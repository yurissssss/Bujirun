import type { TripTimeBounds } from "@/shared/utils/tripTimeBounds";
import {
  type BaseStop,
  minutesToTime,
  clampToTripBounds,
  timeToMinutes,
  roundToNearest10,
} from "./scheduleUtils";
const DEFAULT_DAY_START = "09:00";
const DEFAULT_STOP_GAP_MIN = 60;

export function getDefaultStopTime(
  dayStops: BaseStop[],
  dayIdx: number,
  totalDays: number,
  bounds?: TripTimeBounds | null,
): string {
  if (dayStops.length === 0) {
    return minutesToTime(
      clampToTripBounds(timeToMinutes(DEFAULT_DAY_START), dayIdx, totalDays, bounds),
    );
  }
  const latestMin = Math.max(
    ...dayStops.map((stop) => {
      const [h, m] = stop.time.split(":").map(Number);
      return h * 60 + m;
    }),
  );
  // 이전 항목 시간이 (AI 생성 등으로) 10분 단위가 아니어도, 새로 추가되는 항목은
  // 항상 10분 단위에 맞추고, 여행 시작/종료 시간을 벗어나지 않게 한다.
  const nextMin = clampToTripBounds(
    Math.min(roundToNearest10(latestMin + DEFAULT_STOP_GAP_MIN), 23 * 60 + 59),
    dayIdx,
    totalDays,
    bounds,
  );
  return minutesToTime(findFreeMinute(nextMin, dayStops));
}

// 같은 날에 시간이 똑같은 항목이 두 개 생기지 않도록 비어 있는 10분 슬롯을 찾는다.
// 뒤로 밀다가 자정(23:50)에 닿으면 앞쪽으로 되돌아가며 찾는다(여행 종료 시간에 걸려
// 뒤가 막힌 경우).
function findFreeMinute(preferredMin: number, dayStops: BaseStop[]): number {
  const taken = new Set(dayStops.map((stop) => timeToMinutes(stop.time)));
  const LAST_MIN = 23 * 60 + 50;
  for (let candidate = preferredMin; candidate <= LAST_MIN; candidate += 10) {
    if (!taken.has(candidate)) return candidate;
  }
  for (let candidate = preferredMin - 10; candidate >= 0; candidate -= 10) {
    if (!taken.has(candidate)) return candidate;
  }
  return preferredMin;
}

// 최적화 결과 시각 사이에 두는 최소 간격과, minutesToTime이 잡는 하루 상한(23:59).
const MIN_STOP_GAP_MINUTES = 10;
export const DAY_END_MINUTE = 23 * 60 + 59;

function resolveStopGap(count: number, lowerBound: number, upperBound: number): number {
  if (count < 2) return MIN_STOP_GAP_MINUTES;
  // 경계 폭이 좁아 10분씩 다 넣을 수 없으면 들어가는 만큼으로 간격을 좁힌다.
  return Math.min(MIN_STOP_GAP_MINUTES, Math.floor((upperBound - lowerBound) / (count - 1)));
}

// 최적화 응답의 도착 시각을 ① 여행 시작/종료 경계 안에서 ② 서로 다른 시각이 되도록 편다.
//
// clampToTripBounds는 경계 밖 값을 "잘라 붙이기"만 하므로 여러 스팟이 같은 시각으로 눌리고,
// 예전 구현처럼 그 뒤에 앞→뒤로만 밀면 두 가지가 다시 깨졌다.
//   - 마지막 날 종료가 18:00인데 18:00/18:10/18:20처럼 경계를 넘는다.
//   - minutesToTime이 23:59로 상한을 잡아서, 늦은 시각대에서는 밀어낸 값들이 다시 같은
//     23:59로 붙는다(= 막으려던 상태 그대로).
// 그래서 앞→뒤로 간격을 확보한 뒤, 상한에서 뒤→앞으로 되밀어 넘친 만큼을 앞쪽이 흡수한다.
// 되밀기는 간격을 유지한 채 내려오므로 경계와 "서로 다른 시각"을 동시에 만족한다.
// 같은 날 같은 시각은 백엔드가 400으로 막아(ItineraryService.validateArrivalTimeAvailable)
// 저장 자체가 실패하므로, 중복은 어떤 경우에도 남기지 않는다.
export function spreadStopMinutes(
  rawMinutes: number[],
  lowerBound: number,
  upperBound: number,
): number[] {
  const count = rawMinutes.length;
  if (count === 0) return [];

  let lower = lowerBound;
  let upper = upperBound;
  let gap = resolveStopGap(count, lower, upper);
  // 간격을 1분도 낼 수 없는 경계(시작이 종료보다 늦게 저장된 일정 등)에서는 경계를 포기하고
  // 하루 전체에 편다 — 경계는 화면 규칙이지만 중복 시각은 저장 실패로 이어지기 때문이다.
  if (gap < 1) {
    lower = 0;
    upper = DAY_END_MINUTE;
    gap = Math.max(1, resolveStopGap(count, lower, upper));
  }

  // ① 앞 → 뒤: 최적화가 준 시각을 최대한 살리면서 하한부터 최소 간격을 확보한다.
  const spread: number[] = [];
  for (let idx = 0; idx < count; idx += 1) {
    const earliest = idx === 0 ? lower : spread[idx - 1] + gap;
    spread.push(Math.max(rawMinutes[idx], earliest));
  }

  // ② 뒤 → 앞: 상한부터 거꾸로 되밀어 경계를 넘은 만큼을 앞으로 흡수한다.
  spread[count - 1] = Math.min(spread[count - 1], upper);
  for (let idx = count - 2; idx >= 0; idx -= 1) {
    spread[idx] = Math.min(spread[idx], spread[idx + 1] - gap);
  }
  return spread;
}

export function validateStopTime(
  dayIdx: number,
  time: string,
  totalDays: number,
  tripTimeBounds: TripTimeBounds | null,
): string | null {
  if (!tripTimeBounds) return null;
  // 00:00은 "시간 미지정"으로 본다 — 표시 로직(scheduleUtils.boundMinutes)이 이미 그렇게
  // 취급하는데 여기서만 실제 자정으로 비교해서, 종료 시각이 00:00으로 저장된 일정은
  // 마지막 날 어떤 시각도 저장할 수 없었다(표시는 정상이라 이유를 알 수도 없었다).
  const startBound = tripTimeBounds.startTime === "00:00" ? undefined : tripTimeBounds.startTime;
  const endBound = tripTimeBounds.endTime === "00:00" ? undefined : tripTimeBounds.endTime;
  // 시작이 종료보다 늦게 저장된 일정(백엔드 검증이 없어 가능)에서는 두 조건을 동시에
  // 만족시킬 수 없어 아무 시각도 못 고치게 된다 — 이때는 경계 검증을 건너뛴다.
  const boundsInverted = !!startBound && !!endBound && startBound > endBound;
  if (boundsInverted) return null;

  if (dayIdx === 0 && startBound && time < startBound) {
    return `첫날 일정은 여행 시작 시간(${startBound}) 이후로만 설정할 수 있어요.`;
  }
  if (dayIdx === totalDays - 1 && endBound && time > endBound) {
    return `마지막날 일정은 여행 종료 시간(${endBound}) 이전으로만 설정할 수 있어요.`;
  }
  return null;
}

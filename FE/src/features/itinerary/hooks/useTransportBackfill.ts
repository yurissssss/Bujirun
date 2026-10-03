"use client";

import { useEffect, useRef } from "react";
import { itineraryApi } from "@/shared/api/domains";
import type { RouteOption } from "@/features/itinerary/components/transportRoute";
import {
  buildTransportOptionsFromApi,
  type BaseStop,
} from "@/features/itinerary/utils/scheduleUtils";

// 시각을 바꿔 방문 순서가 재정렬되면, 이웃(다음 스팟)이 달라진 구간의 transport를
// rebuildTransport()가 의도적으로 비운다 — 거기서 placeName으로 역명을 지어내면 실제로
// 존재하지 않는 역("UN조각공원역")이 표시되기 때문이다. 그 방어는 그대로 두고, 비워진
// 구간만 "서버가 계산한 실제 값"으로 다시 채우는 게 이 훅의 역할이다.
//
// 왜 flush(REST 반영)가 끝난 뒤에만 물어보나:
// GET .../travel-mode/options 는 itemId(도착 항목) 하나만 받고 "그 항목의 직전 항목"을
// DB의 order_index로 찾아서 구간을 계산한다. 순서가 아직 REST에 반영되기 전(로컬 Yjs에서만
// 바뀐 상태)에 물어보면 백엔드는 옛 순서 기준의 엉뚱한 구간을 계산해서 돌려준다. 그래서
// 트리거를 "stopsPerDay가 바뀔 때"가 아니라 "flush가 성공할 때"(syncTick)로 잡는다 —
// 덤으로 flush 자체가 2초 디바운스 + coalesce라서, 사용자가 시각을 연달아 바꿔도 요청이
// 폭주하지 않는다.
const BACKFILL_DELAY_MS = 400;

// 한 번에 처리할 구간 수 상한. 순서가 크게 바뀌거나(최적화 직후 일부 구간만 계산 실패)
// 로그를 통째로 불러온 경우 한 day에서만 9개 구간이 동시에 비어있을 수 있다. 남은 구간은
// 다음 flush 성공 때 이어서 채운다(채운 값이 다시 flush를 부르므로 자연히 이어진다).
const MAX_SEGMENTS_PER_RUN = 6;

// 같은 구간에 대한 최대 시도 횟수. 1회는 일시적 네트워크 실패를 흡수하기 위한 여유이고,
// 그 이상은 "이 구간은 원래 계산이 안 되는 구간"이라 보고 더 두드리지 않는다.
const MAX_ATTEMPTS_PER_SEGMENT = 2;

// 대중교통 옵션이 아예 없는(아주 짧은) 구간에서 고를 순서. 택시를 먼저 고르면 요금이 실제
// 이동과 크게 달라 보여서 도보를 앞에 둔다.
const FALLBACK_OPTION_IDS = ["walk", "taxi"] as const;

interface BackfillTarget {
  key: string;
  dayIdx: number;
  dayId: string;
  fromStopId: string;
  toStopId: string;
  fromPlaceName: string;
  toPlaceName: string;
}

// 사용자가 직접 고른 게 아니라 "비어버린 구간을 되살리는" 자리이므로, 이동수단 변경 모달이
// 추천으로 표시하는 것과 같은 기준(대중교통 중 가장 빠른 옵션 = isRecommended)을 그대로 쓴다.
function pickBackfillOption(options: RouteOption[]): RouteOption | undefined {
  // legs가 비어있는 옵션은 화면에 그릴 게 없고, rebuildTransport도 legs[0].type이 없으면
  // 다시 비워버리므로 애초에 후보에서 제외한다.
  const usable = options.filter((option) => option.legs.length > 0);
  if (usable.length === 0) return undefined;

  const recommended = usable.find((option) => option.isRecommended);
  if (recommended) return recommended;

  for (const id of FALLBACK_OPTION_IDS) {
    const match = usable.find((option) => option.id === id);
    if (match) return match;
  }
  return usable[0];
}

// 옵션(RouteOption)을 타임라인이 쓰는 transport 형태로 옮긴다. from/to는 경로 카드의
// 양 끝(출발·도착) 노드라 이전/다음 장소 이름을 쓴다 — buildTransportFromItem과 같은 기준이다.
// 정류장·역명은 legs 안에 그대로 있다.
function toTransport(
  option: RouteOption,
  target: BackfillTarget,
): NonNullable<BaseStop["transport"]> {
  return {
    from: target.fromPlaceName,
    to: target.toPlaceName,
    durationMin: option.durationMin,
    baseDurationMin: option.durationMin,
    cost: option.cost,
    legs: option.legs,
    toStopId: target.toStopId,
  };
}

interface UseTransportBackfillParams {
  itineraryId: string;
  // stopsPerDay와 같은 인덱스로 대응하는 실제 dayId.
  dayIds: string[];
  stopsPerDay: BaseStop[][];
  // REST 반영(flush)이 성공할 때마다 1씩 올라가는 값. 이 값이 바뀔 때만 재계산을 시도한다.
  syncTick: number;
  // Yjs 시딩이 끝나기 전엔 문서가 비어있어서(빈 배열) 판단 자체가 무의미하다.
  enabled: boolean;
  // Yjs 문서에 반영하는 mutation. 로컬 state가 아니라 문서에 써야 같이 보고 있는 다른
  // 참여자 화면에도 구간이 되살아난다.
  applyTransport: (
    dayIdx: number,
    stopId: string,
    transport: NonNullable<BaseStop["transport"]>,
  ) => void;
}

export function useTransportBackfill({
  itineraryId,
  dayIds,
  stopsPerDay,
  syncTick,
  enabled,
  applyTransport,
}: UseTransportBackfillParams): void {
  // effect는 syncTick에만 반응하고, 실제 값은 실행 시점에 ref로 최신 것을 읽는다
  // (stale closure 방지 + stopsPerDay가 바뀔 때마다 effect가 재실행되지 않게).
  const stopsPerDayRef = useRef(stopsPerDay);
  const dayIdsRef = useRef(dayIds);
  const applyTransportRef = useRef(applyTransport);
  useEffect(() => {
    stopsPerDayRef.current = stopsPerDay;
    dayIdsRef.current = dayIds;
    applyTransportRef.current = applyTransport;
  });

  // 지금 조회 중인 구간(중복 호출 방지)과, 이미 시도해본 구간의 시도 횟수.
  // 키가 "출발 항목 → 도착 항목" 쌍이라, 이웃이 다시 바뀌면 새 키가 되어 자연히 다시 시도된다.
  const inFlightKeysRef = useRef<Set<string>>(new Set());
  const attemptsByKeyRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!enabled || !itineraryId) return;

    let cancelled = false;

    // 지금 화면 기준으로 "다음 스팟은 있는데 transport가 비어있는" 구간만 고른다.
    // 값이 살아있는 구간(이웃이 그대로인 구간)은 애초에 후보가 아니라서 덮어쓸 일이 없다.
    const collectTargets = (): BackfillTarget[] => {
      const targets: BackfillTarget[] = [];

      stopsPerDayRef.current.forEach((dayStops, dayIdx) => {
        const dayId = dayIdsRef.current[dayIdx];
        if (!dayId) return;

        dayStops.forEach((stop, idx) => {
          const nextStop = dayStops[idx + 1];
          // 마지막 스팟엔 구간이 없다 — transport가 undefined인 게 맞다.
          if (!nextStop) return;
          if (stop.transport) return;
          // 아직 REST에 저장되지 않은 항목(temp-)은 백엔드가 모르는 id라 물어볼 수 없다.
          // 다음 flush에서 실제 id로 바뀐 뒤에 다시 후보가 된다.
          if (stop.id.startsWith("temp-") || nextStop.id.startsWith("temp-")) return;

          const key = `${dayId}:${stop.id}>${nextStop.id}`;
          if (inFlightKeysRef.current.has(key)) return;
          if ((attemptsByKeyRef.current.get(key) ?? 0) >= MAX_ATTEMPTS_PER_SEGMENT) return;

          targets.push({
            key,
            dayIdx,
            dayId,
            fromStopId: stop.id,
            toStopId: nextStop.id,
            fromPlaceName: stop.placeName,
            toPlaceName: nextStop.placeName,
          });
        });
      });

      return targets.slice(0, MAX_SEGMENTS_PER_RUN);
    };

    // 응답이 도착했을 때도 그 구간이 여전히 "같은 이웃 + 여전히 비어있음"인지 다시 본다.
    // 조회 중에 다른 참여자가 순서를 바꿨거나 사용자가 이동수단을 직접 골랐으면, 낡은
    // 응답으로 덮어쓰지 않고 버린다.
    const isStillMissing = (target: BackfillTarget): boolean => {
      const dayStops = stopsPerDayRef.current[target.dayIdx];
      if (!dayStops) return false;
      const idx = dayStops.findIndex((stop) => stop.id === target.fromStopId);
      if (idx === -1) return false;
      if (dayStops[idx].transport) return false;
      return dayStops[idx + 1]?.id === target.toStopId;
    };

    const countAttempt = (key: string) => {
      attemptsByKeyRef.current.set(key, (attemptsByKeyRef.current.get(key) ?? 0) + 1);
    };

    // 순차 처리 — 한 번에 여러 구간이 비어도 ODsay 계산을 동시에 쏘지 않는다.
    const run = async () => {
      for (const target of collectTargets()) {
        if (cancelled) return;

        inFlightKeysRef.current.add(target.key);
        try {
          const options = await itineraryApi.getTravelModeOptions(
            itineraryId,
            target.dayId,
            target.toStopId,
          );
          // 취소(그 사이 다음 flush가 성공해 더 최신 순서가 생김)는 시도 횟수로 세지
          // 않는다 — 그 구간은 다음 run에서 처음부터 다시 판단한다.
          if (cancelled) return;
          // 성공/실패와 무관하게 "요청이 끝난 횟수"를 센다. 성공했는데 어떤 이유로든 그
          // 구간이 다시 비워지더라도 같은 쌍을 무한히 다시 물어보지 않게 하는 상한이다.
          countAttempt(target.key);

          const option = pickBackfillOption(
            buildTransportOptionsFromApi(options, target.fromPlaceName, target.toPlaceName),
          );
          // 계산 가능한 경로가 없으면 비운 채로 둔다 — 사용자는 시각만 바꿨을 뿐이라
          // 여기서 토스트를 띄우지 않는다(그리고 가짜 값으로 채우지 않는다).
          if (!option) {
            attemptsByKeyRef.current.set(target.key, MAX_ATTEMPTS_PER_SEGMENT);
            continue;
          }
          if (!isStillMissing(target)) continue;

          applyTransportRef.current(target.dayIdx, target.fromStopId, toTransport(option, target));
        } catch {
          // 실패(오프라인/타임아웃/4xx)도 조용히 넘어간다. 다음 flush 성공 때 한 번 더
          // 시도하고, 그래도 안 되면 이 구간은 더 이상 두드리지 않는다.
          countAttempt(target.key);
        } finally {
          inFlightKeysRef.current.delete(target.key);
        }
      }
    };

    // flush 직후 Yjs observer → React 리렌더가 한 박자 늦게 도착할 수 있어서 살짝 미룬다.
    // 그 사이 flush가 또 성공하면(=사용자가 계속 편집 중) 이 타이머는 취소되고 새로 잡힌다.
    const timer = window.setTimeout(() => void run(), BACKFILL_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, itineraryId, syncTick]);
}

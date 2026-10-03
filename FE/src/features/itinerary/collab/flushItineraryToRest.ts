import { isAxiosError } from "axios";
import { itineraryApi } from "@/shared/api/domains";
import type { components } from "@/shared/api/schema";
import {
  mapDayItemsToStops,
  type BaseStop,
  type TripTimeBoundsLike,
} from "@/features/itinerary/utils/scheduleUtils";

type ItineraryDayResponse = components["schemas"]["ItineraryDayResponse"];

type DaySnapshotEntry = { spotId?: string; time: string; orderIndex: number };
export type DaySnapshot = Map<string, DaySnapshotEntry>;

export type AddedItem = Awaited<ReturnType<typeof itineraryApi.addItem>>;

export type FlushFailureKind = "add" | "update" | "reorder" | "delete";

// flush 중 끝까지 실패한 요청 하나. 예전엔 모든 실패를 catch에서 조용히 삼켰는데, 그러면
// 화면(Yjs)은 바뀐 값, DB는 옛 값으로 갈린 채 사용자에게 아무 표시도 없었고 새로고침하면
// 변경이 되돌아갔다. 호출부가 알림/재시도를 판단할 수 있게 실패를 그대로 돌려준다.
export interface FlushFailure {
  kind: FlushFailureKind;
  dayId: string;
  // reorder는 day 전체를 한 번에 보내므로 항목 정보가 없다.
  stopId?: string;
  placeName?: string;
  // 사용자에게 그대로 보여줄 문구. 백엔드 message는 쓰지 않는다 — "항목을 찾을 수 없습니다.
  // id=5201d714-…", "요청한 항목 목록이 현재 일차의 항목 구성과 일치하지 않습니다"처럼
  // 내부 사정이 그대로 나가면 사용자는 무슨 일인지도, 뭘 해야 하는지도 알 수 없다.
  // 원인 파악에 필요한 실제 응답은 error에 그대로 담겨 있다.
  message: string;
  error: unknown;
  // 낙관적 락(409) 충돌이라 이미 서버 최신 상태로 reconcile까지 끝낸 실패. 일반 실패와
  // 달리 "네트워크 문제"가 아니라 "정상적인 동시편집 충돌"이므로, 호출부는 에러 배너 대신
  // "다른 사람이 먼저 수정했다"는 안내만 띄우면 된다(handleSaveFailed 참고).
  conflict?: boolean;
}

// 서버에 이미 없는 항목(404). 삭제에서 이건 실패가 아니라 "목적이 이미 달성된 것"이다 —
// 다른 참여자가 먼저 지웠거나, 같은 항목이 두 번 삭제 대상이 된 경우다.
const isAlreadyGone = (error: unknown) => isAxiosError(error) && error.response?.status === 404;

// 낙관적 락 충돌(409)이면 서버가 이미 실어보낸 최신 day 상태를 꺼내 돌려준다 — 호출부가
// 추가 조회 없이 바로 reconcile할 수 있게 하기 위함(DayVersionConflictException 참고).
function getVersionConflictDay(error: unknown): ItineraryDayResponse | null {
  if (!isAxiosError(error) || error.response?.status !== 409) return null;
  const day = (error.response.data as { data?: ItineraryDayResponse } | undefined)?.data;
  return day?.id ? day : null;
}

const FAILURE_MESSAGE: Record<FlushFailureKind, string> = {
  add: "일정 항목을 저장하지 못했어요.",
  update: "변경한 시각을 저장하지 못했어요.",
  reorder: "변경한 순서를 저장하지 못했어요.",
  delete: "삭제한 항목을 저장하지 못했어요.",
};

// 같은 논리적 편집에는 항상 같은 operationId가 나오도록 편집 내용을 해시한다. 여러
// 클라이언트가 같은 순간 같은 상태(Yjs로 이미 동기화된 동일한 currentStops)를 보고 각자
// 독립적으로 flush해도, 계산되는 해시가 동일해서 서버의 멱등 캐시가 자연스럽게 중복을
// 걸러낸다 — 클라이언트끼리 별도로 조율(리더 선출 등)할 필요가 없다.
async function hashToOperationId(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest).slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function snapshotFromStops(stops: BaseStop[]): DaySnapshot {
  const snapshot: DaySnapshot = new Map();
  stops.forEach((stop, index) =>
    snapshot.set(stop.id, { spotId: stop.spotId, time: stop.time, orderIndex: index }),
  );
  return snapshot;
}

// Yjs의 현재 상태와 마지막으로 REST에 반영된 상태(snapshot)를 비교해 add/update/delete만
// 골라 호출한다. "저장 버튼 없음" 모델이라 매 액션마다가 아니라 이탈 시/합류 시 같은 정해진
// 시점에만 호출된다 — 액션마다 PATCH하면 동시편집 중 orderIndex가 서로 경합할 수 있어서,
// 병합된 최종 상태를 한 번에 반영하는 쪽이 안전하다.
//
// 순서(orderIndex)는 항목별 updateItem PATCH에 실어 보내지 않는다 — 그룹 일정에서 여러
// 클라이언트가 거의 동시에 flush하면, 항목별로 나뉜 PATCH들이 서로 뒤섞여 완료되면서 같은
// day에 order_index가 중복 저장되는 사고가 실제 프로덕션에서 발생했다(2026-08-12 확인).
// 대신 시간 등 필드만 항목별로 PATCH하고, 순서는 day의 최종 전체 순서를 reorderItems 한 번의
// 원자적 요청으로 반영한다.
//
// upsert는 항목을 앞에서부터 "순차로" 처리한다 — 새 항목 추가(addItem)를 병렬로 쏘면
// 백엔드가 "직전 스팟"을 저장 순서(먼저 커밋된 항목)로 잡아버려서, 실시간 편집으로 여러
// 곳을 빠르게 추가할 때 앞 항목의 교통수단 구간이 엉뚱하게 계산되고 배너가 안 뜨는
// 문제가 있었다. 순차로 처리하면 각 새 항목의 직전 스팟이 이미 저장돼 있어 구간이 맞다.
//
// 실패한 요청은 snapshot을 갱신하지 않는다(= 다음 flush에서 다시 대상이 된다). 그게 재시도의
// 유일한 근거이므로 절대 "성공한 것처럼" 갱신하지 말 것. 그리고 끝까지 실패한 요청은
// 반환값(FlushFailure[])으로 알린다 — 조용히 삼키면 호출부가 재시도도, 안내도 할 수 없다.
export async function flushDayToRest(
  itineraryId: string,
  dayId: string,
  currentStops: BaseStop[],
  snapshot: DaySnapshot,
  onIdResolved: (tempId: string, realId: string) => void,
  // 새 항목이 저장되면서 백엔드가 계산해준 (직전 스팟 → 새 항목) 구간 정보를 넘긴다.
  // 호출부가 직전 스팟의 교통수단 배너를 바로 채우는 데 쓴다.
  onLegComputed?: (prevStopId: string, addedItem: AddedItem) => void,
  collaboration?: {
    readStops: () => BaseStop[];
    removeMissingStop: (id: string) => void;
    // 낙관적 락(409) 충돌 시 서버가 돌려준 최신 day 상태로 로컬(Yjs)을 강제 동기화한다.
    reconcileWithServer: (stops: BaseStop[]) => void;
  },
  // 구조적 변경(replaceDayItems)/순서 변경(reorderItems) 요청에 실어 보낼 낙관적 락 버전.
  // 없으면(구버전 호출부) 버전 체크 없이 예전처럼 동작한다.
  versioning?: {
    getVersion: () => number | undefined;
    setVersion: (version: number | undefined) => void;
    dayIdx: number;
    totalDays: number;
    timeBounds?: TripTimeBoundsLike | null;
    // 409를 정상 흐름으로 안내하기 위한 훅(에러 토스트가 아니라 "누가 먼저 고쳤어요" 안내용).
    onConflict?: () => void;
  },
  // 409 충돌 뒤 스스로 한 번 재호출한 것인지 — 재귀가 무한히 반복되지 않도록 이 재시도에서
  // 또 충돌하면 더는 재시도하지 않고 그대로 받아들인다(사용자가 요청한 "1회 재시도").
  isConflictRetry = false,
): Promise<FlushFailure[]> {
  const failures: FlushFailure[] = [];
  const recordFailure = (
    kind: FlushFailureKind,
    error: unknown,
    stopId?: string,
    placeName?: string,
  ) => {
    failures.push({
      kind,
      dayId,
      stopId,
      placeName,
      message: FAILURE_MESSAGE[kind],
      error,
    });
  };

  // 낙관적 락 충돌이면 서버가 이미 실어보낸 최신 day를 그대로 로컬에 반영한다(추가 조회
  // 없음). true를 돌려주면 호출부가 "1회 재시도"할지, 그냥 받아들일지를 isConflictRetry로
  // 판단한다.
  const handleVersionConflict = async (error: unknown): Promise<boolean> => {
    const conflictDay = getVersionConflictDay(error);
    if (!conflictDay || !versioning) return false;
    const stops = mapDayItemsToStops(
      dayId,
      conflictDay.items,
      versioning.dayIdx,
      versioning.totalDays,
      versioning.timeBounds,
    );
    collaboration?.reconcileWithServer(stops);
    snapshot.clear();
    stops.forEach((stop, index) =>
      snapshot.set(stop.id, { spotId: stop.spotId, time: stop.time, orderIndex: index }),
    );
    versioning.setVersion(conflictDay.version ?? undefined);
    versioning.onConflict?.();
    return true;
  };
  // 충돌 처리 공통 경로: 처음 겪는 충돌이면 방금 reconcile한 최신 상태로 한 번 더 시도하고,
  // 이미 한 번 재시도한 뒤라면(isConflictRetry) 더 시도하지 않고 "정상 동작"으로 받아들인다.
  const retryOrAcceptConflict = (
    kind: FlushFailureKind,
    error: unknown,
  ): Promise<FlushFailure[]> => {
    if (!isConflictRetry) {
      return flushDayToRest(
        itineraryId,
        dayId,
        collaboration?.readStops() ?? currentStops,
        snapshot,
        onIdResolved,
        onLegComputed,
        collaboration,
        versioning,
        true,
      );
    }
    failures.push({
      kind,
      dayId,
      message: "다른 사람이 먼저 수정해서 최신 내용으로 맞췄어요.",
      error,
      conflict: true,
    });
    return Promise.resolve(failures);
  };

  // REST에 없는 확정 ID는 삭제/교체된 항목이다. temp- 항목은 아직 저장 중이므로
  // 유지한다. 조회 실패나 일차 자체의 삭제는 항목 삭제로 간주하지 않는다.
  const reconcileMissingStops = async () => {
    const detail = await itineraryApi.getItinerary(itineraryId);
    const day = detail.days?.find((entry) => entry.id === dayId);
    if (!day?.items) throw new Error("일차의 저장 상태를 확인하지 못했습니다.");
    const serverIds = new Set(day.items.map((item) => item.id));
    for (const stop of currentStops) {
      if (!stop.id.startsWith("temp-") && !serverIds.has(stop.id)) {
        collaboration?.removeMissingStop(stop.id);
        snapshot.delete(stop.id);
      }
    }
    for (const id of snapshot.keys()) {
      if (!serverIds.has(id)) snapshot.delete(id);
    }
    return serverIds;
  };
  if (collaboration) {
    try {
      await reconcileMissingStops();
      currentStops = collaboration.readStops();
    } catch (error) {
      recordFailure("update", error);
      return failures;
    }
  }
  const isCurrent = (stop: BaseStop) =>
    !collaboration ||
    collaboration.readStops().some((latest) => latest.id === stop.id && latest.time === stop.time);
  const recoverMissingStop = async (error: unknown, stop: BaseStop) => {
    if (!collaboration || !isAlreadyGone(error)) return false;
    try {
      const serverIds = await reconcileMissingStops();
      return !serverIds.has(stop.id);
    } catch {
      return false;
    }
  };

  const currentIds = new Set(currentStops.map((stop) => stop.id));
  const idsToDelete = [...snapshot.keys()].filter((id) => !currentIds.has(id));

  // 구조적 변경(추가/삭제)이 있으면 개별 add/delete를 따로 쏘지 않고 day 전체를 한 번의
  // 원자적 요청(replaceDayItems)으로 교체한다. 여러 클라이언트가 같은 순간 같은 변경을
  // 각자 flush해도(2026-09-16 실제 프로덕션 사고 원인) operationId가 편집 내용의 해시라
  // 서버 멱등 캐시에서 자연히 하나로 합쳐진다. 시간만 바뀌는 경우는 기존 개별 PATCH
  // 경로를 그대로 쓴다(비용이 더 낮고, 이 경로가 원인이었던 적은 없음).
  const hasNewItems = currentStops.some(
    (stop) => isCurrent(stop) && stop.spotId && stop.id.startsWith("temp-"),
  );
  if (idsToDelete.length > 0 || hasNewItems) {
    const targetStops = currentStops.filter((stop) => isCurrent(stop) && stop.spotId);
    const orderedInputs = targetStops.map((stop) => ({
      existingItemId: stop.id.startsWith("temp-") ? undefined : stop.id,
      spotId: stop.spotId as string,
      arrivalTime: stop.time || undefined,
    }));

    // 해시엔 구조(day + 항목 구성 + 순서)만 싣는다 — arrivalTime처럼 같은 논리적 편집
    // 안에서도 흔들릴 수 있는 값(Yjs 수렴 타이밍차 등)까지 실으면, 똑같은 구조 변경인데
    // 계산 시점에 따라 해시가 달라져 멱등 캐시가 중복을 못 걸러내는 경우가 생긴다.
    const operationId = await hashToOperationId(
      `${dayId}|${orderedInputs.map((i) => `${i.existingItemId ?? "new"}:${i.spotId}`).join(",")}`,
    );

    try {
      const result = await itineraryApi.replaceDayItems(itineraryId, dayId, {
        operationId,
        expectedVersion: versioning?.getVersion(),
        items: orderedInputs,
      });
      const resultItems = result?.items ?? [];
      snapshot.clear();
      targetStops.forEach((stop, index) => {
        const real = resultItems[index];
        if (!real?.id) return;
        if (stop.id.startsWith("temp-")) onIdResolved(stop.id, real.id);
        snapshot.set(real.id, { spotId: stop.spotId, time: stop.time, orderIndex: index });
      });
      versioning?.setVersion(result?.version ?? undefined);
    } catch (error) {
      if (await handleVersionConflict(error)) return retryOrAcceptConflict("add", error);
      recordFailure("add", error);
    }
    return failures;
  }

  const deletions = idsToDelete.map((id) =>
    itineraryApi
      .deleteItem(itineraryId, dayId, id)
      .then(() => snapshot.delete(id))
      .catch((error: unknown) => {
        // 404를 실패로 남기면 snapshot에 id가 그대로 남아 다음 flush가 같은 삭제를 또
        // 시도한다 — 서버엔 이미 없으니 영원히 404다. 그동안 사용자에겐 백엔드 문구
        // ("항목을 찾을 수 없습니다. id=…")가 계속 뜨고, 정상 저장까지 실패한 것처럼 보인다.
        // 이미 없으면 지운 것으로 처리하고 snapshot에서 뺀다.
        if (isAlreadyGone(error)) {
          snapshot.delete(id);
          return;
        }
        recordFailure("delete", error, id);
      }),
  );
  await Promise.allSettled(deletions);

  // currentStops와 같은 길이로 위치별 실제(real) id를 채워나간다. 새 항목은 추가 API가
  // 끝나야 real id를 알 수 있고, 실패하면 해당 위치는 null로 남아 이번 flush의 순서
  // 반영에서 빠진다(다음 flush 때 temp- id 그대로 재시도됨).
  const resolvedIds: (string | null)[] = new Array(currentStops.length).fill(null);
  // 삭제/추가처럼 order_index에 "구멍"을 만드는 구조 변경이 있었는지 — 있었다면 순서가
  // 겉보기엔(상대 순서 기준) 안 바뀌었어도 reorder를 반드시 호출해야 한다. 그렇지 않으면
  // 다음에 추가되는 항목이 삭제로 비어버린 order_index 값을 다시 사용하게 되면서 기존
  // 항목과 order_index가 충돌한다(실제로 로컬 브라우저 테스트에서 재현 확인, 2026-08-13).
  let hasStructuralChange = idsToDelete.length > 0;
  // 시각 PATCH가 실패한 항목들. 이번 pass가 다 끝난 뒤 딱 한 번 더 시도한다 — 백엔드가
  // "같은 날 같은 시각"을 거부하기 때문에(ItineraryService.validateArrivalTimeAvailable),
  // A(10:00)→12:00 / B(12:00)→14:00처럼 서로 자리를 밀어내는 변경은 앞 항목의 PATCH가
  // 먼저 400을 맞는다. B까지 반영된 뒤 다시 보내면 그대로 성공하므로, 이 한 번의 추가
  // pass로 대부분이 해결된다(그래도 실패하면 snapshot을 그대로 둔 채 호출부에 알린다).
  const timeRetryTargets: { stop: BaseStop; index: number }[] = [];

  for (let index = 0; index < currentStops.length; index += 1) {
    const stop = currentStops[index];
    if (!isCurrent(stop)) continue;

    if (stop.id.startsWith("temp-")) {
      if (!stop.spotId) continue;
      try {
        const newItem = await itineraryApi.addItem(itineraryId, dayId, {
          spotId: stop.spotId,
          arrivalTime: stop.time,
          orderIndex: index,
        });
        if (newItem?.id) {
          onIdResolved(stop.id, newItem.id);
          resolvedIds[index] = newItem.id;
          snapshot.set(newItem.id, { spotId: stop.spotId, time: stop.time, orderIndex: index });
          hasStructuralChange = true;
          const prevStopId = index > 0 ? resolvedIds[index - 1] : null;
          if (prevStopId) onLegComputed?.(prevStopId, newItem);
        }
      } catch (error) {
        // 다음 flush 시점에 temp- id 그대로 재시도됨
        recordFailure("add", error, stop.id, stop.placeName);
      }
      continue;
    }

    resolvedIds[index] = stop.id;
    const prev = snapshot.get(stop.id);
    if (prev && prev.time === stop.time) continue;

    try {
      await itineraryApi.updateItem(itineraryId, dayId, stop.id, { arrivalTime: stop.time });
      snapshot.set(stop.id, {
        spotId: stop.spotId,
        time: stop.time,
        orderIndex: prev?.orderIndex ?? index,
      });
    } catch (error) {
      if (!isCurrent(stop) || (await recoverMissingStop(error, stop))) {
        resolvedIds[index] = null;
        continue;
      }
      // 바로 실패로 확정하지 않고 아래 재시도 pass로 넘긴다(중복 시각 400이 대부분이라,
      // 나머지 항목이 반영된 뒤엔 성공한다). snapshot은 일부러 손대지 않는다.
      timeRetryTargets.push({ stop, index });
    }
  }

  // 재시도는 딱 이 한 pass로 끝낸다 — 더 돌리면 재시도해도 절대 성공하지 않는 실패(잘못된
  // 값으로 인한 400 등)에 대해 같은 요청을 무한히 두드리게 된다.
  for (const { stop, index } of timeRetryTargets) {
    if (!isCurrent(stop)) continue;
    const prev = snapshot.get(stop.id);
    try {
      await itineraryApi.updateItem(itineraryId, dayId, stop.id, { arrivalTime: stop.time });
      snapshot.set(stop.id, {
        spotId: stop.spotId,
        time: stop.time,
        orderIndex: prev?.orderIndex ?? index,
      });
    } catch (error) {
      if (!isCurrent(stop) || (await recoverMissingStop(error, stop))) {
        resolvedIds[index] = null;
        continue;
      }
      recordFailure("update", error, stop.id, stop.placeName);
    }
  }

  const orderedRealIds = resolvedIds.filter((id): id is string => id !== null);
  if (orderedRealIds.length === 0) return failures;
  // 저장을 기다리는 동안 편집이 진행됐으면 옛 순서를 보내지 않고 다음 저장에 맡긴다.
  if (collaboration) {
    const latestIds = collaboration.readStops().map((stop) => stop.id);
    if (
      latestIds.length !== orderedRealIds.length ||
      latestIds.some((id, index) => id !== orderedRealIds[index])
    )
      return failures;
  }

  const prevOrder = [...snapshot.entries()]
    .filter(([id]) => orderedRealIds.includes(id))
    .sort((a, b) => a[1].orderIndex - b[1].orderIndex)
    .map(([id]) => id);
  const orderChanged =
    orderedRealIds.length !== prevOrder.length ||
    orderedRealIds.some((id, i) => id !== prevOrder[i]);

  if (!orderChanged && !hasStructuralChange) return failures;

  try {
    const result = await itineraryApi.reorderItems(
      itineraryId,
      dayId,
      orderedRealIds,
      versioning?.getVersion(),
    );
    orderedRealIds.forEach((id, index) => {
      const entry = snapshot.get(id);
      if (entry) entry.orderIndex = index;
    });
    versioning?.setVersion(result?.version ?? undefined);
  } catch (error) {
    if (await handleVersionConflict(error)) return retryOrAcceptConflict("reorder", error);
    if (collaboration && isAxiosError(error) && error.response?.status === 400) {
      try {
        const serverIds = await reconcileMissingStops();
        if (orderedRealIds.some((id) => !serverIds.has(id))) return failures;
      } catch {
        // 서버 상태를 확인하지 못했으면 원래 저장 실패를 유지한다.
      }
    }
    // snapshot의 orderIndex를 갱신하지 않으므로 다음 flush 시점에 다시 reorder 대상이 된다.
    recordFailure("reorder", error, undefined, undefined);
  }

  return failures;
}

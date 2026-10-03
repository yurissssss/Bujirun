"use client";
import { useState, type Dispatch, type SetStateAction } from "react";
import { itineraryApi } from "@/shared/api/domains";
import type { ModalType } from "@/features/itinerary";
import type { TripTimeBounds } from "@/shared/utils/tripTimeBounds";
import {
  type BaseStop,
  buildTransportFromItem,
  clampToTripBounds,
  normalizeTime,
  timeToMinutes,
  minutesToTime,
} from "../utils/scheduleUtils";
import { DAY_END_MINUTE, spreadStopMinutes } from "../utils/itineraryTimeRules";
import type { useCollaborativeItinerary } from "@/features/itinerary/collab/useCollaborativeItinerary";
type Collaboration = ReturnType<typeof useCollaborativeItinerary>;
type ShowToast = (message: string, variant?: "itinerary" | "error") => void;

interface OptimizationParams {
  currentDay: number;
  dayIdsSliced: string[];
  stopsPerDay: BaseStop[][];
  tripTimeBounds: TripTimeBounds | null;
  setModal: Dispatch<SetStateAction<ModalType | null>>;
  pushYjsOptimizedOrder: Collaboration["pushOptimizedOrder"];
  logActivity: Collaboration["logActivity"];
  showToast: ShowToast;
}
export function useItineraryOptimization({
  currentDay,
  dayIdsSliced,
  stopsPerDay,
  tripTimeBounds,
  setModal,
  pushYjsOptimizedOrder,
  logActivity,
  showToast,
}: OptimizationParams) {
  const [optimizeDone, setOptimizeDone] = useState<boolean | undefined>(undefined);
  const startOptimize = async () => {
    setModal("optimizing");
    setOptimizeDone(false);
    const dayId = dayIdsSliced[currentDay];
    try {
      if (!dayId) throw new Error("dayId missing");
      const result = await itineraryApi.optimizeDay(dayId, {});
      // 응답에 item id가 없어 장소 이름으로 기존 stop을 찾아 순서/도착시간만 갱신한다.
      // 이름이 겹치는 스팟이 있어도 같은 stop을 두 번 재사용해 id가 중복되지 않도록,
      // 매칭된 stop은 remaining에서 바로 제거한다.
      const remaining = [...(stopsPerDay[currentDay] ?? [])];
      const optimizedSorted = (result.data?.spots ?? [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      // optimized(travelMode/routeType/routeNo/역명/transitDetail)를 stop과 짝지어 들고
      // 있다가 transport를 만들 때 쓴다 — order/arrivalTime만 반영하면 최적화로 이동수단이
      // 바뀌어도 교통수단 배너가 최적화 전 값 그대로 남는다.
      const pairs = optimizedSorted
        .map((optimized) => {
          const matchIdx = remaining.findIndex((s) => s.placeName === optimized.name);
          const existing = matchIdx >= 0 ? remaining.splice(matchIdx, 1)[0] : remaining.shift();
          if (!existing) return null;
          return {
            optimized,
            // 경계 클램프는 여기서 하지 않는다 — 잘라 붙이면 여러 스팟이 같은 시각이 되고,
            // 그 뒤에 간격을 벌려도 경계를 다시 넘는다. 아래 spreadStopMinutes가 경계와
            // 최소 간격을 한 번에 해결하므로, 여기서는 응답 시각을 그대로 들고 간다.
            stop: {
              ...existing,
              time: normalizeTime(optimized.arrivalTime, existing.time),
            } as BaseStop,
          };
        })
        .filter(
          (p): p is { optimized: (typeof optimizedSorted)[number]; stop: BaseStop } => p !== null,
        );

      // 최적화는 여행 시작/종료 시각을 모른 채 계산하므로(백엔드가 09:00부터 계산한다)
      // 응답 시각이 경계 밖으로 나갈 수 있다. 경계 안으로 넣는 일과 "서로 다른 시각"을
      // 만드는 일을 한 번에 처리한다 — 자세한 근거는 spreadStopMinutes 주석 참고.
      const dayLowerBound = clampToTripBounds(0, currentDay, dayIdsSliced.length, tripTimeBounds);
      const dayUpperBound = clampToTripBounds(
        DAY_END_MINUTE,
        currentDay,
        dayIdsSliced.length,
        tripTimeBounds,
      );
      const spreadMinutes = spreadStopMinutes(
        pairs.map(({ stop }) => timeToMinutes(stop.time)),
        dayLowerBound,
        dayUpperBound,
      );
      pairs.forEach(({ stop }, idx) => {
        stop.time = minutesToTime(spreadMinutes[idx]);
      });

      // transport는 항상 "다음 스팟까지의 구간" 정보라, 각 스팟의 transport는 자신이 아니라
      // 바로 다음 스팟의 optimized 데이터(도착 항목이 이동수단을 들고 있는 컨벤션)로 만든다.
      const reordered = pairs.map(({ stop }, idx) => {
        const nextPair = pairs[idx + 1];
        if (!nextPair) return { ...stop, transport: undefined };
        const transport = buildTransportFromItem(
          nextPair.optimized,
          stop.placeName,
          nextPair.stop.placeName,
          nextPair.stop.id,
          nextPair.optimized.travelTimeMin ?? 30,
        );
        return { ...stop, transport };
      });
      pushYjsOptimizedOrder(currentDay, reordered);
      logActivity("optimize", "");
      showToast("일정이 최적화됐어요.");
    } catch {
      showToast("일정 최적화에 실패했어요.", "error");
    } finally {
      setOptimizeDone(true);
    }
  };

  return { startOptimize, optimizeDone };
}

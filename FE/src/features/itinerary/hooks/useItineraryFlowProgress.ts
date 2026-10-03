"use client";

import { useEffect } from "react";
import { useItineraryFlowStore, type ItineraryFlowStep } from "@/shared/stores";

interface UseItineraryFlowProgressOptions {
  // 투표 세션이 만들어진 뒤에만 채워진다(result 단계). 이어하기 전에 이미 확정된
  // 세션인지 확인하는 데 쓰인다.
  sessionId?: string;
  tripName?: string;
}

// 일정 생성 플로우의 각 단계 페이지에서 호출한다. 지금 단계와 쿼리를 기기에 남겨서,
// 생성 중에 튕기거나 새로고침돼도 일정 탭에서 "이어하기"로 같은 자리로 돌아올 수 있게 한다.
// (플로우 상태가 URL 쿼리에만 있어서, 화면이 한 번 날아가면 복구할 방법이 없었다.)
export function useItineraryFlowProgress(
  step: ItineraryFlowStep,
  query: string,
  groupId: string,
  options?: UseItineraryFlowProgressOptions,
) {
  const { sessionId, tripName } = options ?? {};
  const saveFlow = useItineraryFlowStore((state) => state.saveFlow);

  useEffect(() => {
    // 그룹 없이 들어온 화면(테스트 진입 등)은 이어할 대상이 없다.
    if (!groupId) return;
    saveFlow({ step, query, groupId, sessionId, tripName });
  }, [saveFlow, step, query, groupId, sessionId, tripName]);
}

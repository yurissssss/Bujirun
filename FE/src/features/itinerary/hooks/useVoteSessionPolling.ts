"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { itineraryApi } from "@/shared/api/domains";

// waiting/result/vote-waiting 페이지의 기존 투표 현황 폴링(refetchInterval: 2000)과 동일한 간격.
const VOTE_SESSION_POLLING_INTERVAL_MS = 2000;

interface UseVoteSessionPollingOptions {
  // status가 "confirmed"로 바뀌는 시점에 한 번만 호출된다 (세션당 1회, 재폴링돼도 중복 호출 안 됨).
  // itineraryId는 확정으로 새로 만들어진 일정의 id — 이걸 넘겨야 참여자도
  // 목록 캐시와 무관하게 방금 만들어진 일정으로 바로 들어갈 수 있다.
  // status는 확정 시점의 투표 현황(확정안 confirmedPlan, 안별 득표 포함) — 어떤 안으로 왜
  // 정해졌는지 안내하는 데 쓴다.
  onConfirmed?: (
    sessionId: string,
    itineraryId?: string,
    status?: Awaited<ReturnType<typeof itineraryApi.getVoteStatus>>,
  ) => void;
  // 폴링 중 에러(세션 만료/404 등)가 나서 폴링이 멈추는 시점에 한 번만 호출된다.
  onError?: (error: unknown, sessionId: string) => void;
}

// 그룹 일정 투표 세션 현황(GET /api/itineraries/vote-sessions/{sessionId})을 주기적으로 폴링한다.
// - status가 "confirmed"가 되거나 API 에러(세션 만료/404 등)가 나면 자동으로 폴링을 멈춘다.
// - 언마운트 시 정리는 useQuery가 내부적으로 처리한다(waiting/page.tsx의 기존 폴링과 동일한 방식이라
//   여기서도 별도 setInterval/clearInterval을 쓰지 않는다).
// - operationId가 스와이프 상태 조회(getStatus)와 겹쳐서 "getStatus_1"로 잡혀 있음
//   (src/shared/api/domains/itinerary.ts의 getVoteStatus 참고). 백엔드가 operationId를 고유하게
//   바꿔주면 자연스러운 이름으로 돌아올 수 있어 지금은 그대로 둔다.
export function useVoteSessionPolling(sessionId: string, options?: UseVoteSessionPollingOptions) {
  const { onConfirmed, onError } = options ?? {};

  const {
    data: voteStatus,
    isError,
    error,
  } = useQuery({
    queryKey: itineraryApi.keys.voteStatus(sessionId),
    queryFn: () => itineraryApi.getVoteStatus(sessionId),
    enabled: !!sessionId,
    retry: false,
    refetchInterval: (query) =>
      query.state.status === "error" || query.state.data?.status === "confirmed"
        ? false
        : VOTE_SESSION_POLLING_INTERVAL_MS,
  });

  const isConfirmed = voteStatus?.status === "confirmed";

  // 세션이 바뀌면(재투표 등) 이전 세션에서 이미 쐈던 confirmed/error 알림 상태를 초기화한다.
  const notifiedSessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isConfirmed || !sessionId) return;
    if (notifiedSessionIdRef.current === sessionId) return;
    notifiedSessionIdRef.current = sessionId;
    onConfirmed?.(sessionId, voteStatus?.itineraryId, voteStatus);
    // voteStatus는 확정 순간의 값만 넘기면 된다(확정 뒤엔 폴링이 멈춘다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, sessionId, voteStatus?.itineraryId, onConfirmed]);

  const notifiedErrorSessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isError || !sessionId) return;
    if (notifiedErrorSessionIdRef.current === sessionId) return;
    notifiedErrorSessionIdRef.current = sessionId;
    onError?.(error, sessionId);
  }, [isError, error, sessionId, onError]);

  return { voteStatus, isConfirmed, isError, error };
}

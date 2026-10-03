"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrStartFlowTimer } from "@/shared/api/domains/group";

// 서버에 저장한 공통 마감을 사용한다. 기기 시계 대신 요청 왕복 시간과 단조 시계로
// 남은 시간을 계산하고, 탭 복귀/재접속 시 서버와 다시 맞춘다.
export function useItineraryFlowTimer(
  groupId: string,
  phase: "waiting" | "vote-waiting",
  sessionId?: string,
) {
  const { data, isError, refetch } = useQuery({
    queryKey: ["groups", groupId, "flow-timer", phase, sessionId ?? ""],
    queryFn: async () => {
      const sentAt = performance.now();
      const timer = await getOrStartFlowTimer(groupId, phase, sessionId);
      const receivedAt = performance.now();
      return {
        remainingAtReceipt: Math.max(
          0,
          timer.deadlineAt - timer.serverNow - (receivedAt - sentAt) / 2,
        ),
        receivedAt,
      };
    },
    enabled: !!groupId && (phase === "waiting" || !!sessionId),
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
  const [clock, setClock] = useState<{ sample: typeof data; remainingMs: number } | null>(null);

  useEffect(() => {
    if (!data) return;
    const update = () =>
      setClock({
        sample: data,
        remainingMs: Math.max(0, data.remainingAtReceipt - (performance.now() - data.receivedAt)),
      });
    update();
    const timer = window.setInterval(update, 250);
    const refresh = () => {
      update();
      if (document.visibilityState === "visible") void refetch();
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [data, refetch]);

  const isSynced = !!data && clock?.sample === data;
  const remainingMs = isSynced ? clock.remainingMs : 0;
  return { remainingMs, isOver: isSynced && remainingMs === 0, isSynced, isError };
}

export function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { transitApi } from "@/shared/api/domains";

export interface LiveArrivalLeg {
  type: string;
  arrivalText?: string;
  // 버스 실시간 도착정보(GET /api/transit/arrival/bus) 폴링용
  arsId?: string;
  routeNo?: string;
  // 지하철 도착정보(GET /api/transit/arrival/subway) 폴링용 — ODsay 배차 시각표 기준 추정치
  stationId?: number;
  wayCode?: number;
}

const ARRIVAL_POLL_MS = 30000;

// 버스/지하철 도착정보를 30초 간격으로 폴링해서 보여준다. 필요한 파라미터가 없으면
// (버스: arsId+routeNo, 지하철: stationId+wayCode) 기존 정적 arrivalText로 대체된다.
export function useLiveArrivalText(leg: LiveArrivalLeg) {
  const canPollBus = leg.type === "버스" && !!leg.arsId && !!leg.routeNo;
  const canPollSubway = leg.type === "지하철" && leg.stationId != null && leg.wayCode != null;
  const canPoll = canPollBus || canPollSubway;
  // 마을버스처럼 ODsay가 애초에 arsId를 안 주는 구간도 있다(팀에서 파악된 데이터 한계,
  // 버그 아님) — 이런 경우까지 포함해 버스/지하철 leg는 실시간 조회가 불가능해도
  // 배지 자체를 숨기지 않고 "실시간 정보 없음"으로 보여준다.
  const isArrivalType = leg.type === "버스" || leg.type === "지하철";

  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: canPollSubway
      ? transitApi.keys.subwayArrival({ stationId: leg.stationId ?? 0, wayCode: leg.wayCode ?? 0 })
      : transitApi.keys.busArrival({ arsId: leg.arsId ?? "", routeNo: leg.routeNo ?? "" }),
    queryFn: () =>
      canPollSubway
        ? transitApi.getSubwayArrival({ stationId: leg.stationId ?? 0, wayCode: leg.wayCode ?? 0 })
        : transitApi.getBusArrival({ arsId: leg.arsId ?? "", routeNo: leg.routeNo ?? "" }),
    enabled: canPoll,
    refetchInterval: ARRIVAL_POLL_MS,
  });

  // refetch는 enabled: false를 무시하고 바로 요청을 보내기 때문에, 파라미터가 없는
  // 구간(마을버스 등)에서 배지를 누르면 arsId=&routeNo= 같은 빈 요청이 나간다. 그래서
  // 폴링이 불가능한 leg에서는 호출 자체를 막는다.
  const refresh = useCallback(() => {
    if (!canPoll) return;
    refetch();
  }, [canPoll, refetch]);

  if (!canPoll || isError) {
    return {
      text: leg.arrivalText ?? (isArrivalType ? "실시간 정보 없음" : undefined),
      refetch: refresh,
      isFetching,
    };
  }
  if (data === undefined) return { text: "도착정보 조회 중...", refetch: refresh, isFetching };
  if (data === null) return { text: "도착정보 없음", refetch: refresh, isFetching };
  return { text: `${data}분 후 도착`, refetch: refresh, isFetching };
}

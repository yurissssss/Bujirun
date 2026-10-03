"use client";

import { useQuery } from "@tanstack/react-query";
import { spotApi, travelLogApi } from "@/shared/api/domains";

// 로그인 전 조회 여부는 호출 화면이 결정한다. 기존 쿼리 키와 캐시 정책을 유지한다.
export function usePlaceDetailQueries(spotId: string, enabled: { detail: boolean; logs: boolean }) {
  const detailQuery = useQuery({
    queryKey: spotApi.keys.detail(spotId),
    queryFn: () => spotApi.getSpot(spotId),
    enabled: enabled.detail,
  });
  const logsQuery = useQuery({
    queryKey: travelLogApi.keys.bySpot(spotId),
    queryFn: () => travelLogApi.getLogsBySpot(spotId),
    enabled: enabled.logs,
  });
  const relatedLogs = (logsQuery.data ?? []).slice(0, 2).map((log) => ({
    id: log.id ?? "",
    imageUrl: log.thumbnailPhotoUrl ?? "",
    author: log.authorNickname ?? "",
  }));

  return { detailQuery, relatedLogs };
}

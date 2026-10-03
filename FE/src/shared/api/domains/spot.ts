import { apiClient } from "@/shared/api/client";
import type { OpQuery, OpResponse } from "@/shared/api/types";

export const keys = {
  all: ["spots"] as const,
  search: (query?: OpQuery<"search">) => [...keys.all, "search", query ?? {}] as const,
  detail: (spotId: string) => [...keys.all, "detail", spotId] as const,
};

// 화면 간 공유되는 전체 관광지 목록은 수집/북마크 mutation에서 명시적으로 무효화한다.
export const SPOT_LIST_STALE_TIME_MS = 5 * 60 * 1000;

// 공통 envelope 없이 배열을 그대로 내려준다 (백엔드 스펙 확인됨)
export function searchSpots(query?: OpQuery<"search">) {
  return apiClient
    .get<OpResponse<"search">>("/api/spots/search", { params: query })
    .then((res) => res.data);
}

// 관광지 단건 조회 - envelope 없이 SpotDetailResponse 직접 반환
export function getSpot(spotId: string) {
  return apiClient.get<OpResponse<"getDetail_1">>(`/api/spots/${spotId}`).then((res) => res.data);
}

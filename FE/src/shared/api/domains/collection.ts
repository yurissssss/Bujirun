import { apiClient } from "@/shared/api/client";
import type { OpResponse } from "@/shared/api/types";

export const keys = {
  all: ["collections"] as const,
  board: () => [...keys.all, "board"] as const,
  detail: (spotId: string) => [...keys.all, "detail", spotId] as const,
  swipeDeck: () => [...keys.all, "swipe-deck"] as const,
  my: () => [...keys.all, "my"] as const,
};

// 주의: 이 두 엔드포인트는 다른 API와 달리 공통 { success, message, data } envelope 없이
// 응답 바디를 그대로 내려준다 (백엔드 스펙 확인됨). unwrap하지 않는다.
export function getCollectionBoard() {
  return apiClient.get<OpResponse<"getBoard">>("/api/collections").then((res) => res.data);
}

//getDetail_1이 getDetail_2로 바뀜
export function getCollectionDetail(spotId: string) {
  return apiClient
    .get<OpResponse<"getDetail_2">>(`/api/collections/${spotId}`)
    .then((res) => res.data);
}

export function cancelCollection(spotId: string) {
  return apiClient.delete(`/api/collections/${spotId}`);
}

// 도감 카테고리(바다/자연/문화/체험)별 랜덤 관광지 10곳. 스와이프 카드용.
// 응답도 envelope 없이 배열이 그대로 내려온다.
export function getSwipeDeck() {
  return apiClient
    .get<OpResponse<"getSwipeDeck">>("/api/collections/swipe-deck")
    .then((res) => res.data);
}

export function getMyCollection() {
  return apiClient
    .get<OpResponse<"getMyCollections">>("/api/collections/my")
    .then((res) => res.data);
}

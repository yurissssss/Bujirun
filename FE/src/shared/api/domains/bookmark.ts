// src/shared/api/domains/bookmark.ts

import { apiClient } from "@/shared/api/client";
import type { OpResponse } from "@/shared/api/types";

export const keys = {
  all: ["bookmarks"] as const,
  list: () => [...keys.all, "list"] as const,
};

// 북마크 목록 조회 - envelope 없이 배열 직접 반환
export function getBookmarks() {
  return apiClient.get<OpResponse<"getBookmarks">>("/api/bookmarks").then((res) => res.data);
}

// 북마크 추가
export function addBookmark(spotId: string) {
  return apiClient.post(`/api/bookmarks/${spotId}`);
}

// 북마크 삭제
export function removeBookmark(spotId: string) {
  return apiClient.delete(`/api/bookmarks/${spotId}`);
}

import { apiClient } from "@/shared/api/client";
import { unwrap } from "@/shared/api/response";
import type { OpBody, OpResponse } from "@/shared/api/types";

export const keys = {
  all: ["swipes"] as const,
  status: (groupId: string) => [...keys.all, "status", groupId] as const,
};

// 스와이프(좋아요/싫어요) 결과를 세션 단위로 저장. groupId를 함께 보내야
// 그룹 일정 자동생성(/api/itineraries/group/{groupId}/generate)의 취합 대상이 된다.
export function submitSwipes(body: OpBody<"submit">) {
  return apiClient.post<OpResponse<"submit">>("/api/swipes", body).then((res) => unwrap(res));
}

// 그룹원 중 스와이프 완료 인원/전체 인원 조회. 대기 화면 폴링용.
export function getSwipeStatus(groupId: string) {
  return apiClient
    .get<OpResponse<"getStatus">>("/api/swipes/status", { params: { groupId } })
    .then((res) => unwrap(res));
}

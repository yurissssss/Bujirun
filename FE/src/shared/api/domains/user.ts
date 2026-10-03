import { apiClient } from "@/shared/api/client";
import { unwrap } from "@/shared/api/response";
import type { OpBody, OpQuery, OpResponse } from "@/shared/api/types";

export const keys = {
  all: ["user"] as const,
  me: () => [...keys.all, "me"] as const,
  nicknameAvailability: (nickname: string) =>
    [...keys.all, "nickname-availability", nickname] as const,
};

export function getMyProfile() {
  return apiClient.get<OpResponse<"getMyProfile">>("/api/users/me").then((res) => unwrap(res));
}

export function updateMyProfile(body: OpBody<"updateMyProfile">) {
  return apiClient
    .patch<OpResponse<"updateMyProfile">>("/api/users/me", body)
    .then((res) => unwrap(res));
}

export function checkNicknameAvailability(query: OpQuery<"checkNicknameAvailability">) {
  return apiClient
    .get<OpResponse<"checkNicknameAvailability">>("/api/users/me/nickname/availability", {
      params: query,
    })
    .then((res) => unwrap(res));
}

//회원탈퇴
export function deleteMyAccount() {
  return apiClient.delete("/api/users/me");
}

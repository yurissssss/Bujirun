import { apiClient } from "@/shared/api/client";
import { unwrap } from "@/shared/api/response";
import type { OpResponse } from "@/shared/api/types";

export function kakaoLogin(code: string) {
  return apiClient
    .post<OpResponse<"kakaoLogin">>("/api/auth/kakao/token", null, { params: { code } })
    .then((res) => unwrap(res));
}

export function logout() {
  return apiClient.post<OpResponse<"logout">>("/api/auth/logout").then((res) => unwrap(res));
}

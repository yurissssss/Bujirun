import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import type { ApiResponse } from "./response";

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  // next.config.ts의 rewrites가 /api/*를 백엔드로 프록시하므로 same-origin 상대경로를 사용한다.
  // (절대 URL로 백엔드에 직접 요청하면 refresh_token 쿠키가 백엔드 도메인에만 저장돼
  //  프론트 자신에 대한 요청에서는 쿠키를 확인할 수 없다 — middleware.ts 참고)
  baseURL: "",
  timeout: 10_000,
  // refresh token은 서버가 httpOnly 쿠키로 관리하므로 요청에 쿠키를 포함시킨다.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

const REISSUE_URL = "/api/auth/reissue";

// 401이 동시에 여러 번 터져도 reissue는 한 번만 호출되도록 진행 중인 요청을 공유한다.
let reissuePromise: Promise<string | null> | null = null;

// 실시간 협업 WebSocket 훅(useItineraryYDoc)도 토큰 만료 전 선제 재발급에 이 함수를 그대로 재사용한다
// (reissuePromise 중복 제거 로직을 401 인터셉터와 공유하기 위함).
export function reissueAccessToken(): Promise<string | null> {
  if (!reissuePromise) {
    reissuePromise = apiClient
      .post<ApiResponse<{ accessToken: string; tokenType: string }>>(REISSUE_URL)
      .then((res) => {
        const accessToken = res.data.data.accessToken;
        useAuthStore.getState().setAccessToken(accessToken);
        return accessToken;
      })
      .catch(() => {
        useAuthStore.getState().clear();
        return null;
      })
      .finally(() => {
        reissuePromise = null;
      });
  }
  return reissuePromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    const isReissueCall = originalRequest?.url === REISSUE_URL;
    const shouldRetry =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isReissueCall;

    if (!shouldRetry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const newAccessToken = await reissueAccessToken();

    if (!newAccessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return apiClient(originalRequest);
  },
);

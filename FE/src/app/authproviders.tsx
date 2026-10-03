"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient, unwrap } from "@/shared/api";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { LoadingBoundary } from "@/components";

type AuthProviderProps = {
  children: ReactNode;
};

interface ReissueData {
  accessToken: string;
  tokenType: string;
}

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = ["/login", "/auth/kakao/callback", "/signup", "/join"];

export function AuthProvider({ children }: AuthProviderProps) {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clear = useAuthStore((s) => s.clear);
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // public 경로거나 이미 토큰 있으면 처음부터 ready 상태로 시작
  const [isReady, setIsReady] = useState(isPublicPath || !!accessToken);

  useEffect(() => {
    // public 경로거나 이미 accessToken 있으면 reissue 불필요
    if (isPublicPath || accessToken) return;

    apiClient
      .post<{ data?: ReissueData }>("/api/auth/reissue")
      .then((res) => {
        const data = unwrap<ReissueData>(res);
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
        }
      })
      .catch(() => {
        // reissue 실패 = refresh_token 없거나 만료 → 로그인 페이지로 이동
        // 미들웨어가 1차로 막지만, 혹시 뚫렸을 때 2차 방어선
        clear();
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      })
      .finally(() => setIsReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, isPublicPath, setAccessToken, clear, router]);

  return (
    <LoadingBoundary isLoading={!isReady} message="부지런히 준비하고 있어요">
      {children}
    </LoadingBoundary>
  );
}

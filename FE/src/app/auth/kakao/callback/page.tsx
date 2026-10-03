"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiClient, unwrap } from "@/shared/api";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { LoadingState } from "@/components";
import { buildPendingInviteQuery, consumePendingInvite } from "@/shared/utils/pendingInvite";
import type { OpResponse, OpQuery } from "@/shared/api/types";

// useSearchParams 사용 시 Suspense로 감싸야 해서 컴포넌트 분리
function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const hasRequested = useRef(false); // 중복 요청 방지 플래그

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      router.replace("/login");
      return;
    }

    if (hasRequested.current) return; // 이미 요청 보냈으면 중단
    hasRequested.current = true; // 요청 보내기 직전에 플래그 세움

    // 카카오 인가 코드를 백엔드에 전달해 토큰 발급 (schema 생성 타입 사용)
    apiClient
      .post<OpResponse<"kakaoLogin">>(`/api/auth/kakao/token`, null, {
        params: { code } satisfies OpQuery<"kakaoLogin">,
      })
      .then((response) => {
        const data = unwrap(response);
        if (!data?.accessToken) {
          router.replace("/login");
          return;
        }

        setAccessToken(data.accessToken);

        // 로그인 성공 직후의 이동은 router.replace(소프트 네비게이션) 대신
        // 하드 네비게이션을 쓴다. 로그인 전에 목적지 페이지가 이미 prefetch돼서
        // 클라이언트 라우터 캐시에 "비로그인" 상태로 박제돼 있으면, 소프트 네비게이션은
        // 그 캐시를 재사용해 로그인 후에도 예전 화면(리다이렉트 등)을 보여줄 수 있다.
        // 하드 네비게이션은 캐시를 거치지 않고 서버에 새로 요청하므로 이 문제가 없다.

        // 신규 유저는 회원가입(추가정보) 화면으로 분기
        // (초대 링크를 통해 들어온 경우 pendingInvite는 회원가입 완료 시점에 소비됨)
        if (data.isNewUser) {
          window.location.href = "/signup";
          return;
        }

        const pendingInvite = consumePendingInvite();
        if (!pendingInvite) {
          // 로그인 전 접근하려던 경로로 복귀, 없으면 홈으로
          const redirectTo = searchParams.get("redirect") ?? "/";
          window.location.href = redirectTo;
          return;
        }

        // 초대 링크로 들어온 경우 그룹 참여 페이지로 이동
        const query = buildPendingInviteQuery(pendingInvite);
        window.location.href = `/join/${pendingInvite.code}${query ? `?${query}` : ""}`;
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [searchParams, router, setAccessToken]);

  return <LoadingState message="로그인 중..." />;
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<LoadingState message="로그인 중..." />}>
      <CallbackContent />
    </Suspense>
  );
}

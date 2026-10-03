"use client";

// src/app/mypage/logs/[id]/page.tsx
// 다른 사람 로그 읽기 전용 상세 페이지 (북마크 관광지 상세 → 관련 로그 클릭 시 진입)
// GET /api/logs/{id} → TravelLogDetailResponse

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageCard, ErrorState, LoadingBoundary } from "@/components";
import { LogDetailContent, toLogDetailData } from "@/components/log/LogDetailContent";
import { travelLogApi } from "@/shared/api/domains";
import { useAuthStore } from "@/shared/stores/useAuthStore";

// 로그 상세 데이터 조회 훅
function useLogDetail(id: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: travelLogApi.keys.detail(id),
    queryFn: () => travelLogApi.getLog(id),
    enabled: !!accessToken && !!id,
  });
}

export default function MypageLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: log, isLoading } = useLogDetail(id);

  return (
    <PageCard>
      <LoadingBoundary isLoading={isLoading} message="로그를 불러오는 중이에요">
        {!log ? (
          <ErrorState
            code={404}
            title="로그를 찾을 수 없어요"
            description="삭제되었거나 존재하지 않는 로그예요."
            primaryAction={{
              label: "이전으로 돌아가기",
              onClick: () => router.back(),
            }}
          />
        ) : (
          <LogDetailContent log={toLogDetailData(log)} onBack={() => router.back()} />
        )}
      </LoadingBoundary>
    </PageCard>
  );
}

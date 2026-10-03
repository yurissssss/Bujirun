"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageCard, ErrorState, LoadingBoundary } from "@/components";
import { LogDetailContent, toLogDetailData } from "@/components/log/LogDetailContent";
import { useQuery } from "@tanstack/react-query";
import { getLog, keys } from "@/shared/api/domains/travel-log";

export default function LogDetailPage({ params }: { params: Promise<{ logId: string }> }) {
  const { logId } = use(params);
  const router = useRouter();

  const {
    data: log,
    isLoading,
    isError,
  } = useQuery({
    queryKey: keys.detail(logId),
    queryFn: () => getLog(logId),
  });

  // 목록/상세 다른 화면과 동일한 변환 로직 사용 (대표 관광지명은 log.title이 아니라 첫 방문지에서 가져와야 함)
  const detailLog = useMemo(() => (log ? toLogDetailData(log) : null), [log]);

  return (
    <PageCard>
      <LoadingBoundary isLoading={isLoading} message="로그를 불러오는 중이에요">
        {isError || !detailLog ? (
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
          <LogDetailContent log={detailLog} onBack={() => router.back()} />
        )}
      </LoadingBoundary>
    </PageCard>
  );
}

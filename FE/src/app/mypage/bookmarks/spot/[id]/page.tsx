"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { PageCard, ErrorState, LoadingBoundary } from "@/components";
import { PlaceDetailContent } from "@/components/place/PlaceDetailContent";
import { useSpotDetail } from "@/features/itinerary/hooks/useSpotDetail";

export default function BookmarkSpotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  // 토글 결과 토스트는 PlaceDetailContent가 띄운다.
  const { spot, place, isLoading, isError, toggleBookmark, relatedLogs } = useSpotDetail(id);

  return (
    <PageCard>
      <LoadingBoundary isLoading={isLoading} message="관광지 정보를 불러오는 중이에요">
        {isError || !spot || !spot.name ? (
          <ErrorState
            code={404}
            title="관광지를 찾을 수 없어요"
            description="삭제되었거나 존재하지 않는 페이지예요."
            primaryAction={{
              label: "북마크로 돌아가기",
              onClick: () => router.push("/mypage/bookmarks"),
            }}
          />
        ) : (
          <PlaceDetailContent
            place={place}
            onBack={() => router.back()}
            onBookmark={toggleBookmark}
            relatedLogs={relatedLogs}
            onViewMoreLogs={() => router.push(`/mypage/bookmarks/${id}/related-logs`)}
            getRelatedLogHref={(logId) => `/mypage/logs/${logId}`}
            onLogClick={(logId) => router.push(`/mypage/logs/${logId}`)}
          />
        )}
      </LoadingBoundary>
    </PageCard>
  );
}

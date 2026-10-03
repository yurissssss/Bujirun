"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button, PageCard, ErrorState, LoadingBoundary, StatusBadge } from "@/components";
import { PlaceDetailContent } from "@/components/place/PlaceDetailContent";
import { useSpotDetail } from "@/features/itinerary/hooks/useSpotDetail";

export default function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
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
              label: "이전으로 돌아가기",
              onClick: () => router.back(),
            }}
          />
        ) : (
          <PlaceDetailContent
            place={place}
            imageOverlay={
              spot.collection ? (
                <div className="absolute right-2 top-2">
                  <StatusBadge status={spot.collected ? "collected" : "uncollected"} />
                </div>
              ) : undefined
            }
            onBack={() => router.back()}
            onBookmark={toggleBookmark}
            relatedLogs={relatedLogs}
            onViewMoreLogs={() =>
              router.push(
                `/itinerary/place/${id}/related-logs?placeName=${encodeURIComponent(place.name)}&category=${place.category}`,
              )
            }
            getRelatedLogHref={(logId) => `/itinerary/logs/${logId}`}
            onLogClick={(logId) => router.push(`/itinerary/logs/${logId}`)}
            // TODO: 실제 일정 담기 플로우(대상 일정/day 선택) 연동 필요
            footer={<Button variant="primary">+ 일정에 추가</Button>}
          />
        )}
      </LoadingBoundary>
    </PageCard>
  );
}

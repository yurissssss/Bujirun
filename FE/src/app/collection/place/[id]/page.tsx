"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState, LoadingBoundary, PageCard } from "@/components";
import { PlaceDetailContent } from "@/components/place/PlaceDetailContent";
import { useSpotDetail } from "@/features/itinerary/hooks/useSpotDetail";

export default function CollectionPlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "전체";

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
              label: "도감으로 돌아가기",
              onClick: () => router.push(`/collection?category=${encodeURIComponent(category)}`),
            }}
          />
        ) : (
          <PlaceDetailContent
            place={place}
            onBack={() => router.push(`/collection?category=${encodeURIComponent(category)}`)}
            onBookmark={toggleBookmark}
            relatedLogs={relatedLogs}
            onViewMoreLogs={() =>
              router.push(
                `/itinerary/place/${id}/related-logs?placeName=${encodeURIComponent(place.name)}&category=${place.category}`,
              )
            }
            getRelatedLogHref={(logId) => `/itinerary/logs/${logId}`}
            onLogClick={(logId) => router.push(`/itinerary/logs/${logId}`)}
          />
        )}
      </LoadingBoundary>
    </PageCard>
  );
}

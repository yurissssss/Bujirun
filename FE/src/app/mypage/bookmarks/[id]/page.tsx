"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { PageCard, LoadingBoundary } from "@/components";
import { PlaceDetailContent } from "@/components/place/PlaceDetailContent";
import { useSpotDetail } from "@/features/itinerary/hooks/useSpotDetail";
import { getBookmarkCategory } from "@/features/mypage/utils/bookmarkCategory";

export default function BookmarkDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ thumbnail?: string }>;
}) {
  const { id } = use(params);
  // 북마크 목록에서 넘겨준 썸네일 — spot API 응답 전 플레이스홀더 대신 사용
  const { thumbnail } = use(searchParams);
  const router = useRouter();

  // 북마크 여부는 서버 북마크 목록 기준으로 판단하고, 토글 결과 토스트는 PlaceDetailContent가 띄운다.
  const { spot, place, isLoading, toggleBookmark, relatedLogs } = useSpotDetail(id, {
    imageUrl: thumbnail,
  });

  return (
    <PageCard>
      <LoadingBoundary isLoading={isLoading} message="관광지 정보를 불러오는 중이에요">
        <PlaceDetailContent
          // 카테고리는 북마크 목록 카드와 같은 기준으로 판단한다.
          place={{
            ...place,
            category: getBookmarkCategory(spot?.category, spot?.name) ?? "nature",
          }}
          onBack={() => router.back()}
          onBookmark={toggleBookmark}
          relatedLogs={relatedLogs}
          onViewMoreLogs={() => router.push(`/mypage/bookmarks/${id}/related-logs`)}
          getRelatedLogHref={(logId) => `/mypage/logs/${logId}`}
          onLogClick={(logId) => router.push(`/mypage/logs/${logId}`)}
        />
      </LoadingBoundary>
    </PageCard>
  );
}

"use client";

import { usePlaceDetailQueries } from "@/shared/hooks/usePlaceDetailQueries";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageCard, ErrorState, LoadingBoundary } from "@/components";
import { getKakaoMapUrl } from "@/shared/utils";
import type { Category } from "@/components";
import { PlaceDetailContent } from "@/components/place/PlaceDetailContent";
import { bookmarkApi, spotApi } from "@/shared/api/domains";
import { useAuthStore } from "@/shared/stores/useAuthStore";

function toCategory(value?: string, name?: string): Category {
  // TODO: 백엔드 category 응답이
  // "바다" | "자연" | "문화" | "체험"으로 통일되면
  // 아래 임시 문자열 판별 로직을 단순화
  if (name?.includes("해수욕장") || name?.includes("해변")) {
    return "sea";
  }

  if (!value) return "nature";
  if (value.includes("바다") || value.includes("해수욕")) {
    return "sea";
  }

  if (value.includes("자연")) {
    return "nature";
  }

  if (value.includes("문화") || value.includes("역사")) {
    return "culture";
  }

  if (value.includes("체험") || value.includes("놀이")) {
    return "experience";
  }

  return "nature";
}

export default function RecommendedPlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  // 관광지 상세 조회
  const { detailQuery, relatedLogs } = usePlaceDetailQueries(id, {
    detail: Boolean(accessToken && id),
    logs: Boolean(accessToken && id),
  });
  const { data: spot, isLoading, isError } = detailQuery;

  // 북마크 목록 조회
  const { data: bookmarks = [] } = useQuery({
    queryKey: bookmarkApi.keys.list(),
    queryFn: bookmarkApi.getBookmarks,
    enabled: Boolean(accessToken),
  });

  // collected가 아니라 북마크 목록에 현재 spotId가 있는지로 판단
  const isBookmarked = bookmarks.some((bookmark) => bookmark.spotId === id);

  // 북마크 추가/삭제
  const { mutate: toggleBookmark, isPending: isBookmarkPending } = useMutation({
    mutationFn: () => (isBookmarked ? bookmarkApi.removeBookmark(id) : bookmarkApi.addBookmark(id)),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: bookmarkApi.keys.list(),
        }),
        queryClient.invalidateQueries({
          queryKey: spotApi.keys.detail(id),
        }),
        queryClient.invalidateQueries({
          queryKey: spotApi.keys.search(),
        }),
      ]);
    },
  });

  return (
    <PageCard>
      <LoadingBoundary isLoading={isLoading} message="관광지 정보를 불러오는 중이에요">
        {isError || !spot || !spot.name ? (
          <ErrorState
            code={404}
            title="관광지를 찾을 수 없어요"
            description="삭제되었거나 존재하지 않는 페이지예요."
            primaryAction={{
              label: "추천 여행지로 돌아가기",
              onClick: () => router.push("/home/recommend"),
            }}
          />
        ) : (
          <PlaceDetailContent
            onBack={() => router.back()}
            place={{
              imageUrl: spot.thumbnailUrl ?? `https://picsum.photos/seed/${id}/400/300`,
              name: spot.name,
              category: toCategory(spot.collectionCategory, spot.name),
              description: spot.overview ?? "",
              address: spot.address ?? "",
              mapUrl: getKakaoMapUrl(spot.name, spot.lat, spot.lng),
              isBookmarked,
              infoItems: [
                ...(spot.operatingHours
                  ? [
                      {
                        type: "clock" as const,
                        label: "운영시간",
                        value: spot.operatingHours,
                      },
                    ]
                  : []),

                ...(spot.tel
                  ? [
                      {
                        type: "call" as const,
                        label: "문의",
                        value: spot.tel,
                      },
                    ]
                  : []),
              ],
            }}
            onBookmark={() => {
              if (!isBookmarkPending) {
                toggleBookmark();
              }
            }}
            relatedLogs={relatedLogs}
            onViewMoreLogs={() => router.push(`/home/recommend/${id}/related-logs`)}
            getRelatedLogHref={(logId) => `/home/logs/${logId}`}
            onLogClick={(logId) => router.push(`/home/logs/${logId}`)}
          />
        )}
      </LoadingBoundary>
    </PageCard>
  );
}

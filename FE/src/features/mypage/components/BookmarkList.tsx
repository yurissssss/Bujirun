"use client";

import { getPlaceCollectionStatus } from "@/shared/utils/placeCollection";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlaceBookmarkCard } from "@/components/place/PlaceBookmarkCard";
import { Toast, EmptyState, PlaceCardListSkeleton, ErrorState } from "@/components";
import { SPOT_LIST_STALE_TIME_MS } from "@/shared/api/domains/spot";
import { bookmarkApi, spotApi } from "@/shared/api/domains";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { BOOKMARK_TOAST_MESSAGE } from "@/shared/constants/bookmark";
import { getBookmarkCategory } from "@/features/mypage/utils/bookmarkCategory";

export function BookmarkList() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [toastVisible, setToastVisible] = useState(false);

  const {
    data: bookmarks = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: bookmarkApi.keys.list(),
    queryFn: () => bookmarkApi.getBookmarks(),
    enabled: !!accessToken,
  });

  // 북마크 응답에는 수집 여부가 없으므로 검색과 같은 관광지 캐시에서 상태를 가져온다.
  const { data: spots = [] } = useQuery({
    queryKey: spotApi.keys.search(),
    queryFn: () => spotApi.searchSpots(),
    staleTime: SPOT_LIST_STALE_TIME_MS,
    enabled: !!accessToken && bookmarks.length > 0,
  });
  const spotsById = new Map(spots.map((spot) => [spot.spotId, spot]));

  const { mutate: removeBookmark } = useMutation({
    mutationFn: (spotId: string) => bookmarkApi.removeBookmark(spotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkApi.keys.list() });
      setToastVariant("success");
      setToastVisible(true);
    },
    onError: () => {
      setToastVariant("error");
      setToastVisible(true);
    },
  });

  if (isError) {
    return (
      <ErrorState
        code={500}
        title="북마크를 불러오지 못했어요"
        description="잠시 후 다시 시도해주세요."
        primaryAction={{
          label: "다시 시도하기",
          onClick: () => refetch(),
        }}
      />
    );
  }

  if (isLoading) return <PlaceCardListSkeleton />;

  return (
    <>
      {bookmarks.length === 0 ? (
        <EmptyState
          className="-translate-y-5"
          title="아직 저장된 관광지가 없어요"
          description={
            <>
              마음에 드는 관광지를 저장해두고
              <br />
              나중에 다시 확인해보세요.
            </>
          }
          primaryAction={{
            label: "관광지 둘러보기",
            onClick: () => router.push("/mypage/bookmarks/search"),
          }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {bookmarks.map((item) => (
            <PlaceBookmarkCard
              key={item.spotId}
              name={item.name ?? ""}
              category={getBookmarkCategory(item.category, item.name ?? "")}
              status={getPlaceCollectionStatus(spotsById.get(item.spotId))}
              isBookmarked={true}
              imageUrl={item.thumbnailUrl ?? undefined}
              onBookmarkToggle={() => item.spotId && removeBookmark(item.spotId)}
              onClick={() => item.spotId && router.push(`/mypage/bookmarks/${item.spotId}`)}
            />
          ))}
        </div>
      )}

      <Toast
        isVisible={toastVisible}
        message={
          toastVariant === "success" ? BOOKMARK_TOAST_MESSAGE.removed : BOOKMARK_TOAST_MESSAGE.error
        }
        onHide={() => setToastVisible(false)}
        variant={toastVariant}
      />
    </>
  );
}

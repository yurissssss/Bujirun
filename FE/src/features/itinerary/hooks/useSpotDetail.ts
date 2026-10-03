"use client";

import { usePlaceDetailQueries } from "@/shared/hooks/usePlaceDetailQueries";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Category, PlaceDetailData } from "@/components";
import { bookmarkApi, spotApi } from "@/shared/api/domains";
import { getCategoryFromKo } from "@/shared/constants/category";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { getKakaoMapUrl } from "@/shared/utils";
import { getFallbackImage } from "@/features/itinerary/utils/scheduleUtils";

interface UseSpotDetailFallback {
  name?: string;
  imageUrl?: string;
  category?: Category;
  description?: string;
  address?: string;
}

// 관광지 상세 데이터 로직(스팟 상세/북마크 토글/관련 로그)과 PlaceDetailContent에 바로 꽂을 수 있는
// place 객체 구성까지 한 곳에 모은 훅. 전체페이지 상세(/itinerary/place/[id]), 일정 타임라인 인라인
// 팝업(TimelinePlaceDetailPopup), 장소 검색 미리보기(TimelineSearchPopup)가 이 훅을 공유한다 —
// 예전엔 각자 따로 구현돼 있어서 한 곳만 고치고 다른 곳은 놓치기 쉬웠다.
export function useSpotDetail(spotId: string | undefined, fallback: UseSpotDetailFallback = {}) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const { detailQuery, relatedLogs } = usePlaceDetailQueries(spotId ?? "", {
    detail: Boolean(spotId),
    logs: Boolean(accessToken && spotId),
  });
  const { data: spot, isLoading, isError } = detailQuery;

  const { data: bookmarks = [] } = useQuery({
    queryKey: bookmarkApi.keys.list(),
    queryFn: bookmarkApi.getBookmarks,
    enabled: Boolean(accessToken),
  });

  // collected가 아니라 북마크 목록에 현재 spotId가 있는지로 판단
  const isBookmarked = Boolean(spotId) && bookmarks.some((bookmark) => bookmark.spotId === spotId);

  const { mutateAsync: toggleBookmarkMutateAsync, isPending: isBookmarkPending } = useMutation({
    mutationFn: () =>
      spotId
        ? isBookmarked
          ? bookmarkApi.removeBookmark(spotId)
          : bookmarkApi.addBookmark(spotId)
        : Promise.reject(new Error("spotId missing")),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bookmarkApi.keys.list() }),
        queryClient.invalidateQueries({ queryKey: spotApi.keys.detail(spotId ?? "") }),
        queryClient.invalidateQueries({ queryKey: spotApi.keys.search() }),
      ]);
    },
  });

  const name = spot?.name || fallback.name || "";
  const place: PlaceDetailData = {
    imageUrl:
      spot?.thumbnailUrl || fallback.imageUrl || getFallbackImage(spot?.spotId ?? spotId, name),
    name,
    category: fallback.category ?? getCategoryFromKo(spot?.collectionCategory ?? ""),
    description: spot?.overview || fallback.description || "",
    address: spot?.address || fallback.address || "",
    mapUrl: getKakaoMapUrl(name, spot?.lat, spot?.lng),
    isBookmarked,
    infoItems: [
      { type: "clock", label: "운영", value: spot?.operatingHours || "운영 정보가 없습니다." },
      { type: "call", label: "문의", value: spot?.tel || "문의처 정보가 없습니다." },
    ],
  };

  return {
    spot,
    place,
    isLoading,
    isError,
    isBookmarked,
    toggleBookmark: async () => {
      if (spotId && !isBookmarkPending) await toggleBookmarkMutateAsync();
    },
    relatedLogs,
  };
}

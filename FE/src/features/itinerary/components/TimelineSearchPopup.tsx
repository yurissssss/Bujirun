"use client";

import { forwardRef, useState } from "react";
import Image from "next/image";
import angleLeftIcon from "@/assets/icons/itinerary/angle-left.svg?url";
import PlusIcon from "@/assets/icons/itinerary/plus-small.svg?svgr";
import { PlaceDetailContent, StatusBadge } from "@/components";
import { cn } from "@/shared/utils";
import { useSpotDetail } from "@/features/itinerary/hooks/useSpotDetail";
import {
  PlaceSearchPanel,
  type PlaceSearchState,
  type SearchPlace,
} from "../../../components/place/PlaceSearchPanel";

interface TimelineSearchPopupProps {
  onClose: () => void;
  onAddToItinerary?: (place: SearchPlace) => void;
  /**
   * 평소엔 타임라인 세로선 오른쪽(카드 자리)에 맞춰 띄우지만, 일정이 하나도 없어 세로선도
   * 카드도 없는 화면에서는 기준 삼을 게 없어 오른쪽으로 치우쳐 보인다 — 그때만 화면 전체
   * 너비로 가운데에 띄운다.
   */
  centered?: boolean;
}

function SelectedPlacePreview({
  selectedPlace,
  onBackToSearch,
  onAddToItinerary,
  onClose,
}: {
  selectedPlace: SearchPlace;
  onBackToSearch: () => void;
  onAddToItinerary?: (place: SearchPlace) => void;
  onClose: () => void;
}) {
  const { place, toggleBookmark, relatedLogs } = useSpotDetail(selectedPlace.id, {
    name: selectedPlace.name,
    imageUrl: selectedPlace.imageUrl,
    category: selectedPlace.collectionCategory,
  });

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToSearch}
          className="flex items-center justify-center -translate-y-0.5"
          aria-label="관광지 상세 닫기"
        >
          <Image
            src={angleLeftIcon}
            alt=""
            width={12}
            height={12}
            className="icon-darkgray"
            aria-hidden
          />
        </button>
        {onAddToItinerary && (
          <button
            type="button"
            onClick={() => {
              onAddToItinerary(selectedPlace);
              onClose();
            }}
            className="flex size-[18px] shrink-0 -translate-y-0.5 items-center justify-center rounded-md bg-sub-coral active:opacity-70"
            aria-label="내 일정에 추가"
          >
            <PlusIcon width={16} height={16} className="text-main-white" aria-hidden />
          </button>
        )}
      </div>

      <PlaceDetailContent
        place={place}
        // 도감(수집) 대상이 아닌 관광지는 status가 undefined다(SearchPlace 참고). 검색 목록은
        // 이걸 보고 배지를 숨기는데 상세보기만 그대로 그려서, 도감에 없는 관광지에도 "미수집"이
        // 붙었다 — 모을 수 없는 곳인데 안 모은 것처럼 보인다.
        imageOverlay={
          selectedPlace.status ? (
            <div className="absolute right-2 top-2">
              <StatusBadge
                status={selectedPlace.status === "completed" ? "collected" : "uncollected"}
              />
            </div>
          ) : undefined
        }
        onBookmark={toggleBookmark}
        relatedLogs={relatedLogs}
        // 타임라인 관광지 상세 팝업과 같이 로그 상세와 관련 로그 전체 목록으로 연결한다.
        relatedLogsHref={`/itinerary/place/${selectedPlace.id}/related-logs`}
        getRelatedLogHref={(logId) => `/itinerary/logs/${logId}`}
        size="compact"
      />
    </>
  );
}

export const TimelineSearchPopup = forwardRef<HTMLDivElement, TimelineSearchPopupProps>(
  function TimelineSearchPopup({ onClose, onAddToItinerary, centered = false }, ref) {
    const [selectedPlace, setSelectedPlace] = useState<SearchPlace | null>(null);
    const [searchState, setSearchState] = useState<PlaceSearchState>({
      searchValue: "",
      sortBy: "추천순",
      categoryFilter: "all",
    });

    return (
      <div
        ref={ref}
        className={cn(
          "z-20",
          centered
            ? "absolute inset-x-0 top-0 flex translate-x-1.5 justify-center px-4"
            : "absolute left-[52px] right-0 top-0 pl-3",
        )}
      >
        <div className="flex h-[470px] w-full flex-col overflow-hidden rounded-3xl border-[0.5px] border-system-glassborder bg-main-white px-4 py-5 shadow-[2px_2px_10px_0px_var(--color-system-glassborder)]">
          {selectedPlace ? (
            <SelectedPlacePreview
              selectedPlace={selectedPlace}
              onBackToSearch={() => setSelectedPlace(null)}
              onAddToItinerary={onAddToItinerary}
              onClose={onClose}
            />
          ) : (
            <PlaceSearchPanel
              onClose={onClose}
              onPlaceSelect={setSelectedPlace}
              initialSearchState={searchState}
              onSearchStateChange={setSearchState}
            />
          )}
        </div>
      </div>
    );
  },
);

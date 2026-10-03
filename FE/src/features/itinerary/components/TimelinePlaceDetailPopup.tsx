import { forwardRef } from "react";
import Image from "next/image";
import angleLeftIcon from "@/assets/icons/itinerary/angle-left.svg?url";
import { PlaceDetailContent, StatusBadge } from "@/components";
import { useSpotDetail } from "@/features/itinerary/hooks/useSpotDetail";
import type { ItineraryStop } from "./ItineraryTimeline";

interface TimelinePlaceDetailPopupProps {
  stop: ItineraryStop;
  onClose: () => void;
}

export const TimelinePlaceDetailPopup = forwardRef<HTMLDivElement, TimelinePlaceDetailPopupProps>(
  function TimelinePlaceDetailPopup({ stop, onClose }, ref) {
    const spotId = stop.spotId;

    const { spot, place, isBookmarked, toggleBookmark, relatedLogs } = useSpotDetail(spotId, {
      name: stop.placeName,
      imageUrl: stop.imageUrl,
      category: stop.category,
      description: stop.description,
      address: stop.address,
    });

    return (
      <div ref={ref} className="absolute left-[52px] right-0 top-0 z-20 pl-3">
        <div className="flex h-116 w-full flex-col overflow-hidden rounded-3xl border-[0.5px] border-system-glassborder bg-main-white px-4 py-5 shadow-[2px_2px_10px_0px_var(--color-system-glassborder)]">
          <button
            type="button"
            onClick={onClose}
            className="mb-3 flex items-center justify-center self-start -translate-y-0.5"
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
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <PlaceDetailContent
              place={{ ...place, mapUrl: place.mapUrl ?? stop.mapUrl, isBookmarked }}
              // 도감(수집) 대상이 아닌 관광지엔 수집 배지를 붙이지 않는다 — 모을 수 없는 곳에
              // "미수집"이 붙어 안 모은 것처럼 보였다(검색 목록은 이미 같은 기준으로 숨긴다).
              // 상세를 아직 못 받았으면 붙이지 않는다 — 잘못 붙는 것보다 늦게 붙는 게 낫다.
              imageOverlay={
                spot?.collection ? (
                  <div className="absolute right-2 top-2">
                    <StatusBadge
                      status={stop.status === "completed" ? "collected" : "uncollected"}
                    />
                  </div>
                ) : undefined
              }
              onBookmark={spotId ? toggleBookmark : undefined}
              relatedLogs={spotId ? relatedLogs : undefined}
              // 다른 탭의 관광지 상세와 같이 관련 로그 전체 목록으로 가는 "더보기"를 단다.
              relatedLogsHref={spotId ? `/itinerary/place/${spotId}/related-logs` : undefined}
              getRelatedLogHref={(logId) => `/itinerary/logs/${logId}`}
              size="compact"
            />
          </div>
        </div>
      </div>
    );
  },
);

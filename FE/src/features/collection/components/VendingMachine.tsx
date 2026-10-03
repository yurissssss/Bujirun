"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import vendingMachineImage from "@/assets/collection/vendingmachine.png";
import { Pagination } from "@/features/collection/components/Pagination";

const ITEMS_PER_PAGE = 20;
const SWIPE_THRESHOLD = 40;

const CATEGORY_BUTTON_CLASS = {
  바다: "bg-collection-sea",
  자연: "bg-collection-nature",
  문화: "bg-collection-culture",
  체험: "bg-collection-experience",
} as const;

type CollectionCategory = keyof typeof CATEGORY_BUTTON_CLASS;

const isCollectionCategory = (category?: string): category is CollectionCategory =>
  category !== undefined && category in CATEGORY_BUTTON_CLASS;

type CollectionSpot = {
  spotId?: string;
  name?: string;
  collectedAt?: string;
  collectionCategory?: string;
};

type VendingMachineProps = {
  spots: CollectionSpot[];
  onCategorySelect: (category: CollectionCategory) => void;
  onSpotClick?: (spotId: string) => void;
  onRecordClick?: () => void;
};

export function VendingMachine({
  spots,
  onCategorySelect,
  onSpotClick,
  onRecordClick,
}: VendingMachineProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isLeverPulled, setIsLeverPulled] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const pointerStartXRef = useRef<number | null>(null);

  const pageCount = Math.max(1, Math.ceil(spots.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, pageCount - 1);

  const pageTranslateClass = ["translate-x-0", "-translate-x-full", "-translate-x-[200%]"][
    safePage
  ];

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const touchStartX = touchStartXRef.current;
    const touchEndX = event.changedTouches[0]?.clientX;

    touchStartXRef.current = null;

    if (touchStartX === null || touchEndX === undefined) return;

    const swipeDistance = touchStartX - touchEndX;

    if (Math.abs(swipeDistance) < SWIPE_THRESHOLD) return;

    if (swipeDistance > 0 && safePage < pageCount - 1) {
      setCurrentPage(safePage + 1);
      return;
    }

    if (swipeDistance < 0 && safePage > 0) {
      setCurrentPage(safePage - 1);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartXRef.current = event.clientX;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointerStartX = pointerStartXRef.current;
    pointerStartXRef.current = null;

    if (pointerStartX === null) return;

    const swipeDistance = pointerStartX - event.clientX;

    if (Math.abs(swipeDistance) < SWIPE_THRESHOLD) return;

    if (swipeDistance > 0 && safePage < pageCount - 1) {
      setCurrentPage(safePage + 1);
      return;
    }

    if (swipeDistance < 0 && safePage > 0) {
      setCurrentPage(safePage - 1);
    }
  };

  const handlePageChange = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  const handleRecordLeverClick = () => {
    if (isLeverPulled) return;

    setIsLeverPulled(true);

    window.setTimeout(() => {
      onRecordClick?.();
      setIsLeverPulled(false);
    }, 280);
  };

  return (
    <div className="relative w-full">
      <Image src={vendingMachineImage} alt="부산 도감 자판기" className="h-auto w-full" priority />

      <p className="absolute left-1/2 top-[3%] -translate-x-1/2 whitespace-nowrap font-giants text-lg text-text-heading">
        BUSAN COLLECTION
      </p>

      <div
        className="absolute left-6 right-6 top-[8%] bottom-[20%] touch-pan-y select-none overflow-hidden rounded-t-[6px] border-[1.5] border-collection-border bg-main-white"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className="grid h-full grid-rows-5">
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid min-h-0 grid-rows-[1fr_22px]">
              {/* 스티커만 슬라이드 */}
              <div className="overflow-hidden">
                <div
                  className={`flex h-full transition-transform duration-300 ease-out ${pageTranslateClass}`}
                >
                  {Array.from({ length: pageCount }).map((_, pageIndex) => {
                    const pageStartIndex = pageIndex * ITEMS_PER_PAGE;
                    const pageSpots = spots.slice(pageStartIndex, pageStartIndex + ITEMS_PER_PAGE);

                    return (
                      <div
                        key={pageIndex}
                        className="grid h-full w-full shrink-0 grid-cols-4 items-end gap-4 px-3 pt-3"
                      >
                        {Array.from({ length: 4 }).map((_, itemIndex) => {
                          const spot = pageSpots[rowIndex * 4 + itemIndex];

                          if (!spot?.name) {
                            return (
                              <div
                                key={itemIndex}
                                className="mx-auto aspect-square w-full max-w-[56px]"
                              />
                            );
                          }

                          return (
                            <button
                              key={spot.spotId ?? spot.name}
                              type="button"
                              className="cursor-pointer transition active:scale-[0.97]"
                              onClick={() => spot.spotId && onSpotClick?.(spot.spotId)}
                            >
                              <Image
                                src={`/collection/${spot.name}.webp`}
                                alt={spot.name}
                                width={56}
                                height={56}
                                unoptimized
                                className={`mx-auto aspect-square w-full max-w-[56px] rounded-[6px] border-[1px] border-collection-border object-contain ${
                                  spot.collectedAt ? "" : "grayscale opacity-80"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className={`relative -mt-1 grid grid-cols-4 items-center gap-4 border-t-[1.5px] border-collection-border bg-collection-shelf px-4 ${
                  rowIndex < 4 ? "border-b-[1.5px]" : ""
                }`}
              >
                {Array.from({ length: 4 }).map((_, itemIndex) => {
                  const activePageStartIndex = safePage * ITEMS_PER_PAGE;
                  const activePageSpots = spots.slice(
                    activePageStartIndex,
                    activePageStartIndex + ITEMS_PER_PAGE,
                  );

                  const spot = activePageSpots[rowIndex * 4 + itemIndex];

                  if (!spot || !isCollectionCategory(spot.collectionCategory)) {
                    return <span key={itemIndex} className="mx-auto h-3 w-6" />;
                  }

                  const buttonClass = CATEGORY_BUTTON_CLASS[spot.collectionCategory];
                  const category = spot.collectionCategory;

                  return (
                    <button
                      key={spot.spotId ?? spot.name}
                      type="button"
                      aria-label={`${spot.collectionCategory} 카테고리 보기`}
                      onClick={() => onCategorySelect(category)}
                      className={`mx-auto h-3 w-6 cursor-pointer -translate-y-[1px] rounded-[45%] border border-collection-border shadow-collection-button
active:shadow-collection-button-active transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--color-collection-border)] ${buttonClass}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute left-1/2 top-[81.5%] -translate-x-1/2">
        <Pagination currentPage={safePage} pageCount={pageCount} onPageChange={handlePageChange} />
      </div>

      {/* 여행 기록 레버 */}
      <button
        type="button"
        aria-label="여행 기록 보기"
        onClick={handleRecordLeverClick}
        className="absolute left-[76%] top-[87%] z-10 h-[9%] w-[10%]"
      >
        <span className="absolute bottom-[53%] left-[21%] aspect-square w-[60%] -translate-x-1/2 rounded-full border border-collection-border bg-collection-lever" />

        <span
          className={`absolute bottom-[68%] left-[21%] h-[50%] w-[12%] origin-bottom -translate-x-1/2 rounded-full border border-collection-border bg-collection-lever transition-transform duration-900 ease-out ${
            isLeverPulled ? "rotate-[35deg]" : "rotate-0"
          }`}
        />
      </button>
    </div>
  );
}

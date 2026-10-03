import Image from "next/image";

import { cn } from "@/shared/utils";

import shelfSea from "@/assets/collection/shelf-sea.png";
import shelfNature from "@/assets/collection/shelf-nature.png";
import shelfCulture from "@/assets/collection/shelf-culture.png";
import shelfExperience from "@/assets/collection/shelf-experience.png";

const CATEGORY_TITLE = {
  바다: "SEA COLLECTION",
  자연: "NATURE COLLECTION",
  문화: "CULTURE COLLECTION",
  체험: "EXPERIENCE COLLECTION",
} as const;

const CATEGORY_SHELF_IMAGE = {
  바다: shelfSea,
  자연: shelfNature,
  문화: shelfCulture,
  체험: shelfExperience,
} as const;

type CollectionCategory = keyof typeof CATEGORY_TITLE;

type CollectionSpot = {
  spotId?: string;
  name?: string;
  collectedAt?: string;
  collectionCategory?: string;
};

type ShelfProps = {
  spots: CollectionSpot[];
  category: CollectionCategory;
  onSpotClick?: (spotId: string) => void;
};

export function Shelf({ spots, category, onSpotClick }: ShelfProps) {
  const categorySpots = spots.filter((spot) => spot.collectionCategory === category);

  const ITEMS_PER_ROW = 3;

  const shelfImage = CATEGORY_SHELF_IMAGE[category];

  const rows = Array.from({
    length: Math.ceil(categorySpots.length / ITEMS_PER_ROW),
  });

  return (
    <div className="relative w-full">
      <div className="-mt-1 mb-4 flex flex-col items-center">
        <div className="flex w-[61%] justify-between px-8">
          <div className="h-3 w-[1.5px] bg-collection-border" />
          <div className="h-3 w-[1.5px] bg-collection-border" />
        </div>

        <div className="flex h-11 w-[72%] items-center justify-center rounded-[4px] border-[1.5px] border-collection-border bg-collection-bg px-3">
          <p className="whitespace-nowrap font-giants text-lg text-text-heading">
            {CATEGORY_TITLE[category]}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 -translate-y-1">
        {rows.map((_, rowIndex) => {
          const rowSpots = categorySpots.slice(
            rowIndex * ITEMS_PER_ROW,
            rowIndex * ITEMS_PER_ROW + ITEMS_PER_ROW,
          );

          return (
            <div key={rowIndex} className="relative">
              <div className="relative z-10 grid translate-y-2.5 grid-cols-3 items-end gap-6 px-6">
                {Array.from({ length: ITEMS_PER_ROW }).map((_, itemIndex) => {
                  const spot = rowSpots[itemIndex];

                  if (!spot?.name) {
                    return <div key={itemIndex} />;
                  }

                  return (
                    <div key={spot.spotId ?? spot.name} className="flex flex-col items-center">
                      <button
                        type="button"
                        className="cursor-pointer transition active:scale-[0.97]"
                        onClick={() => spot.spotId && onSpotClick?.(spot.spotId)}
                      >
                        <Image
                          src={`/collection/${spot.name}.webp`}
                          alt={spot.name}
                          width={70}
                          height={70}
                          unoptimized
                          className={`aspect-square max-w-[70px] w-full border border-collection-border object-contain ${
                            spot.collectedAt ? "" : "grayscale opacity-80"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              <Image src={shelfImage} alt="선반 이미지" className="h-auto w-full" />

              <div className="absolute left-0 top-20 z-20 grid w-full grid-cols-3 gap-6 px-6">
                {Array.from({ length: ITEMS_PER_ROW }).map((_, itemIndex) => {
                  const spot = rowSpots[itemIndex];

                  if (!spot?.name) {
                    return <div key={itemIndex} />;
                  }

                  return (
                    <div
                      key={spot.spotId ?? spot.name}
                      className={cn(
                        "relative mt-3.5 flex h-8 w-20 items-center justify-center border border-collection-border bg-main-white px-1 text-center text-xs leading-tight text-text-heading",
                      )}
                    >
                      {spot.collectedAt && (
                        <span
                          className="absolute -right-4 -top-2 flex h-3.5 w-11.5 rotate-[18deg] items-center justify-center bg-collection-shelf font-courierprime font-bold text-[8px] leading-none text-text-heading"
                          style={{
                            clipPath:
                              "polygon(0 15%, 6% 25%, 2% 40%, 7% 52%, 1% 68%, 6% 82%, 0 100%, 100% 100%, 94% 82%, 99% 68%, 93% 52%, 98% 40%, 94% 25%, 100% 15%, 100% 0, 0 0)",
                          }}
                        >
                          VISITED
                        </span>
                      )}

                      <span className="line-clamp-2">{spot.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

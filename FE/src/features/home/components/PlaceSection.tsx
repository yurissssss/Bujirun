"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { keys, searchSpots, SPOT_LIST_STALE_TIME_MS } from "@/shared/api/domains/spot";
import { CategoryChip, HomePlaceRowSkeleton } from "@/components";
import type { Category } from "@/components";

function toCategory(value?: string): Category {
  if (!value) return "experience";

  if (value.includes("자연")) return "nature";
  if (value.includes("바다")) return "sea";
  if (value.includes("문화")) return "culture";

  return "experience";
}

export function PlaceSection() {
  const router = useRouter();

  const {
    data: spots = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: keys.search(),
    queryFn: () => searchSpots(),
    staleTime: SPOT_LIST_STALE_TIME_MS,
  });

  const recommendedPlaces = useMemo(
    () =>
      [...spots]
        .filter(
          (spot) =>
            Boolean(spot.spotId && spot.name && spot.thumbnailUrl) &&
            ((spot.isCollection && !spot.collected) || (!spot.isCollection && !spot.visited)),
        )
        .sort((a, b) => {
          const getPriority = (spot: (typeof spots)[number]) => {
            if (spot.isCollection && !spot.collected) return 0;
            if (!spot.isCollection && !spot.visited) return 1;
            return 2;
          };

          return getPriority(a) - getPriority(b);
        })
        .slice(0, 6),
    [spots],
  );

  if (isLoading) {
    return <HomePlaceRowSkeleton />;
  }

  if (isError) {
    return null;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-ssurround text-lg text-text-heading">여기는 어때요?</h2>
        <button
          type="button"
          className="flex items-center text-sm font-semibold text-sub-darkgray"
          onClick={() => router.push("/home/recommend")}
        >
          더보기
          <svg viewBox="0 0 24 24" className="size-5 fill-sub-darkgray" aria-hidden="true">
            <path d="M15.4,9.88,10.81,5.29a1,1,0,0,0-1.41,0,1,1,0,0,0,0,1.42L14,11.29a1,1,0,0,1,0,1.42L9.4,17.29a1,1,0,0,0,1.41,1.42l4.59-4.59A3,3,0,0,0,15.4,9.88Z" />
          </svg>
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {recommendedPlaces.map((place) => (
          <button
            key={place.spotId}
            type="button"
            className="relative h-[90px] w-[144px] shrink-0 overflow-hidden rounded-[15px] active:opacity-80"
            onClick={() => router.push(`/home/recommend/${place.spotId}`)}
          >
            <Image
              src={place.thumbnailUrl ?? ""}
              alt={place.name ?? "관광지"}
              fill
              className="object-cover"
              sizes="144px"
            />

            <div className="absolute right-2 top-2">
              <CategoryChip category={toCategory(place.collectionCategory)} variant="strong" />
            </div>

            <div className="absolute bottom-2 left-2">
              <span className="inline-flex rounded-[8px] bg-system-blackbg px-2.5 py-1.5 text-xs font-semibold text-main-white backdrop-blur-sm">
                {place.name ?? "이름 없는 관광지"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

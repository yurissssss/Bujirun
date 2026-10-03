"use client";

import { getPlaceCollectionStatus } from "@/shared/utils/placeCollection";

import type { OpResponse } from "@/shared/api/types";
import { useRouter } from "next/navigation";
import { PlaceBookmarkCard } from "@/components/place/PlaceBookmarkCard";

type Place = OpResponse<"search">[number];

interface RecommendedPlaceCardProps {
  place: Place;
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
}

export function RecommendedPlaceCard({
  place,
  isBookmarked,
  onBookmarkToggle,
}: RecommendedPlaceCardProps) {
  const router = useRouter();

  if (!place.thumbnailUrl || !place.name || !place.spotId || !place.collectionCategory) {
    return null;
  }

  const collectionCategory = place.collectionCategory.includes("자연")
    ? "nature"
    : place.collectionCategory.includes("바다")
      ? "sea"
      : place.collectionCategory.includes("문화")
        ? "culture"
        : "experience";

  return (
    <PlaceBookmarkCard
      imageUrl={place.thumbnailUrl}
      name={place.name}
      category={collectionCategory}
      status={getPlaceCollectionStatus(place)}
      isBookmarked={isBookmarked}
      onBookmarkToggle={onBookmarkToggle}
      onClick={() => router.push(`/home/recommend/${place.spotId}`)}
    />
  );
}

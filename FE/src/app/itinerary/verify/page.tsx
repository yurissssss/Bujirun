"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrivalVerifyModal } from "@/features/itinerary";
import { PageCard } from "@/components";
import characterImg from "@/assets/character/face.png";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const spotId = searchParams.get("spotId");
  const itineraryId = searchParams.get("itineraryId");
  const itineraryItemId = searchParams.get("itineraryItemId") ?? undefined;
  const placeName = searchParams.get("placeName") ?? "관광지";
  const placeImageUrl = searchParams.get("placeImageUrl") ?? undefined;

  if (!spotId || !itineraryId) {
    return null;
  }

  return (
    <div className="relative flex h-full flex-col">
      <PageCard />

      <ArrivalVerifyModal
        spotId={spotId}
        itineraryId={itineraryId}
        itineraryItemId={itineraryItemId}
        isOpen
        onClose={() => router.back()}
        placeName={placeName}
        placeImageUrl={placeImageUrl}
        characterImageUrl={characterImg.src}
        onVerify={() => router.back()}
        onLater={() => router.back()}
      />
    </div>
  );
}

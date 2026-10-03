"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { RelatedLogsContent } from "@/components";
import { travelLogApi, spotApi } from "@/shared/api/domains";
import { getCategoryFromKo } from "@/shared/constants/category";
import { useAuthStore } from "@/shared/stores/useAuthStore";

export default function ItineraryPlaceRelatedLogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data: spot } = useQuery({
    queryKey: spotApi.keys.detail(id),
    queryFn: () => spotApi.getSpot(id),
    enabled: !!accessToken && !!id,
  });

  const { data: relatedLogs = [], isLoading } = useQuery({
    queryKey: travelLogApi.keys.bySpot(id),
    queryFn: () => travelLogApi.getLogsBySpot(id),
    enabled: !!accessToken && !!id,
  });

  return (
    <RelatedLogsContent
      placeName={spot?.name ?? ""}
      category={spot ? getCategoryFromKo(spot.collectionCategory ?? "", spot.name) : undefined}
      relatedLogs={relatedLogs}
      isLoading={isLoading}
      logHrefBase="/itinerary/logs"
    />
  );
}

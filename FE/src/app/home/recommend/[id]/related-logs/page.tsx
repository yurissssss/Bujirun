"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { RelatedLogsContent } from "@/components";
import { travelLogApi, spotApi } from "@/shared/api/domains";
import { useAuthStore } from "@/shared/stores/useAuthStore";

export default function RelatedLogsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const accessToken = useAuthStore((s) => s.accessToken);

  // 관광지명을 RelatedLogsContent에 전달하기 위해 spot 조회
  const { data: spot } = useQuery({
    queryKey: spotApi.keys.detail(id),
    queryFn: () => spotApi.getSpot(id),
    enabled: !!accessToken && !!id,
  });

  // 해당 관광지의 공개 여행 기록 목록 조회
  const { data: relatedLogs = [], isLoading } = useQuery({
    queryKey: travelLogApi.keys.bySpot(id),
    queryFn: () => travelLogApi.getLogsBySpot(id),
    enabled: !!accessToken && !!id,
  });

  return (
    <RelatedLogsContent
      placeName={spot?.name ?? ""}
      relatedLogs={relatedLogs}
      isLoading={isLoading}
      logHrefBase="/home/logs"
    />
  );
}

// TODO: API 연결 시 GET /tour-spots/:spotId/logs 로 교체

import { SAMPLE_LOGS } from "@/features/itinerary/data/sampleLogs";
import { PLACES } from "@/features/collection/data/places";
import type { LogDetail } from "@/features/itinerary/data/sampleLogs";
import type { RelatedLog } from "@/shared/types/relatedLog";

function normalizePlaceName(name: string) {
  return name.replace(/\s/g, "");
}

// LogDetail(상세 전체 구조) → RelatedLog(카드 요약)로 변환
function toRelatedLog(log: LogDetail): RelatedLog {
  return {
    id: log.id,
    imageUrl: log.imageUrl,
    placeName: log.placeName,
    extraCount: log.extraCount,
    author: log.author,
    duration: log.duration,
    date: log.date,
    downloadCount: log.downloadCount,
  };
}

export function getRelatedLogsByPlaceName(placeName: string): RelatedLog[] {
  const normalized = normalizePlaceName(placeName);

  return SAMPLE_LOGS.filter((log) => {
    if (
      normalizePlaceName(log.placeName).includes(normalized) ||
      normalized.includes(normalizePlaceName(log.placeName))
    ) {
      return true;
    }
    return log.days.some((day) =>
      day.stops.some((stop) => {
        const stopNorm = normalizePlaceName(stop.place);
        return (
          stopNorm === normalized || stopNorm.includes(normalized) || normalized.includes(stopNorm)
        );
      }),
    );
  }).map(toRelatedLog);
}

export function getRelatedLogs(placeId: number): RelatedLog[] {
  const place = PLACES.find((p) => p.id === placeId);
  if (!place) return [];
  return getRelatedLogsByPlaceName(place.name);
}

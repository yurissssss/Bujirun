export type PlaceCollectionStatus = "completed" | "uncollected";

interface CollectionState {
  isCollection?: boolean;
  collected?: boolean;
}

// 데이터 미확인 또는 도감 대상이 아닌 관광지에는 수집 배지를 표시하지 않는다.
export function getPlaceCollectionStatus(
  place?: CollectionState,
): PlaceCollectionStatus | undefined {
  if (!place?.isCollection) return undefined;
  return place.collected ? "completed" : "uncollected";
}

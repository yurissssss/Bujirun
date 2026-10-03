// 여행 시작/종료 시간 + 숙소 정보. 전부 백엔드(Itinerary 엔티티)에 저장되고
// ItineraryDetailResponse로 내려오는 값을 그대로 옮겨 쓰는 타입일 뿐이다.
// (예전엔 백엔드에 이 필드들이 없어서 localStorage에 임시 보관했었음 — 지금은 제거됨.)
export interface TripTimeBounds {
  startTime: string;
  endTime: string;
  accommodationName?: string;
  accommodationAddress?: string;
  accommodationLat?: number;
  accommodationLng?: number;
}

export type TransportType = "버스" | "지하철" | "도보" | "택시";

export interface TransportStep {
  type: TransportType;
  routeName: string;
  from: string;
  to: string;
  arrivalText?: string;
  // 버스 실시간 도착정보(GET /api/transit/arrival/bus) 폴링용 — 둘 다 있을 때만 실시간 조회
  arsId?: string;
  routeNo?: string;
  // 지하철 도착정보(GET /api/transit/arrival/subway) 폴링용 — 둘 다 있을 때만 조회
  stationId?: number;
  wayCode?: number;
  walkAfterMin?: number;
}

export interface TransportOption {
  id: string;
  durationText: string;
  costText: string;
  isRecommended?: boolean;
  steps: TransportStep[];
}

export interface TransportGroup {
  fromPlace: string;
  toPlace: string;
  // 카카오맵 길찾기 좌표 — 없으면 장소 이름으로 키워드 검색한다.
  fromLocation?: { lat?: number; lng?: number };
  toLocation?: { lat?: number; lng?: number };
  selectedOptionId: string;
  options: TransportOption[];
}

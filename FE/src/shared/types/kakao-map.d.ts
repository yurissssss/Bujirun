export {};

declare global {
  interface Window {
    kakao?: {
      maps: KakaoMaps;
    };
  }
}

interface KakaoMaps {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
  Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
  InfoWindow: new (options: KakaoInfoWindowOptions) => KakaoInfoWindow;
  services: {
    Places: new () => KakaoPlaces;
    Status: {
      OK: string;
      ZERO_RESULT: string;
      ERROR: string;
    };
  };
}

interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

interface KakaoLatLngBounds {
  extend: (latlng: KakaoLatLng) => void;
}

interface KakaoMapOptions {
  center: KakaoLatLng;
  level?: number;
}

interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  setBounds: (bounds: KakaoLatLngBounds) => void;
  setLevel: (level: number) => void;
}

interface KakaoMarkerOptions {
  map: KakaoMap;
  position: KakaoLatLng;
  title?: string;
}

interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
}

interface KakaoInfoWindowOptions {
  content: string;
  removable?: boolean;
}

interface KakaoInfoWindow {
  open: (map: KakaoMap, marker: KakaoMarker) => void;
}

export interface KakaoPlaceResult {
  id: string;
  place_name: string;
  x: string;
  y: string;
  address_name: string;
  road_address_name?: string;
  // 카테고리 그룹 코드는 비어 있을 수 있다(관광지 상당수가 그렇다) — 그럴 땐
  // category_name("여행 > 관광,명소 > 케이블카" 형태)으로 판단한다.
  category_group_code?: string;
  category_name?: string;
}

export interface KakaoKeywordSearchOptions {
  // 카카오 로컬 카테고리 그룹 코드. 예: AD5(숙박), AT4(관광명소).
  category_group_code?: string;
  size?: number;
  page?: number;
}

interface KakaoPlaces {
  keywordSearch: (
    keyword: string,
    callback: (result: KakaoPlaceResult[], status: string) => void,
    options?: KakaoKeywordSearchOptions,
  ) => void;
}

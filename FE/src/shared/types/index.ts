// ── 장소 ────────────────────────────────────────────────
export type PlaceCategory = "자연·공원" | "역사·문화" | "체험·레저" | "음식·카페";

export interface Place {
  id: string;
  contentId: string;
  name: string;
  category: PlaceCategory;
  sigungu: string;
  lat: number;
  lng: number;
  address: string;
  thumbnailUrl: string;
  operatingHours: string;
  isCollected: boolean;
}

// ── 일정 ────────────────────────────────────────────────
export type TravelMode = "transit" | "walk" | "taxi" | "bus";

export interface ScheduleItem {
  id: string;
  spotId: string;
  spotName: string;
  orderIndex: number;
  arrivalTime: string;
  durationMin: number;
  travelMode: TravelMode;
  travelTimeMin: number;
  routeName?: string; // API 연결 시 버스 번호("2012") 또는 지하철 노선("1호선") 등
  memo: string | null;
}

export interface ScheduleDay {
  id: string;
  dayNumber: number;
  date: string;
  items: ScheduleItem[];
}

export type PlanType = "A" | "B" | "C";
export type ScheduleStatus = "confirmed" | "draft";

export interface Schedule {
  id: string;
  title: string;
  planType: PlanType;
  status: ScheduleStatus;
  createdAt: string;
  days: ScheduleDay[];
}

// ── 로그 ────────────────────────────────────────────────
export interface TravelLog {
  id: string;
  userId: string;
  itineraryId: string;
  title: string;
  shared: boolean;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── 유저 ────────────────────────────────────────────────
export interface User {
  id: string;
  nickname: string;
  email: string;
  authProvider: "kakao";
  createdAt: string;
}

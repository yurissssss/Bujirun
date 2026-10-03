import type { TripRecord } from "@/features/collection/types/tripRecord";

export const TRIP_RECORDS: TripRecord[] = [
  {
    id: 1,
    title: "해운대 블루로드",
    period: "2026.05.18 - 2026.05.20",
  },
  {
    id: 2,
    title: "영도 감성 골목 여행",
    period: "2026.06.02 - 2026.06.03",
  },
  {
    id: 3,
    title: "기장 바다 드라이브",
    period: "2026.06.14 - 2026.06.15",
  },
  {
    id: 4,
    title: "서면 문화 산책",
    period: "2026.06.22 - 2026.06.22",
  },
  {
    id: 5,
    title: "낙동강 노을 코스",
    period: "2026.07.03 - 2026.07.04",
  },
  {
    id: 6,
    title: "부산 시장 먹방 투어",
    period: "2026.07.11 - 2026.07.12",
  },
  {
    id: 7,
    title: "금정산 초록 여행",
    period: "2026.07.19 - 2026.07.21",
  },
  {
    id: 8,
    title: "오시리아 체험 여행",
    period: "2026.08.01 - 2026.08.02",
  },
] as const;

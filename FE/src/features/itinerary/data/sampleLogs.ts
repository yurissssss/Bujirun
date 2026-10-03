export interface ScheduleStop {
  time: string;
  place: string;
  imageUrl?: string;
  tags: string[];
}

export interface DaySchedule {
  day: number;
  date: string;
  stops: ScheduleStop[];
}

export interface LogDetail {
  id: string;
  title: string;
  placeName: string;
  extraCount: number;
  author: string;
  duration: string;
  date: string;
  downloadCount: number;
  category: string;
  createdAt: string;
  imageUrl: string;
  days: DaySchedule[];
}

export const SAMPLE_LOGS: LogDetail[] = [
  {
    id: "1",
    title: "여행자123 로그 🌊",
    placeName: "해운대 해수욕장",
    extraCount: 2,
    author: "여행자123",
    duration: "2박3일",
    date: "2026.05.10 ~ 05.12",
    downloadCount: 34,
    category: "바다",
    createdAt: "2026-05-10",
    imageUrl: "https://picsum.photos/seed/log1/400/300",
    days: [
      {
        day: 1,
        date: "2026.05.10",
        stops: [
          {
            time: "10:00",
            place: "해운대 해수욕장",
            imageUrl: "https://picsum.photos/seed/log1a/400/300",
            tags: ["#바다", "#여름", "#사진명소"],
          },
          {
            time: "14:00",
            place: "동백섬",
            imageUrl: "https://picsum.photos/seed/log1b/400/300",
            tags: ["#자연", "#산책", "#바다뷰"],
          },
          {
            time: "17:00",
            place: "해운대 시장",
            tags: ["#맛집", "#로컬푸드"],
          },
        ],
      },
      {
        day: 2,
        date: "2026.05.11",
        stops: [
          {
            time: "10:00",
            place: "광안리 해수욕장",
            imageUrl: "https://picsum.photos/seed/log1c/400/300",
            tags: ["#바다", "#야경", "#낭만"],
          },
          {
            time: "14:00",
            place: "민락수변공원",
            tags: ["#산책", "#야경명소"],
          },
          {
            time: "18:00",
            place: "광안대교",
            imageUrl: "https://picsum.photos/seed/log1d/400/300",
            tags: ["#야경", "#부산명소"],
          },
        ],
      },
      {
        day: 3,
        date: "2026.05.12",
        stops: [
          {
            time: "11:00",
            place: "해리단길",
            imageUrl: "https://picsum.photos/seed/log1e/400/300",
            tags: ["#카페", "#감성", "#사진명소"],
          },
          {
            time: "15:00",
            place: "부산시립미술관",
            tags: ["#문화", "#전시", "#실내"],
          },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "여행러버 로그 🏘️",
    placeName: "감천문화마을",
    extraCount: 1,
    author: "여행러버",
    duration: "1박2일",
    date: "2026.05.08 ~ 05.09",
    downloadCount: 12,
    category: "문화",
    createdAt: "2026-05-08",
    imageUrl: "https://picsum.photos/seed/log2/400/300",
    days: [
      {
        day: 1,
        date: "2026.05.08",
        stops: [
          {
            time: "11:00",
            place: "감천문화마을",
            imageUrl: "https://picsum.photos/seed/log2a/400/300",
            tags: ["#문화", "#골목길", "#사진명소"],
          },
          {
            time: "15:00",
            place: "보수동 책방골목",
            tags: ["#문화", "#책방", "#레트로"],
          },
          {
            time: "18:00",
            place: "남포동 BIFF광장",
            imageUrl: "https://picsum.photos/seed/log2b/400/300",
            tags: ["#문화", "#야경", "#먹거리"],
          },
        ],
      },
      {
        day: 2,
        date: "2026.05.09",
        stops: [
          {
            time: "10:00",
            place: "용두산공원",
            imageUrl: "https://picsum.photos/seed/log2c/400/300",
            tags: ["#자연", "#전망대", "#부산타워"],
          },
          {
            time: "14:00",
            place: "국제시장",
            tags: ["#시장", "#로컬푸드", "#쇼핑"],
          },
        ],
      },
    ],
  },
  {
    id: "3",
    title: "트레커 로그 🏔️",
    placeName: "금정산",
    extraCount: 0,
    author: "트레커",
    duration: "2박3일",
    date: "2026.05.01 ~ 05.03",
    downloadCount: 8,
    category: "자연",
    createdAt: "2026-05-01",
    imageUrl: "https://picsum.photos/seed/log3/400/300",
    days: [
      {
        day: 1,
        date: "2026.05.01",
        stops: [
          {
            time: "08:00",
            place: "금정산 북문",
            imageUrl: "https://picsum.photos/seed/log3a/400/300",
            tags: ["#자연", "#등산", "#뷰맛집"],
          },
          {
            time: "12:00",
            place: "금정산성",
            tags: ["#역사", "#자연", "#산성"],
          },
        ],
      },
      {
        day: 2,
        date: "2026.05.02",
        stops: [
          {
            time: "09:00",
            place: "범어사",
            imageUrl: "https://picsum.photos/seed/log3b/400/300",
            tags: ["#문화", "#사찰", "#고즈넉"],
          },
          {
            time: "14:00",
            place: "회동수원지",
            imageUrl: "https://picsum.photos/seed/log3c/400/300",
            tags: ["#자연", "#산책", "#힐링"],
          },
        ],
      },
      {
        day: 3,
        date: "2026.05.03",
        stops: [
          {
            time: "10:00",
            place: "금강공원",
            imageUrl: "https://picsum.photos/seed/log3d/400/300",
            tags: ["#자연", "#케이블카", "#뷰"],
          },
          {
            time: "14:00",
            place: "온천천 카페거리",
            tags: ["#카페", "#산책", "#힐링"],
          },
        ],
      },
    ],
  },
  {
    id: "4",
    title: "테마파크매니아 로그 🚠",
    placeName: "송도해상케이블카",
    extraCount: 3,
    author: "테마파크매니아",
    duration: "1박2일",
    date: "2026.04.20 ~ 04.21",
    downloadCount: 56,
    category: "체험",
    createdAt: "2026-04-20",
    imageUrl: "https://picsum.photos/seed/log4/400/300",
    days: [
      {
        day: 1,
        date: "2026.04.20",
        stops: [
          {
            time: "10:00",
            place: "송도해상케이블카",
            imageUrl: "https://picsum.photos/seed/log4a/400/300",
            tags: ["#체험", "#뷰맛집", "#케이블카"],
          },
          {
            time: "13:00",
            place: "송도 해수욕장",
            imageUrl: "https://picsum.photos/seed/log4b/400/300",
            tags: ["#바다", "#여름", "#시원"],
          },
          {
            time: "17:00",
            place: "암남공원",
            tags: ["#자연", "#산책", "#바다뷰"],
          },
        ],
      },
      {
        day: 2,
        date: "2026.04.21",
        stops: [
          {
            time: "10:00",
            place: "태종대",
            imageUrl: "https://picsum.photos/seed/log4c/400/300",
            tags: ["#자연", "#절벽", "#바다뷰"],
          },
          {
            time: "14:00",
            place: "영도 깡통야시장",
            tags: ["#맛집", "#야시장", "#로컬푸드"],
          },
          {
            time: "17:00",
            place: "흰여울문화마을",
            imageUrl: "https://picsum.photos/seed/log4d/400/300",
            tags: ["#문화", "#골목길", "#사진명소"],
          },
        ],
      },
    ],
  },
  {
    id: "5",
    title: "바다사랑 로그 🌅",
    placeName: "광안리 해수욕장",
    extraCount: 1,
    author: "바다사랑",
    duration: "2박3일",
    date: "2026.04.15 ~ 04.17",
    downloadCount: 21,
    category: "바다",
    createdAt: "2026-04-15",
    imageUrl: "https://picsum.photos/seed/log5/400/300",
    days: [
      {
        day: 1,
        date: "2026.04.15",
        stops: [
          {
            time: "15:00",
            place: "광안리 해수욕장",
            imageUrl: "https://picsum.photos/seed/log5a/400/300",
            tags: ["#바다", "#야경", "#낭만"],
          },
          {
            time: "19:00",
            place: "광안대교",
            imageUrl: "https://picsum.photos/seed/log5b/400/300",
            tags: ["#야경", "#야경명소", "#부산"],
          },
        ],
      },
      {
        day: 2,
        date: "2026.04.16",
        stops: [
          {
            time: "10:00",
            place: "해운대 해수욕장",
            imageUrl: "https://picsum.photos/seed/log5c/400/300",
            tags: ["#바다", "#여름", "#사진명소"],
          },
          {
            time: "14:00",
            place: "해리단길",
            tags: ["#카페", "#감성", "#산책"],
          },
          {
            time: "18:00",
            place: "달맞이고개",
            imageUrl: "https://picsum.photos/seed/log5d/400/300",
            tags: ["#야경", "#드라이브", "#낭만"],
          },
        ],
      },
      {
        day: 3,
        date: "2026.04.17",
        stops: [
          {
            time: "11:00",
            place: "송정해수욕장",
            imageUrl: "https://picsum.photos/seed/log5e/400/300",
            tags: ["#바다", "#서핑", "#자연"],
          },
          {
            time: "15:00",
            place: "죽성드림성당",
            tags: ["#사진명소", "#이국적", "#드라이브"],
          },
        ],
      },
    ],
  },
  {
    id: "6",
    title: "기장 드라이브 로그 🚗",
    placeName: "오시리아 해안산책로",
    extraCount: 2,
    author: "드라이브러버",
    duration: "1박2일",
    date: "2026.06.14 ~ 06.15",
    downloadCount: 47,
    category: "바다",
    createdAt: "2026-06-14",
    imageUrl: "https://picsum.photos/seed/log6/400/300",
    days: [
      {
        day: 1,
        date: "2026.06.14",
        stops: [
          {
            time: "11:00",
            place: "오시리아 해안산책로",
            imageUrl: "https://picsum.photos/seed/log6a/400/300",
            tags: ["#바다", "#산책", "#드라이브"],
          },
          {
            time: "14:00",
            place: "죽성성당",
            imageUrl: "https://picsum.photos/seed/log6b/400/300",
            tags: ["#문화", "#사진명소", "#이국적"],
          },
          {
            time: "17:30",
            place: "기장시장",
            tags: ["#시장", "#로컬푸드", "#해산물"],
          },
        ],
      },
      {
        day: 2,
        date: "2026.06.15",
        stops: [
          {
            time: "10:30",
            place: "아난티 코브",
            imageUrl: "https://picsum.photos/seed/log6c/400/300",
            tags: ["#체험", "#휴식", "#오션뷰"],
          },
          {
            time: "15:00",
            place: "해동용궁사",
            imageUrl: "https://picsum.photos/seed/log6d/400/300",
            tags: ["#문화", "#사찰", "#바다뷰"],
          },
        ],
      },
    ],
  },
  {
    id: "7",
    title: "낙동강 노을 로그 🌾",
    placeName: "삼락생태공원",
    extraCount: 2,
    author: "노을수집가",
    duration: "1박2일",
    date: "2026.07.03 ~ 07.04",
    downloadCount: 31,
    category: "자연",
    createdAt: "2026-07-03",
    imageUrl: "https://picsum.photos/seed/log7/400/300",
    days: [
      {
        day: 1,
        date: "2026.07.03",
        stops: [
          {
            time: "13:00",
            place: "부산현대미술관",
            imageUrl: "https://picsum.photos/seed/log7a/400/300",
            tags: ["#문화", "#전시", "#실내"],
          },
          {
            time: "16:00",
            place: "을숙도",
            imageUrl: "https://picsum.photos/seed/log7b/400/300",
            tags: ["#자연", "#철새", "#산책"],
          },
          {
            time: "18:30",
            place: "삼락생태공원",
            imageUrl: "https://picsum.photos/seed/log7c/400/300",
            tags: ["#자연", "#노을", "#피크닉"],
          },
        ],
      },
      {
        day: 2,
        date: "2026.07.04",
        stops: [
          {
            time: "11:00",
            place: "다대포해수욕장",
            imageUrl: "https://picsum.photos/seed/log7d/400/300",
            tags: ["#바다", "#노을", "#산책"],
          },
          {
            time: "15:30",
            place: "다대포 꿈의 낙조분수",
            tags: ["#체험", "#분수", "#가족여행"],
          },
        ],
      },
    ],
  },
  {
    id: "8",
    title: "시장 먹방 로그 🐟",
    placeName: "자갈치시장",
    extraCount: 3,
    author: "먹방탐험가",
    duration: "당일치기",
    date: "2026.07.11",
    downloadCount: 63,
    category: "문화",
    createdAt: "2026-07-11",
    imageUrl: "https://picsum.photos/seed/log8/400/300",
    days: [
      {
        day: 1,
        date: "2026.07.11",
        stops: [
          {
            time: "10:30",
            place: "국제시장",
            imageUrl: "https://picsum.photos/seed/log8a/400/300",
            tags: ["#시장", "#쇼핑", "#먹거리"],
          },
          {
            time: "13:00",
            place: "자갈치시장",
            imageUrl: "https://picsum.photos/seed/log8b/400/300",
            tags: ["#문화", "#해산물", "#로컬푸드"],
          },
          {
            time: "15:30",
            place: "부산영화체험박물관",
            imageUrl: "https://picsum.photos/seed/log8c/400/300",
            tags: ["#체험", "#실내", "#영화"],
          },
          {
            time: "18:00",
            place: "용두산공원",
            tags: ["#자연", "#야경", "#전망대"],
          },
        ],
      },
    ],
  },
  {
    id: "9",
    title: "요트 야경 로그 ⛵",
    placeName: "부산요트투어",
    extraCount: 1,
    author: "야경항해자",
    duration: "당일치기",
    date: "2026.08.02",
    downloadCount: 72,
    category: "체험",
    createdAt: "2026-08-02",
    imageUrl: "https://picsum.photos/seed/log9/400/300",
    days: [
      {
        day: 1,
        date: "2026.08.02",
        stops: [
          {
            time: "16:00",
            place: "마린시티",
            imageUrl: "https://picsum.photos/seed/log9a/400/300",
            tags: ["#문화", "#도시뷰", "#산책"],
          },
          {
            time: "18:30",
            place: "부산요트투어",
            imageUrl: "https://picsum.photos/seed/log9b/400/300",
            tags: ["#체험", "#야경", "#바다"],
          },
          {
            time: "21:00",
            place: "더베이101",
            imageUrl: "https://picsum.photos/seed/log9c/400/300",
            tags: ["#야경", "#사진명소", "#부산"],
          },
        ],
      },
    ],
  },
];

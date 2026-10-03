import place1 from "@/assets/place/place1.png";
import place2 from "@/assets/place/place2.png";
import place3 from "@/assets/place/place3.png";
import place4 from "@/assets/place/place4.png";
import place5 from "@/assets/place/place5.png";
import place6 from "@/assets/place/place6.png";
import place7 from "@/assets/place/place7.png";
import type { StaticImageData } from "next/image";

export interface ScheduleStop {
  time: string;
  place: string;
  imageUrl?: StaticImageData;
  category: "sea" | "nature" | "culture" | "experience";
  tags: string[];
  isVerified: boolean;
  transportId?: string;
}

export interface DaySchedule {
  day: number;
  date: string;
  stops: ScheduleStop[];
}

export interface LogDetail {
  id: string;
  isVisible: boolean;
  title: string;
  placeName: string;
  extraCount: number;
  author: string;
  duration: string;
  date: string;
  downloadCount: number;
  createdAt: string;
  imageUrl: string;
  mood: string;
  theme: string;
  days: DaySchedule[];
}

export const SAMPLE_LOGS: LogDetail[] = [
  {
    id: "1",
    isVisible: false,
    title: "여행자123 로그",
    placeName: "해운대 해수욕장",
    extraCount: 2,
    author: "여행자123",
    duration: "2박3일",
    date: "2026.08.10 ~ 08.12",
    downloadCount: 34,
    createdAt: "2026-08-10",
    imageUrl: "https://picsum.photos/seed/log1/400/300",
    mood: "",
    theme: "",
    days: [
      {
        day: 1,
        date: "2026.08.10",
        stops: [
          {
            time: "10:00",
            place: "해운대 해수욕장",
            imageUrl: place1,
            category: "sea",
            tags: ["#여름", "#사진명소"],
            isVerified: true,
          },
          {
            time: "14:00",
            place: "동백섬",
            imageUrl: place2,
            category: "nature",
            tags: ["#산책", "#바다뷰"],
            isVerified: false,
          },
          {
            time: "17:00",
            place: "해운대 시장",
            imageUrl: place6,
            category: "culture",
            tags: ["#맛집", "#로컬푸드"],
            isVerified: false,
          },
        ],
      },
      {
        day: 2,
        date: "2026.08.11",
        stops: [
          {
            time: "10:00",
            place: "광안리 해수욕장",
            imageUrl: place3,
            category: "sea",
            tags: ["#야경", "#낭만"],
            isVerified: true,
          },
          {
            time: "14:00",
            place: "민락수변공원",
            imageUrl: place7,
            category: "nature",
            tags: ["#야경명소"],
            isVerified: false,
          },
          {
            time: "18:00",
            place: "광안대교",
            imageUrl: place4,
            category: "nature",
            tags: ["#야경", "#부산명소"],
            isVerified: false,
          },
        ],
      },
      {
        day: 3,
        date: "2026.08.12",
        stops: [
          {
            time: "11:00",
            place: "해리단길",
            imageUrl: place5,
            category: "culture",
            tags: ["#카페", "#감성", "#사진명소"],
            isVerified: true,
          },
          {
            time: "15:00",
            place: "부산시립미술관",
            imageUrl: place6,
            category: "culture",
            tags: ["#전시", "#실내"],
            isVerified: false,
          },
        ],
      },
    ],
  },
  {
    id: "2",
    isVisible: true,
    title: "여행러버 로그 🏘️",
    placeName: "감천문화마을",
    extraCount: 1,
    author: "여행러버",
    duration: "1박2일",
    date: "2026.08.08 ~ 08.09",
    downloadCount: 12,
    createdAt: "2026-08-08",
    imageUrl: "https://picsum.photos/seed/log2/400/300",
    mood: "",
    theme: "",
    days: [
      {
        day: 1,
        date: "2026.08.08",
        stops: [
          {
            time: "11:00",
            place: "감천문화마을",
            imageUrl: place1,
            category: "culture",
            tags: ["#골목길", "#사진명소"],
            isVerified: true,
          },
          {
            time: "15:00",
            place: "보수동 책방골목",
            imageUrl: place7,
            category: "culture",
            tags: ["#책방", "#레트로"],
            isVerified: false,
          },
          {
            time: "18:00",
            place: "남포동 BIFF광장",
            imageUrl: place2,
            category: "culture",
            tags: ["#야경", "#먹거리"],
            isVerified: false,
          },
        ],
      },
      {
        day: 2,
        date: "2026.08.09",
        stops: [
          {
            time: "10:00",
            place: "용두산공원",
            imageUrl: place3,
            category: "nature",
            tags: ["#전망대", "#부산타워"],
            isVerified: true,
          },
          {
            time: "14:00",
            place: "국제시장",
            imageUrl: place6,
            category: "culture",
            tags: ["#로컬푸드", "#쇼핑"],
            isVerified: false,
          },
        ],
      },
    ],
  },
  {
    id: "3",
    isVisible: true,
    title: "트레커 로그 🏔️",
    placeName: "금정산",
    extraCount: 0,
    author: "트레커",
    duration: "2박3일",
    date: "2026.08.01 ~ 08.03",
    downloadCount: 8,
    createdAt: "2026-08-01",
    imageUrl: "https://picsum.photos/seed/log3/400/300",
    mood: "",
    theme: "",
    days: [
      {
        day: 1,
        date: "2026.08.01",
        stops: [
          {
            time: "08:00",
            place: "금정산 북문",
            imageUrl: place1,
            category: "nature",
            tags: ["#등산", "#뷰맛집"],
            isVerified: true,
          },
          {
            time: "12:00",
            place: "금정산성",
            imageUrl: place6,
            category: "nature",
            tags: ["#역사", "#산성"],
            isVerified: false,
          },
        ],
      },
      {
        day: 2,
        date: "2026.08.02",
        stops: [
          {
            time: "09:00",
            place: "범어사",
            imageUrl: place2,
            category: "culture",
            tags: ["#사찰", "#고즈넉"],
            isVerified: true,
          },
          {
            time: "14:00",
            place: "회동수원지",
            imageUrl: place3,
            category: "nature",
            tags: ["#산책", "#힐링"],
            isVerified: false,
          },
        ],
      },
      {
        day: 3,
        date: "2026.08.03",
        stops: [
          {
            time: "10:00",
            place: "금강공원",
            imageUrl: place4,
            category: "nature",
            tags: ["#케이블카", "#뷰"],
            isVerified: true,
          },
          {
            time: "14:00",
            place: "온천천 카페거리",
            imageUrl: place6,
            category: "culture",
            tags: ["#산책", "#힐링"],
            isVerified: false,
          },
        ],
      },
    ],
  },
  {
    id: "4",
    isVisible: true,
    title: "테마파크매니아 로그 🚠",
    placeName: "송도해상케이블카",
    extraCount: 3,
    author: "테마파크매니아",
    duration: "1박2일",
    date: "2026.08.20 ~ 08.21",
    downloadCount: 56,
    createdAt: "2026-08-20",
    imageUrl: "https://picsum.photos/seed/log4/400/300",
    mood: "",
    theme: "",
    days: [
      {
        day: 1,
        date: "2026.08.20",
        stops: [
          {
            time: "10:00",
            place: "송도해상케이블카",
            imageUrl: place1,
            category: "experience",
            tags: ["#뷰맛집", "#케이블카"],
            isVerified: true,
          },
          {
            time: "13:00",
            place: "송도 해수욕장",
            imageUrl: place2,
            category: "sea",
            tags: ["#여름", "#시원"],
            isVerified: false,
          },
          {
            time: "17:00",
            place: "암남공원",
            imageUrl: place7,
            category: "nature",
            tags: ["#산책", "#바다뷰"],
            isVerified: false,
          },
        ],
      },
      {
        day: 2,
        date: "2026.08.21",
        stops: [
          {
            time: "10:00",
            place: "태종대",
            imageUrl: place3,
            category: "nature",
            tags: ["#절벽", "#바다뷰"],
            isVerified: true,
          },
          {
            time: "14:00",
            place: "영도 깡통야시장",
            imageUrl: place6,
            category: "culture",
            tags: ["#맛집", "#야시장", "#로컬푸드"],
            isVerified: false,
          },
          {
            time: "17:00",
            place: "흰여울문화마을",
            imageUrl: place4,
            category: "culture",
            tags: ["#골목길", "#사진명소"],
            isVerified: false,
          },
        ],
      },
    ],
  },
  {
    id: "5",
    isVisible: true,
    title: "바다사랑 로그 🌅",
    placeName: "광안리 해수욕장",
    extraCount: 1,
    author: "바다사랑",
    duration: "2박3일",
    date: "2026.07.30 ~ 08.01",
    downloadCount: 21,
    createdAt: "2026-08-15",
    imageUrl: "https://picsum.photos/seed/log5/400/300",
    mood: "",
    theme: "",
    days: [
      {
        day: 1,
        date: "2026.07.30",
        stops: [
          {
            time: "15:00",
            place: "광안리 해수욕장",
            imageUrl: place1,
            category: "sea",
            tags: ["#야경", "#낭만"],
            isVerified: true,
            transportId: "gwanganli-to-gwangandaegyo",
          },
          {
            time: "19:00",
            place: "광안대교",
            imageUrl: place2,
            category: "nature",
            tags: ["#야경명소", "#부산"],
            isVerified: false,
            transportId: "gwangandaegyo-to-minrak",
          },
          {
            time: "20:30",
            place: "민락수변공원",
            imageUrl: place7,
            category: "nature",
            tags: ["#야경", "#산책", "#회센터"],
            isVerified: false,
          },
        ],
      },
      {
        day: 2,
        date: "2026.07.31",
        stops: [
          {
            time: "10:00",
            place: "해운대 해수욕장",
            imageUrl: place3,
            category: "sea",
            tags: ["#여름", "#사진명소"],
            isVerified: true,
          },
          {
            time: "14:00",
            place: "해리단길",
            imageUrl: place7,
            category: "culture",
            tags: ["#감성", "#산책"],
            isVerified: false,
          },
          {
            time: "18:00",
            place: "달맞이고개",
            imageUrl: place4,
            category: "nature",
            tags: ["#드라이브", "#낭만"],
            isVerified: false,
          },
        ],
      },
      {
        day: 3,
        date: "2026.08.01",
        stops: [
          {
            time: "11:00",
            place: "송정해수욕장",
            imageUrl: place5,
            category: "sea",
            tags: ["#서핑", "#자연"],
            isVerified: true,
          },
          {
            time: "15:00",
            place: "죽성드림성당",
            imageUrl: place6,
            category: "culture",
            tags: ["#사진명소", "#이국적", "#드라이브"],
            isVerified: false,
          },
        ],
      },
    ],
  },
];

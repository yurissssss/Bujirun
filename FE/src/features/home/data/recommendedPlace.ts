import placeImage from "@/assets/place/recommendPlace.jpg";
import type { Category } from "@/components";

export const RECOMMENDED_PLACE: {
  id: string;
  name: string;
  introduction: string;
  imageUrl: typeof placeImage;
  address: string;
  category: Category;
  operatingHours: string;
  fee: string;
  parking: string;
  phone: string;
  homepage: string;
  isBookmarked: boolean;
  isCollected: boolean;
} = {
  id: "1",
  name: "경복궁",
  introduction: "조선시대의 대표적인 궁궐로, 서울의 대표적인 관광지입니다.",
  imageUrl: placeImage,
  address: "서울특별시 종로구 사직로 161",
  category: "sea",
  operatingHours: "09:00 - 18:00",
  fee: "무료",
  parking: "공영 주차장",
  phone: "02-3700-3900",
  homepage: "https://www.royalpalace.go.kr",
  isBookmarked: true,
  isCollected: true,
};

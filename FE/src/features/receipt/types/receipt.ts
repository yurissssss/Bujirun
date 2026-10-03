import type { StaticImageData } from "next/image";
import type { MoodValue } from "@/features/home/components/MoodOptions";

export interface ReviewPromptSubmitData {
  mood: MoodValue;
  theme: string;
}

export interface ReceiptPeriod {
  startDate: string;
  endDate: string;
  totalDays: number;
}

export interface ReceiptPlace {
  id: string;
  time: string;
  name: string;
  collectionCategory: string;
  categoryIcon: string;
  image: StaticImageData | string;
}

export interface ReceiptDay {
  day: number;
  date: string;
  weekday: string;
  places: ReceiptPlace[];
}

export interface ReceiptData {
  tripId: string;
  traveler: string;
  title: string;
  profileImage: StaticImageData | string;
  period: ReceiptPeriod;
  companion: string;
  mood: MoodValue;
  theme: string;
  collection: number;
  collectedSpots: number;
  archiveNumber: string;
  days: ReceiptDay[];
}

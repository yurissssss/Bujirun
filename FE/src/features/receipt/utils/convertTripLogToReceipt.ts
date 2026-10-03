import type { MoodValue } from "@/features/home/components/MoodOptions";
import { travelLogApi } from "@/shared/api/domains";
import type { ReceiptData } from "../types/receipt";
import { calculateTotalDays, createArchiveNumber, formatDateWithDots, getWeekday } from "./receipt";

interface TravelLogGroupMember {
  userId?: string;
  nickname?: string;
  joinedAt?: string;
}

type TravelLogDetail = Awaited<ReturnType<typeof travelLogApi.getLog>> & {
  groupMembers?: TravelLogGroupMember[];
};

const MOOD_EMOJI: Record<number, MoodValue> = {
  0: "🥰",
  1: "😆",
  2: "😌",
  3: "🫠",
  4: "😡",
};

const CATEGORY_ICON: Record<string, string> = {
  바다: "🌊",
  자연: "🌿",
  문화: "🏛️",
  체험: "🎡",
};

export function convertTripLogToReceipt(
  tripLog: TravelLogDetail,
  currentUserId: string,
  traveler: string,
  profileImage: ReceiptData["profileImage"],
): ReceiptData {
  const startDate = tripLog.startDate ?? "";
  const lastDay = tripLog.days?.at(-1);
  const endDate = lastDay?.date ?? startDate;
  const companion =
    tripLog.groupMembers
      ?.filter((member) => member.userId !== currentUserId)
      .map((member) => member.nickname)
      .filter((nickname): nickname is string => !!nickname)
      .join(". ") ?? "";

  return {
    tripId: tripLog.id ?? "",
    traveler,
    title: tripLog.title ?? "여행 기록",
    profileImage,
    period: {
      startDate: formatDateWithDots(startDate),
      endDate: formatDateWithDots(endDate),

      totalDays: startDate && endDate ? calculateTotalDays(startDate, endDate) : 0,
    },
    companion,
    mood: MOOD_EMOJI[tripLog.mood ?? 0] ?? "😌",
    theme: tripLog.theme ?? "",
    collection: tripLog.totalSpots ?? 0,
    collectedSpots: tripLog.collectedSpots ?? 0,
    archiveNumber: createArchiveNumber(startDate, tripLog.travelNumber ?? 0),
    days:
      tripLog.days?.map((day) => ({
        day: day.dayNumber ?? 1,
        date: formatDateWithDots(day.date ?? ""),
        weekday: getWeekday(day.date ?? ""),
        places:
          day.items
            ?.filter((item) => item.visited)
            .map((item) => ({
              id: item.id ?? "",
              time: item.arrivalTime?.slice(0, 5) ?? "",
              name: item.spotName ?? "",
              collectionCategory: item.spotCollectionCategory ?? "",
              categoryIcon: CATEGORY_ICON[item.spotCollectionCategory ?? ""] ?? "",
              image:
                item.photos?.find((photo) => photo.representative)?.photoUrl ??
                item.photos?.[0]?.photoUrl ??
                "",
            })) ?? [],
      })) ?? [],
  };
}

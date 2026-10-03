import Image from "next/image";
import listIcon from "@/assets/icons/itinerary/list.svg?url";
import magicWandIcon from "@/assets/icons/itinerary/magic-wand.svg?url";
import binocularIcon from "@/assets/icons/itinerary/binocular.png";
import { DayBadge } from "./DayBadge";

interface ItineraryHeaderProps {
  currentDay: number;
  tripName: string;
  onLogsClick: () => void;
  onOptimizeClick: () => void;
  onTripsClick: () => void;
  onMembersClick: () => void;
}

export function ItineraryHeader({
  currentDay,
  tripName,
  onLogsClick,
  onOptimizeClick,
  onTripsClick,
  onMembersClick,
}: ItineraryHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 pb-3.5">
      <DayBadge day={currentDay + 1} />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="max-w-30 truncate text-lg font-bold text-sub-deepgray">{tripName}</span>
        <button
          type="button"
          onClick={onMembersClick}
          aria-label="여행 멤버 보기"
          className="shrink-0 text-sub-gray transition-colors hover:text-main-blue"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="size-[17px]"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="m7.5 13a4.5 4.5 0 1 1 4.5-4.5 4.505 4.505 0 0 1 -4.5 4.5zm6.5 11h-13a1 1 0 0 1 -1-1v-.5a7.5 7.5 0 0 1 15 0v.5a1 1 0 0 1 -1 1zm3.5-15a4.5 4.5 0 1 1 4.5-4.5 4.505 4.505 0 0 1 -4.5 4.5zm-1.421 2.021a6.825 6.825 0 0 0 -4.67 2.831 9.537 9.537 0 0 1 4.914 5.148h6.677a1 1 0 0 0 1-1v-.038a7.008 7.008 0 0 0 -7.921-6.941z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button
          className="size-[28px] rounded-lg bg-system-scroll border border-main-blue/30 flex items-center justify-center"
          onClick={onLogsClick}
          aria-label="로그"
        >
          <Image src={binocularIcon} alt="쌍안경" width={20} height={20} aria-hidden />
        </button>
        <button
          className="size-[28px] rounded-lg bg-system-scroll border border-main-blue/30 flex items-center justify-center"
          onClick={onOptimizeClick}
          aria-label="최적화"
        >
          <Image src={magicWandIcon} alt="" width={20} height={20} aria-hidden />
        </button>
        <button
          className="size-[28px] rounded-lg bg-system-scroll border border-main-blue/30 flex items-center justify-center"
          onClick={onTripsClick}
          aria-label="목록"
        >
          <Image src={listIcon} alt="" width={20} height={20} aria-hidden />
        </button>
      </div>
    </div>
  );
}

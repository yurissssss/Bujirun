import Image from "next/image";
import bagIcon from "@/assets/icons/itinerary/bag.svg?url";
import pencilIcon from "@/assets/icons/itinerary/pencil.svg?url";
import removeIcon from "@/assets/icons/itinerary/remove.svg?url";
import { Card } from "@/components";

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  // 그룹 일정일 때만 존재. 있으면 삭제 대신 나가기(leave)로 동작해야 한다.
  groupId?: string;
}

interface TripCardProps {
  trip: Trip;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const getDateOnly = (date: string) => date.split(" ")[0];

export function TripCard({ trip, onSelect, onEdit, onDelete }: TripCardProps) {
  const { id, name, startDate, endDate } = trip;

  return (
    <Card variant="glass-sm" className="relative flex items-center gap-3 px-6 py-4">
      <button
        className="flex items-start gap-3.5 flex-1 text-left active:opacity-70"
        onClick={() => onSelect(id)}
      >
        <Image src={bagIcon} alt="" width={14} height={14} aria-hidden />
        <div className="flex flex-col gap-1">
          <span className="font-bold text-md text-text-heading leading-none">{name}</span>
          <span
            key={`${startDate}-${endDate}`}
            className="font-medium text-xs text-sub-gray leading-none animate-fade-in"
          >
            {getDateOnly(startDate)} - {getDateOnly(endDate)}
          </span>
        </div>
      </button>

      <div className="absolute top-[16px] right-[24px] flex items-center gap-2">
        <button
          className="size-[20px] rounded-md bg-main-blue flex items-center justify-center active:opacity-70"
          onClick={() => onEdit(id)}
        >
          <Image
            src={pencilIcon}
            alt=""
            width={12}
            height={12}
            className="brightness-0 invert"
            aria-hidden
          />
        </button>
        <button
          className="size-[20px] rounded-md bg-sub-coral flex items-center justify-center active:opacity-70"
          onClick={() => onDelete(id)}
        >
          <Image
            src={removeIcon}
            alt=""
            width={12}
            height={12}
            className="brightness-0 invert"
            aria-hidden
          />
        </button>
      </div>
    </Card>
  );
}

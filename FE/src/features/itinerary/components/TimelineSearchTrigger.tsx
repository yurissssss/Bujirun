import { cn } from "@/shared/utils";

interface TimelineSearchTriggerProps {
  time: string;
  isActive: boolean;
  isTimeActive: boolean;
  onTimeClick?: () => void;
}

export function TimelineSearchTrigger({
  time,
  isActive,
  isTimeActive,
  onTimeClick,
}: TimelineSearchTriggerProps) {
  return (
    <>
      <button
        type="button"
        data-time-btn
        className="flex w-10 shrink-0 justify-end whitespace-nowrap pr-[2px]"
        onClick={onTimeClick}
      >
        {isTimeActive ? (
          <div className="flex items-center justify-center rounded-md border border-dashed border-sub-gray p-[2px]">
            <span className="text-xs font-medium text-sub-gray">{time}</span>
          </div>
        ) : isActive ? (
          <div className="flex items-center justify-center rounded-md border border-dashed border-sub-gray p-[2px]">
            <span className="text-xs font-medium text-sub-gray">{time}</span>
          </div>
        ) : (
          <span className="text-xs font-medium tracking-[0.6px] text-sub-deepblue">{time}</span>
        )}
      </button>

      <button
        type="button"
        data-time-btn
        aria-label={`${time} 시간 변경`}
        onClick={onTimeClick}
        className="relative z-10 -mx-1.5 flex size-6 shrink-0 items-center justify-center"
      >
        <span
          className={cn(
            "size-3 rounded-full",
            isActive || isTimeActive ? "bg-sub-coral" : "bg-main-blue",
          )}
        />
      </button>
    </>
  );
}

interface DayBadgeProps {
  day: number;
}

export function DayBadge({ day }: DayBadgeProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-main-blue px-2.5 pt-1.5 pb-1 shrink-0">
      <span className="font-ssurround font-bold text-md text-main-white tracking-[0.5px] leading-none">
        Day {day}
      </span>
    </div>
  );
}

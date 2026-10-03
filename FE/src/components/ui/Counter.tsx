"use client";

import { cn } from "@/shared/utils";

interface CounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function Counter({ value, onChange, min = 1, max = 99, className }: CounterProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn(
          "w-[24px] h-[24px] rounded-full bg-sub-lightblue",
          "flex items-center justify-center",
          "font-bold text-lg text-sub-deepblue",
          "transition-opacity disabled:opacity-30",
        )}
      >
        −
      </button>
      <div className="mx-1 w-[32px] h-[32px] rounded-full bg-main-blue flex items-center justify-center">
        <span className="font-bold text-md text-white">{value}</span>
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(
          "w-[24px] h-[24px] rounded-full bg-sub-lightblue",
          "flex items-center justify-center",
          "font-bold text-lg text-sub-deepblue",
          "transition-opacity disabled:opacity-30",
        )}
      >
        +
      </button>
    </div>
  );
}

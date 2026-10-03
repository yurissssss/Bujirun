"use client";

import { cn } from "@/shared/utils";

export const MOOD_OPTIONS = ["🥰", "😆", "😌", "🫠", "😡"] as const;

export type MoodValue = (typeof MOOD_OPTIONS)[number];

export const MOOD_VALUE: Record<MoodValue, number> = {
  "🥰": 0,
  "😆": 1,
  "😌": 2,
  "🫠": 3,
  "😡": 4,
};

interface MoodOptionsProps {
  selectedMood: MoodValue | null;
  onSelect: (mood: MoodValue) => void;
  className?: string;
}

export function MoodOptions({ selectedMood, onSelect, className }: MoodOptionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {MOOD_OPTIONS.map((mood) => {
        const isSelected = selectedMood === mood;

        return (
          <button
            key={mood}
            type="button"
            aria-label={`${mood} 기분 선택`}
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full transition active:scale-95",
              isSelected ? "bg-main-blue" : "bg-main-white border border-main-blue/20",
            )}
            onClick={() => onSelect(mood)}
          >
            <span className="flex items-center justify-center translate-y-1 leading-[0]">
              {mood}
            </span>
          </button>
        );
      })}
    </div>
  );
}

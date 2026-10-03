"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import triangleIcon from "@/assets/icons/itinerary/triangle.svg?url";
import { cn } from "@/shared/utils";
import { SPOT_SEARCH_CATEGORIES, SPOT_SEARCH_CATEGORY_EMOJI } from "@/shared/constants/category";
import type { SpotSearchCategory } from "@/shared/constants/category";

type CategoryFilter = SpotSearchCategory | "all";

const CATEGORY_EMOJI: Record<string, string> = {
  all: "⭐",
  ...SPOT_SEARCH_CATEGORY_EMOJI,
};

const CATEGORY_OPTIONS: { label: string; value: CategoryFilter }[] = [
  { label: "전체", value: "all" },
  ...SPOT_SEARCH_CATEGORIES.map((value) => ({ label: value, value })),
];

interface CategoryFilterDropdownProps {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

export function CategoryFilterDropdown({ value, onChange }: CategoryFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-[19px] items-center gap-3.5 rounded-lg border-[0.5px] border-main-blue bg-system-navbg pl-[15px] pr-1.5 text-xs font-normal text-text-primary"
      >
        {CATEGORY_OPTIONS.find((c) => c.value === value)?.label ?? "전체"}
        <Image
          src={triangleIcon}
          alt=""
          width={6}
          height={6}
          className={cn("shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[22px] z-20 w-full overflow-hidden rounded-lg border-[0.5px] border-main-blue bg-main-white px-1 py-1.5 shadow-[0_2px_8px_0_var(--color-system-scroll)]">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-1.5 whitespace-nowrap px-2 py-1 text-left text-xs text-text-primary",
                value === opt.value &&
                  "rounded-md border-[0.5px] border-main-blue bg-system-navbg font-semibold",
              )}
            >
              <span>{CATEGORY_EMOJI[opt.value]}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

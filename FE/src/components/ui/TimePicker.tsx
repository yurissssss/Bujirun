"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@/assets/icons/mypage/close.svg?svgr";
import { cn } from "@/shared/utils";
import { Button } from "./Button";

interface TimePickerProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  onConfirm: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 6 }, (_, i) => i * 10);
const ITEM_H = 44;
const VISIBLE = 5;

function ScrollColumn({
  items,
  selected,
  onSelect,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const closestIndex = items.reduce(
      (closest, v, i) =>
        Math.abs(v - selected) < Math.abs(items[closest] - selected) ? i : closest,
      0,
    );
    ref.current.scrollTo({ top: closestIndex * ITEM_H, behavior: "smooth" });
  }, [selected, items]);

  const handleScroll = () => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    onSelect(items[Math.min(idx, items.length - 1)]);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="relative z-10 w-[64px] overflow-y-scroll"
      style={{
        height: ITEM_H * VISIBLE,
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div style={{ paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2 }}>
        {items.map((v) => (
          <div
            key={v}
            onClick={() => onSelect(v)}
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
            className={cn(
              "flex items-center justify-center cursor-pointer transition-all select-none",
              v === selected
                ? "text-2xl font-bold text-text-heading"
                : "text-lg font-semibold text-sub-gray",
            )}
          >
            {String(v).padStart(2, "0")}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimePicker({
  hour,
  minute,
  onChange,
  onConfirm,
  onClose,
  isOpen,
}: TimePickerProps) {
  if (!isOpen) return null;

  if (typeof document === "undefined") return null;

  const appRoot = document.getElementById("app-root");
  if (!appRoot) return null;

  return createPortal(
    <div
      className="absolute inset-0 z-50 flex items-center justify-center px-5 py-6"
      style={{ backgroundColor: "var(--color-system-blackbg)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[260px] max-h-[80dvh] bg-white rounded-3xl px-5 py-6 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-5 w-5 items-center justify-center text-main-blue active:opacity-70"
        >
          <CloseIcon width={16} height={16} aria-hidden />
        </button>
        <h3 className="font-bold text-2xl text-text-heading">시간 변경</h3>

        {/* 스크롤 영역 + 하이라이트 */}
        <div className="relative flex items-center gap-2" style={{ height: ITEM_H * VISIBLE }}>
          {/* 선택된 행 하이라이트 (두 컬럼 전체 너비) */}
          <div
            className="absolute -left-4 -right-4 rounded-xl z-0"
            style={{
              top: ITEM_H * 2,
              height: ITEM_H,
              backgroundColor: "var(--color-system-scroll)",
            }}
          />

          <ScrollColumn items={HOURS} selected={hour} onSelect={(h) => onChange(h, minute)} />

          <span
            className="relative z-10 font-bold text-2xl text-text-heading"
            style={{ lineHeight: 1 }}
          >
            :
          </span>

          <ScrollColumn items={MINUTES} selected={minute} onSelect={(m) => onChange(hour, m)} />
        </div>

        <Button variant="primary" onClick={onConfirm} className="w-full">
          완료
        </Button>
      </div>
    </div>,
    appRoot,
  );
}

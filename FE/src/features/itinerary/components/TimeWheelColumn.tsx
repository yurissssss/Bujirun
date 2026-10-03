"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/shared/utils";

export const TIME_WHEEL_ITEM_HEIGHT = 24;
export const TIME_WHEEL_VISIBLE_COUNT = 5;
export const TIME_WHEEL_HOURS = Array.from({ length: 24 }, (_, i) => i);
export const TIME_WHEEL_MINUTES = Array.from({ length: 6 }, (_, i) => i * 10);

// 시간 변경(TimelineTimePicker)과 여행 생성/수정(TripDateTimePicker)에서 공용으로 쓰는
// iOS 스타일 롤러 한 칸. 위아래로 스크롤해서 값을 고르고, 스크롤이 멈추면 가장 가까운
// 항목으로 스냅한다 — 숫자를 직접 타이핑하지 않게 하기 위함.
// itemHeight/visibleCount를 다르게 넘기면(예: 여행 생성 팝업처럼 더 작은 영역) 그 크기에
// 맞춰 패딩도 같이 재계산된다 — 항상 목록 가운데 줄이 선택값과 정확히 겹치도록.
export function TimeWheelColumn({
  items,
  selected,
  onSelect,
  itemHeight = TIME_WHEEL_ITEM_HEIGHT,
  visibleCount = TIME_WHEEL_VISIBLE_COUNT,
  // true면 거리별로 글자 크기를 안 키우고 전부 text-2xs로 고정한다(색/투명도로만 강조) —
  // 여행 생성 팝업처럼 옆 달력 날짜 숫자(text-2xs)와 크기를 맞추고 싶을 때 쓴다.
  compact = false,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  itemHeight?: number;
  visibleCount?: number;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isProgrammatic = useRef(false);
  const isFirstRender = useRef(true);
  const edgePadding = itemHeight * Math.floor(visibleCount / 2);
  const selectedIndex = items.indexOf(selected);

  useEffect(() => {
    if (!ref.current) return;
    isProgrammatic.current = true;
    const behavior = isFirstRender.current ? "instant" : "smooth";
    isFirstRender.current = false;
    const closestIndex = items.reduce(
      (closest, v, i) =>
        Math.abs(v - selected) < Math.abs(items[closest] - selected) ? i : closest,
      0,
    );
    ref.current.scrollTo({ top: closestIndex * itemHeight, behavior });
    const t = setTimeout(() => {
      isProgrammatic.current = false;
    }, 400);
    return () => clearTimeout(t);
  }, [selected, items, itemHeight]);

  const handleScroll = () => {
    if (isProgrammatic.current) return;
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / itemHeight);
    onSelect(items[Math.min(idx, items.length - 1)]);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="relative z-10 w-10 overflow-y-scroll"
      style={{
        height: itemHeight * visibleCount,
        scrollSnapType: "y mandatory",
      }}
    >
      <div style={{ paddingTop: edgePadding, paddingBottom: edgePadding }}>
        {items.map((v, index) => {
          // 값 차이가 아니라 인덱스 차이로 거리를 계산한다 — 분(分)처럼 항목 간
          // 간격이 1이 아닌 경우(0,10,20...)에도 "바로 옆 칸"이 항상 거리 1이 되도록.
          const dist = Math.abs(index - selectedIndex);
          return (
            <div
              key={v}
              onClick={() => onSelect(v)}
              style={{ height: itemHeight, scrollSnapAlign: "center" }}
              className={cn(
                "flex items-center justify-center cursor-pointer select-none font-semibold transition-all duration-150",
                compact
                  ? cn(
                      "text-2xs",
                      dist === 0
                        ? "text-text-primary"
                        : dist === 1
                          ? "text-sub-gray/70"
                          : "text-sub-gray/30",
                    )
                  : dist === 0
                    ? "text-md text-text-primary"
                    : dist === 1
                      ? "text-sm text-sub-gray/70"
                      : "text-xs text-sub-gray/30",
              )}
            >
              {String(v).padStart(2, "0")}
            </div>
          );
        })}
      </div>
    </div>
  );
}

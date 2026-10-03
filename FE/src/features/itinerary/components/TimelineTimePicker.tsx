"use client";

import { forwardRef } from "react";
import CloseIcon from "@/assets/icons/mypage/close.svg?svgr";
import {
  TimeWheelColumn,
  TIME_WHEEL_ITEM_HEIGHT as ITEM_H,
  TIME_WHEEL_VISIBLE_COUNT as VISIBLE,
  TIME_WHEEL_HOURS as HOURS,
  TIME_WHEEL_MINUTES as MINUTES,
} from "./TimeWheelColumn";

interface TimelineTimePickerProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

// 다른 타임라인 팝업(검색/상세)과 동일하게 해당 행 안에서 absolute로 띄운다.
// 예전엔 createPortal + getBoundingClientRect로 픽셀 좌표를 한 번만 계산해서
// app-root에 붙였는데, 그 뒤에 타임라인을 스크롤하면 팝업이 원래 시간 위치에서
// 떨어져 보이는 문제가 있었다. 행 안에 두면 스크롤에 자연히 같이 따라온다.
export const TimelineTimePicker = forwardRef<HTMLDivElement, TimelineTimePickerProps>(
  function TimelineTimePicker({ hour, minute, onChange, onConfirm, onClose }, ref) {
    return (
      <div
        ref={ref}
        className="absolute left-[52px] top-0 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative flex flex-col gap-2 rounded-2xl bg-main-white shadow-[2px_2px_10px_0px_var(--color-system-glassborder)]"
          style={{ width: 163, padding: "20px 16px" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center text-main-blue active:opacity-70"
          >
            <CloseIcon width={20} height={20} className="text-main-blue" aria-hidden />
          </button>
          <p className="text-center font-ssurround font-bold text-md text-text-heading">
            시간 변경
          </p>

          <div
            className="relative flex items-center justify-center gap-1.5"
            style={{ height: ITEM_H * VISIBLE }}
          >
            <div
              className="absolute left-0 right-0 z-0 rounded-[6px] border-[0.3px] border-main-blue"
              style={{
                top: ITEM_H * 2,
                height: ITEM_H,
                backgroundColor: "var(--color-system-scroll)",
                opacity: 0.5,
              }}
            />
            <TimeWheelColumn items={HOURS} selected={hour} onSelect={(h) => onChange(h, minute)} />
            <span className="relative z-10 text-md font-semibold text-text-heading leading-none">
              :
            </span>
            <TimeWheelColumn
              items={MINUTES}
              selected={minute}
              onSelect={(m) => onChange(hour, m)}
            />
          </div>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full h-7 rounded-[7px] bg-main-blue px-[34px] font-ssurround font-bold text-sm text-main-white active:opacity-80"
          >
            완료
          </button>
        </div>
      </div>
    );
  },
);

"use client";

import searchIcon from "@/assets/icons/collection/search.png";
import { cn } from "@/shared/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  gapClassName?: string;
  iconSize?: number;
  // 입력값이 있을 때 오른쪽에 초기화(x) 버튼을 보여준다. 지우고 나서 하는 일이
  // 화면마다 다를 수 있어(필터 되돌리기 등) 핸들러를 받을 수 있게 열어둔다.
  onClear?: () => void;
  hideClear?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "관광지 검색",
  className,
  inputClassName,
  gapClassName,
  iconSize = 16,
  onClear,
  hideClear = false,
}: SearchBarProps) {
  const showClear = !hideClear && value.length > 0;
  return (
    <div
      className={cn(
        "flex items-center gap-1",
        gapClassName,
        "py-2 px-3 rounded-lg",
        "bg-system-searchbg",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="shrink-0 bg-sub-gray"
        style={{
          width: iconSize,
          height: iconSize,
          maskImage: `url(${searchIcon.src})`,
          maskSize: "contain",
          maskPosition: "center",
          maskRepeat: "no-repeat",
          WebkitMaskImage: `url(${searchIcon.src})`,
          WebkitMaskSize: "contain",
          WebkitMaskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent outline-none",
          "font-normal text-xs text-text-primary",
          "placeholder:text-sub-gray",
          inputClassName,
        )}
      />
      {showClear && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          // 아이콘은 작아도 누를 수 있어야 해서 히트 영역을 패딩으로 넓힌다(레이아웃엔
          // 영향이 없도록 음수 마진으로 상쇄).
          className="-m-1.5 shrink-0 p-1.5 active:opacity-60"
        >
          {/* 아이콘 에셋 중 x 표시는 비트맵을 품은 SVG라 색·크기 제어가 안 돼서
              (작게 렌더하면 형태가 깨진다) 인라인으로 그린다 — Modal의 닫기 버튼과 같은 방식. */}
          <svg viewBox="0 0 24 24" width={18} height={18} className="text-sub-gray" aria-hidden>
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <path
              d="M8.5 8.5l7 7M15.5 8.5l-7 7"
              stroke="var(--color-system-searchbg)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

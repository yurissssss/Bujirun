"use client";

import Image from "next/image";
import type { StaticImageData } from "next/image";
import { PlaceMarker } from "@/components/place/PlaceMarker";
import bookmarkOnIcon from "@/assets/icons/mypage/bookmark-on.png";
import bookmarkOffIcon from "@/assets/icons/mypage/bookmark-off.png";
import { CategoryChip, StatusBadge } from "@/components";
import type { Category } from "@/components";

import type { PlaceStatus } from "@/components/ui/StatusBadge";

interface PlaceBookmarkCardProps {
  imageUrl?: StaticImageData | string;
  name: string;
  category?: Category; //카테고리
  status?: PlaceStatus;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onClick?: () => void;
}

export function PlaceBookmarkCard({
  imageUrl,
  name,
  category,
  status,
  isBookmarked = true,
  onBookmarkToggle,
  onClick,
}: PlaceBookmarkCardProps) {
  return (
    <div
      className="relative flex h-[98px] w-full cursor-pointer items-start gap-3 rounded-[20px] border-[0.3px] border-sub-lightblue bg-main-white px-[14px] py-[13px] shadow-[2px_2px_6px_var(--color-system-scroll)] active:opacity-80"
      onClick={onClick}
    >
      {/* 썸네일 - 이미지 없으면 placeholder */}
      <div className="relative h-[72px] w-[108px] shrink-0 overflow-hidden rounded-[15px] border-[0.3px] border-system-glassborder bg-system-navbg">
        {imageUrl && <Image src={imageUrl} alt={name} fill className="object-cover" />}
      </div>

      <div className="flex h-[72px] flex-1 flex-col">
        {/* 상단: 관광지명 + 북마크 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <PlaceMarker size={13} status={status} />
            <span className="text-md font-medium text-text-heading tracking-[-0.3px]">{name}</span>
          </div>
          <button
            type="button"
            aria-label={isBookmarked ? "북마크 해제" : "북마크 추가"}
            onClick={(e) => {
              e.stopPropagation();
              onBookmarkToggle?.();
            }}
            className="shrink-0 active:opacity-70"
          >
            <Image
              src={isBookmarked ? bookmarkOnIcon : bookmarkOffIcon}
              alt=""
              width={14}
              height={14}
              aria-hidden
            />
          </button>
        </div>

        {/* 중간: 카테고리 칩 */}
        {category && <CategoryChip category={category} size="md" className="mt-1 self-start" />}

        {/* 하단: 수집 상태 */}
        <div className="mt-auto flex justify-end">
          {status && <StatusBadge status={status} className="px-2.5 py-1.5 text-xs" />}
        </div>
      </div>
    </div>
  );
}

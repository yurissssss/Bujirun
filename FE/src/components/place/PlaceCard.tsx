"use client";

import Image from "next/image";
import { useState } from "react";
import { PlaceMarker } from "@/components/place/PlaceMarker";
import removeIcon from "@/assets/icons/itinerary/remove.svg?url";
import bookmarkOnIcon from "@/assets/icons/mypage/bookmark-on.png";
import bookmarkOffIcon from "@/assets/icons/mypage/bookmark-off.png";
import { cn } from "@/shared/utils";
import { getFallbackImage } from "@/features/itinerary/utils/scheduleUtils";
import { CategoryChip, StatusBadge } from "@/components";
import type { Category } from "@/components";

import type { PlaceStatus } from "@/components/ui/StatusBadge";

interface PlaceCardProps {
  imageUrl: string;
  name: string;
  category: Category;
  status?: PlaceStatus;
  isBookmarked?: boolean;
  showBookmark?: boolean;
  onDelete?: () => void;
  onBookmarkToggle?: () => void;
  onClick?: () => void;
  onVerify?: () => void;
  className?: string;
}

export function PlaceCard({
  imageUrl,
  name,
  category,
  status,
  isBookmarked = false,
  showBookmark = false,
  onDelete,
  onBookmarkToggle,
  onClick,
  onVerify,
  className,
}: PlaceCardProps) {
  // 관광공사 썸네일(tong.visitkorea.or.kr)이 503을 내면 이미지가 깨진 채로 남는다.
  // 한 번 실패하면 그 카드만 로컬 대체 이미지로 바꿔서 최소한 빈칸이 보이지 않게 한다.
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <div
      className={cn(
        "w-full min-w-0 h-[98px] flex bg-main-white rounded-2xl overflow-hidden border-[0.5px] border-system-glassborder shadow-[2px_2px_10px_0px_var(--color-system-glassborder)] cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      <div className="relative w-[108px] h-[80px] shrink-0 self-center ml-2 rounded-xl overflow-hidden">
        <Image
          src={hasImageError || !imageUrl ? getFallbackImage(name) : imageUrl}
          alt={name}
          fill
          sizes="108px"
          className="object-cover"
          onError={() => setHasImageError(true)}
        />
      </div>

      <div className="min-w-0 flex-1 flex flex-col justify-between px-2.5 py-2.5 overflow-hidden relative">
        <div className="flex flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1 pr-5">
            <PlaceMarker size={13} status={status} />
            <span className="font-medium text-md text-text-heading truncate">{name}</span>
          </div>
          <CategoryChip category={category} className="self-start" />
        </div>

        {status && (
          <div className="flex justify-end">
            {status === "verify" && onVerify ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVerify();
                }}
              >
                <StatusBadge status={status} />
              </button>
            ) : (
              <StatusBadge status={status} />
            )}
          </div>
        )}

        {showBookmark && (
          <button
            type="button"
            aria-label={isBookmarked ? "북마크 해제" : "북마크 추가"}
            className="absolute right-[10px] top-[10px] active:opacity-70"
            onClick={(event) => {
              event.stopPropagation();
              onBookmarkToggle?.();
            }}
          >
            <Image
              src={isBookmarked ? bookmarkOnIcon : bookmarkOffIcon}
              alt=""
              width={16}
              height={16}
              aria-hidden
            />
          </button>
        )}

        {onDelete && (
          <button
            className="absolute top-[10px] right-[10px] w-[18px] h-[18px] rounded-md bg-sub-coral flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Image
              src={removeIcon}
              alt="삭제"
              width={10}
              height={10}
              className="brightness-0 invert"
            />
          </button>
        )}
      </div>
    </div>
  );
}

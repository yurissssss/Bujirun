"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import BookmarkOffIcon from "@/assets/icons/itinerary/bookmark-off.svg?svgr";
import BookmarkOnIcon from "@/assets/icons/itinerary/bookmark-on.svg?svgr";
import MarkerIcon from "@/assets/icons/itinerary/marker.svg?svgr";
import { cn } from "@/shared/utils";
import { CategoryChip, StatusBadge, PlaceInfoRow } from "@/components";
import type { Category } from "@/components";

interface RelatedLog {
  imageUrl: string;
  userName: string;
}

interface PlaceDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: () => void;
  onVerify?: () => void;
  imageUrl: string;
  name: string;
  category: Category;
  status?: "completed" | "verify" | "pending";
  description: string;
  address: string;
  infoItems?: { icon: string; label: string; value: string }[];
  relatedLogs?: RelatedLog[];
  onViewMoreLogs?: () => void;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  className?: string;
}

export function PlaceDetailSheet({
  isOpen,
  onClose,
  onAdd,
  onVerify,
  imageUrl,
  name,
  category,
  status,
  description,
  address,
  infoItems,
  relatedLogs,
  onViewMoreLogs,
  isBookmarked,
  onBookmark,
  className,
}: PlaceDetailSheetProps) {
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
        className={cn(
          "w-full max-w-[320px] h-[470px] max-h-[80dvh] rounded-2xl bg-main-white shadow-[0_2px_8px_0_var(--color-system-scroll)] flex flex-col overflow-hidden",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 네비게이션 */}
        <div className="px-5 pt-6 pb-3 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="flex items-center justify-center">
            <span className="font-bold text-lg text-text-heading leading-none">‹</span>
          </button>
          <button
            onClick={onAdd}
            className="w-[28px] h-[28px] bg-sub-coral rounded-lg flex items-center justify-center"
          >
            <span className="font-bold text-main-white text-lg leading-none">+</span>
          </button>
        </div>

        {/* 스크롤 영역 (이미지 포함) */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 pb-6 px-5">
          {/* 이미지 */}
          <div className="relative w-full h-[152px] rounded-lg overflow-hidden">
            <Image src={imageUrl} alt={name} fill sizes="390px" className="object-cover" />
            {onVerify && (
              <button
                onClick={onVerify}
                className="absolute top-2 right-2 h-[26px] px-3 bg-sub-coral rounded-lg flex items-center justify-center"
              >
                <span className="font-bold text-main-white text-xs leading-none">인증하기</span>
              </button>
            )}
            {status && (
              <div className="absolute bottom-2 right-2">
                <StatusBadge status={status} />
              </div>
            )}
          </div>

          {/* 이름 행 — 좌우 패딩을 이미지 여백(21px)에 맞춤 */}
          <div className="flex items-center justify-between pt-2.5 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <MarkerIcon
                  width={13}
                  height={15}
                  className="shrink-0 fill-sub-coral"
                  aria-hidden
                />
                <span className="font-medium text-md text-text-heading">{name}</span>
              </div>
              <CategoryChip category={category} />
            </div>
            <button
              onClick={onBookmark}
              className="shrink-0"
              aria-label={isBookmarked ? "북마크 해제" : "북마크"}
            >
              {isBookmarked ? (
                <BookmarkOnIcon width={16} height={18} className="fill-main-blue" aria-hidden />
              ) : (
                <BookmarkOffIcon width={16} height={18} className="fill-sub-darkgray" aria-hidden />
              )}
            </button>
          </div>

          <hr className="border-t border-system-divider" />

          <div>
            <div className="py-2.5">
              <h3 className="font-semibold text-sm text-text-heading mb-2.5">소개</h3>
              <p className="font-normal text-xs text-text-primary leading-relaxed">{description}</p>
            </div>

            <hr className="border-t border-system-divider" />

            <div className="py-2.5">
              <div className="flex items-center gap-2 mb-2.5">
                <h3 className="font-semibold text-sm text-text-heading">위치</h3>
                <div className="flex items-center gap-1 bg-sub-lightblue px-2 py-0.5 rounded-full">
                  <MarkerIcon
                    width={10}
                    height={11}
                    className="shrink-0 fill-sub-coral"
                    aria-hidden
                  />
                  <span className="text-xs text-sub-deepblue font-medium">카카오맵</span>
                </div>
              </div>
              <p className="font-normal text-xs text-text-primary">{address}</p>
            </div>

            {infoItems && infoItems.length > 0 && (
              <>
                <hr className="border-t border-system-divider" />
                <div className="py-2.5">
                  <h3 className="font-semibold text-sm text-text-heading mb-2.5">정보</h3>
                  <PlaceInfoRow items={infoItems} />
                </div>
              </>
            )}
            {relatedLogs && relatedLogs.length > 0 && (
              <>
                <hr className="border-t border-system-divider" />
                <div className="py-2.5">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="font-semibold text-sm text-text-heading">관련 로그</h3>
                    <button onClick={onViewMoreLogs} className="flex items-center gap-0.5">
                      <span className="text-xs text-sub-deepblue">더보기</span>
                      <span className="text-xs text-sub-deepblue">›</span>
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {relatedLogs.map((log, i) => (
                      <div
                        key={i}
                        className="relative w-[110px] h-[90px] shrink-0 rounded-lg overflow-hidden"
                      >
                        <Image
                          src={log.imageUrl}
                          alt={log.userName}
                          fill
                          sizes="110px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <span className="absolute bottom-1.5 left-2 font-medium text-xs text-main-white">
                          {log.userName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    appRoot,
  );
}

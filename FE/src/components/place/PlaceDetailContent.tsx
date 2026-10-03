"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { StaticImageData } from "next/image";
import bookmarkOffIcon from "@/assets/icons/itinerary/bookmark-off.png";
import bookmarkOnIcon from "@/assets/icons/itinerary/bookmark-on.png";
import { BOOKMARK_TOAST_MESSAGE } from "@/shared/constants/bookmark";
import callIcon from "@/assets/icons/itinerary/call.png";
import clockIcon from "@/assets/icons/itinerary/clock-blue.png";
import feeIcon from "@/assets/icons/itinerary/fee.png";
import kakaoMapIcon from "@/assets/icons/itinerary/kakaomap_horizontal_ko.png";
import markerPinkIcon from "@/assets/icons/itinerary/marker-pink.png";
import parkingIcon from "@/assets/icons/itinerary/parking.png";
import { BackButton, Card, CategoryChip, Toast } from "@/components";
import type { Category } from "@/components";
import { cn } from "@/shared/utils";

type InfoIconType = "clock" | "fee" | "parking" | "call";
type PlaceDetailSize = "default" | "compact";

// sticky 헤더의 "덮는 높이"를 한 곳에서만 정한다 — 헤더 배경 높이(heightClass), 스크롤 영역
// 상단 패딩(paddingClass), 이름 줄을 관찰하는 IntersectionObserver의 rootMargin(height)이
// 전부 같은 값이어야 한다. 예전엔 헤더는 h-8(32px)인데 패딩만 pt-11(44px)로 남아 있어서, 그
// 12px 구간으로 이미지·텍스트가 헤더 밑(배경이 없는 부분)에 비쳐 보였다.
// 높이는 뒤로가기 버튼(28px) 기준이라 버튼 위치는 북마크 목록 등 다른 화면과 동일하게 유지된다.
const STICKY_HEADER = {
  default: { height: 32, heightClass: "h-8", paddingClass: "pt-8" },
  compact: { height: 36, heightClass: "h-9", paddingClass: "pt-9" },
} as const;

const CONTENT_TOP_GAP = {
  default: 12,
  compact: 12,
} as const;

const INFO_ICONS: Record<InfoIconType, StaticImageData> = {
  clock: clockIcon,
  fee: feeIcon,
  parking: parkingIcon,
  call: callIcon,
};

export interface PlaceDetailInfoItem {
  type: InfoIconType;
  label: string;
  value: string;
}

export interface PlaceDetailRelatedLog {
  id: string;
  imageUrl: string;
  author: string;
}

// 소개글을 문장 단위(마침표/느낌표/물음표 뒤)로 줄바꿈해서 읽기 편하게 보여준다.
function formatDescription(text: string): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .join("\n");
}

export interface PlaceDetailData {
  imageUrl: string | StaticImageData;
  name: string;
  category: Category;
  description: string;
  address: string;
  mapUrl?: string;
  isBookmarked?: boolean;
  infoItems?: PlaceDetailInfoItem[];
}

interface PlaceDetailContentProps {
  place: PlaceDetailData;
  onBookmark?: () => void | Promise<void>;
  relatedLogs?: PlaceDetailRelatedLog[];
  onViewMoreLogs?: () => void;
  relatedLogsHref?: string;
  onLogClick?: (logId: string) => void;
  getRelatedLogHref?: (logId: string) => string;
  imageOverlay?: ReactNode;
  footer?: ReactNode;
  // 일정 탭의 작은 타임라인 팝업처럼 좁은 공간에 넣을 땐 "compact"로 축소한다. 기본은 "default".
  size?: PlaceDetailSize;
  // 있으면 이미지까지 포함해서 화면 전체가 한 번에 스크롤되고, 스크롤 시 뒤로가기
  // 버튼 옆에 관광지명이 떠오르는 sticky 헤더로 바뀐다. 없으면 기존처럼 이미지/이름은
  // 고정, 아래 섹션만 스크롤.
  onBack?: () => void;
}

export function PlaceDetailContent({
  place,
  onBookmark,
  relatedLogs,
  onViewMoreLogs,
  relatedLogsHref,
  onLogClick,
  getRelatedLogHref,
  imageOverlay,
  footer,
  size = "default",
  onBack,
}: PlaceDetailContentProps) {
  const { imageUrl, name, category, description, address, mapUrl, isBookmarked, infoItems } = place;
  const compact = size === "compact";
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nameRowRef = useRef<HTMLDivElement>(null);
  const [showStickyName, setShowStickyName] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [bookmarkToast, setBookmarkToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const stickyHeader = STICKY_HEADER[compact ? "compact" : "default"];
  const headerHeight = stickyHeader.height;
  const contentTopGap = CONTENT_TOP_GAP[compact ? "compact" : "default"];
  const formattedDescription = formatDescription(description?.trim() || "등록된 내용이 없습니다.");
  const canExpandDescription = formattedDescription.length > 80;
  const hideBookmarkToast = useCallback(() => setBookmarkToast(null), []);

  const handleBookmark = async () => {
    const willAddBookmark = !isBookmarked;

    try {
      await onBookmark?.();
      setBookmarkToast({
        message: willAddBookmark ? BOOKMARK_TOAST_MESSAGE.added : BOOKMARK_TOAST_MESSAGE.removed,
        variant: "success",
      });
    } catch {
      setBookmarkToast({ message: BOOKMARK_TOAST_MESSAGE.error, variant: "error" });
    }
  };

  // scrollTop/offsetTop 계산은 padding·offsetParent에 따라 어긋나기 쉬워서,
  // sticky 헤더 높이만큼 root를 줄인 IntersectionObserver로 "이름 줄이 헤더 밑으로
  // 넘어갔는지"를 직접 관찰한다.
  useEffect(() => {
    if (!onBack) return;
    const root = scrollContainerRef.current;
    const target = nameRowRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyName(!entry.isIntersecting),
      {
        root,
        rootMargin: `-${headerHeight + contentTopGap}px 0px 0px 0px`,
        threshold: 0,
      },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [onBack, headerHeight, contentTopGap]);

  const nameRow = (
    <div
      ref={nameRowRef}
      className={cn(
        "shrink-0 flex items-center justify-between",
        compact ? "pt-3 pb-2.5" : "pt-5 pb-4",
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <Image
          src={markerPinkIcon}
          alt=""
          width={compact ? 12 : 18}
          height={compact ? 12 : 18}
          aria-hidden
        />
        <span
          className={cn(
            "truncate font-bold text-text-heading tracking-[-0.3px]",
            compact ? "text-md" : "text-xl",
          )}
        >
          {name}
        </span>
        <CategoryChip category={category} size={compact ? "sm" : "md"} className="ml-2 shrink-0" />
      </div>
      {onBookmark !== undefined && (
        <button
          type="button"
          aria-label={isBookmarked ? "북마크 해제" : "북마크 추가"}
          onClick={handleBookmark}
          className="ml-2 shrink-0 active:opacity-70"
        >
          <Image
            src={isBookmarked ? bookmarkOnIcon : bookmarkOffIcon}
            alt=""
            width={compact ? 12 : 18}
            height={compact ? 12 : 18}
            aria-hidden
          />
        </button>
      )}
    </div>
  );

  const sections = (
    <div className={cn("flex flex-col", compact ? "gap-3 py-3" : "gap-5 py-5")}>
      {/* 소개 */}
      <section className="flex flex-col gap-2">
        <h2 className={cn("font-bold text-text-heading", compact ? "text-sm" : "text-lg")}>소개</h2>
        <p
          className={cn(
            "whitespace-pre-line text-text-primary",
            compact
              ? "text-xs font-normal leading-loose tracking-[0.015em]"
              : "text-md leading-[1.85] tracking-[0.025em]",
            canExpandDescription && !isDescriptionExpanded && "line-clamp-3",
          )}
        >
          {formattedDescription}
        </p>
        {canExpandDescription && (
          <button
            type="button"
            onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
            className="self-end mt-1 text-xs font-semibold text-sub-gray underline underline-offset-2 active:opacity-70"
          >
            {isDescriptionExpanded ? "접기" : "더보기"}
          </button>
        )}
      </section>

      <hr className="border-[0.3px] border-sub-lightgray/70" />

      {/* 위치 */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className={cn("font-bold text-text-heading", compact ? "text-sm" : "text-lg")}>
            위치
          </h2>
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="active:opacity-70 bg-main-blue px-2.5 py-1 rounded-xl"
            >
              <Image
                src={kakaoMapIcon}
                alt="카카오맵"
                width={compact ? 37 : 45}
                height={compact ? 11 : 17}
                className="object-contain"
              />
            </a>
          )}
        </div>
        <p className={cn("text-text-primary", compact ? "text-xs font-normal" : "text-md")}>
          {address}
        </p>
      </section>

      {infoItems && infoItems.length > 0 && (
        <>
          <hr className="border-[0.3px] border-sub-lightgray/70" />
          <section className="flex flex-col gap-2">
            <h2 className={cn("font-bold text-text-heading", compact ? "text-sm" : "text-lg")}>
              정보
            </h2>
            <Card
              variant="glass-sm"
              className={cn("flex flex-col gap-2", compact ? "!p-[10px_12px]" : "!p-[12px_16px]")}
            >
              {infoItems.map((item) => (
                <InfoRow
                  key={item.label}
                  icon={INFO_ICONS[item.type]}
                  label={item.label}
                  value={item.value}
                  compact={compact}
                />
              ))}
            </Card>
          </section>
        </>
      )}

      {relatedLogs !== undefined && (
        <>
          <hr className="border-[0.3px] border-sub-lightgray/70" />
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className={cn("font-bold text-text-heading", compact ? "text-sm" : "text-lg")}>
                관련 로그
              </h2>
              {relatedLogsHref ? (
                <Link href={relatedLogsHref} className="flex items-center gap-1 active:opacity-70">
                  <span className="text-xs font-semibold text-sub-gray">더보기</span>
                  <ChevronRightIcon className="h-2.5 w-2.5 shrink-0 text-sub-gray" />
                </Link>
              ) : (
                onViewMoreLogs && (
                  <button
                    type="button"
                    className="flex items-center gap-1 active:opacity-70"
                    onClick={onViewMoreLogs}
                  >
                    <span className="text-xs font-semibold text-sub-gray">더보기</span>
                    <ChevronRightIcon className="h-2.5 w-2.5 shrink-0 text-sub-gray" />
                  </button>
                )
              )}
            </div>
            <div className={cn("flex", compact ? "gap-3 overflow-x-auto pb-1" : "gap-4")}>
              {relatedLogs.length === 0 ? (
                <p className="text-sm text-sub-gray">아직 관련 로그가 없어요</p>
              ) : (
                relatedLogs.slice(0, compact ? 4 : 2).map((log) => {
                  const content = (
                    <>
                      {/* 대표 사진 없으면 회색 배경 처리 */}
                      {log.imageUrl ? (
                        <Image
                          src={log.imageUrl}
                          alt=""
                          fill
                          sizes="150px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-system-searchbg" />
                      )}
                      <div className="absolute bottom-[6px] left-[6px] rounded-[5px] bg-system-blackbg px-1.5 py-0.5">
                        <span className="text-2xs font-medium text-white">{log.author}</span>
                      </div>
                    </>
                  );
                  const className = cn(
                    "relative shrink-0 overflow-hidden rounded-lg active:opacity-70",
                    compact ? "h-[67px] w-[106px]" : "h-[95px] w-[150px]",
                  );

                  if (getRelatedLogHref) {
                    return (
                      <Link key={log.id} href={getRelatedLogHref(log.id)} className={className}>
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => onLogClick?.(log.id)}
                      className={className}
                    >
                      {content}
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );

  const toast = bookmarkToast && (
    <Toast
      isVisible
      onHide={hideBookmarkToast}
      message={bookmarkToast.message}
      variant={bookmarkToast.variant}
    />
  );

  const image = (
    <div
      className={cn(
        "relative w-full shrink-0 overflow-hidden",
        compact ? "h-[145px] rounded-[10px]" : "h-[195px] rounded-[15px]",
      )}
    >
      <Image src={imageUrl} alt={name} fill sizes="390px" className="object-cover" />
      {imageOverlay}
    </div>
  );

  if (onBack) {
    return (
      <div className="relative flex h-full flex-col">
        {toast}
        <div
          className={cn(
            "absolute inset-x-0 top-0 z-20 flex shrink-0 items-center gap-3 bg-main-white",
            stickyHeader.heightClass,
          )}
        >
          <BackButton className="bg-transparent" onClick={onBack} />
          <span
            className={cn(
              "truncate font-bold text-text-heading transition-opacity duration-200",
              compact ? "text-md" : "text-xl",
              showStickyName ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {name}
          </span>
        </div>
        <div
          ref={scrollContainerRef}
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden",
            stickyHeader.paddingClass,
          )}
        >
          <div className="h-3 shrink-0" aria-hidden />

          {image}
          {nameRow}
          <hr className="border-[0.3px] border-sub-lightgray/70" />
          {sections}
        </div>
        {footer && <div className="shrink-0 px-1 pb-6 pt-3">{footer}</div>}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {toast}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {image}
        {nameRow}
        <hr className="border-[0.3px] border-sub-lightgray/70" />
        {sections}
      </div>
      {footer && (
        <div className={cn("shrink-0", compact ? "pb-0 pt-2" : "pb-6 pt-3")}>{footer}</div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  compact,
}: {
  icon: StaticImageData;
  label: string;
  value: string;
  compact: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[5px] border-[0.1px] border-main-blue bg-system-navbg",
          compact ? "h-[22px] w-[22px]" : "h-[26px] w-[26px]",
        )}
      >
        <Image src={icon} alt="" width={compact ? 12 : 14} height={compact ? 12 : 14} aria-hidden />
      </div>
      <p
        className={cn("shrink-0 font-semibold text-text-primary", compact ? "text-xs" : "text-md")}
      >
        {label}
      </p>
      <p
        className={cn(
          "min-w-0 flex-1 break-keep whitespace-pre-line text-right text-text-primary",
          compact ? "text-2xs" : "text-sm",
        )}
      >
        {value.replace(/<br\s*\/?>\s*/gi, "\n")}
      </p>
    </div>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M6.079,22.5a1.5,1.5,0,0,1,.44-1.06l7.672-7.672a2.5,2.5,0,0,0,0-3.536L6.529,2.565A1.5,1.5,0,0,1,8.65.444l7.662,7.661a5.506,5.506,0,0,1,0,7.779L8.64,23.556A1.5,1.5,0,0,1,6.079,22.5Z" />
    </svg>
  );
}

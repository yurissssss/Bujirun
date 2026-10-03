"use client";

import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";
import type { StaticImageData } from "next/image";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/shared/utils";
import type { Category } from "@/components/ui/CategoryChip";
import { matchCategoryTag } from "@/shared/constants/category";
import type { components } from "@/shared/api/schema.d";

const CATEGORY_BG: Record<Category, string> = {
  sea: "bg-category-sea",
  nature: "bg-category-nature",
  culture: "bg-category-culture",
  experience: "bg-category-experience",
};

export interface LogDetailStop {
  time: string;
  place: string;
  imageUrl?: string | StaticImageData;
  photoId?: string;
  representative?: boolean;
  visited: boolean;
  /** 4개 카테고리(바다/자연/문화/체험)와 일치하는 태그만 해당 카테고리 색으로, 나머지는 기본색으로 표시 */
  tags: string[];
}

export interface LogDetailDay {
  day: number;
  date: string;
  stops: LogDetailStop[];
}

export interface LogDetailData {
  title: string;
  placeName: string;
  extraCount?: number;
  duration: string;
  date: string;
  days: LogDetailDay[];
}

interface LogDetailContentProps {
  log: LogDetailData;
  onBack?: () => void;
  /** itinerary의 "일정에 담기" 버튼, collection의 공개/비공개 스위치 등 헤더 우측 슬롯 */
  headerRight?: ReactNode;
  /** 도감(collection) 탭 로그 상세보기에서만 사용: 관광지 태그 추가/삭제 UI 노출 */
  editableTags?: boolean;
  onAddTag?: (dayIndex: number, stopIndex: number, tag: string) => void;
  onDeleteTag?: (dayIndex: number, stopIndex: number, tagIndex: number) => void;
  editableRepresentativePhoto?: boolean;

  onSetRepresentativePhoto?: (dayIndex: number, stopIndex: number) => void;
}

export function LogDetailContent({
  log,
  onBack,
  headerRight,
  editableTags = false,
  onAddTag,
  onDeleteTag,
  editableRepresentativePhoto = false,
  onSetRepresentativePhoto,
}: LogDetailContentProps) {
  const representativePlaceName =
    log.days.flatMap((day) => day.stops).find((stop) => stop.representative)?.place ??
    log.placeName;

  const summaryPlace =
    log.extraCount && log.extraCount > 0
      ? `${representativePlaceName} 외 ${log.extraCount}곳`
      : representativePlaceName;

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center gap-4 pb-4 shrink-0">
        <BackButton className="bg-transparent" onClick={onBack} />
        <span className="font-ssurround font-bold text-lg text-text-heading flex-1 truncate">
          {log.title}
        </span>
        {headerRight && <div className="pr-3">{headerRight}</div>}
      </div>

      {/* 요약 정보 카드 */}
      <div className="shrink-0 mb-5 backdrop-blur-[15px] bg-gradient-to-b from-system-glassfrom to-system-glassto border border-system-glassborder rounded-2xl h-[67px] flex flex-col justify-center px-5 gap-2">
        <div className="flex items-center gap-1">
          <span className="text-md shrink-0">📍</span>
          <span className="font-medium text-md text-text-primary tracking-[0.28px]">
            {summaryPlace}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm shrink-0">📅</span>
          <span className="font-medium text-sm text-sub-deepgray tracking-[0.24px]">
            {log.duration} · {log.date}
          </span>
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-6 flex flex-col gap-6">
        {log.days.map((daySchedule, dayIdx) => (
          <div key={daySchedule.day} className="flex flex-col">
            {/* Day 헤더 */}
            <div className="flex items-center gap-2 mb-3.5">
              <DayBadge day={daySchedule.day} />
              <span className="font-ssurround font-semibold text-md text-sub-darkgray">
                {daySchedule.date}
              </span>
            </div>

            {/* 타임라인 */}
            <div className="relative flex flex-col pb-1.5">
              {daySchedule.stops.length === 0 ? (
                <div className="flex min-h-8 items-center ml-5">
                  <span className="text-md text-text-primary">기록된 일정이 없어요.</span>
                </div>
              ) : (
                daySchedule.stops.map((stop, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "relative flex items-start",
                      idx < daySchedule.stops.length - 1 && "pb-5",
                    )}
                  >
                    {idx < daySchedule.stops.length - 1 && (
                      <div className="absolute left-[53px] top-[6px] bottom-[-6px] w-[2px] rounded-full bg-sub-lightgray" />
                    )}

                    {/* 시간 + 도트 */}
                    <div className="flex items-center shrink-0">
                      <div className="w-12 text-right pr-2.5">
                        <span className="font-medium text-sm text-sub-deepblue tracking-[0.6px]">
                          {formatArrivalTime(stop.time)}
                        </span>
                      </div>

                      <div className="w-3 h-3 rounded-full bg-main-blue shrink-0 relative z-10" />
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 flex flex-col gap-2.5 pl-2">
                      {/* 장소명 */}
                      <div className="flex items-center gap-1">
                        <span className="text-md shrink-0">📍</span>
                        <span
                          className={cn(
                            "font-medium text-md tracking-[0.42px]",
                            stop.visited ? "text-text-primary" : "text-sub-gray",
                          )}
                        >
                          {stop.place}
                        </span>
                      </div>

                      {/* 사진 */}
                      {stop.imageUrl && (
                        <div className="relative w-[254px] h-[118px] rounded-xl overflow-hidden border-[0.3px] border-system-glassborder shrink-0">
                          <Image
                            src={stop.imageUrl}
                            alt={stop.place}
                            fill
                            sizes="254px"
                            className="object-cover"
                          />

                          {editableRepresentativePhoto && stop.visited && (
                            <button
                              type="button"
                              onClick={
                                stop.representative
                                  ? undefined
                                  : () => onSetRepresentativePhoto?.(dayIdx, idx)
                              }
                              disabled={stop.representative}
                              aria-pressed={stop.representative}
                              className={cn(
                                "absolute right-2 top-2 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                                stop.representative
                                  ? "cursor-default bg-main-blue text-main-white"
                                  : "cursor-pointer bg-system-whitebg backdrop-blur-sm text-system-blackbg",
                              )}
                            >
                              대표사진
                            </button>
                          )}
                        </div>
                      )}

                      {/* 태그 */}
                      <StopTags
                        tags={stop.tags}
                        editable={editableTags}
                        disabled={!stop.visited}
                        onAddTag={(tag) => onAddTag?.(dayIdx, idx, tag)}
                        onDeleteTag={(tagIdx) => onDeleteTag?.(dayIdx, idx, tagIdx)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function DayBadge({ day }: { day: number }) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-main-blue px-2.5 pt-1.5 pb-1 shrink-0">
      <span className="font-ssurround font-bold text-md text-main-white tracking-[0.5px] leading-none">
        day {day}
      </span>
    </div>
  );
}

interface StopTagsProps {
  tags: string[];
  editable?: boolean;
  disabled?: boolean;
  onAddTag?: (tag: string) => void;
  onDeleteTag?: (tagIndex: number) => void;
}

/** editable이 true일 때만(도감 탭) 태그 추가/삭제 UI를 노출, 그 외 페이지는 기존과 동일한 정적 표시 */
function StopTags({
  tags,
  editable = false,
  disabled = false,
  onAddTag,
  onDeleteTag,
}: StopTagsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleCancel = () => {
    setIsAdding(false);
    setNewTag("");
  };

  const handleSubmit = () => {
    const trimmedTag = newTag.trim().replace(/^#/, "");

    if (!trimmedTag) {
      handleCancel();
      return;
    }

    onAddTag?.(`#${trimmedTag}`);
    handleCancel();
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tags.map((tag, tagIdx) => {
        const matchedCategory = matchCategoryTag(tag);
        const deletable = editable && !disabled && !matchedCategory;

        return (
          <button
            key={`${tag}-${tagIdx}`}
            type="button"
            onClick={deletable ? () => onDeleteTag?.(tagIdx) : undefined}
            disabled={!deletable}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-1.5 py-1",
              deletable ? "cursor-pointer" : "cursor-default",
              matchedCategory ? CATEGORY_BG[matchedCategory] : "bg-main-blue",
            )}
          >
            <span
              className={cn(
                "text-center text-xs tracking-[0.16px]",
                matchedCategory ? "text-text-primary" : "text-main-white",
              )}
            >
              {tag}
            </span>
          </button>
        );
      })}

      {editable &&
        !disabled &&
        (isAdding ? (
          <div className="inline-flex items-center justify-center rounded-md bg-main-blue px-1.5 py-1">
            <span className="text-center text-xs tracking-[0.16px] text-main-white">#</span>
            <input
              value={newTag}
              onChange={(event) => setNewTag(event.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSubmit();
                }

                if (event.key === "Escape") {
                  handleCancel();
                }
              }}
              style={{ width: `${Math.max(newTag.length + 1, 1)}ch` }}
              className="ml-0.5 min-w-5 max-w-[16ch] bg-transparent text-xs tracking-[0.16px] text-main-white outline-none placeholder:text-main-white/70"
              autoFocus
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            aria-label="태그 추가"
            className="inline-flex min-w-[36px] items-center justify-center rounded-md border border-dashed border-main-blue px-1.5 py-[3px]"
          >
            <svg viewBox="0 0 20 20" className="size-4 fill-main-blue" aria-hidden="true">
              <path d="M9 4a1 1 0 1 1 2 0v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4Z" />
            </svg>
          </button>
        ))}
    </div>
  );
}

function formatArrivalTime(value?: string) {
  if (!value) return "";

  const timeMatch = value.match(/(\d{2}):(\d{2})(?::\d{2})?/);

  return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : value;
}

// API 응답 → LogDetailContent props 변환
type TravelLogDetail = components["schemas"]["TravelLogDetailResponse"];

export function toLogDetailData(log: TravelLogDetail): LogDetailData {
  return {
    title: log.title ?? "",
    placeName: log.days?.[0]?.items?.[0]?.spotName ?? "",
    extraCount: log.totalSpots != null && log.totalSpots > 1 ? log.totalSpots - 1 : undefined,
    duration: log.duration ?? "",
    date: log.startDate?.replace(/-/g, ".") ?? "",
    days: (log.days ?? []).map((day) => ({
      day: day.dayNumber ?? 1,
      date: day.date?.replace(/-/g, ".") ?? "",
      stops: (day.items ?? []).map((item) => ({
        time: formatArrivalTime(item.arrivalTime),
        place: item.spotName ?? "",
        imageUrl:
          item.photos?.find((p) => p.representative)?.photoUrl ??
          item.photos?.[0]?.photoUrl ??
          undefined,
        representative: item.photos?.some((p) => p.representative) ?? false,
        tags: item.hashtags?.map((h) => `#${h.tag}`) ?? [],
        visited: item.visited ?? true,
      })),
    })),
  };
}

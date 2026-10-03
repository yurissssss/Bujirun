"use client";

import { useState, useRef, useEffect } from "react";
import PlusIcon from "@/assets/icons/itinerary/plus-small.svg?svgr";
import type { TransportLeg } from "./TransportCard";
import { PlaceCard, EmptyState } from "@/components";
import { TransportCard } from "./TransportCard";
import { TimelinePlaceDetailPopup } from "./TimelinePlaceDetailPopup";
import { TimelineSearchPopup } from "./TimelineSearchPopup";
import { TimelineSearchTrigger } from "./TimelineSearchTrigger";
import { TimelineTimePicker } from "./TimelineTimePicker";
import { cn } from "@/shared/utils";
import { MAX_STOPS_PER_DAY } from "@/features/itinerary/utils/scheduleUtils";
import type { Category } from "@/components";
import type { SearchPlace } from "../../../components/place/PlaceSearchPanel";
import { CollaboratorBadge } from "./CollaboratorBadge";
import type { CollaboratorInfo } from "@/features/itinerary/collab/useCollaborativeItinerary";

type PlaceStatus = "completed" | "verify";

interface TransportInfo {
  from: string;
  to: string;
  durationMin: number;
  baseDurationMin: number;
  cost?: number;
  legs: TransportLeg[];
  // 이 경로가 계산된 시점의 "다음 스팟" id — 재정렬/삭제로 이웃이 바뀌면 이 값과
  // 현재 다음 스팟 id가 달라져서, rebuildTransport()가 낡은 정보를 골라낼 수 있다.
  toStopId?: string;
}

export interface ItineraryStop {
  id: string;
  // 인증하기(ArrivalVerifyModal)에 넘길 실제 관광지 ID. item.id(=id, 일정 아이템 ID)와는 다르다.
  spotId?: string;
  time: string;
  placeName: string;
  imageUrl: string;
  category: Category;
  status: PlaceStatus;
  description?: string;
  address?: string;
  // 카카오맵 길찾기 좌표 — 없으면(좌표 추가 전 공동편집 문서, 검색으로 막 추가한 장소)
  // 길찾기가 장소 이름으로 키워드 검색한다.
  lat?: number;
  lng?: number;
  mapUrl?: string;
  isBookmarked?: boolean;
  relatedLogs?: { id: string; imageUrl: string; userName: string }[];
  transport?: TransportInfo;
  // 최초 계산된 실제 추천 경로(ODsay 등) 스냅샷 — transport는 사용자가 교통수단을 바꿀
  // 때마다 덮어써지지만, 이 필드는 절대 바뀌지 않아서 "추천" 옵션이 항상 원래 추천을
  // 보여줄 수 있게 한다. REST/로그에서 처음 불러올 때 한 번만 채워진다.
  recommendedTransport?: TransportInfo;
  // 사용자가 시간선택기로 이 스팟의 시간을 직접 정한 적이 있는지 — 교통수단 변경으로
  // 이후 일정 시간을 자동으로 밀 때, 이 값이 true인 스팟을 만나면 거기서 멈춘다.
  // TODO: 백엔드에 필드 추가되면 REST에도 반영 — 지금은 로컬(Yjs) 전용이라 새로고침하면
  // 초기화된다(시간 값 자체는 REST에 저장되니 안 사라짐, 이 플래그만 사라짐).
  timeIsManual?: boolean;
  // 지금 이 항목을 보고 있는 다른 참여자 목록 (실시간 공동편집, WS 미연결 시 항상 빈 배열)
  activeEditors?: CollaboratorInfo[];
  onDelete?: () => void;
  onClick?: () => void;
  onTimeClick?: () => void;
  onTimeConfirm?: (time: string) => void;
  onTransportClick?: () => void;
  onVerify?: () => void;
  onAddPlace?: (place: SearchPlace) => void;
}

interface ItineraryTimelineProps {
  stops: ItineraryStop[];
  date?: string;
  onAddNewPlace?: (place: SearchPlace) => void;
  // 지금 이 날에서 유저가 보고 있는 항목이 바뀔 때마다 알려준다 (실시간 공동편집 프레즌스용)
  onFocusChange?: (stopId: string | null) => void;
  // SlidingTimeline이 모든 Day를 동시에 마운트해두고 translateX로 넘기는 구조라,
  // 화면 밖으로 밀려난(비활성) Day의 검색/상세/시간변경 팝업이 계속 열린 채로 남아있던
  // 문제가 있었다 — 비활성화되는 순간 팝업들을 닫아서 방지한다.
  isActive?: boolean;
}

export function ItineraryTimeline({
  stops,
  date,
  onAddNewPlace,
  onFocusChange,
  isActive = true,
}: ItineraryTimelineProps) {
  const [activeSearchStopId, setActiveSearchStopId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [activeDetailStopId, setActiveDetailStopId] = useState<string | null>(null);
  const [activeTimeStopId, setActiveTimeStopId] = useState<string | null>(null);
  const [inlineTimeValue, setInlineTimeValue] = useState({ hour: 12, minute: 0 });
  const [popupScrollSpace, setPopupScrollSpace] = useState(0);
  const searchCardRef = useRef<HTMLDivElement>(null);
  const addNewCardRef = useRef<HTMLDivElement>(null);
  const detailCardRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const stopRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isAutoScrollingRef = useRef(false);
  const activePopupStopId = activeSearchStopId ?? activeDetailStopId ?? activeTimeStopId;
  const focusedStopId = activeSearchStopId ?? activeDetailStopId ?? activeTimeStopId ?? null;

  useEffect(() => {
    onFocusChange?.(focusedStopId);
    return () => onFocusChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedStopId]);

  // isActive가 true->false로 바뀌는 순간(Day가 화면 밖으로 밀려남) 열려있던 팝업들을
  // 닫는다. 렌더링 도중 상태를 조정하는 공식 패턴(prop 변화 감지)을 쓴다 — effect 안에서
  // setState하면 렌더 한 번 더 낭비되고 케스케이드 렌더 린트 경고도 발생하기 때문.
  const [prevIsActive, setPrevIsActive] = useState(isActive);
  if (isActive !== prevIsActive) {
    setPrevIsActive(isActive);
    if (!isActive) {
      setActiveSearchStopId(null);
      setIsAddingNew(false);
      setActiveDetailStopId(null);
      setActiveTimeStopId(null);
      setPopupScrollSpace(0);
    }
  }

  const closeSearch = () => {
    setActiveSearchStopId(null);
    setPopupScrollSpace(0);
  };
  const isFull = stops.length >= MAX_STOPS_PER_DAY;
  const openAddNew = () => {
    if (isFull) return; // "+" 버튼을 이미 숨기지만, 다른 진입 경로 대비 방어적으로 한 번 더 막는다
    setActiveTimeStopId(null);
    setActiveDetailStopId(null);
    setActiveSearchStopId(null);
    setPopupScrollSpace(0);
    setIsAddingNew(true);
  };
  const closeAddNew = () => setIsAddingNew(false);
  const openDetail = (stop: ItineraryStop) => {
    setActiveTimeStopId(null);
    setActiveSearchStopId(null);
    setIsAddingNew(false);
    setPopupScrollSpace(0);
    setActiveDetailStopId(stop.id);
    stop.onClick?.();
  };
  const closeDetail = () => {
    setActiveDetailStopId(null);
    setPopupScrollSpace(0);
  };
  const openTimePicker = (stop: ItineraryStop) => {
    closeSearch();
    closeDetail();
    closeAddNew();
    const [h, m] = stop.time.split(":").map(Number);
    setInlineTimeValue({ hour: h, minute: m });
    setActiveTimeStopId(stop.id);
  };
  const closeTimePicker = () => {
    pendingAutoTimeRef.current = false;
    setActiveTimeStopId(null);
  };
  const pendingAutoTimeRef = useRef(false);
  // 추가 직후 시간 변경 팝업을 곧바로 띄우면 너무 급하게 느껴져서, 처음 한 번만
  // 살짝 텀을 두고 연다 (그 사이 "추가되었어요" 토스트가 먼저 보이도록).
  const autoOpenDelayedRef = useRef(false);
  const handleAddNewPlace = (place: SearchPlace) => {
    pendingAutoTimeRef.current = true;
    autoOpenDelayedRef.current = false;
    onAddNewPlace?.(place);
  };
  useEffect(() => {
    // 추가 직후 임시 id가 실제 id로 교체돼도(같은 길이) 계속 마지막 stop을 기준으로
    // 다시 열어줘야, 그 사이 팝업이 닫혀버리지 않는다. 사용자가 직접 닫거나 확정하면
    // closeTimePicker에서 pendingAutoTimeRef를 꺼서 더 이상 재오픈되지 않게 한다.
    if (!pendingAutoTimeRef.current) return;
    const newest = stops[stops.length - 1];
    if (!newest) return;

    if (!autoOpenDelayedRef.current) {
      autoOpenDelayedRef.current = true;
      const timer = window.setTimeout(() => openTimePicker(newest), 700);
      return () => window.clearTimeout(timer);
    }

    openTimePicker(newest);
    // openTimePicker는 매 렌더마다 새로 만들어져서 참조 자체를 deps에 넣으면 안 됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);
  const confirmInlineTime = (stop: ItineraryStop) => {
    const timeStr = `${String(inlineTimeValue.hour).padStart(2, "0")}:${String(inlineTimeValue.minute).padStart(2, "0")}`;
    stop.onTimeConfirm?.(timeStr);
    closeTimePicker();
  };

  useEffect(() => {
    if (!activePopupStopId) return;
    const el = stopRefs.current.get(activePopupStopId);
    if (!el) return;
    const firstStopEl = stops[0] ? stopRefs.current.get(stops[0].id) : null;
    let scrollParent: HTMLElement | null = el.parentElement;
    while (scrollParent) {
      const ov = getComputedStyle(scrollParent).overflowY;
      if (ov === "scroll" || ov === "auto") break;
      scrollParent = scrollParent.parentElement;
    }
    if (!scrollParent) return;
    const activeTop =
      el.getBoundingClientRect().top -
      scrollParent.getBoundingClientRect().top +
      scrollParent.scrollTop;
    const firstStopTop = firstStopEl
      ? firstStopEl.getBoundingClientRect().top -
        scrollParent.getBoundingClientRect().top +
        scrollParent.scrollTop
      : 40;
    const targetScrollTop = Math.max(0, activeTop - firstStopTop);
    const maxScrollTop = Math.max(0, scrollParent.scrollHeight - scrollParent.clientHeight);
    const maxScrollTopWithoutDynamicSpace = Math.max(0, maxScrollTop - popupScrollSpace);
    const nextPopupScrollSpace = Math.ceil(
      Math.max(0, targetScrollTop - maxScrollTopWithoutDynamicSpace),
    );

    if (nextPopupScrollSpace !== popupScrollSpace) {
      setPopupScrollSpace(nextPopupScrollSpace);
      return;
    }

    isAutoScrollingRef.current = true;
    scrollParent.scrollTo({ top: targetScrollTop, behavior: "smooth" });

    const autoScrollTimer = window.setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 900);
    let closeTimer: number | undefined;

    const handleScroll = () => {
      if (isAutoScrollingRef.current) return;
      if (Math.abs(scrollParent.scrollTop - targetScrollTop) < 90) return;
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => {
        closeSearch();
        closeDetail();
        closeTimePicker();
      }, 250);
    };

    scrollParent.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.clearTimeout(autoScrollTimer);
      window.clearTimeout(closeTimer);
      scrollParent.removeEventListener("scroll", handleScroll);
    };
  }, [activePopupStopId, popupScrollSpace, stops]);

  const handleRootClick = (e: React.MouseEvent) => {
    const target = e.target as Element;
    if (activeSearchStopId) {
      if (searchCardRef.current?.contains(target)) return;
      if (target.closest("[data-time-btn]")) return;
      closeSearch();
    }
    if (isAddingNew) {
      if (addNewCardRef.current?.contains(target)) return;
      closeAddNew();
    }
    if (activeDetailStopId) {
      if (detailCardRef.current?.contains(target)) return;
      closeDetail();
    }
    if (activeTimeStopId) {
      if (timePickerRef.current?.contains(target)) return;
      if (target.closest("[data-time-btn]")) return;
      closeTimePicker();
    }
  };

  const isEmpty = stops.length === 0;

  return (
    <div
      className="relative flex h-full ml-0.5 min-h-0 min-w-0 flex-col overflow-hidden"
      onClick={handleRootClick}
    >
      {" "}
      {!isEmpty && (
        <div className="absolute top-2 bottom-0 left-[45px] w-[2px] rounded-full bg-sub-lightgray" />
      )}
      <div className="relative z-20 shrink-0 bg-system-whitebg py-1">
        <div className="relative flex items-center">
          <div className="w-10 shrink-0" />

          <div className="relative z-10 flex items-center gap-2.5">
            <button
              type="button"
              className={cn(
                "flex size-[18px] shrink-0 -ml-0.5 items-center justify-center rounded-md bg-sub-coral active:opacity-70",
                (activeSearchStopId || isAddingNew || isEmpty || isFull) && "invisible",
              )}
              onClick={openAddNew}
              aria-label="장소 추가"
            >
              <PlusIcon width={18} height={18} className="text-main-white" aria-hidden />
            </button>

            {!isEmpty && date && (
              <span className="text-xs font-semibold text-sub-deepgray">{date}</span>
            )}
          </div>

          {isAddingNew && !isEmpty && (
            <TimelineSearchPopup
              ref={addNewCardRef}
              onClose={closeAddNew}
              onAddToItinerary={handleAddNewPlace}
            />
          )}
        </div>
      </div>
      {isAddingNew && isEmpty && (
        <TimelineSearchPopup
          ref={addNewCardRef}
          onClose={closeAddNew}
          onAddToItinerary={handleAddNewPlace}
          centered
        />
      )}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto pt-3 pb-16 flex flex-col gap-5",
          isEmpty && "h-full",
        )}
        style={{ paddingBottom: popupScrollSpace }}
      >
        {isEmpty && !isAddingNew && (
          <EmptyState
            className="-translate-y-5"
            title="아직 이 날 일정이 없어요"
            description="가고 싶은 관광지를 추가해 일정을 채워보세요!"
            primaryAction={{
              label: "관광지 추가하기",
              onClick: openAddNew,
            }}
          />
        )}

        {!isAddingNew &&
          stops.map((stop) => {
            const isSearchActive = activeSearchStopId === stop.id;
            const isDetailActive = activeDetailStopId === stop.id;
            const isTimeActive = activeTimeStopId === stop.id;
            return (
              <div
                key={stop.id}
                ref={(el) => {
                  if (el) stopRefs.current.set(stop.id, el);
                  else stopRefs.current.delete(stop.id);
                }}
                className="min-w-0"
              >
                <div className="relative flex min-w-0 items-center">
                  <TimelineSearchTrigger
                    time={stop.time}
                    isActive={isSearchActive}
                    isTimeActive={isTimeActive}
                    onTimeClick={() => openTimePicker(stop)}
                  />

                  <div className="relative min-w-0 flex-1 pl-3">
                    {stop.activeEditors && stop.activeEditors.length > 0 && (
                      <div className="absolute -top-1.5 left-1.5 z-10">
                        <CollaboratorBadge editors={stop.activeEditors} />
                      </div>
                    )}
                    <PlaceCard
                      imageUrl={stop.imageUrl}
                      name={stop.placeName}
                      category={stop.category}
                      status={stop.status}
                      onDelete={stop.onDelete}
                      onClick={() => openDetail(stop)}
                      onVerify={stop.onVerify}
                    />
                  </div>

                  {/* 검색 카드 */}
                  {isSearchActive && (
                    <TimelineSearchPopup
                      ref={searchCardRef}
                      onClose={closeSearch}
                      onAddToItinerary={stop.onAddPlace}
                    />
                  )}

                  {/* 관광지 상세 카드 */}
                  {isDetailActive && (
                    <TimelinePlaceDetailPopup
                      ref={detailCardRef}
                      stop={stop}
                      onClose={closeDetail}
                    />
                  )}

                  {/* 시간 변경 카드 */}
                  {isTimeActive && (
                    <TimelineTimePicker
                      ref={timePickerRef}
                      hour={inlineTimeValue.hour}
                      minute={inlineTimeValue.minute}
                      onChange={(h, m) => setInlineTimeValue({ hour: h, minute: m })}
                      onConfirm={() => confirmInlineTime(stop)}
                      onClose={closeTimePicker}
                    />
                  )}
                </div>

                {/* 교통수단 카드 */}
                {stop.transport && (
                  <div className="mt-5 flex min-w-0">
                    <div className="w-16 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <TransportCard {...stop.transport} onLegsClick={stop.onTransportClick} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

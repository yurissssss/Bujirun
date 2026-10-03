"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatTransportDuration } from "@/shared/utils/formatTransportDuration";
import Image from "next/image";
import busIcon from "@/assets/icons/itinerary/bus.svg?url";
import subwayIcon from "@/assets/icons/itinerary/subway.svg?url";
import walkIcon from "@/assets/icons/itinerary/walk.svg?url";
import taxiIcon from "@/assets/icons/itinerary/taxi.svg?url";
import { cn } from "@/shared/utils";
import { useLiveArrivalText } from "@/shared/hooks/useLiveArrivalText";
import type { TransportType } from "@/features/home/types/transport";

// 경로 카드에 그리는 도보 구간 — distanceM이 없으면(도보 거리 저장 전 데이터) min으로 표시
export interface TransportWalk {
  distanceM?: number;
  min?: number;
}

export interface TransportLeg {
  type: TransportType;
  routeName: string;
  from: string;
  to: string;
  // 버스 실시간 도착정보(GET /api/transit/arrival/bus) 폴링용 — 둘 다 있을 때만 실시간 조회
  arsId?: string;
  routeNo?: string;
  // 지하철 도착정보(GET /api/transit/arrival/subway) 폴링용 — 둘 다 있을 때만 조회
  stationId?: number;
  wayCode?: number;
  // 이 구간에서 내린 뒤 걷는 시간(분) — 다음 구간 또는 목적지까지
  walkAfterMin?: number;
  // 출발지 → 이 구간 탑승 전 도보 (첫 구간에만)
  walkBefore?: TransportWalk;
  // 이 구간 하차 → 다음 구간 탑승(환승) 또는 도착지까지 도보
  walkAfter?: TransportWalk;
}

interface TransportCardProps {
  from: string;
  to: string;
  durationMin: number;
  cost?: number;
  legs: TransportLeg[];
  isRecommended?: boolean;
  selected?: boolean;
  disableShadow?: boolean;
  className?: string;
  // 펼친 상태에서 구간 영역(출발 → 구간 → 도착)을 눌렀을 때 — 이동수단 모달 열기
  onLegsClick?: () => void;
}

const TRANSPORT_ICONS: Record<TransportType, string> = {
  버스: busIcon,
  지하철: subwayIcon,
  도보: walkIcon,
  택시: taxiIcon,
};

const TRANSPORT_COLORS: Record<TransportType, string> = {
  버스: "bg-main-blue",
  지하철: "bg-sub-pink",
  도보: "bg-sub-green",
  택시: "bg-sub-violet",
};

const ARRIVAL_VISIBLE_TYPES = ["버스", "지하철"] as const;

function TransportTypeIcon({ type, small }: { type: TransportType; small?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 relative z-10",
        small ? "w-5 h-5 rounded-md" : "w-6 h-6 rounded-lg",
        TRANSPORT_COLORS[type],
      )}
    >
      <Image
        src={TRANSPORT_ICONS[type]}
        alt=""
        width={small ? 12 : 14}
        height={small ? 12 : 14}
        className="brightness-0 invert"
        aria-hidden
      />
    </div>
  );
}

// leg 하나(아이콘 + 노선명/구간 + 실시간 도착 배지)를 그린다. 단일 leg 카드와 다구간
// 카드가 레이아웃만 다르고 내용은 동일해서 공통 컴포넌트로 뺐다 — arsId가 있는 버스,
// stationId가 있는 지하철 leg는 useLiveArrivalText로 30초마다 폴링해 배지에 남은 시간을 보여준다.
function TransportLegRow({ leg }: { leg: TransportLeg }) {
  const { text: arrivalText, refetch, isFetching } = useLiveArrivalText(leg);
  const showArrival =
    !!arrivalText &&
    ARRIVAL_VISIBLE_TYPES.includes(leg.type as (typeof ARRIVAL_VISIBLE_TYPES)[number]);

  const handleArrivalClick = (e: React.MouseEvent) => {
    // TransportCard가 버튼(상세 열기/옵션 선택) 안에 들어가는 경우가 있어, 새로고침
    // 클릭이 그 버튼 클릭으로 번지지 않게 막는다.
    e.stopPropagation();
    refetch();
  };

  return (
    <>
      <div className="mt-2.5 shrink-0">
        <TransportTypeIcon type={leg.type} />
      </div>

      <div className="flex flex-1 items-center justify-between min-w-0 gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-h-6 min-w-0 items-center">
            <span className="min-w-0 truncate font-semibold text-md text-text-heading leading-none">
              {leg.routeName}
            </span>
          </div>
          <span className="font-normal text-xs text-sub-darkgray truncate">
            {leg.from} → {leg.to}
          </span>
          {showArrival && (
            <div
              onClick={handleArrivalClick}
              className={cn(
                "mt-1 flex items-center justify-between rounded-[10px] px-3 py-2 text-sm font-semibold text-main-white cursor-pointer",
                TRANSPORT_COLORS[leg.type],
              )}
            >
              <span>{arrivalText}</span>
              <svg
                viewBox="0 0 512 512"
                className={cn("size-3 fill-main-white", isFetching && "animate-spin")}
                aria-hidden="true"
              >
                <path d="M66.074,228.731C81.577,123.379,179.549,50.542,284.901,66.045c35.944,5.289,69.662,20.626,97.27,44.244l-24.853,24.853c-8.33,8.332-8.328,21.84,0.005,30.17c3.999,3.998,9.423,6.245,15.078,6.246h97.835c11.782,0,21.333-9.551,21.333-21.333V52.39c-0.003-11.782-9.556-21.331-21.338-21.329c-5.655,0.001-11.079,2.248-15.078,6.246L427.418,65.04C321.658-29.235,159.497-19.925,65.222,85.835c-33.399,37.467-55.073,83.909-62.337,133.573c-2.864,17.607,9.087,34.202,26.693,37.066c1.586,0.258,3.188,0.397,4.795,0.417C50.481,256.717,64.002,244.706,66.074,228.731z" />
                <path d="M479.429,256.891c-16.108,0.174-29.629,12.185-31.701,28.16C432.225,390.403,334.253,463.24,228.901,447.738c-35.944-5.289-69.662-20.626-97.27-44.244l24.853-24.853c8.33-8.332,8.328-21.84-0.005-30.17c-3.999-3.998-9.423-6.245-15.078-6.246H43.568c-11.782,0-21.333,9.551-21.333,21.333v97.835c0.003,11.782,9.556,21.331,21.338,21.329c5.655-0.001,11.079-2.248,15.078-6.246l27.733-27.733c105.735,94.285,267.884,85.004,362.17-20.732c33.417-37.475,55.101-83.933,62.363-133.615c2.876-17.605-9.064-34.208-26.668-37.084C482.655,257.051,481.044,256.91,479.429,256.891z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function TransportCard({
  from,
  to,
  durationMin,
  cost,
  legs,
  selected,
  disableShadow,
  className,
  onLegsClick,
}: TransportCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardBase = cn(
    "w-full min-w-0 overflow-hidden rounded-2xl border-[0.5px] border-system-glassborder py-3.5 px-2.5",
    !disableShadow && "shadow-[2px_2px_10px_0px_var(--color-system-glassborder)]",
    selected === false ? "bg-main-white" : "bg-system-navbg",
    className,
  );
  // 도보는 요금이 없으니 "0원"을 붙이지 않는다 — 요금 0 전체를 숨기면 대중교통 요금 누락이 가려진다.
  const isWalkOnly = legs.every((leg) => leg.type === "도보");
  const metaText = `${formatTransportDuration(durationMin)}${cost != null && !isWalkOnly ? ` · ${cost.toLocaleString()}원` : ""}`;
  // 버스/지하철 구간이 없는(택시/도보) 카드는 펼쳐도 헤더와 같은 내용이라 셰브론 없이 접힌 헤더 한 줄만 보여준다.
  const isTransit = legs.some((leg) =>
    ARRIVAL_VISIBLE_TYPES.includes(leg.type as (typeof ARRIVAL_VISIBLE_TYPES)[number]),
  );

  // 단일 leg (환승 없는 버스 등): 점 없이 심플 레이아웃
  const isSimple = legs.length === 1 && !legs[0].walkBefore && !legs[0].walkAfter;

  // 구간이 2개 이상이면 헤더에는 아이콘만 이어 보여주고, 노선명은 스크린리더용으로만 남긴다.
  const showRouteNames = legs.length === 1;

  const summary = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {legs.map((leg, index) => (
          <Fragment key={index}>
            {index > 0 && <span className="shrink-0 text-sm text-sub-gray">›</span>}
            <div className="flex min-w-0 items-center gap-1">
              <TransportTypeIcon type={leg.type} small />
              <span
                className={cn(
                  "min-w-0 truncate font-semibold text-sm text-text-heading",
                  !showRouteNames && "sr-only",
                )}
              >
                {leg.routeName}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      <span className="shrink-0 font-semibold text-xs text-sub-darkgray whitespace-nowrap">
        {metaText}
      </span>
    </>
  );

  if (!isTransit) {
    return (
      <div className={cardBase}>
        <button
          type="button"
          onClick={onLegsClick}
          className="flex w-full min-w-0 items-center gap-2 text-left"
        >
          {summary}
        </button>
      </div>
    );
  }

  return (
    <div className={cardBase}>
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full min-w-0 items-center gap-2 text-left"
      >
        {summary}
        <ChevronDown
          className={cn(
            "size-4.5 shrink-0 text-sub-gray transition-transform",
            isExpanded && "rotate-180",
          )}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>

      {/* 접힌 상태에선 구간 줄을 아예 그리지 않는다 — 실시간 도착정보 폴링(useLiveArrivalText)도 펼쳤을 때만 돈다. */}
      {isExpanded && (
        <button
          type="button"
          onClick={onLegsClick}
          className="mt-3 block w-full min-w-0 text-left animate-fade-in"
        >
          {isSimple ? (
            <div className="flex min-w-0 items-start gap-3">
              <TransportLegRow leg={legs[0]} />
            </div>
          ) : (
            <TransportRouteLegs from={from} to={to} legs={legs} selected={selected} />
          )}
        </button>
      )}
    </div>
  );
}

// 복수 leg (대중교통): 출발·도착 점 + 점선 풀 레이아웃
function TransportRouteLegs({
  from,
  to,
  legs,
  selected,
}: Pick<TransportCardProps, "from" | "to" | "legs" | "selected">) {
  return (
    <div className="relative flex min-w-0 flex-col gap-3">
      <svg
        className="absolute top-[10px] overflow-visible"
        style={{ left: "10.4px", height: "calc(100% - 20px)" }}
        width="1.6"
      >
        <line
          x1="0.8"
          y1="0"
          x2="0.8"
          y2="100%"
          stroke="var(--color-sub-gray)"
          strokeWidth="1.6"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
      </svg>

      {/* 출발 */}
      <div className="flex items-center gap-3">
        <div className="w-6 flex justify-center shrink-0 relative z-10">
          <div
            className="w-3 h-3 rounded-full bg-sub-gray"
            style={{
              boxShadow:
                selected === false
                  ? "0 0 0 3px var(--color-main-white)"
                  : "0 0 0 3px var(--color-system-navbg)",
            }}
          />
        </div>
        <span className="truncate font-semibold text-md text-text-heading">{from}</span>
      </div>

      {legs.map((leg, index) => (
        <div key={index} className="flex items-start gap-3">
          <TransportLegRow leg={leg} />
        </div>
      ))}

      {/* 도착 */}
      <div className="flex items-center gap-3">
        <div className="w-6 flex justify-center shrink-0 relative z-10">
          <div
            className="w-3 h-3 rounded-full bg-sub-gray"
            style={{
              boxShadow:
                selected === false
                  ? "0 0 0 3px var(--color-main-white)"
                  : "0 0 0 3px var(--color-system-navbg)",
            }}
          />
        </div>
        <span className="truncate font-semibold text-md text-text-heading">{to}</span>
      </div>
    </div>
  );
}

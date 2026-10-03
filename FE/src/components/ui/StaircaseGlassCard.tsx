"use client";

import { useRef, useLayoutEffect, useState, useEffect } from "react";

const DEFAULT_OFFSET_X = 56;
const OVERLAP = 8;
const R = 20;

const FONT_CLASS = {
  proup: "font-proup",
  mona: "font-mona",
} as const;

const SIZE_CLASS = {
  xl: {
    text: "text-xl",
    padding: "py-[10px] px-5",
  },
  sm: {
    text: "text-sm",
    padding: "py-2.5 px-4",
  },
} as const;

type StaircaseGlassCardFont = keyof typeof FONT_CLASS;
type StaircaseGlassCardSize = keyof typeof SIZE_CLASS;

type StaircaseGlassCardColor = "default" | "sub-coral" | "sub-deepblue";

const COLOR_CLASS = {
  default: "text-text-heading",
  "sub-coral": "text-sub-coral",
  "sub-deepblue": "text-sub-deepblue",
} as const;

interface StaircaseGlassCardProps {
  line1: string;
  line2: string;
  font?: StaircaseGlassCardFont;
  size?: StaircaseGlassCardSize;
  color?: StaircaseGlassCardColor;
  offsetX?: number;
}

function buildPath(w1: number, h1: number, w2: number, h2: number, offsetX: number): string {
  const oy = h1 - OVERLAP;
  const tw = offsetX + w2;
  const th = oy + h2;
  return [
    `M 0,${R}`,
    `A ${R},${R} 0 0 1 ${R},0`,
    `L ${w1 - R},0`,
    `A ${R},${R} 0 0 1 ${w1},${R}`,
    `L ${w1},${oy}`,
    `L ${tw - R},${oy}`,
    `A ${R},${R} 0 0 1 ${tw},${oy + R}`,
    `L ${tw},${th - R}`,
    `A ${R},${R} 0 0 1 ${tw - R},${th}`,
    `L ${offsetX + R},${th}`,
    `A ${R},${R} 0 0 1 ${offsetX},${th - R}`,
    `L ${offsetX},${h1}`,
    `L ${R},${h1}`,
    `A ${R},${R} 0 0 1 0,${h1 - R}`,
    `Z`,
  ].join(" ");
}

export function StaircaseGlassCard({
  line1,
  line2,
  font = "proup",
  size = "xl",
  color = "default",
  offsetX = DEFAULT_OFFSET_X,
}: StaircaseGlassCardProps) {
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{
    w1: number;
    h1: number;
    w2: number;
    h2: number;
  } | null>(null);

  const fontClassName = FONT_CLASS[font];
  const { text, padding } = SIZE_CLASS[size];
  const colorClassName = COLOR_CLASS[color];

  // 커스텀 폰트가 font-display: swap이라 마운트 시점엔 폴백 폰트로 측정될 수 있음.
  // 폰트 로딩이 끝나면 다시 측정해서 실제 렌더 크기와 맞춘다 (그렇지 않으면 폰트가
  // 늦게 로드되는 실기기에서 텍스트가 말풍선 밖으로 삐져나감).
  const [fontsReady, setFontsReady] = useState(
    () => typeof document === "undefined" || !document.fonts,
  );

  useEffect(() => {
    if (fontsReady) return;
    document.fonts.ready.then(() => setFontsReady(true));
  }, [fontsReady]);

  useLayoutEffect(() => {
    if (!ref1.current || !ref2.current) return;
    setDims({
      w1: ref1.current.offsetWidth,
      h1: ref1.current.offsetHeight,
      w2: ref2.current.offsetWidth,
      h2: ref2.current.offsetHeight,
    });
  }, [line1, line2, fontClassName, padding, text, offsetX, fontsReady]);

  const totalW = dims ? offsetX + dims.w2 : undefined;
  const totalH = dims ? dims.h1 - OVERLAP + dims.h2 : undefined;
  const clipPath = dims
    ? `path('${buildPath(dims.w1, dims.h1, dims.w2, dims.h2, offsetX)}')`
    : undefined;

  return (
    <div className="relative" style={{ width: totalW, height: totalH }}>
      {/* 텍스트 크기 측정용 (화면 밖) */}
      <div
        ref={ref1}
        className={`absolute left-[-9999px] ${padding} whitespace-nowrap`}
        aria-hidden
      >
        <span className={`${fontClassName} ${text}`}>{line1}</span>
      </div>
      <div
        ref={ref2}
        className={`absolute left-[-9999px] ${padding} whitespace-nowrap`}
        aria-hidden
      >
        <span className={`${fontClassName} ${text}`}>{line2}</span>
      </div>

      {dims && clipPath && (
        <>
          {/* backdrop-blur + gradient 단 한 번만 적용 */}
          <div
            className="absolute inset-0 backdrop-blur-[15px] bg-gradient-to-b from-system-glassfrom to-system-glassto opacity-[0.97]"
            style={{ clipPath }}
          />
          <div className={`absolute top-0 left-0 ${padding} whitespace-nowrap`}>
            <span className={`${fontClassName} ${text} ${colorClassName}`}>{line1}</span>
          </div>
          <div
            className={`absolute ${padding} whitespace-nowrap`}
            style={{ top: dims.h1 - OVERLAP, left: offsetX }}
          >
            <span className={`${fontClassName} ${text} ${colorClassName}`}>{line2}</span>
          </div>
        </>
      )}
    </div>
  );
}

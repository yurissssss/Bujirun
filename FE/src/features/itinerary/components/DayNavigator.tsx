import { cn } from "@/shared/utils";

interface DayNavigatorProps {
  totalDays: number;
  currentDay: number;
  onDayChange: (day: number) => void;
}

/**
 * 일차 페이지네이션.
 *
 * 점의 보이는 크기(비활성 9px / 활성 22px)와 간격(gap-5)은 그대로 두고, 실제
 * 터치·클릭 히트 영역만 투명 오버레이(28x44)로 넓힌다 — 9px 점은 모바일에서
 * 좌표로 누르면 거의 안 눌렸다.
 *
 * 오버레이 너비 28px은 "점 지름 9px + 간격 20px = 29px"(이웃 점과의 중심 거리)
 * 보다 1px 작게 잡은 값이다. 이보다 넓히면 옆 날짜의 히트 영역과 겹쳐서 엉뚱한
 * 날짜가 선택된다. 높이는 레이아웃에 영향을 주지 않는 absolute라 44px까지 잡는다.
 */
export function DayNavigator({ totalDays, currentDay, onDayChange }: DayNavigatorProps) {
  return (
    <div
      role="group"
      aria-label="일차 선택"
      className="flex items-center justify-center gap-5 pt-2 pb-1.5"
    >
      {Array.from({ length: totalDays }).map((_, i) => {
        const isCurrent = i === currentDay;
        return (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}일차`}
            aria-current={isCurrent ? "true" : undefined}
            className={cn(
              "relative rounded-full",
              isCurrent
                ? "flex size-[22px] items-center justify-center bg-main-blue"
                : "size-[9px] bg-system-scroll",
            )}
            onClick={() => onDayChange(i)}
          >
            {isCurrent && (
              <span className="font-proup text-sm font-normal text-main-white">{i + 1}</span>
            )}
            {/* 점 크기·간격은 건드리지 않고 히트 영역만 넓히는 투명 오버레이 */}
            <span
              aria-hidden
              className="absolute top-1/2 left-1/2 h-11 w-7 -translate-x-1/2 -translate-y-1/2"
            />
          </button>
        );
      })}
    </div>
  );
}

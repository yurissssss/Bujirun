import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/shared/utils";
import { TimeWheelColumn, TIME_WHEEL_HOURS, TIME_WHEEL_MINUTES } from "./TimeWheelColumn";

// TimelineTimePicker(24px)보다 더 작게 — 여행 생성/수정 팝업 전체를 컴팩트하게 유지하기 위함.
const TRIP_WHEEL_ITEM_HEIGHT = 20;

interface TripDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  minValue?: string;
  maxValue?: string;
  className?: string;
  // 날짜는 고정하고 시간만 바꿔야 하는 경우 사용한다.
  lockDate?: boolean;
  // min/max를 벗어난 값을 선택/입력하려고 했을 때 알려준다. 안쪽 값은 자동으로
  // min/max에 맞춰 잘리므로(clamp), 이건 어디까지나 "왜 이 값으로 바뀌었는지" 안내용.
  onInvalidSelect?: (reason: "min" | "max") => void;
}

const pad = (value: number) => String(value).padStart(2, "0");

export const parseTripDateTime = (value: string) => {
  const [datePart, timePart = "00:00"] = value.split(" ");
  const [year, month, day] = datePart.split(".").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute);
};

export const formatTripDateTime = (date: Date) =>
  `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;

// "YYYY.MM.DD HH:mm" -> "YYYY-MM-DD" (백엔드 date 파라미터 포맷)
export const toApiDate = (value: string) => value.split(" ")[0].replaceAll(".", "-");

// 당일치기(숙박 0일) 여행에서 시작과 종료 사이에 최소한 남겨두는 간격.
export const MIN_TRIP_DURATION_MINUTES = 60;

// 시작 시각과 숙박 수가 정해지면 종료 시각이 그보다 앞설 수 없는 하한이 생긴다.
// - 숙박이 있으면 종료 날짜가 이미 하루 이상 뒤라서 시간은 자유롭게(그 날 자정부터) 고를 수 있다.
// - 당일치기면 같은 날 안에서 최소 MIN_TRIP_DURATION_MINUTES만큼은 뒤여야 한다. 단, 날짜가
//   다음 날로 넘어가면 "여행 일수 유지" 규칙이 깨지므로 그 날 마지막으로 고를 수 있는
//   시각(시간 휠의 마지막 분 단위)까지만 민다.
export const getMinTripEndDateTime = (startValue: string, nights: number) => {
  const minEnd = parseTripDateTime(startValue);

  if (nights > 0) {
    minEnd.setDate(minEnd.getDate() + nights);
    minEnd.setHours(0, 0, 0, 0);
    return formatTripDateTime(minEnd);
  }

  const lastSlotOfDay = new Date(minEnd);
  lastSlotOfDay.setHours(23, TIME_WHEEL_MINUTES[TIME_WHEEL_MINUTES.length - 1], 0, 0);
  minEnd.setMinutes(minEnd.getMinutes() + MIN_TRIP_DURATION_MINUTES);

  return formatTripDateTime(minEnd > lastSlotOfDay ? lastSlotOfDay : minEnd);
};

const getCalendarDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  return [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: lastDate }, (_, index) => index + 1),
  ];
};

const isBeforeMinute = (date: Date, target: Date) =>
  date.getTime() < new Date(target).setSeconds(0, 0);

const isAfterMinute = (date: Date, target: Date) =>
  date.getTime() > new Date(target).setSeconds(0, 0);

export function TripDateTimePicker({
  value,
  onChange,
  minValue,
  maxValue,
  className,
  lockDate = false,
  onInvalidSelect,
}: TripDateTimePickerProps) {
  const selectedDate = parseTripDateTime(value);
  const minDate = minValue ? parseTripDateTime(minValue) : null;
  const maxDate = maxValue ? parseTripDateTime(maxValue) : null;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const [calendarMonth, setCalendarMonth] = useState(() => parseTripDateTime(value));
  // 날짜부터 고르고 나서야 시간 휠이 나타나게 한다 — 열자마자 달력+시간이 한꺼번에
  // 보이는 것보다, 한 단계씩 진행되는 편이 더 명확하다. 팝업 열 때마다 다시 접어둔다.
  const [showTimeWheel, setShowTimeWheel] = useState(false);
  const calendarDays = getCalendarDays(calendarMonth);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return;

      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // 트리거 위치를 한 번 계산해 고정하는 방식이라, 열려있는 동안 뒤 화면이
  // 스크롤되면 팝업이 트리거와 어긋나 보인다. 매 스크롤마다 다시 계산해 따라
  // 움직이게 하는 대신, 그냥 닫아버린다.
  // 단, 시간 휠(TimeWheelColumn)도 내부적으로 overflow-y-scroll이라 스크롤 이벤트가
  // 나는데, 팝업 안쪽 스크롤까지 "바깥 스크롤"로 잡아버리면 시간을 고르려고 휠을
  // 돌리자마자 팝업이 닫혀버린다 — 팝업 내부에서 난 스크롤은 무시한다.
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (event: Event) => {
      const target = event.target as Node;
      if (popupRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [isOpen]);

  const applyDate = (date: Date) => {
    if (minDate && isBeforeMinute(date, minDate)) {
      onChange(formatTripDateTime(minDate));
      onInvalidSelect?.("min");
      return;
    }
    if (maxDate && isAfterMinute(date, maxDate)) {
      onChange(formatTripDateTime(maxDate));
      onInvalidSelect?.("max");
      return;
    }

    onChange(formatTripDateTime(date));
  };
  const updatePopupPosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    const appRoot = document.getElementById("app-root");

    if (!rect || !appRoot) return;

    const rootRect = appRoot.getBoundingClientRect();
    const popupWidth = popupRef.current?.offsetWidth ?? 220;
    const popupHeight = popupRef.current?.offsetHeight ?? 240;
    const margin = 8;
    const gap = 8;
    const centeredLeft = rect.left + rect.width / 2 - popupWidth / 2;
    const minLeft = rootRect.left + margin;
    const maxLeft = rootRect.right - popupWidth - margin;
    const left = Math.min(Math.max(centeredLeft, minLeft), maxLeft);
    const top = Math.max(rootRect.top + margin, rect.top - popupHeight - gap);

    setPopupPos({ top, left });
  }, []);
  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePopupPosition();
  }, [isOpen, updatePopupPosition, value, showTimeWheel]);
  const openPicker = () => {
    const targetDate = parseTripDateTime(value);

    updatePopupPosition();
    setIsOpen(true);
    setShowTimeWheel(lockDate);
    setCalendarMonth(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
  };
  const moveCalendarMonth = (amount: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };
  const handleDateSelect = (day: number) => {
    // 날짜만 옮겨도 이미 정해둔 시간은 그대로 이어받는다. 예전엔 00:00으로 초기화했는데
    // (시간을 별도 단계로 다시 고르게 하려던 의도), 시간을 다시 안 고르고 저장하면 여행
    // 시작/종료 시각이 자정으로 덮여 마지막 날 일정이 전부 00:00으로 뭉개졌다.
    const current = parseTripDateTime(value);
    applyDate(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth(),
        day,
        current.getHours(),
        current.getMinutes(),
      ),
    );
    setShowTimeWheel(true);
  };
  const isDisabledDate = (day: number) =>
    Boolean(
      (minDate &&
        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day, 23, 59).getTime() <
          minDate.getTime()) ||
      (maxDate &&
        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day, 0, 0).getTime() >
          maxDate.getTime()),
    );
  const handleHourWheelChange = (nextHour: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setHours(nextHour);
    applyDate(nextDate);
  };
  const handleMinuteWheelChange = (nextMinute: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setMinutes(nextMinute);
    applyDate(nextDate);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPicker}
        className={cn(
          "h-[27px] w-[160px] rounded-lg border-[0.5px] border-sub-lightblue bg-main-blue/20 px-3 text-left text-2xs font-light text-text-primary outline-none",
          className,
        )}
      >
        {value}
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          className="fixed z-50 w-[168px] rounded-xl border-[0.5px] border-sub-lightblue bg-main-white/95 p-1.5 backdrop-blur-[12px]"
          style={{ top: popupPos.top, left: popupPos.left }}
        >
          {!lockDate && (
            <>
              <div className="mb-1 flex items-center justify-between">
                <button
                  type="button"
                  aria-label="이전 달"
                  className="flex size-5 items-center justify-center text-sm font-bold text-text-primary active:opacity-70"
                  onClick={() => moveCalendarMonth(-1)}
                >
                  &lt;
                </button>
                <span className="font-ssurround text-xs font-bold text-text-heading">
                  {calendarMonth.getFullYear()}.{pad(calendarMonth.getMonth() + 1)}
                </span>
                <button
                  type="button"
                  aria-label="다음 달"
                  className="flex size-5 items-center justify-center text-sm font-bold text-text-primary active:opacity-70"
                  onClick={() => moveCalendarMonth(1)}
                >
                  &gt;
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center font-paperlogy text-2xs font-medium text-sub-gray">
                {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, index) => {
                  if (!day) return <span key={`empty-${index}`} />;

                  const isSelected =
                    selectedDate.getFullYear() === calendarMonth.getFullYear() &&
                    selectedDate.getMonth() === calendarMonth.getMonth() &&
                    selectedDate.getDate() === day;
                  const isDisabled = isDisabledDate(day);

                  return (
                    <button
                      type="button"
                      key={day}
                      disabled={isDisabled}
                      className={`h-4 font-paperlogy text-2xs font-medium active:opacity-70 ${
                        isDisabled
                          ? "text-sub-lightgray"
                          : isSelected
                            ? "rounded-md bg-main-blue text-main-white"
                            : "text-text-primary"
                      }`}
                      onClick={() => handleDateSelect(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {showTimeWheel && (
            <div className="relative mt-1.5 rounded-lg border-[0.5px] border-sub-lightblue bg-main-blue/10 px-2 py-1">
              {/* 가운데(선택된) 줄 강조 바 — TimelineTimePicker와 같은 방식 */}
              <div
                className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-md bg-main-blue/15"
                style={{ height: TRIP_WHEEL_ITEM_HEIGHT }}
                aria-hidden
              />
              <div className="relative flex items-center justify-center">
                <TimeWheelColumn
                  items={TIME_WHEEL_HOURS}
                  selected={selectedDate.getHours()}
                  onSelect={handleHourWheelChange}
                  itemHeight={TRIP_WHEEL_ITEM_HEIGHT}
                  visibleCount={3}
                  compact
                />
                <span className="px-0 font-ssurround text-xs font-bold text-sub-gray">:</span>
                <TimeWheelColumn
                  items={TIME_WHEEL_MINUTES}
                  selected={selectedDate.getMinutes()}
                  onSelect={handleMinuteWheelChange}
                  itemHeight={TRIP_WHEEL_ITEM_HEIGHT}
                  visibleCount={3}
                  compact
                />
              </div>
            </div>
          )}
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              className="h-6 rounded-lg border-[0.5px] border-main-blue font-ssurround text-2xs font-bold text-main-blue active:opacity-70"
              onClick={() => setIsOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              className="h-6 rounded-lg bg-main-blue font-ssurround text-2xs font-bold text-main-white active:opacity-70"
              onClick={() => setIsOpen(false)}
            >
              완료
            </button>
          </div>
        </div>
      )}
    </>
  );
}

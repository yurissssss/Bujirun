import type { ItineraryStop } from "./ItineraryTimeline";
import { ItineraryTimeline } from "./ItineraryTimeline";
import type { SearchPlace } from "../../../components/place/PlaceSearchPanel";
import { DayNavigator } from "./DayNavigator";

interface SlidingTimelineProps {
  allDayStops: ItineraryStop[][];
  currentDay: number;
  tripDates: string[];
  onAddNewPlace: (dayIdx: number, place: SearchPlace) => void;
  onDayChange: (day: number) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onFocusChange?: (dayIdx: number, stopId: string | null) => void;
}

export function SlidingTimeline({
  allDayStops,
  currentDay,
  tripDates,
  onAddNewPlace,
  onDayChange,
  onTouchStart,
  onTouchEnd,
  onFocusChange,
}: SlidingTimelineProps) {
  return (
    <div className="-ml-6 flex-1 overflow-hidden">
      <div
        className="flex h-full transition-transform duration-300 ease-in-out will-change-transform"
        style={{ transform: `translateX(-${currentDay * 100}%)` }}
      >
        {allDayStops.map((dayStops, dayIdx) => (
          <div
            key={dayIdx}
            className="box-border flex w-full min-w-0 h-full shrink-0 flex-col"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="min-h-0 flex-1 overflow-hidden pl-3 pr-1 pb-4">
              <ItineraryTimeline
                stops={dayStops}
                date={tripDates[dayIdx]}
                onAddNewPlace={(place) => onAddNewPlace(dayIdx, place)}
                onFocusChange={(stopId) => onFocusChange?.(dayIdx, stopId)}
                isActive={dayIdx === currentDay}
              />
            </div>
            {/* 관광지 수에 따라 타임라인 길이는 자연스럽게 유지하되,
                페이지네이션은 항상 화면 맨 아래에 고정해 위치가 들쭉날쭉하지 않게 한다. */}
            <DayNavigator
              totalDays={allDayStops.length}
              currentDay={currentDay}
              onDayChange={onDayChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

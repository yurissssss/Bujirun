"use client";

import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getItineraries, getItinerary, keys } from "@/shared/api/domains/itinerary";
import { getNearestItineraryDay } from "@/features/home/utils/getNearestItineraryDay";
import { resolveDayDate } from "@/shared/utils/resolveDayDate";

export function useTodayItinerary() {
  const itinerariesQuery = useQuery({
    queryKey: keys.lists(),
    queryFn: getItineraries,
  });

  const itineraries = itinerariesQuery.data ?? [];
  const [now] = useState(() => Date.now());

  const itineraryQueries = useQueries({
    queries: itineraries
      .filter(
        (
          itinerary,
        ): itinerary is typeof itinerary & {
          id: string;
        } => Boolean(itinerary.id),
      )
      .map((itinerary) => ({
        queryKey: keys.detail(itinerary.id),
        queryFn: () => getItinerary(itinerary.id),
      })),
  });

  const nearestSchedule = useMemo(() => {
    const schedules = itineraryQueries.flatMap((query) => {
      const itinerary = query.data;

      if (!itinerary) {
        return [];
      }

      // scheduleUtils.mapItineraryDetailToDays와 동일한 기준(dayNumber 정렬 + startAt
      // fallback)으로 날짜를 구해야 일정 탭과 홈의 "오늘의 일정"이 어긋나지 않는다.
      const sortedDays = [...(itinerary.days ?? [])].sort(
        (a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0),
      );

      return sortedDays.flatMap((day, dayIdx) => {
        const date = resolveDayDate(day.date, dayIdx, itinerary.startAt);
        if (!date) return [];
        return [{ itinerary, day, date }];
      });
    });

    return getNearestItineraryDay<(typeof schedules)[number]>(schedules);
  }, [itineraryQueries]);

  const completedItineraries = useMemo(() => {
    return itineraryQueries
      .flatMap((query) => {
        const itinerary = query.data;

        if (!itinerary?.id || !itinerary.endAt) {
          return [];
        }

        const endAt = new Date(itinerary.endAt).getTime();

        if (Number.isNaN(endAt) || endAt > now) {
          return [];
        }

        return [
          {
            itinerary: {
              ...itinerary,
              id: itinerary.id,
            },
            endAt,
          },
        ];
      })
      .sort((a, b) => b.endAt - a.endAt)
      .map(({ itinerary }) => itinerary);
  }, [itineraryQueries, now]);

  const items = useMemo(
    () =>
      [...(nearestSchedule?.day.items ?? [])].sort(
        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
      ),
    [nearestSchedule],
  );

  const isDetailLoading = itineraryQueries.some((query) => query.isLoading);

  const detailErrorQuery = itineraryQueries.find((query) => query.isError);

  return {
    itinerary: nearestSchedule?.itinerary,
    completedItineraries,
    day: nearestSchedule?.day,
    // day.date는 백엔드가 비워서 내려줄 수 있어(fallback 대상) 화면 표시는 이 값을 써야 한다.
    date: nearestSchedule?.date,
    items,
    hasSchedule: Boolean(nearestSchedule),
    isLoading: itinerariesQuery.isLoading || isDetailLoading,
    isError: itinerariesQuery.isError || Boolean(detailErrorQuery),
    error: itinerariesQuery.error ?? detailErrorQuery?.error,
  };
}

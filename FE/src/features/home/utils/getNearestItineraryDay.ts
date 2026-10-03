interface DatedItineraryItem {
  date: string;
}

function getDateValue(date: string) {
  return new Date(`${date}T00:00:00`).getTime();
}

export function getNearestItineraryDay<T extends DatedItineraryItem>(
  days: readonly T[],
  baseDate = new Date(),
) {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);

  const todayValue = today.getTime();
  let nearest: T | undefined;
  let nearestValue = Infinity;
  // 같은 날짜는 원래 배열에서 먼저 나온 항목을 유지한다(기존 stable sort와 동일).
  for (const day of days) {
    const value = getDateValue(day.date);
    if (value >= todayValue && value < nearestValue) {
      nearest = day;
      nearestValue = value;
    }
  }
  return nearest;
}

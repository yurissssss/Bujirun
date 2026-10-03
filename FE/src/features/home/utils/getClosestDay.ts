import type { DaySchedule, LogDetail } from "@/features/home/data/sampleLogs";

function parseScheduleDate(date: string) {
  const normalizedDate = date.replaceAll(".", "-");
  const parsedDate = new Date(normalizedDate);

  parsedDate.setHours(0, 0, 0, 0);

  return parsedDate;
}

interface ClosestDayResult {
  log: LogDetail;
  day: DaySchedule;
}

export function getClosestDay(logs: LogDetail[]): ClosestDayResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allDays = logs.flatMap((log) => log.days.map((day) => ({ log, day })));

  const upcomingDays = allDays.filter(({ day }) => {
    const dayDate = parseScheduleDate(day.date);

    return dayDate.getTime() >= today.getTime();
  });

  const targetDays = upcomingDays.length > 0 ? upcomingDays : allDays;

  return targetDays.reduce((closest, current) => {
    const closestDate = parseScheduleDate(closest.day.date);
    const currentDate = parseScheduleDate(current.day.date);

    return currentDate.getTime() < closestDate.getTime() ? current : closest;
  });
}

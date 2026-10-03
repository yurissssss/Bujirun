// 일정의 N번째 날(dayIdx, 0-based, dayNumber 정렬 기준)이 실제로 며칠인지 구한다.
//
// 기준은 일정의 startAt이다 — day.date가 아니라. 여행 기간을 수정해도 백엔드가
// itinerary.startAt/endAt만 옮기고 각 day의 date는 예전 날짜로 남겨두기 때문에
// (2026-09-06 라이브 확인: 기간을 09.25~09.26으로 바꿔도 days[].date는 08.30/08.31),
// day.date를 그대로 믿으면 일정 탭 타임라인과 홈의 "오늘의 일정"이 수정 전 날짜를
// 계속 보여준다. 여행 일수는 수정해도 유지되므로(일정 수정 모달 안내 문구 참고)
// startAt + dayIdx가 항상 그 날의 날짜다.
//
// startAt이 없는 응답(구버전/부분 응답)에서만 day.date로 되돌아간다.
// 일정 탭(scheduleUtils)과 홈 탭(useTodayItinerary) 양쪽이 이 함수를 함께 써야
// 두 화면의 날짜가 어긋나지 않는다.
export function resolveDayDate(
  rawDate: string | undefined,
  dayIdx: number,
  startAt?: string,
): string {
  const [year, month, dayNum] = (startAt ?? "").split("-").map(Number);
  if (!year || !month || !dayNum) return rawDate ?? "";

  const date = new Date(year, month - 1, dayNum + dayIdx);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

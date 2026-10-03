// 초대 링크/공유 문구에서 여행 기간을 "2026.09.02 ~ 2026.09.04 · 2박 3일"로 만든다.
// 초대 화면(/join)과 카카오 공유 문구가 같은 표기를 쓰도록 한곳에 모아둔다.

// "YYYY-MM-DD" → "YYYY.MM.DD". 형식이 다르면 원본을 그대로 보여준다.
export function formatInviteDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${year}.${month}.${day}`;
}

// 날짜가 없으면(구버전 링크) 아무것도 렌더하지 않도록 빈 문자열을 돌려준다.
export function formatTripPeriod(startDate?: string, endDate?: string, days?: string): string {
  if (!startDate || !endDate) return "";
  const range = `${formatInviteDate(startDate)} ~ ${formatInviteDate(endDate)}`;
  const dayCount = Number(days);
  if (!Number.isFinite(dayCount) || dayCount < 1) return range;
  if (dayCount === 1) return `${range} · 당일치기`;
  return `${range} · ${dayCount - 1}박 ${dayCount}일`;
}

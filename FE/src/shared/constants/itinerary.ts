// 일정 탭에서 마지막으로 본 여행 id. 일정 화면이 열릴 때마다 갱신되고, 여행을 지정하지
// 않고 일정 화면으로 돌아오는 경로(로그 담기 등)에서 "어느 여행이었는지"를 복원하는 데 쓴다.
export const LAST_VIEWED_ITINERARY_KEY = "bujirun:last-viewed-itinerary-id";
export const LAST_VIEWED_ITINERARY_EVENT = "bujirun:last-viewed-itinerary-change";

export function getLastViewedItineraryId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_VIEWED_ITINERARY_KEY);
  } catch {
    return null;
  }
}

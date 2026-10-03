const SKIPPED_REVIEW_KEY = "bujirun_skipped_review_itinerary_ids";

// 완료된 여행 일정에 대한 영수증 발행 팝업(/home/review)을 "취소"로 닫으면 여기 기록해서,
// 영수증이 아직 없다는 이유로 다음 홈 진입 때 같은 팝업으로 다시 튕겨 들어오지 않게 한다
// (TodayItinerary.tsx의 자동 리다이렉트 useEffect가 이 목록을 참고).
//
// 취소는 서버에도 "다시 묻지 않음"(POST /api/logs/receipt-prompt/{itineraryId}/dismiss)으로
// 저장되고 /api/logs/exists의 promptDismissed로 다시 내려오므로, 기기를 바꾸거나 여기 값이
// 지워져도 팝업은 다시 뜨지 않는다. 이 목록은 그 요청이 실패했거나 아직 응답을 다시 받지
// 못한 사이(취소 직후 홈 복귀)를 메우는 로컬 캐시 역할이다.
function readSkippedIds(): string[] {
  const raw = window.localStorage.getItem(SKIPPED_REVIEW_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function isReviewSkipped(itineraryId: string): boolean {
  return readSkippedIds().includes(itineraryId);
}

export function skipReview(itineraryId: string): void {
  const ids = readSkippedIds();
  if (ids.includes(itineraryId)) return;
  window.localStorage.setItem(SKIPPED_REVIEW_KEY, JSON.stringify([...ids, itineraryId]));
}

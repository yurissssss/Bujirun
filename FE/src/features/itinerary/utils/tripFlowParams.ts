// 취향분석 대기 → 결과(투표) 화면으로 넘길 쿼리. 대기 화면과 방장 타임아웃 모달이 같은
// 값을 써야 결과 화면이 같은 조건(인원/날짜/시간/숙소)으로 일정을 불러온다.
export function buildTripResultQuery(searchParams: Pick<URLSearchParams, "get">): string {
  const totalSlots = Math.min(6, Math.max(2, Number(searchParams.get("count")) || 6));
  const accommodation = searchParams.get("accommodation") ?? "";
  const accommodationAddress = searchParams.get("accommodationAddress") ?? "";
  const accommodationLat = searchParams.get("accommodationLat") ?? "";
  const accommodationLng = searchParams.get("accommodationLng") ?? "";
  return new URLSearchParams({
    count: String(totalSlots),
    days: searchParams.get("days") ?? "1",
    groupId: searchParams.get("groupId") ?? "",
    name: searchParams.get("name") ?? "",
    startDate: searchParams.get("startDate") ?? "",
    endDate: searchParams.get("endDate") ?? "",
    startTime: searchParams.get("startTime") ?? "",
    endTime: searchParams.get("endTime") ?? "",
    ...(accommodation ? { accommodation } : {}),
    ...(accommodationAddress ? { accommodationAddress } : {}),
    ...(accommodationLat ? { accommodationLat } : {}),
    ...(accommodationLng ? { accommodationLng } : {}),
  }).toString();
}

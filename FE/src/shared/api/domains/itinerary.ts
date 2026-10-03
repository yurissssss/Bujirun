import { apiClient } from "@/shared/api/client";
import { unwrap } from "@/shared/api/response";
import type { OpBody, OpResponse } from "@/shared/api/types";

export const keys = {
  all: ["itineraries"] as const,
  lists: () => [...keys.all, "list"] as const,
  detail: (id: string) => [...keys.all, "detail", id] as const,
  groupGenerate: (groupId: string, startDate: string, endDate: string) =>
    [...keys.all, "group-generate", groupId, startDate, endDate] as const,
  voteStatus: (sessionId: string) => [...keys.all, "vote-status", sessionId] as const,
  travelModeOptions: (itineraryId: string, dayId: string, itemId: string) =>
    [...keys.all, "travel-mode-options", itineraryId, dayId, itemId] as const,
};

export function getItineraries() {
  return apiClient.get<OpResponse<"getList">>("/api/itineraries").then((res) => unwrap(res));
}

export function getItinerary(id: string) {
  return apiClient.get<OpResponse<"getById">>(`/api/itineraries/${id}`).then((res) => unwrap(res));
}

export function createItinerary(body: OpBody<"create_1">) {
  return apiClient
    .post<OpResponse<"create_1">>("/api/itineraries", body)
    .then((res) => unwrap(res));
}

export function updateItinerary(id: string, body: OpBody<"update_1">) {
  return apiClient
    .patch<OpResponse<"update_1">>(`/api/itineraries/${id}`, body)
    .then((res) => unwrap(res));
}

// 개인 일정 전용. 그룹 일정에 호출하면 400("그룹 일정은 삭제 대신 나가기를 사용해주세요.")이 온다.
export function deleteItinerary(id: string) {
  return apiClient.delete(`/api/itineraries/${id}`);
}

// 그룹 일정 나가기. 나가도 다른 그룹원에게는 일정이 그대로 남고, 혼자 남은 상태에서
// 나가면 그룹과 일정이 함께 삭제된다. 개인 일정에 호출하면 400.
export function leaveItinerary(id: string) {
  return apiClient.post(`/api/itineraries/${id}/leave`);
}

export function addDay(itineraryId: string, body: OpBody<"addDay">) {
  return apiClient
    .post<OpResponse<"addDay">>(`/api/itineraries/${itineraryId}/days`, body)
    .then((res) => unwrap(res));
}

export function deleteDay(itineraryId: string, dayId: string) {
  return apiClient.delete(`/api/itineraries/${itineraryId}/days/${dayId}`);
}

// 좌표 기반 동선 재정렬 + 운영시간 반영. PATCH라 서버에 바로 반영되며,
// 재정렬된 spots/routes를 응답으로 돌려준다. 호출부(itinerary/page.tsx)가
// res.data.spots 형태로 쓰므로 unwrap하지 않고 envelope째로 반환한다.
export function optimizeDay(dayId: string, body: OpBody<"optimize">) {
  return apiClient
    .patch<OpResponse<"optimize">>(`/api/itineraries/days/${dayId}/optimize`, body)
    .then((res) => res.data);
}

export function addItem(itineraryId: string, dayId: string, body: OpBody<"addItem">) {
  return apiClient
    .post<OpResponse<"addItem">>(`/api/itineraries/${itineraryId}/days/${dayId}/items`, body)
    .then((res) => unwrap(res));
}

export function updateItem(
  itineraryId: string,
  dayId: string,
  itemId: string,
  body: OpBody<"updateItem">,
) {
  return apiClient
    .patch<
      OpResponse<"updateItem">
    >(`/api/itineraries/${itineraryId}/days/${dayId}/items/${itemId}`, body)
    .then((res) => unwrap(res));
}

export function deleteItem(itineraryId: string, dayId: string, itemId: string) {
  return apiClient.delete(`/api/itineraries/${itineraryId}/days/${dayId}/items/${itemId}`);
}

// 일차(day)에 속한 방문 항목 전체의 순서를 한 번에 원자적으로 반영한다. itemIds는 그 일차에
// 존재하는 항목 id 전체를 원하는 순서대로 담아야 한다(부분 목록 불가). expectedVersion이
// 서버의 현재 값과 다르면 409(내용이 다른 동시 편집과 충돌)가 온다 — 응답 바디에 최신 day
// 상태가 실려 있어 호출부가 추가 조회 없이 reconcile할 수 있다.
export function reorderItems(
  itineraryId: string,
  dayId: string,
  itemIds: string[],
  expectedVersion?: number,
) {
  const body: OpBody<"reorderItems"> = { itemIds, expectedVersion };
  return apiClient
    .patch<
      OpResponse<"reorderItems">
    >(`/api/itineraries/${itineraryId}/days/${dayId}/items/order`, body)
    .then((res) => unwrap(res));
}

// 일차의 방문 항목 전체를 한 번의 원자적 요청으로 교체한다. 개별 add/delete를 여러 번
// 나눠 보내면 여러 클라이언트가 동시에 같은 변경을 재전송할 때 일부만 반영되고 나머지가
// 유실될 수 있어(2026-09-16 실제 사고) 도입됨. operationId가 같은 요청을 다시 보내면
// 서버가 재처리 없이 첫 요청의 결과를 그대로 돌려준다(멱등) — 같은 논리적 편집을 재시도할
// 때는 반드시 같은 operationId를 재사용해야 한다.
export function replaceDayItems(
  itineraryId: string,
  dayId: string,
  body: OpBody<"replaceDayItems">,
) {
  return apiClient
    .put<OpResponse<"replaceDayItems">>(`/api/itineraries/${itineraryId}/days/${dayId}/items`, body)
    .then((res) => unwrap(res));
}

// 사용자가 이동수단을 직접 선택했을 때 실제 경로(역명/노선번호 등)를 재계산해서 돌려받는다.
export function updateTravelMode(
  itineraryId: string,
  dayId: string,
  itemId: string,
  body: OpBody<"updateTravelMode">,
) {
  return apiClient
    .patch<
      OpResponse<"updateTravelMode">
    >(`/api/itineraries/${itineraryId}/days/${dayId}/items/${itemId}/travel-mode`, body)
    .then((res) => unwrap(res));
}

// 이동수단 변경 모달을 열 때, 확정 전 후보(지하철 전용/버스 전용/버스+지하철 조합/도보/택시)와
// 각각의 실제 요금·소요시간을 조회한다. DB에 저장된 값이 아니라 매번 새로 계산된 값.
export function getTravelModeOptions(itineraryId: string, dayId: string, itemId: string) {
  return apiClient
    .get<
      OpResponse<"getTravelModeOptions">
    >(`/api/itineraries/${itineraryId}/days/${dayId}/items/${itemId}/travel-mode/options`)
    .then((res) => unwrap(res));
}

// OpenAI + ODsay + 버스도착정보를 스팟마다 순차 호출해 16~24초까지 걸리므로
// 전역 타임아웃(10초)보다 넉넉하게 잡는다.
const GENERATE_TIMEOUT_MS = 60_000;

// group-itinerary-controller: 그룹원들의 투표/선호를 모아 일정을 생성
export function generateGroupItinerary(groupId: string, body: OpBody<"generate">) {
  return apiClient
    .post<OpResponse<"generate">>(`/api/itineraries/group/${groupId}/generate`, body, {
      timeout: GENERATE_TIMEOUT_MS,
    })
    .then((res) => unwrap(res));
}

// A/B/C안 중 하나에 투표
export function castVote(sessionId: string, body: OpBody<"castVote">) {
  return apiClient
    .post<OpResponse<"castVote">>(`/api/itineraries/vote-sessions/${sessionId}/votes`, body)
    .then((res) => unwrap(res));
}

// 투표 현황(안별 득표수/총 투표수) 조회
// operationId가 스와이프 상태 조회(getStatus)와 겹쳐서 codegen이 getStatus_1로 분리함.
// 백엔드가 operationId를 고유하게 바꿔주면 이 부분도 다시 getStatus로 돌아올 수 있음.
export function getVoteStatus(sessionId: string) {
  return apiClient
    .get<OpResponse<"getStatus_1">>(`/api/itineraries/vote-sessions/${sessionId}`)
    .then((res) => unwrap(res));
}

// 일정 확정 (리더 전용). freePass=true면 투표 결과와 무관하게 selectedPlan으로 즉시 확정.
export function finalizeItinerary(sessionId: string, body: OpBody<"finalize">) {
  return apiClient
    .post<OpResponse<"finalize">>(`/api/itineraries/vote-sessions/${sessionId}/finalize`, body)
    .then((res) => unwrap(res));
}

// itinerary-generate-controller: 스와이프 선호 기반 개인 일정 생성
export function generateItinerary(body: OpBody<"generateItinerary">) {
  return apiClient
    .post<OpResponse<"generateItinerary">>("/api/itineraries/generate", body, {
      timeout: GENERATE_TIMEOUT_MS,
    })
    .then((res) => unwrap(res));
}

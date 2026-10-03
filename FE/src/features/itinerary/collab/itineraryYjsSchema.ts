import * as Y from "yjs";
import type { BaseStop } from "@/features/itinerary/utils/scheduleUtils";
import {
  minutesToTime,
  rebuildTransport,
  roundToNearest10,
  timeToMinutes,
  toHourMinute,
} from "@/features/itinerary/utils/scheduleUtils";

const DAYS_KEY = "days";
const META_KEY = "meta";
const ACTIVITY_LOG_KEY = "activityLog";
// 활동 로그 상한 / 상한 초과 시 한 번에 잘라내는 개수. 왜 이런 형태인지는 logActivity 주석 참고
// (관찰자가 "배열 길이 증가"로 신규를 판별하므로, 길이를 한 값에 고정하면 알림이 영구 정지한다).
const ACTIVITY_LOG_HARD_LIMIT = 2000;
const ACTIVITY_LOG_TRIM_CHUNK = 500;

export type ActivityAction =
  | "add"
  | "delete"
  | "time"
  | "replace"
  | "optimize"
  | "import"
  | "accommodation";

export interface ActivityLogEntry {
  id: string;
  actorName: string;
  action: ActivityAction;
  placeName: string;
  at: number;
}

function getDaysArray(doc: Y.Doc): Y.Array<Y.Map<unknown>> {
  return doc.getArray(DAYS_KEY);
}

function getMeta(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap(META_KEY);
}

// 숙소는 일정 항목이 아니라 일정 자체의 값이라 DB(PATCH /itineraries/{id})가 기준이다.
// 공동편집 문서엔 "누가 방금 저장한 최신 숙소"만 실어 다른 참여자 화면에 바로 반영되게 한다
// — 예전엔 로컬 state로만 들고 있어서 다른 사람이 바꿔도 새로고침 전까지 안 보였다.
// null이면 숙소를 지운 것이다.
export interface SharedAccommodation {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

const ACCOMMODATION_KEY = "accommodation";

export function setSharedAccommodation(doc: Y.Doc, place: SharedAccommodation | null): void {
  getMeta(doc).set(
    ACCOMMODATION_KEY,
    place ? { name: place.name, address: place.address, lat: place.lat, lng: place.lng } : null,
  );
}

// 문서에 이미 있던 값은 알리지 않고, 이후 "다른 참여자가" 바꾼 값만 넘긴다. 입장할 때는
// 방금 받은 DB 값이 더 정확하므로 Redis에 남아 있던 옛 값으로 덮어쓰지 않기 위함이다.
export function observeSharedAccommodation(
  doc: Y.Doc,
  callback: (place: SharedAccommodation | null) => void,
): () => void {
  const meta = getMeta(doc);
  const handler = (event: Y.YMapEvent<unknown>) => {
    if (event.transaction.local || !event.keysChanged.has(ACCOMMODATION_KEY)) return;
    callback((meta.get(ACCOMMODATION_KEY) as SharedAccommodation | null | undefined) ?? null);
  };
  meta.observe(handler);
  return () => meta.unobserve(handler);
}

// status(방문인증 완료 여부)는 일부러 여기서 빼고 저장한다 — 이건 "나"의 인증 여부라
// 개인마다 달라야 하는데, 다른 필드처럼 Y.Map에 넣으면 그룹 전원이 보는 하나의 값으로
// 합쳐져서 한 명만 인증해도 전원 화면에 "완료"로 보이는 문제가 있었다(2026-08-25).
// 그래서 status는 Yjs 문서(공유 상태)에 아예 안 실어 보내고, 각자 클라이언트가 로컬에서만
// 들고 있는다 — useCollaborativeItinerary의 completedStopIds 참고.
const LOCAL_ONLY_FIELDS = new Set(["status"]);

// transport는 그대로 저장하되, from/to 라벨은 읽을 때마다 rebuildTransport()로
// 인접 스톱의 현재 placeName 기준으로 다시 계산한다(가운데 스톱이 바뀌어도 라벨이
// 낡지 않게). type/durationMin/cost 같은 "선택값"만 저장된 값을 그대로 이어받는다.
function toItemMap(stop: BaseStop): Y.Map<unknown> {
  const map = new Y.Map<unknown>();
  Object.entries(stop).forEach(([key, value]) => {
    if (value !== undefined && !LOCAL_ONLY_FIELDS.has(key)) map.set(key, value);
  });
  return map;
}

function fromItemMap(map: Y.Map<unknown>): BaseStop {
  const stop = map.toJSON() as Omit<BaseStop, "status"> & { status?: unknown };
  // status는 로컬 전용 필드라 여기서도 무시한다 — 이 필드를 공유 문서에 실어보내던
  // 예전 버전이 만들어둔 room엔 아직 "status":"completed" 같은 값이 남아있을 수 있는데,
  // 그걸 그대로 읽어버리면 옛날 버그(팀 전체 공유)가 재발한다.
  delete stop.status;
  // room에는 백엔드 LocalTime 그대로("15:30:00") 들어간 값이 남아있을 수 있다 — 표시(고정 폭
  // 시간 버튼)와 같은 시각 비교(findStopAtTime)가 둘 다 "HH:mm"에 의존하므로 읽을 때 맞춘다.
  if (typeof stop.time === "string") stop.time = toHourMinute(stop.time) ?? stop.time;
  return stop as BaseStop;
}

function toDayMap(dayId: string, stops: BaseStop[]): Y.Map<unknown> {
  const dayMap = new Y.Map<unknown>();
  dayMap.set("dayId", dayId);
  const items = new Y.Array<Y.Map<unknown>>();
  items.push(stops.map(toItemMap));
  dayMap.set("items", items);
  return dayMap;
}

function getDayItems(dayMap: Y.Map<unknown> | undefined): Y.Array<Y.Map<unknown>> | null {
  return (dayMap?.get("items") as Y.Array<Y.Map<unknown>> | undefined) ?? null;
}

function getItemsArray(doc: Y.Doc, dayIdx: number): Y.Array<Y.Map<unknown>> | null {
  return getDayItems(getDaysArray(doc).get(dayIdx) as Y.Map<unknown> | undefined);
}

function findItemIndex(items: Y.Array<Y.Map<unknown>>, itemId: string): number {
  return items.toArray().findIndex((map) => map.get("id") === itemId);
}

// a, b 공통으로 등장하는 id 중 "양쪽에서 같은 상대 순서를 유지하는" 가장 긴 부분수열을
// 구한다 — 재정렬 시 실제로 위치가 안 바뀐(=이 부분수열에 속한) 항목을 가려내기 위함.
function longestCommonSubsequenceIds(a: string[], b: string[]): Set<string> {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const result = new Set<string>();
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.add(a[i - 1]);
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  return result;
}

// Y.Map에 이미 들어있는 값과 같은 값인지 비교한다(transport처럼 객체인 필드까지). 같은 값을
// 다시 set해도 Yjs는 업데이트를 쌓기 때문에(문서 크기↑, 동시 편집과 부딪힐 표면↑), 실제로
// 달라진 필드만 쓰기 위해 쓴다.
function isSameFieldValue(current: unknown, next: unknown): boolean {
  if (current === next) return true;
  if (current === null || next === null) return false;
  if (typeof current !== "object" || typeof next !== "object") return false;
  return JSON.stringify(current) === JSON.stringify(next);
}

// map의 필드를 stop 기준으로 다시 채운다(stop에 없는 키는 지움) — Y.Map 인스턴스는 그대로
// 유지한 채 필드만 갱신하므로, 같은 항목의 다른 필드를 동시에 건드리는 변경과 안전하게 병합된다.
function applyStopFields(map: Y.Map<unknown>, stop: BaseStop): void {
  const nextEntries = Object.entries(stop).filter(
    ([key, value]) => value !== undefined && !LOCAL_ONLY_FIELDS.has(key),
  );
  const nextKeys = new Set(nextEntries.map(([key]) => key));
  Array.from(map.keys()).forEach((key) => {
    if (!nextKeys.has(key) && !LOCAL_ONLY_FIELDS.has(key)) map.delete(key);
  });
  nextEntries.forEach(([key, value]) => {
    if (!isSameFieldValue(map.get(key), value)) map.set(key, value);
  });
}

// 순서가 바뀌는 연산(최적화/로그 불러오기 같은 "명시적 재배치") 전용. mutate가 돌려주는
// "목표 배열"을 현재 배열과 id 기준 LCS로 비교해서, 실제로 위치가 바뀐 항목만 새 Y.Map으로
// 만들어 delete+insert하고 나머지는 건드리지 않는다(내용만 바뀐 항목은 Y.Map 인스턴스를
// 유지한 채 필드만 patch).
//
// Yjs는 한 번 문서에 통합된 shared type(Y.Map)을 삭제 후 재삽입할 수 없고(실제로 에러 발생
// 확인함) Y.Array엔 move 연산도 없어서(yjs 13.6에 없음을 확인함), 위치가 바뀌는 항목 자체는 새
// 인스턴스로 다시 만들 수밖에 없다. 하지만 "위치가 안 바뀐 나머지 항목"까지 전부 다시 만들
// 필요는 없다 — 예전엔 배열 전체를 delete(0,len)+push(전체)로 다시 써서, 두 피어가 동시에
// (서로의 변경을 아직 모른 채) 같은 day에서 이 함수를 호출하면 각자 계산한 "배열 전체"가 서로
// 모르는 별개의 삽입으로 병합되어 항목이 통째로 중복되는 버그가 있었다(재현 확인 후 이 방식으로
// 교체). 지금은 실제로 이동하는 항목의 개수만큼만 delete/insert가 일어난다.
//
// 그래도 "두 피어가 같은 항목을 각자 옮기는" 경우엔 delete는 하나로 합쳐지고(멱등) insert는 서로
// 모르는 별개의 삽입으로 병합돼(비멱등) 같은 id의 Y.Map이 2개 남을 수 있다. Yjs에 move가 없는 한
// 이 방식으로는 완전히 못 막으므로, 중복이 생기면 dedupeItemsById가 변경을 받는 시점에 정리한다.
// 이 함수를 거치는 경로는 시각 변경(updateStopTime — 시간순 재정렬) / 시간 밀기
// (shiftFollowingStopTimes — 순서 유지) / 최적화 / 로그 불러오기 전부이고, 그중 시각 변경이 가장
// 흔한 동시 편집 경로라 중복이 실제로 터진 곳도 거기였다.
//
// 대안으로 "항목을 옮기지 않고 배열 슬롯의 내용만 목표 순서대로 덮어쓰는" 방식도 구현해봤지만
// 절대 쓰면 안 된다: 필드별 LWW 병합이 슬롯마다 다른 피어 쪽으로 갈릴 수 있어서, 두 피어가 각자
// 다른 항목의 시각을 동시에 고치기만 해도 두 슬롯이 같은 id가 되며 한 항목이 통째로 사라졌고,
// "한쪽이 삭제 + 다른 쪽이 재정렬"에선 지운 항목이 되살아나고 엉뚱한 항목이 사라졌다
// (2026-09-12, 실제 yjs로 재현 확인함).
function replaceItemsArray(
  doc: Y.Doc,
  dayIdx: number,
  mutate: (stops: BaseStop[]) => BaseStop[],
  options: { allowNewIds?: boolean } = {},
): void {
  doc.transact(() => {
    const items = getItemsArray(doc, dayIdx);
    if (!items) return;
    const currentMaps = items.toArray();
    const currentIds = currentMaps.map((map) => map.get("id") as string);
    const nextStops = mutate(currentMaps.map(fromItemMap));
    const nextById = new Map(nextStops.map((stop) => [stop.id, stop]));
    // 동시에 다른 피어가 지운 항목은 currentIds에 이미 없으니 여기서 자동으로 걸러진다.
    // 단, mutate가 현재 배열의 부분집합/순열이 아니라 애초에 한 번도 존재한 적 없는 새
    // id의 항목들을 통째로 돌려주는 경우(로그 불러오기 등, allowNewIds:true)엔 이 필터를
    // 적용하면 안 된다 — 전부 "현재 배열에 없는 id"로 걸러져 day가 통째로 비어버린다.
    const nextIds = options.allowNewIds
      ? nextStops.map((stop) => stop.id)
      : nextStops.map((stop) => stop.id).filter((id) => currentIds.includes(id));

    const anchorIds = longestCommonSubsequenceIds(currentIds, nextIds);

    // 1) 위치가 그대로인 항목은 내용만 patch (Y.Map 인스턴스 유지, 배열 구조는 안 건드림)
    currentMaps.forEach((map) => {
      const id = map.get("id") as string;
      if (!anchorIds.has(id)) return;
      const nextStop = nextById.get(id);
      if (nextStop) applyStopFields(map, nextStop);
    });

    // 2) 위치가 바뀐 항목만 제거 (뒤에서부터 지워야 인덱스가 안 꼬임)
    for (let idx = currentMaps.length - 1; idx >= 0; idx -= 1) {
      const id = currentMaps[idx].get("id") as string;
      if (!anchorIds.has(id)) items.delete(idx, 1);
    }

    // 3) 목표 순서(nextIds)를 따라가며, 이동 대상만 새 Y.Map으로 제자리에 삽입
    let cursor = 0;
    nextIds.forEach((id) => {
      if (anchorIds.has(id)) {
        cursor += 1;
        return;
      }
      const nextStop = nextById.get(id);
      if (nextStop) {
        items.insert(cursor, [toItemMap(nextStop)]);
        cursor += 1;
      }
    });
  });
}

// 항목 하나만 찾아서 그 Y.Map을 직접 mutate한다(배열 전체를 건드리지 않음) — 동시에 다른
// 항목이 추가/삭제돼도 서로 간섭하지 않는다. 대상이 이미 지워졌으면(동시 삭제) 조용히 무시.
function mutateStopById(
  doc: Y.Doc,
  dayIdx: number,
  itemId: string,
  mutate: (map: Y.Map<unknown>) => void,
): void {
  doc.transact(() => {
    const items = getItemsArray(doc, dayIdx);
    if (!items) return;
    const idx = findItemIndex(items, itemId);
    if (idx === -1) return;
    mutate(items.get(idx));
  });
}

export function isYjsDaysEmpty(doc: Y.Doc): boolean {
  return getDaysArray(doc).length === 0;
}

export function seedYjsDays(doc: Y.Doc, dayIds: string[], days: BaseStop[][]): void {
  doc.transact(() => {
    const daysArray = getDaysArray(doc);
    if (daysArray.length > 0) return;
    daysArray.push(dayIds.map((dayId, idx) => toDayMap(dayId, days[idx] ?? [])));
    getMeta(doc).set("seeded", true);
  });
}

// 완전히 새 일정(아무도 연 적 없는 room)에 두 명 이상이 정확히 동시에 처음 접속하면, 서로의
// 존재를 모른 채 둘 다 "문서가 비어있다"고 판단해 seedYjsDays를 각자 실행해서 day 전체가
// 통째로 중복될 수 있다(재현 확인함) — Yjs엔 "동시 생성" 자체를 막는 락이 없어서 이건 근본적
// 으로 못 막는다. 대신 병합된 뒤에 dayId 기준으로 중복을 정리한다.
//
// "남길 쪽"은 항상 "배열에서 가장 앞에 있는 사본"이다. 내용(항목 수 등)으로 고르지 않는 이유:
// 아직 상대의 업데이트를 다 못 받은 피어끼리는 같은 사본의 항목 수를 다르게 볼 수 있어서,
// A는 "1번째가 더 알차다"며 2번째를, B는 "2번째가 더 알차다"며 1번째를 지우는 일이 벌어진다
// (삭제는 병합되므로 결과는 day가 통째로 소멸 = 진짜 데이터 손실). 반면 Y.Array의 순서는 모든
// 피어에서 동일하게 수렴하고, "내가 보는 것 중 가장 앞"을 남기는 규칙은 전역적으로 가장 앞인
// 사본을 누구도 지우지 않으므로 최소 하나는 반드시 살아남는다.
//
// 그래서 "빈 사본이 알찬 사본을 이기는" 문제는 고르는 기준이 아니라 흡수(merge)로 해결한다:
// 중복 사본의 항목 중 남길 사본에 없는 id만 남길 사본의 뒤에 복사해 붙인 뒤 중복 사본을
// 지운다. 그러면 남는 쪽이 내 로컬 폴백 시딩본이어도 다른 참여자가 그 사이 추가한 항목이
// 사라지지 않는다(둘 다 같은 REST 응답으로 시딩된 통상적인 경우엔 id가 같아 흡수할 게 없고,
// 결과도 예전과 동일하다). 같은 id의 필드 편집은 남는 쪽 값이 이긴다 — 항목이 없어지는 것보다
// 가볍고, 순서 정보 없이 병합하려면 여기서 판단 불가능한 우선순위가 필요해서 시도하지 않는다.
// 흡수한 항목은 맨 뒤에 붙으므로 방문 순서가 어색해질 수 있지만(사용자가 다시 옮길 수 있다)
// 내용이 사라지는 것보다 낫다고 판단했다. 통합된 Y.Map은 옮길 수 없어 내용을 복사한다.
function dedupeDaysById(doc: Y.Doc): void {
  const daysArray = getDaysArray(doc);
  const keepIdxByDayId = new Map<string, number>();
  const duplicates: { keepIdx: number; dupIdx: number }[] = [];
  daysArray.toArray().forEach((dayMap, idx) => {
    const dayId = dayMap.get("dayId") as string;
    const keepIdx = keepIdxByDayId.get(dayId);
    if (keepIdx === undefined) keepIdxByDayId.set(dayId, idx);
    else duplicates.push({ keepIdx, dupIdx: idx });
  });
  if (duplicates.length === 0) return;

  doc.transact(() => {
    // 1) 먼저 흡수 (daysArray 자체는 건드리지 않으므로 위 인덱스가 그대로 유효하다)
    duplicates.forEach(({ keepIdx, dupIdx }) => {
      const keepItems = getDayItems(daysArray.get(keepIdx) as Y.Map<unknown> | undefined);
      const dupItems = getDayItems(daysArray.get(dupIdx) as Y.Map<unknown> | undefined);
      if (!keepItems || !dupItems) return;
      const keptIds = new Set(keepItems.toArray().map((map) => map.get("id") as string));
      const absorbed = dupItems
        .toArray()
        .filter((map) => !keptIds.has(map.get("id") as string))
        .map((map) => toItemMap(fromItemMap(map)));
      if (absorbed.length > 0) keepItems.push(absorbed);
    });

    // 2) 중복 사본 제거 — 뒤에서부터 지워야 앞쪽 인덱스가 안 꼬인다.
    duplicates
      .map(({ dupIdx }) => dupIdx)
      .sort((a, b) => b - a)
      .forEach((idx) => daysArray.delete(idx, 1));
  });
}

// 같은 id의 항목이 한 day에 2개 이상 있으면 가장 앞의 하나만 남기고 나머지를 지운다.
// 두 군데를 막는다: (1) 동시 편집으로 새로 생기는 중복 — 배열 순서를 바꾸는 경로(시각 변경의
// 시간순 재정렬, 최적화, 로그 불러오기)는 replaceItemsArray의 delete+insert를 거치는데, 삭제는
// 멱등이지만 삽입은 아니라서 두 사람이 거의 동시에 실행하면 같은 id가 두 벌로 병합될 수 있다
// (가장 흔한 건 시각 변경). (2) 그렇게 이미 중복이 박혀버린 채 Redis에 남아 있는 문서 — 열었을 때
// 화면에 같은 장소가 2개 뜨고 flush의 reorderItems가 400을 맞아 순서 저장이 계속 죽어있는 상태를
// 복구한다.
// 남길 기준을 "가장 앞"으로 잡은 이유는 dedupeDaysById와 같다: 내용으로 고르면 피어마다
// 판단이 갈려 양쪽 사본이 다 지워질 수 있고, 위치 기준은 전역적으로 가장 앞인 사본이 절대
// 지워지지 않아 최소 하나가 반드시 남는다(중복 사본들의 내용은 원래 같은 항목에서 갈라져
// 나온 것이라 어느 쪽을 남겨도 차이가 거의 없다).
function dedupeItemsById(doc: Y.Doc): void {
  const removals: { items: Y.Array<Y.Map<unknown>>; indexes: number[] }[] = [];
  getDaysArray(doc)
    .toArray()
    .forEach((dayMap) => {
      const items = getDayItems(dayMap);
      if (!items) return;
      const seenIds = new Set<string>();
      const duplicateIndexes: number[] = [];
      items.toArray().forEach((map, idx) => {
        const id = map.get("id") as string | undefined;
        if (id === undefined) return;
        if (seenIds.has(id)) duplicateIndexes.push(idx);
        else seenIds.add(id);
      });
      if (duplicateIndexes.length > 0) removals.push({ items, indexes: duplicateIndexes });
    });
  if (removals.length === 0) return;

  doc.transact(() => {
    removals.forEach(({ items, indexes }) => {
      // 뒤에서부터 지워야 앞쪽 인덱스가 안 꼬인다.
      indexes
        .slice()
        .reverse()
        .forEach((idx) => items.delete(idx, 1));
    });
  });
}

// 이미 시딩된 방(재오픈)은 그 이후 백엔드에서 새로 계산된 이동수단(재정렬로 routeType이
// 채워지는 등)을 다시 받아오지 않는다 — REST로 새로 받아온 값 중 transport가 있는데
// Yjs 쪽 같은 id 항목엔 아직 비어있는 경우에 한해 채워 넣는다. 사용자가 직접 고른
// transport(updateStopTransport)는 이미 값이 있으므로 덮어쓰지 않는다. toStopId가 현재
// 순서와 안 맞으면 어차피 readStopsFromYjs가 매번 rebuildTransport()로 다시 비우므로
// 여기서 순서 검증까진 하지 않아도 안전하다.
export function reconcileTransportFromRest(
  doc: Y.Doc,
  dayIds: string[],
  restDays: BaseStop[][],
): void {
  doc.transact(() => {
    dayIds.forEach((_, dayIdx) => {
      const restStopsById = new Map((restDays[dayIdx] ?? []).map((stop) => [stop.id, stop]));
      if (restStopsById.size === 0) return;
      const items = getItemsArray(doc, dayIdx);
      if (!items) return;
      items.toArray().forEach((map) => {
        const restStop = restStopsById.get(map.get("id") as string);
        // 좌표(카카오맵 길찾기용) 필드가 생기기 전에 시딩된 방도 같은 방식으로 채워 넣는다.
        if (map.get("lat") === undefined && restStop?.lat != null && restStop.lng != null) {
          map.set("lat", restStop.lat);
          map.set("lng", restStop.lng);
        }
        if (map.get("transport") !== undefined) return;
        if (!restStop?.transport) return;
        map.set("transport", restStop.transport);
        if (restStop.recommendedTransport !== undefined) {
          map.set("recommendedTransport", restStop.recommendedTransport);
        }
      });
    });
  });
}

// 이미 시딩된 방은 시각도 다시 안 받아온다(seedYjsDays가 "비어있을 때만" 시딩). 예전 버그로
// 하루 전체가 같은 시각(대개 00:00)으로 뭉개진 채 시딩된 방이 Redis에 그대로 남아 있어서,
// REST가 제대로 계산해서 내려줘도 화면은 계속 00:00을 보여준다(2026-09-06 라이브 확인).
//
// 사용자가 직접 맞춰둔 시각을 덮으면 안 되므로, "그 날 항목이 2개 이상인데 시각이 전부
// 동일"한 명백히 깨진 경우에만 REST 값으로 되돌린다 — 서로 다른 두 항목이 같은 시각을
// 갖는 상태는 사용자가 만들 수 없다(백엔드가 같은 날 같은 시각을 아예 막는다).
export function reconcileBrokenTimesFromRest(
  doc: Y.Doc,
  dayIds: string[],
  restDays: BaseStop[][],
): void {
  doc.transact(() => {
    dayIds.forEach((_, dayIdx) => {
      const items = getItemsArray(doc, dayIdx);
      if (!items) return;
      const maps = items.toArray();
      if (maps.length < 2) return;

      const times = maps.map((map) => map.get("time") as string | undefined);
      const isBroken = times.every((time) => time !== undefined && time === times[0]);
      if (!isBroken) return;

      const restTimesById = new Map(
        (restDays[dayIdx] ?? []).map((stop) => [stop.id, stop.time] as const),
      );
      // REST에 없는 항목(아직 저장 안 된 새 항목)이 섞여 있으면 그 날은 손대지 않는다 —
      // 일부만 바꾸면 오히려 순서와 시각이 어긋난다.
      const nextTimes = maps.map((map) => restTimesById.get(map.get("id") as string));
      if (nextTimes.some((time) => time === undefined)) return;
      // REST 쪽도 전부 같은 시각이면(= 같은 깨진 값) 고칠 게 없다.
      if (nextTimes.every((time) => time === nextTimes[0])) return;

      maps.forEach((map, idx) => map.set("time", nextTimes[idx]));
    });
  });
}

// "days" 키를 이 모듈 밖으로 새어나가지 않게 감싼 observe 헬퍼. 매 변화마다 dayId 중복과
// 항목 id 중복부터 정리한 뒤(동시 최초시딩 경합 / 예전 버전이 남긴 중복 대비, dedupeDaysById·
// dedupeItemsById 주석 참고) 콜백을 부른다 — 정리할 게 있었다면 그 트랜잭션이 이 observer를
// 한 번 더 재귀 호출하지만, 두 번째 패스는 정리할 게 없어 바로 종료되므로 무한루프로 이어지지
// 않는다(dayId 정리에서 흡수된 항목이 중복 id를 만들면 그 두 번째 패스가 정리해 준다).
export function observeYjsDays(doc: Y.Doc, callback: () => void): () => void {
  const daysArray = getDaysArray(doc);
  const handler = () => {
    dedupeDaysById(doc);
    dedupeItemsById(doc);
    callback();
  };
  daysArray.observeDeep(handler);
  return () => daysArray.unobserveDeep(handler);
}

export function readStopsFromYjs(doc: Y.Doc): BaseStop[][] {
  return getDaysArray(doc)
    .toArray()
    .map((dayMap) => {
      const items = (dayMap.get("items") as Y.Array<Y.Map<unknown>>).toArray().map(fromItemMap);
      return rebuildTransport(items);
    });
}

export function addStop(doc: Y.Doc, dayIdx: number, stop: BaseStop): void {
  doc.transact(() => {
    const items = getItemsArray(doc, dayIdx);
    if (!items) return;
    items.push([toItemMap(stop)]);
  });
}

export function deleteStop(doc: Y.Doc, dayIdx: number, itemId: string): void {
  doc.transact(() => {
    const items = getItemsArray(doc, dayIdx);
    if (!items) return;
    const idx = findItemIndex(items, itemId);
    if (idx === -1) return;
    items.delete(idx, 1);
  });
}

// 해당 항목의 시각을 고치고, 그날 목록을 시간순으로 다시 정렬한다 — 정렬이 원래 동작이고
// 의도된 동작이다(2026-09-12에 원래 동작으로 복원). 타임라인이 시간축 UI라 목록 순서와 시각이
// 어긋나 보이면 안 되고, 이 배열 순서가 그대로 DB 방문 순서(flush → reorderItems의 order_index)가
// 되기 때문이다.
//
// 정렬은 반드시 "쓰는 시점"에 해야 한다. 읽는 쪽에서만 시간순으로 보여주는 방법은 쓸 수 없다 —
// readStopsFromYjs의 결과는 화면뿐 아니라 flush(→ order_index)와 rebuildTransport("배열상 다음
// 항목까지의 구간"이라는 전제)로 그대로 흘러가서, 읽을 때만 정렬하면 화면과 저장되는 방문 순서가
// 갈리고 뒤바뀐 위치마다 toStopId가 실제 다음 스팟과 안 맞아 구간 이동수단이 연쇄로 비워진다.
//
// 이 경로는 replaceItemsArray를 거치므로 위치가 실제로 바뀐 항목은 delete+insert된다. 삭제는
// 멱등이지만 삽입은 아니라서, 두 사람이 "같은 항목의 시각"을 거의 동시에 고치면 같은 id의 Y.Map이
// 두 벌로 병합될 수 있다(화면에 같은 장소 2개 = React key 중복 + flush의 reorderItems에 중복 id가
// 실려 400). 그 중복은 dedupeItemsById가 변경을 받는 시점에 정리한다 — 정렬을 없애는 방향이 아니다.
//
// 시도했다가 되돌린 두 방향(다시 꺼내지 말 것):
//  - 정렬을 걷어내고 제자리에서 필드만 고치기: 같은 id가 갈라지는 문제는 사라지지만, 시각과 방문
//    순서가 어긋난 채로 저장돼(12:00 항목이 10:00 항목보다 위에 남는다) 타임라인이 뒤죽박죽으로
//    보이고 그 순서가 그대로 DB에 반영된다.
//  - "배열 슬롯은 그대로 두고 내용만 목표 순서대로 덮어쓰기": 필드별 LWW 병합의 승자가 슬롯마다
//    갈려서, 두 피어가 각자 다른 항목의 시각을 고치기만 해도 두 슬롯이 같은 id가 되며 한 항목이
//    통째로 사라졌다(replaceItemsArray 주석의 2026-09-12 시뮬레이션 결과 참고).
//
// 반대로 shiftFollowingStopTimes(교통수단 변경에 따른 시간 밀기)는 정렬하지 않는다 — 거기선 일부
// 항목만 밀리기 때문에 정렬하면 사용자가 정해둔 방문 순서 자체가 뒤바뀐다(그 함수 주석 참고).
export function updateStopTime(doc: Y.Doc, dayIdx: number, itemId: string, time: string): void {
  replaceItemsArray(doc, dayIdx, (stops) =>
    stops
      .map((stop) => (stop.id === itemId ? { ...stop, time, timeIsManual: true } : stop))
      .sort((a, b) => a.time.localeCompare(b.time)),
  );
}

export interface ShiftTimesResult {
  shiftedCount: number;
  cappedAtBoundary: boolean;
}

// 교통수단이 바뀌어서 소요시간이 달라지면, fromItemId 다음 스팟부터 그날 남은 스팟까지
// deltaMinutes만큼 시간을 민다. 사용자가 직접 시간을 정해둔 스팟(timeIsManual)을 만나거나
// boundaryMinutes(여행 종료 시간)를 넘기게 되면 그 지점에서 멈추고 이후는 건드리지 않는다.
export function shiftFollowingStopTimes(
  doc: Y.Doc,
  dayIdx: number,
  fromItemId: string,
  deltaMinutes: number,
  boundaryMinutes?: number,
): ShiftTimesResult {
  const result: ShiftTimesResult = { shiftedCount: 0, cappedAtBoundary: false };
  if (deltaMinutes === 0) return result;

  replaceItemsArray(doc, dayIdx, (stops) => {
    const fromIdx = stops.findIndex((stop) => stop.id === fromItemId);
    if (fromIdx === -1) return stops;

    let stillShifting = true;
    const next = stops.map((stop, idx) => {
      if (idx <= fromIdx || !stillShifting) return stop;
      if (stop.timeIsManual) {
        stillShifting = false;
        return stop;
      }

      const newMinutes = roundToNearest10(timeToMinutes(stop.time) + deltaMinutes);
      if (boundaryMinutes !== undefined && newMinutes > boundaryMinutes) {
        result.cappedAtBoundary = true;
        stillShifting = false;
        return stop;
      }

      result.shiftedCount += 1;
      return { ...stop, time: minutesToTime(newMinutes) };
    });

    // 여기서 시간순으로 재정렬하면 안 된다 — 배열 순서(next)는 "방문 순서" 그 자체라
    // toStopId 기반 transport(rebuildTransport)와 이후 로직 전체가 이 순서를 전제로
    // 한다. 시간만 밀렸을 뿐인데(예: 중간에 timeIsManual 스팟이 있어 그 뒤는 안 밀리고
    // 앞쪽만 밀린 경우) 시간순 정렬을 하면 방문 순서 자체가 뒤바뀌어서, 바뀐 위치마다
    // toStopId가 실제 다음 스팟과 안 맞게 되고 그 구간의 transport가 연쇄로 비워지는
    // 버그가 있었다(2026-09-03). 방문 순서는 사용자가 명시적으로 재배치할 때만
    // (드래그 재정렬/최적화) 바뀌어야 한다.
    return next;
  });

  return result;
}

// UpdateItemRequest엔 spotId가 없어 PATCH로 스팟 자체를 바꿀 수 없다 — 기존 REST 흐름과
// 동일하게 항목을 통째로 새 스팟으로 교체한다(같은 위치에서 삭제 후 재생성).
export function replaceStop(doc: Y.Doc, dayIdx: number, itemId: string, newStop: BaseStop): void {
  mutateStopById(doc, dayIdx, itemId, (map) => applyStopFields(map, newStop));
}

// REST에 반영되진 않는 로컬 전용 UI 상태(교통수단 선택)지만, 같이 보고 있는 다른
// 피어에게도 실시간으로 보이도록 Yjs로는 반영한다. (인증완료 표시는 이제 여기 포함되지
// 않음 — 개인마다 달라야 해서 useCollaborativeItinerary의 로컬 state로만 관리한다.)
export function updateStopTransport(
  doc: Y.Doc,
  dayIdx: number,
  itemId: string,
  transport: BaseStop["transport"],
): void {
  mutateStopById(doc, dayIdx, itemId, (map) => {
    if (transport === undefined) map.delete("transport");
    else map.set("transport", transport);
  });
}

// 새로 추가된 항목의 백엔드 계산 교통정보(직전 스팟 → 새 항목 구간)를 그 직전 스톱의
// 배너로 바로 채운다. 실시간 편집으로 관광지를 추가하면 다음 리마운트 전까지는 REST
// 재조회/reconcile이 안 돌아서 배너가 안 뜨던 문제 대응.
// 사용자가 직접 고른 값(같은 다음-스팟 기준)은 덮어쓰지 않되, 그 사이 다른 스팟이 끼어들어
// 낡아버린 값(toStopId 불일치)은 새로 계산된 값으로 교체한다.
export function applyComputedTransport(
  doc: Y.Doc,
  prevStopId: string,
  nextStopId: string,
  transport: NonNullable<BaseStop["transport"]>,
): void {
  doc.transact(() => {
    getDaysArray(doc)
      .toArray()
      .forEach((dayMap) => {
        const items = dayMap.get("items") as Y.Array<Y.Map<unknown>> | undefined;
        if (!items) return;
        const idx = findItemIndex(items, prevStopId);
        if (idx === -1) return;
        const map = items.get(idx);
        const existing = map.get("transport") as BaseStop["transport"] | undefined;
        if (existing && existing.toStopId === nextStopId) return;
        map.set("transport", transport);
        map.set("recommendedTransport", transport);
      });
  });
}

export function pushOptimizedOrder(doc: Y.Doc, dayIdx: number, stops: BaseStop[]): void {
  replaceItemsArray(doc, dayIdx, () => stops);
}

// 로그 불러오기 전용. pushOptimizedOrder는 "현재 day의 기존 항목을 재정렬"하는 용도라
// nextStops의 id가 현재 배열에 이미 있어야 하는데(그래야 동시 삭제된 항목을 되살리지
// 않을 수 있음), 로그 불러오기는 애초에 한 번도 존재한 적 없는 새 id의 항목들로 day를
// 통째로 갈아끼우는 것이라 그 필터를 걸면 전부 걸러져서 day가 완전히 비어버린다
// (2026-08-23 실서버 테스트로 재현·확인됨). allowNewIds:true로 그 필터만 건너뛴다.
export function replaceStopsWithImportedLog(doc: Y.Doc, dayIdx: number, stops: BaseStop[]): void {
  replaceItemsArray(doc, dayIdx, () => stops, { allowNewIds: true });
}

// flush(REST 반영)가 재시도까지 모두 실패했을 때, 로컬(Yjs)이 서버와 갈라진 채로 영영 남지
// 않도록 그 day를 서버 최신 상태로 강제 동기화한다. replaceStopsWithImportedLog와 구현은
// 같지만(전량 교체 + LCS 기반 diff라 동시 편집 중에도 안전하게 병합됨) 의도가 다르므로
// 별도 이름으로 노출한다 — 로그 불러오기가 아니라 실패 복구 용도.
export function reconcileDayWithServer(doc: Y.Doc, dayIdx: number, stops: BaseStop[]): void {
  replaceItemsArray(doc, dayIdx, () => stops, { allowNewIds: true });
}

export function resolveTempId(doc: Y.Doc, dayIdx: number, tempId: string, realId: string): void {
  mutateStopById(doc, dayIdx, tempId, (map) => map.set("id", realId));
}

function getActivityLogArray(doc: Y.Doc): Y.Array<ActivityLogEntry> {
  return doc.getArray(ACTIVITY_LOG_KEY);
}

// "누가 뭘 했는지" 기록 — 데이터 mutation 함수와 분리해서 호출부(페이지)가 액션 종류를
// 직접 고르게 한다(같은 pushOptimizedOrder 호출도 AI 최적화/로그 불러오기처럼 문맥에 따라
// 다른 액션으로 기록해야 해서, mutation 함수 안에 액션을 못 박아두지 않는다).
//
// 이 배열은 기본적으로 append-only로 둔다. 관찰자(useCollaborativeItinerary)가 "신규 항목"을
// 배열 길이 증가(entries.slice(lastSeenLen))로 판별하기 때문에, 예전처럼 push할 때마다 앞부분을
// 잘라 길이를 50에 고정해 버리면 길이가 더 이상 늘지 않아 신규가 항상 빈 배열이 된다 — 활동이
// 50건을 넘긴(=오래 쓴) 방에서 "○○님이 …" 토스트와 로그 불러오기 안내가 조용히 영구 정지하던
// 원인이 이것이었다.
//
// 그래도 무한히 쌓이면 Redis 문서가 계속 커지므로 상한은 둔다. 단 "상한에 닿을 때마다 1개 자르기"
// (= 길이 고정)가 아니라 "상한을 넘으면 한 번에 CHUNK개 자르기"로 한다: 자른 직후엔 배열이
// 관찰자의 기준 길이보다 짧아져 알림이 잠시 멈추지만, 다시 CHUNK개가 쌓여 기준 길이를 넘어서면
// 자동으로 되살아난다. 즉 "영구 정지"가 "아주 드문 일시 정지"로 바뀐다(한 일정 방에서 활동
// 2000건은 현실적으로 거의 도달하지 않는 수치라 실제로는 트림 자체가 거의 일어나지 않는다).
// 완전한 해결은 관찰자가 길이 대신 항목 id/at 기준으로 신규를 판별하는 것이지만, 그 파일은
// 이번 작업 범위가 아니라 손대지 않았다.
export function logActivity(
  doc: Y.Doc,
  actorName: string,
  action: ActivityAction,
  placeName: string,
): void {
  doc.transact(() => {
    const log = getActivityLogArray(doc);
    log.push([{ id: crypto.randomUUID(), actorName, action, placeName, at: Date.now() }]);
    if (log.length > ACTIVITY_LOG_HARD_LIMIT) log.delete(0, ACTIVITY_LOG_TRIM_CHUNK);
  });
}

export function readActivityLog(doc: Y.Doc): ActivityLogEntry[] {
  return getActivityLogArray(doc).toArray();
}

// transaction을 그대로 넘겨서(호출부가 transaction.local로 "내가 한 변경인지" 판단할 수
// 있게) — 로컬 변경까지 토스트로 띄우면 내가 한 행동에 내가 알림을 받는 꼴이 된다.
export function observeActivityLog(
  doc: Y.Doc,
  callback: (transaction: Y.Transaction) => void,
): () => void {
  const log = getActivityLogArray(doc);
  const wrapped = (_events: unknown, transaction: Y.Transaction) => callback(transaction);
  log.observe(wrapped);
  return () => log.unobserve(wrapped);
}

"use client";

import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { itineraryApi } from "@/shared/api/domains";
import type { BaseStop } from "@/features/itinerary/utils/scheduleUtils";
import {
  buildTransportFromItem,
  mapItineraryDetailToDays,
} from "@/features/itinerary/utils/scheduleUtils";
import { useItineraryYDoc } from "./useItineraryYDoc";
import {
  addStop as yAddStop,
  applyComputedTransport,
  deleteStop as yDeleteStop,
  logActivity as yLogActivity,
  observeActivityLog,
  observeSharedAccommodation,
  observeYjsDays,
  pushOptimizedOrder as yPushOptimizedOrder,
  readActivityLog,
  setSharedAccommodation,
  type SharedAccommodation,
  readStopsFromYjs,
  reconcileDayWithServer,
  reconcileTransportFromRest,
  reconcileBrokenTimesFromRest,
  replaceStop as yReplaceStop,
  replaceStopsWithImportedLog as yReplaceStopsWithImportedLog,
  resolveTempId,
  seedYjsDays,
  shiftFollowingStopTimes as yShiftFollowingStopTimes,
  updateStopTime as yUpdateStopTime,
  updateStopTransport as yUpdateStopTransport,
  type ActivityAction,
  type ActivityLogEntry,
  type ShiftTimesResult,
} from "./itineraryYjsSchema";
import {
  flushDayToRest,
  snapshotFromStops,
  type AddedItem,
  type DaySnapshot,
  type FlushFailure,
} from "./flushItineraryToRest";
import { resolveParticipantColorClass } from "./participantColor";

export interface CollaboratorInfo {
  // 색이 겹쳤을 때 "누가 양보할지"를 정하는 기준. 이게 없으면 양보하는 쪽이 접속마다
  // 달라져 같은 사람 색이 또 바뀐다(participantColor.ts 참고).
  id?: string;
  name: string;
  colorClass: string;
  avatarUrl?: string;
}

interface CursorState {
  dayIdx: number;
  itemId: string;
}

interface CurrentUser {
  id: string;
  nickname: string;
  profileImageUrl?: string;
}

// WS sync가 이 시간 안에 안 끝나면(연결 자체가 안 되거나, 오프라인 등) REST 값으로
// 그냥 시딩해서 로컬 편집만이라도 항상 가능하게 한다.
const SEED_FALLBACK_MS = 4000;

// flush(REST 반영)가 실패했을 때 자동으로 다시 시도하는 횟수와 간격.
// 예전엔 flush 실패를 전부 조용히 삼켰고, 재flush 트리거가 stopsPerDay 변화뿐이라
// 사용자가 그 뒤에 아무것도 더 건드리지 않으면 영구히 재시도되지 않았다 — 화면은 12:00,
// DB는 10:00인 상태로 갈려 있다가 새로고침하면 변경이 되돌아갔다.
// 상한을 두는 이유: 재시도해도 절대 성공하지 않는 실패(값 자체가 거부되는 400 등)에
// 대해서까지 계속 재시도하면 같은 요청으로 백엔드를 무한히 두드리게 된다.
const MAX_FLUSH_RETRIES = 2;
const FLUSH_RETRY_DELAY_MS = 1500;

// 3단계: flush 주체를 node-yjs 서버로 이관. true면 이 훅은 Yjs 문서만 갱신하고 REST flush를
// 전혀 하지 않는다(디바운스 타이머도 켜지 않음) — node-yjs의 RoomFlushManager가 대신
// 5초 디바운스/30초 주기로 flush하고, 저장 상태는 awareness로 브로드캐스트한다(아래
// __system 구독 참고). false(기본값, 미설정 시도 false)면 예전 그대로 이 훅이 직접 flush한다
// — 문제가 생기면 이 값만 false로 되돌리면 즉시 롤백된다. 코드 자체는 지우지 않고 이 플래그
// 뒤에 그대로 남겨둔다(안정화 확인 후 별도 커밋으로 제거하기로 함, 2026-09-17).
const SERVER_SIDE_FLUSH_ENABLED = process.env.NEXT_PUBLIC_SERVER_SIDE_FLUSH === "true";

// flush가 끝까지 실패했을 때 호출부(일정 페이지)에 넘기는 정보. 사용자에게 "저장되지
// 않았어요" 같은 안내를 띄우고, 필요하면 직접 재시도 버튼을 붙이는 데 쓴다.
export interface FlushErrorInfo {
  failures: FlushFailure[];
  // 사용자에게 그대로 보여줄 수 있는 대표 문구(첫 실패 기준, 백엔드 message 우선).
  message: string;
  // 몇 번째 시도가 실패했는지(1 = 최초 시도).
  attempt: number;
  // 자동 재시도가 예약됐는지. false면 이번 실패가 이 flush 사이클의 최종 실패다.
  willRetry: boolean;
  // 최종 실패 뒤 로컬(Yjs)을 서버 최신 상태로 강제 동기화했는지. true면 화면에 남아있던
  // 저장 안 된 편집은 사라지고 서버 값으로 되돌아간 것이므로, 호출부는 재시도 안내가
  // 아니라 "편집이 되돌아갔다"는 걸 알려줘야 한다.
  reconciled: boolean;
}

// useItineraryYDoc(연결 생명주기)을 감싸 실제 화면이 쓰는 형태로 데이터를 노출한다:
// Yjs 상태를 BaseStop[][]로 파생시키고, 초기 시딩·이탈시/합류시 DB 반영을 처리한다.
export function useCollaborativeItinerary(
  itineraryId: string,
  dayIds: string[],
  initialDays: BaseStop[][],
  // 서버가 내려준 day별 낙관적 락 버전(GET 상세 응답 기준). replaceDayItems/reorderItems
  // 요청의 expectedVersion으로 실어 보내고, 성공/충돌 응답이 올 때마다 갱신한다.
  initialVersions: (number | undefined)[],
  currentUser?: CurrentUser,
  onRemoteActivity?: (entry: ActivityLogEntry) => void,
  // REST 반영에 실패한 변경이 있을 때 알림용(선택). 없으면 예전처럼 조용히 재시도만 한다.
  // 조용히 삼키면, 화면(Yjs)에는 남아 있어서 사용자는 저장된 줄 알지만 새로고침하면
  // 사라진다 — 그 사실을 화면에 알리기 위한 통로다. 자동 재시도가 남았는지(willRetry)까지
  // 함께 넘기므로, 호출부가 "재시도 중" 안내와 "최종 실패" 안내를 나눠 띄울 수 있다.
  onFlushError?: (info: FlushErrorInfo) => void,
  // 낙관적 락(409) 충돌이 있었을 때 알림용(선택). 이건 실패가 아니라 "다른 사람이 먼저
  // 저장한 정상적인 충돌"이라 onFlushError와 분리한다 — flushDayToRest가 이미 자체적으로
  // 서버 최신 상태로 reconcile까지 끝낸 뒤 알리므로, 호출부는 안내 토스트만 띄우면 된다.
  onVersionConflict?: () => void,
  // 서버 반영이 끝난 뒤 호출된다. 호출부가 상세 캐시를 갱신하는 데 쓴다 — 저장은 됐는데
  // 캐시에 옛 응답이 남아 있으면, 앱 안에서 이 화면에 다시 들어올 때 그 옛 응답으로 문서가
  // 시딩돼 "바꾼 시간이 저장되지 않은 것처럼" 보였다(새로고침하면 캐시가 없어 정상).
  onFlushed?: () => void,
  // 다른 참여자가 숙소를 바꿨을 때(저장 성공 후 공유된 값). null이면 숙소를 지운 것.
  onRemoteAccommodation?: (place: SharedAccommodation | null) => void,
) {
  // 문서는 빈 채로 만든다. 시딩은 아래 useEffect에서, WS 동기화가 끝나 원격(Redis)에
  // 이미 있던 days가 doc에 먼저 반영된 뒤에 한다 — 그래야 seedYjsDays의 "로컬 문서가
  // 비어있으면 시딩" 가드가 "진짜 처음 여는 일정인지"를 정확히 판단할 수 있다.
  // (이전엔 useState 초기화 시점에 곧바로 시딩했는데, 매 마운트마다 새 빈 문서를 만들다
  // 보니 이 가드가 사실상 항상 통과해버려서, 같은 일정을 재오픈할 때마다 REST에서 받은
  // days가 서버에 이미 있던 days와 합쳐져 개수가 배로 늘어나는 버그가 있었다.)
  const [doc] = useState(() => new Y.Doc());
  const [stopsPerDay, setStopsPerDay] = useState<BaseStop[][]>(initialDays);

  // 방문인증 완료(status==="completed") 여부는 "나"만의 상태라 Yjs 공유 문서에는 아예
  // 안 싣는다(itineraryYjsSchema의 LOCAL_ONLY_FIELDS 참고) — 대신 이 컴포넌트 로컬
  // state로만 들고 있다가 stopsPerDay를 노출할 때 덧씌운다. 그래야 같은 일정을 보고
  // 있는 다른 그룹원이 인증해도 내 화면엔 반영되지 않고, 내가 직접 인증했을 때만 내
  // 화면에서 바로 "완료"로 바뀐다(REST로 재조회해도 백엔드가 개인별로 계산해주므로
  // 동일한 값으로 수렴함).
  const [completedStopIds, setCompletedStopIds] = useState<Set<string>>(
    () =>
      new Set(
        initialDays
          .flat()
          .filter((stop) => stop.status === "completed")
          .map((stop) => stop.id),
      ),
  );

  // effect/콜백 안에서 최신 값을 읽기 위한 ref (stale closure 방지). 렌더 중 값을 그대로
  // 대입하면 안 되므로(react-hooks/refs) effect에서 매 렌더 최신값으로 갱신한다.
  const dayIdsRef = useRef(dayIds);
  const snapshotsRef = useRef<DaySnapshot[]>(initialDays.map(snapshotFromStops));
  // day별로 마지막에 확인한 낙관적 락 버전. replaceDayItems/reorderItems 성공·충돌 응답마다
  // 갱신되고, 다음 요청의 expectedVersion으로 실린다.
  const versionsRef = useRef<(number | undefined)[]>(initialVersions);
  // 시딩용 초기값은 마운트 시점 값 그대로 고정한다 — props가 그 사이 바뀌어도
  // 시딩 로직이 재실행되며 엉뚱한 값을 시딩하면 안 되기 때문.
  const initialDaysRef = useRef(initialDays);
  // 시딩(원격 상태 병합 포함)이 실제로 끝나기 전엔 doc이 빈 상태라, 이 시점에 flushAll이
  // 돌면 그 빈 상태를 REST에 그대로 PATCH해서 서버에 이미 있던 데이터를 지워버린다.
  // (React StrictMode가 개발 모드에서 연결 effect를 마운트 직후 한 번 cleanup했다가
  // 다시 마운트하는데, 그 cleanup이 onBeforeDisconnect=flushAll을 호출하는 경로가 있어서
  // 시딩 전에 flushAll이 불릴 수 있다 — 실제로 이걸로 로컬 테스트 중 데이터가 날아갔다.)
  //
  // ref와 별개로 state(seeded)로도 노출한다 — 로그 불러오기처럼 마운트 직후 곧바로
  // doc에 쓰기(day 배열이 아직 없으면 조용히 무시됨)를 시도하는 호출부가 "지금 써도
  // 안전한지"를 알 수 있어야 한다(ref는 effect 밖 렌더에서 못 읽어서 이 용도로는 못 씀).
  const hasSeededRef = useRef(false);
  const [seeded, setSeeded] = useState(false);

  // 항상 최신 콜백을 참조하기 위한 ref (stale closure 방지 — flushAll은 effect/타이머/
  // awareness 콜백에서 불리므로 마운트 시점 콜백에 고정되면 안 된다).
  const onFlushErrorRef = useRef(onFlushError);
  const onVersionConflictRef = useRef(onVersionConflict);
  const onFlushedRef = useRef(onFlushed);
  // 예약된 자동 재시도 타이머. 새 flush가 시작되면 취소한다(그 flush가 더 최신 상태를
  // 보내므로 예전 재시도는 의미가 없다).
  const retryTimerRef = useRef<number | null>(null);
  // flush 겹침 방지(coalesce) 상태: 지금 돌고 있는 flush 체인과, 그 사이에 들어온
  // "끝나면 한 번 더 돌려야 한다"는 예약 플래그. 자세한 이유는 runFlush 주석 참고.
  const flushChainRef = useRef<Promise<void> | null>(null);
  const flushAgainRef = useRef(false);

  useEffect(() => {
    dayIdsRef.current = dayIds;
    onFlushErrorRef.current = onFlushError;
    onVersionConflictRef.current = onVersionConflict;
    onFlushedRef.current = onFlushed;
  });

  // 새 항목이 저장되면서 백엔드가 계산해준 (직전 스팟 → 새 항목) 구간 정보를, 그 직전
  // 스팟의 교통수단 배너로 바로 문서에 채운다 — 리마운트해서 REST를 다시 받아오기 전에도
  // 배너가 보이도록. (실시간 편집으로 관광지를 추가할 때 배너가 안 뜨던 문제)
  const applyLegTransport = (prevStopId: string, addedItem: AddedItem) => {
    if (!addedItem.id) return;
    const stops = readStopsFromYjs(doc).flat();
    const prevStop = stops.find((stop) => stop.id === prevStopId);
    const addedStop = stops.find((stop) => stop.id === addedItem.id);
    if (!prevStop || !addedStop) return;

    const transport = buildTransportFromItem(
      addedItem,
      prevStop.placeName,
      addedStop.placeName,
      addedItem.id,
      addedItem.travelTimeMin ?? 30,
    );
    if (!transport) return;
    applyComputedTransport(doc, prevStopId, addedItem.id, transport);
  };

  // flush 재시도까지 모두 실패한 day들을 서버 최신 상태로 강제 동기화한다. reconcileDayWithServer
  // 자체는 LCS 기반 부분 diff라 그 사이 다른 참여자가 만든 편집과도 안전하게 병합되지만,
  // 이 함수가 덮어쓰는 건 "이 클라이언트가 저장하지 못한 로컬 편집"이므로 그 편집은 사라진다
  // — 실패를 조용히 삼켜 화면과 DB가 영영 갈린 채로 남는 것보다는 안전한 선택이다.
  // 서버 조회 자체가 실패하면(오프라인 등) 아무것도 건드리지 않고 false를 돌려준다 — 다음
  // flush 트리거 때 이 실패한 로컬 편집이 다시 대상이 되어 재시도된다.
  const reconcileFailedDays = async (failures: FlushFailure[]): Promise<boolean> => {
    const failedDayIds = [...new Set(failures.map((f) => f.dayId))];
    if (failedDayIds.length === 0) return false;
    try {
      const detail = await itineraryApi.getItinerary(itineraryId);
      const { days: serverDays, dayIds: serverDayIds } = mapItineraryDetailToDays(detail);
      let didReconcile = false;
      for (const dayId of failedDayIds) {
        const dayIdx = dayIdsRef.current.indexOf(dayId);
        const serverIdx = serverDayIds.indexOf(dayId);
        if (dayIdx < 0 || serverIdx < 0) continue;
        const stops = serverDays[serverIdx] ?? [];
        reconcileDayWithServer(doc, dayIdx, stops);
        snapshotsRef.current[dayIdx] = snapshotFromStops(stops);
        didReconcile = true;
      }
      return didReconcile;
    } catch {
      return false;
    }
  };

  // flush 한 번(모든 day)을 실제로 수행하는 패스. 겹침 방지는 입구(runFlush)가 맡으므로
  // 여기서는 "지금 문서 상태를 REST에 반영"만 한다 — 반드시 runFlush를 통해서 호출할 것.
  //
  // stopsPerDay(React state)가 아니라 doc에서 매번 직접 읽는다 — Yjs observer가
  // setStopsPerDay를 부른 직후에도 React가 아직 리렌더를 커밋하기 전이면 stopsPerDay는
  // 옛 값 그대로라서, "mutate 하자마자 바로 flush" 같은 흐름(예: 로그 불러오기 직후
  // flushNow)에서 방금 반영한 변경이 아니라 그 이전 상태를 저장해버리는 문제가 있었다.
  // (예약된 재실행도 이 함수를 다시 호출해 문서를 새로 읽으므로 항상 최신 상태를 보낸다.)
  // attempt: 0이면 최초 시도, 1 이상은 자동 재시도. 실패한 항목은 flushDayToRest가
  // snapshot을 갱신하지 않은 채로 남겨두므로, 다음 시도에서 자연히 다시 대상이 된다.
  const flushPass = async (attempt: number) => {
    if (!hasSeededRef.current) return;
    const currentStops = readStopsFromYjs(doc);
    const results = await Promise.all(
      dayIdsRef.current.map((dayId, dayIdx) => {
        if (!dayId) return Promise.resolve<FlushFailure[]>([]);
        const snapshot = (snapshotsRef.current[dayIdx] ??= new Map());
        return flushDayToRest(
          itineraryId,
          dayId,
          currentStops[dayIdx] ?? [],
          snapshot,
          (tempId, realId) => resolveTempId(doc, dayIdx, tempId, realId),
          applyLegTransport,
          {
            readStops: () => readStopsFromYjs(doc)[dayIdx] ?? [],
            removeMissingStop: (id) => yDeleteStop(doc, dayIdx, id),
            reconcileWithServer: (stops) => reconcileDayWithServer(doc, dayIdx, stops),
          },
          {
            getVersion: () => versionsRef.current[dayIdx],
            setVersion: (v) => {
              versionsRef.current[dayIdx] = v;
            },
            dayIdx,
            totalDays: dayIdsRef.current.length,
            onConflict: () => onVersionConflictRef.current?.(),
          },
          // flushDayToRest는 내부에서 실패를 전부 잡아 배열로 돌려주지만, 예상 못한
          // 예외로 Promise.all 전체가 깨져 다른 day의 결과까지 잃지 않도록 막아둔다.
        ).catch((error: unknown): FlushFailure[] => [
          {
            kind: "update",
            dayId,
            message: "일정을 저장하지 못했어요. 잠시 후 다시 시도해요.",
            error,
          },
        ]);
      }),
    );

    const allFailures = results.flat();
    // 낙관적 락 충돌(409)은 flushDayToRest가 이미 자체적으로 서버 최신 상태로 reconcile하고
    // "1회 재시도"까지 끝낸 뒤 돌아온 것이다 — 여기서 또 지수 백오프로 재시도하면 이미 끝난
    // 충돌을 다시 건드리는 셈이라 의미가 없다. 실제로 더 재시도가 필요한 실패(네트워크 오류,
    // 검증 실패 등)만 아래 재시도 로직의 대상으로 삼는다.
    const failures = allFailures.filter((f) => !f.conflict);
    // 실패가 없다면 이번 패스에서 보낸 변경은 모두 서버에 반영됐다. 상세 캐시를 갱신할
    // 기회를 호출부에 준다(변경이 없었던 패스도 갱신해도 무해하다 — 서버 값과 같다).
    if (failures.length === 0) {
      onFlushedRef.current?.();
      return;
    }

    const willRetry = attempt < MAX_FLUSH_RETRIES;
    // 더 재시도할 게 없으면 이 시점 로컬(Yjs)엔 서버에 반영되지 못한 편집이 그대로 남는다.
    // 다음 flush 트리거(추가 편집, 재합류 등)가 없으면 영영 그 상태로 남아, 화면은 바뀐
    // 값을 보여주지만 새로고침하면 사라지는 예전 사고와 같은 모양이 된다. 조용히 두지 않고
    // 서버 최신 상태로 강제 동기화해 화면과 DB를 다시 일치시킨다.
    const reconciled = willRetry ? false : await reconcileFailedDays(failures);
    onFlushErrorRef.current?.({
      failures,
      message: failures[0].message,
      attempt: attempt + 1,
      willRetry,
      reconciled,
    });
    if (!willRetry) return;

    // 짧은 지연 후 한 번 더(최대 MAX_FLUSH_RETRIES회) — 중복 시각 400처럼 "다른 항목이
    // 먼저 반영되면 풀리는" 실패가 대부분이라 대개 이 재시도에서 성공한다.
    if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    retryTimerRef.current = window.setTimeout(
      () => {
        retryTimerRef.current = null;
        void runFlush(attempt + 1);
      },
      FLUSH_RETRY_DELAY_MS * (attempt + 1),
    );
  };

  // flush 입구. 이미 돌고 있는 flush가 있으면 새로 시작하지 않고 "끝난 뒤 한 번 더"만
  // 예약하고(coalesce), 돌고 있는 체인을 그대로 돌려준다 — 그래야 이탈 시 완료를 기다리는
  // 호출부(useItineraryYDoc)가 예약된 재실행까지 함께 기다린다.
  //
  // 왜 필요한가: flushDayToRest는 id가 "temp-"로 시작하는 항목을 addItem POST로 만들고,
  // 응답으로 받은 real id를 resolveTempId로 문서에 써야 비로소 "추가 완료"가 된다. 그
  // 응답이 오기 전에 두 번째 flush가 같은 temp- id를 다시 보면 같은 장소를 한 번 더
  // POST해서 DB에 항목이 2개 생기고, 이어지는 reorderItems엔 중복 id가 실려 순서 저장이
  // 400으로 죽는다. 트리거가 여러 개라(2초 디바운스 / 새 인원 합류 / useItineraryYDoc의
  // pagehide·visibilitychange 이탈 저장) 탭을 숨기는 정도의 평범한 조작으로도 겹친다.
  // 이탈 이벤트 쪽 최소 간격 가드는 이탈 이벤트끼리의 중복만 막아서 이 경합과는 무관하다.
  //
  // "진행 중이면 그냥 스킵"으로 막으면 안 된다 — 겹친 호출이 들고 온 더 최신 편집이 영구히
  // 저장되지 않을 수 있어(다음 트리거가 없으면 그대로 끝), 중복 생성을 막는 대신 데이터
  // 손실을 만든다. 그래서 스킵이 아니라 "끝난 뒤 한 번 더"로 미룬다.
  //
  // 예약된 재실행은 attempt 0(최초 시도)으로 돈다: 그 사이 들어온 새 편집이라 실패 재시도
  // 예산을 새로 주는 게 맞다. 재실행은 "진행 중에 들어온 호출"이 있을 때만 일어나므로
  // (루프 안에서 스스로 플래그를 세우는 경로는 없다) 이 루프가 저절로 계속 돌지는 않는다.
  const runFlush = (attempt: number): Promise<void> => {
    // node-yjs가 flush를 전담하는 동안엔 이 훅에서 REST를 전혀 건드리지 않는다 — 문서(Yjs)
    // 갱신은 이미 다른 경로(add/delete/updateStopTime 등)에서 doc.transact로 끝나 있으므로,
    // 여기서 할 일이 없다.
    if (SERVER_SIDE_FLUSH_ENABLED) return Promise.resolve();
    if (flushChainRef.current) {
      flushAgainRef.current = true;
      return flushChainRef.current;
    }

    const chain = (async () => {
      try {
        let nextAttempt = attempt;
        for (;;) {
          await flushPass(nextAttempt);
          if (!flushAgainRef.current) return;
          flushAgainRef.current = false;
          // 예약된 재실행이 더 최신 상태를 보내므로, 직전 패스가 걸어둔 재시도 타이머는
          // 취소한다(flushAll과 같은 이유 — 그 타이머는 이미 낡은 시도다).
          if (retryTimerRef.current !== null) {
            window.clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
          }
          nextAttempt = 0;
        }
      } finally {
        flushChainRef.current = null;
      }
    })();
    flushChainRef.current = chain;
    return chain;
  };

  const flushAll = () => {
    // 새 flush가 더 최신 상태를 보내므로, 예약돼 있던 재시도는 취소하고 재시도 횟수도
    // 처음부터 다시 센다(사용자의 새 편집엔 새 재시도 기회를 준다).
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    // Promise를 돌려줘야 이탈 시점(useItineraryYDoc의 지연 destroy)이 "저장 완료"를
    // 실제로 기다릴 수 있다. 예전엔 void로 버려서, 언마운트 직후 연결이 끊기고 응답으로
    // 받은 새 항목 id가 이미 파괴된 문서에만 반영됐다.
    return runFlush(0);
  };

  // 언마운트 후에 재시도가 깨어나 요청을 쏘지 않도록 타이머를 정리한다(이탈 시점엔
  // onBeforeDisconnect=flushAll이 이미 최종 상태를 보낸다).
  //
  // 반면 coalesce 예약 플래그(flushAgainRef)는 여기서 비우지 않는다 — 그 플래그는 "아직
  // REST에 못 보낸 최신 편집이 있다"는 뜻이고, 이탈 직전의 마지막 flushAll도 진행 중인
  // 체인에 바로 이 플래그로 합류하기 때문에, 여기서 비우면 마지막 편집을 버리게 된다.
  // 정리하지 않아도 새지 않는다: 두 ref는 이 컴포넌트 인스턴스 전용이고, 진행 중인 체인이
  // 끝나면 flushChainRef는 스스로 null로 돌아간다(runFlush의 finally).
  useEffect(() => {
    return () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  // 편집하고 몇 초 지나면 자동으로 DB에 반영한다("저장 버튼 없음" 전제). 이탈 시/합류 시
  // 트리거만으로는, 페이지를 나가지 않고 계속 머무는 사용자의 편집이(특히 아직 실시간
  // 협업 서버가 없어서 이탈 트리거 자체가 잘 안 걸리는 지금 같은 상황엔 더더욱) 전혀
  // 저장되지 않는 문제가 있었다.
  useEffect(() => {
    if (SERVER_SIDE_FLUSH_ENABLED) return;
    const timer = window.setTimeout(() => flushAll(), 2000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsPerDay]);

  const { status, synced, getProvider, connectionState, isCollabUnavailable } = useItineraryYDoc(
    itineraryId,
    doc,
    flushAll,
  );

  // WS 동기화가 끝난 뒤에만 시딩한다 — synced=true가 되는 시점엔 원격(Redis)에 이미
  // 있던 days가 doc에 먼저 반영된 후라, seedYjsDays의 "로컬 문서 비어있으면 시딩" 가드가
  // 방금 합쳐진 원격 상태까지 포함해서 "진짜 처음 여는 일정인지"를 정확히 판단한다.
  // 동기화가 SEED_FALLBACK_MS 안에 안 끝나면(연결 실패, 오프라인 등) 그냥 REST 값으로
  // 시딩해서 로컬 편집만이라도 항상 가능하게 한다.
  useEffect(() => {
    if (synced) {
      seedYjsDays(doc, dayIdsRef.current, initialDaysRef.current);
      // 이미 시딩된 방을 재오픈한 경우, 그 사이 백엔드에서 새로 계산된 이동수단 정보를
      // 이번 REST 응답 기준으로 채워 넣는다 (없으면 새로고침할 때마다 잠깐 떴다가
      // 사라지는 버그가 있었음 — Yjs 쪽 항목엔 이동수단이 비어있는 채로 굳어있어서).
      reconcileTransportFromRest(doc, dayIdsRef.current, initialDaysRef.current);
      // 예전 버그로 하루 전체가 같은 시각(대개 00:00)으로 굳어버린 방을 REST 값으로 되돌린다.
      reconcileBrokenTimesFromRest(doc, dayIdsRef.current, initialDaysRef.current);
      hasSeededRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeeded(true);
      return;
    }
    const timer = window.setTimeout(() => {
      seedYjsDays(doc, dayIdsRef.current, initialDaysRef.current);
      reconcileTransportFromRest(doc, dayIdsRef.current, initialDaysRef.current);
      reconcileBrokenTimesFromRest(doc, dayIdsRef.current, initialDaysRef.current);
      hasSeededRef.current = true;
      setSeeded(true);
    }, SEED_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [doc, synced]);

  // Yjs 상태 변화를 로컬 state로 반영한다 (렌더링은 이 state만 본다). 새로 만든 Y.Doc은
  // 항상 빈 상태로 시작해서 — 처음 마운트 시점에 즉시 읽어버리면 아직 시딩/동기화가
  // 안 된 빈 문서로 REST에서 받아온 initialDays를 덮어써 버린다. 그래서 "실제 변화가
  // 생겼을 때"(시딩 완료, 원격 피어의 수정, 내 mutation)만 반영하고, 마운트 시점엔
  // initialDays를 그대로 보여준다 — WS가 아예 연결 안 돼도 화면이 비지 않게 하기 위함.
  useEffect(() => {
    return observeYjsDays(doc, () => setStopsPerDay(readStopsFromYjs(doc)));
  }, [doc]);

  // 내 프레즌스(이름/색/아바타)를 알린다. currentUser가 나중에 로드되거나 provider가
  // status 변화(connecting→connected)로 뒤늦게 생겨도 다시 타도록 status를 deps에 둔다.
  // 색은 userId 해시로 정해서 같은 사람이 늘 같은 색을 갖게 하고, 겹칠 때만 userId가 큰
  // 쪽이 양보한다(participantColor.ts). 그래서 누가 들어오고 나가든, 새로고침을 하든
  // 내 색은 그대로다 — 예전엔 접속마다 랜덤으로 뽑고 겹칠 때 양쪽이 서로를 피해서
  // 색이 계속 바뀌었다.
  useEffect(() => {
    const provider = getProvider();
    if (!provider || !currentUser) return;

    const broadcastPresence = () => {
      const peers: CollaboratorInfo[] = [];
      provider.awareness.getStates().forEach((state, clientId) => {
        if (clientId === provider.awareness.clientID) return;
        const peerUser = state.user as CollaboratorInfo | undefined;
        if (peerUser?.colorClass) peers.push(peerUser);
      });

      const colorClass = resolveParticipantColorClass(currentUser.id, peers);
      const localUser = provider.awareness.getLocalState()?.user as CollaboratorInfo | undefined;

      // 실제로 바뀐 게 없으면 재브로드캐스트하지 않는다 — setLocalStateField는 내용이
      // 같아도 awareness "change"를 다시 쏴서, 그대로 두면 무한 루프에 빠진다.
      if (
        localUser?.id === currentUser.id &&
        localUser?.name === currentUser.nickname &&
        localUser?.colorClass === colorClass &&
        localUser?.avatarUrl === currentUser.profileImageUrl
      ) {
        return;
      }

      provider.awareness.setLocalStateField("user", {
        id: currentUser.id,
        name: currentUser.nickname,
        colorClass,
        avatarUrl: currentUser.profileImageUrl,
      });
    };

    broadcastPresence();
    provider.awareness.on("change", broadcastPresence);
    return () => provider.awareness.off("change", broadcastPresence);
  }, [doc, getProvider, status, currentUser]);

  const [collaboratorsByStop, setCollaboratorsByStop] = useState<Map<string, CollaboratorInfo[]>>(
    new Map(),
  );

  // 새 인원 합류(awareness에 피어 추가) 시 DB에 한 번 반영하고, 매 변화마다 "누가 어떤
  // 항목을 보고 있는지" 맵도 다시 계산한다.
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const recomputeCollaborators = () => {
      const map = new Map<string, CollaboratorInfo[]>();
      provider.awareness.getStates().forEach((state, clientId) => {
        if (clientId === provider.awareness.clientID) return;
        const user = state.user as CollaboratorInfo | undefined;
        const cursor = state.cursor as CursorState | null | undefined;
        if (!user || !cursor) return;
        const key = `${cursor.dayIdx}:${cursor.itemId}`;
        map.set(key, [...(map.get(key) ?? []), user]);
      });
      setCollaboratorsByStop(map);
    };

    const handleAwarenessChange = ({ added }: { added: number[] }) => {
      if (added.length > 0) flushAll();
      recomputeCollaborators();
    };
    provider.awareness.on("change", handleAwarenessChange);
    recomputeCollaborators();
    return () => provider.awareness.off("change", handleAwarenessChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, getProvider, status]);

  // 3단계: node-yjs가 flush를 전담할 때는 "내가 REST를 성공시켰다"가 아니라 node가 room의
  // flush 결과를 awareness로 브로드캐스트한 걸 구독해서 안내한다(__system 플래그로 실제
  // 참여자 프레즌스와 구분 — recomputeCollaborators는 user/cursor 없는 상태를 이미 걸러내므로
  // 참여자 목록엔 안 보인다). 기존 onFlushError/onFlushed 콜백을 그대로 재사용해서
  // ItineraryMain의 토스트/캐시 무효화 로직을 새로 만들지 않는다.
  useEffect(() => {
    if (!SERVER_SIDE_FLUSH_ENABLED) return;
    const provider = getProvider();
    if (!provider) return;

    let lastSavedAt = 0;
    const handleSaveStatus = () => {
      const states = Array.from(provider.awareness.getStates().values()) as Array<{
        __system?: boolean;
        saveStatus?: "saved" | "error";
        savedAt?: number;
      }>;
      const system = states.find((state) => state.__system === true);
      if (!system || typeof system.savedAt !== "number" || system.savedAt <= lastSavedAt) return;
      lastSavedAt = system.savedAt;

      if (system.saveStatus === "saved") {
        onFlushedRef.current?.();
        return;
      }
      onFlushErrorRef.current?.({
        failures: [],
        message: "일정을 저장하지 못했어요. 잠시 후 다시 시도해요.",
        attempt: 1,
        willRetry: false,
        reconciled: false,
      });
    };

    provider.awareness.on("change", handleSaveStatus);
    return () => provider.awareness.off("change", handleSaveStatus);
  }, [doc, getProvider, status]);

  const setFocusedStop = (dayIdx: number, itemId: string | null) => {
    getProvider()?.awareness.setLocalStateField(
      "cursor",
      itemId ? ({ dayIdx, itemId } satisfies CursorState) : null,
    );
  };

  // 항상 최신 콜백을 참조하기 위한 ref (stale closure 방지, effect는 [doc]에만 반응).
  const onRemoteActivityRef = useRef(onRemoteActivity);
  useEffect(() => {
    onRemoteActivityRef.current = onRemoteActivity;
  });

  // 다른 피어가 만든 변경(추가/삭제/시간변경/교체/최적화/로그 불러오기)만 골라서 알려준다.
  // 내가 만든 변경은 transaction.local === true라서 여기서 걸러진다(내가 한 행동에
  // 내가 알림을 받는 걸 방지).
  //
  // 기준점(lastSeenLen)은 WS 동기화가 끝난 뒤(원격 Redis에 있던 과거 활동 로그가 doc에
  // 이미 반영된 시점)에 잡아야 한다 — 시딩과 똑같은 이유로, 동기화 전(빈 문서 상태)에
  // 기준점을 0으로 잡으면 새로고침할 때마다 Redis에 쌓여있던 과거 로그 전체가 "새
  // 이벤트"로 재생되어 예전에 지운 일정의 "삭제됐어요" 토스트 같은 게 계속 다시 뜬다.
  useEffect(() => {
    let started = false;
    let lastSeenLen = 0;

    const establishBaseline = () => {
      if (started) return;
      started = true;
      lastSeenLen = readActivityLog(doc).length;
    };

    if (synced) establishBaseline();
    const timer = window.setTimeout(establishBaseline, SEED_FALLBACK_MS);

    const unobserve = observeActivityLog(doc, (transaction) => {
      if (!started || transaction.local) return;
      const entries = readActivityLog(doc);
      const newEntries = entries.slice(lastSeenLen);
      lastSeenLen = entries.length;
      newEntries.forEach((entry) => onRemoteActivityRef.current?.(entry));
    });

    return () => {
      window.clearTimeout(timer);
      unobserve();
    };
  }, [doc, synced]);

  const onRemoteAccommodationRef = useRef(onRemoteAccommodation);
  useEffect(() => {
    onRemoteAccommodationRef.current = onRemoteAccommodation;
  });

  // 활동 로그와 같은 이유로 WS 동기화가 끝난 뒤부터만 반응한다 — 동기화 중에 들어오는
  // Redis의 옛 숙소 값까지 "원격 변경"으로 받아 방금 불러온 DB 값을 덮어쓰면 안 된다.
  useEffect(() => {
    let started = false;
    const start = () => {
      started = true;
    };
    if (synced) start();
    const timer = window.setTimeout(start, SEED_FALLBACK_MS);
    const unobserve = observeSharedAccommodation(doc, (place) => {
      if (started) onRemoteAccommodationRef.current?.(place);
    });
    return () => {
      window.clearTimeout(timer);
      unobserve();
    };
  }, [doc, synced]);

  const logActivity = (action: ActivityAction, placeName: string) => {
    yLogActivity(doc, currentUser?.nickname ?? "누군가", action, placeName);
  };

  // stopsPerDay(Yjs 유래, 그룹 공유)엔 status가 없으므로(itineraryYjsSchema 참고), 여기서
  // 로컬 전용 completedStopIds를 덧씌워 화면에 넘긴다.
  const stopsPerDayWithStatus = stopsPerDay.map((day) =>
    day.map((stop) => ({
      ...stop,
      status: (completedStopIds.has(stop.id) ? "completed" : "verify") as BaseStop["status"],
    })),
  );

  return {
    stopsPerDay: stopsPerDayWithStatus,
    status,
    // 실시간 연결 상태(끊김 / 협업 서버 설정 누락)를 그대로 통과시켜 노출만 해둔 값이다 —
    // 아직 이 값을 쓰는 화면이 없다. 화면 안내 연결은 후속 작업(useItineraryYDoc 주석 참고).
    connectionState,
    isCollabUnavailable,
    seeded,
    collaboratorsByStop,
    setFocusedStop,
    logActivity,
    // 숙소 저장이 성공한 뒤 호출한다 — 저장 전에 공유하면 실패했을 때 다른 사람 화면에만
    // 바뀐 값이 남는다.
    publishAccommodation: (place: SharedAccommodation | null) => {
      setSharedAccommodation(doc, place);
      yLogActivity(doc, currentUser?.nickname ?? "누군가", "accommodation", place?.name ?? "");
    },
    // 로그 불러오기처럼 "한 번에 크게 바뀌는" 확정적인 액션 직후엔, 2초 디바운스를
    // 기다리지 않고 바로 저장한다 — 사용자가 결과를 보자마자 새로고침해보면 디바운스
    // 타이머가 끝나기 전에 페이지가 죽어서 저장 기회를 잃을 수 있다.
    flushNow: flushAll,
    addStop: (dayIdx: number, stop: BaseStop) => yAddStop(doc, dayIdx, stop),
    deleteStop: (dayIdx: number, itemId: string) => yDeleteStop(doc, dayIdx, itemId),
    updateStopTime: (dayIdx: number, itemId: string, time: string) =>
      yUpdateStopTime(doc, dayIdx, itemId, time),
    replaceStop: (dayIdx: number, itemId: string, newStop: BaseStop) =>
      yReplaceStop(doc, dayIdx, itemId, newStop),
    updateStopTransport: (dayIdx: number, itemId: string, transport: BaseStop["transport"]) =>
      yUpdateStopTransport(doc, dayIdx, itemId, transport),
    // 인증완료 표시는 "나"만의 로컬 상태다 — Yjs로 보내지 않고 이 클라이언트의 state만
    // 바꾼다(status===undefined면 되돌리기, 지금은 완료 표시 전용으로만 호출됨).
    updateStopStatus: (_dayIdx: number, itemId: string, status: BaseStop["status"]) =>
      setCompletedStopIds((prev) => {
        const next = new Set(prev);
        if (status === "completed") next.add(itemId);
        else next.delete(itemId);
        return next;
      }),
    pushOptimizedOrder: (dayIdx: number, stops: BaseStop[]) =>
      yPushOptimizedOrder(doc, dayIdx, stops),
    replaceStopsWithImportedLog: (dayIdx: number, stops: BaseStop[]) =>
      yReplaceStopsWithImportedLog(doc, dayIdx, stops),
    shiftFollowingStopTimes: (
      dayIdx: number,
      fromItemId: string,
      deltaMinutes: number,
      boundaryMinutes?: number,
    ): ShiftTimesResult =>
      yShiftFollowingStopTimes(doc, dayIdx, fromItemId, deltaMinutes, boundaryMinutes),
  };
}

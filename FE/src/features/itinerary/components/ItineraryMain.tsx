"use client";

import HotelIcon from "@/assets/icons/itinerary/hotel.svg?svgr";
import PencilIcon from "@/assets/icons/itinerary/pencil.svg?svgr";
import { LoadingBoundary, PageCard, Toast } from "@/components";
import type { SearchPlace } from "@/components/place/PlaceSearchPanel";
import type { AccommodationPlace, ItineraryStop, ModalType } from "@/features/itinerary";
import {
  AccommodationSearchField,
  ItineraryFlowResumeBanner,
  ItineraryHeader,
  ItineraryModals,
  SlidingTimeline,
} from "@/features/itinerary";
import type {
  ActivityAction,
  ActivityLogEntry,
} from "@/features/itinerary/collab/itineraryYjsSchema";
import {
  useCollaborativeItinerary,
  type FlushErrorInfo,
} from "@/features/itinerary/collab/useCollaborativeItinerary";
import { useTransportBackfill } from "@/features/itinerary/hooks/useTransportBackfill";
import { getDefaultItineraryDay } from "@/features/itinerary/utils/itinerarySelection";
import {
  getActiveTransportOptionId,
  MAX_STOPS_PER_DAY,
  type BaseStop,
} from "@/features/itinerary/utils/scheduleUtils";
import { itineraryApi, userApi } from "@/shared/api/domains";
import type { TripTimeBounds } from "@/shared/utils/tripTimeBounds";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useApplyImportedTravelLog, useImportedTravelLog } from "../hooks/useImportedTravelLog";
import { useItineraryOptimization } from "../hooks/useItineraryOptimization";
import { useItineraryTransport } from "../hooks/useItineraryTransport";
import {
  getDefaultStopTime,
  validateStopTime as validateItineraryStopTime,
} from "../utils/itineraryTimeRules";

// 다른 참여자가 만든 변경을 토스트/안내팝업 메시지로 바꾸는 규칙. "누가 뭘 했는지"는
// activityLog 엔트리에서 그대로 나오고, 여기서는 문구만 고른다.
const ACTIVITY_MESSAGES: Record<ActivityAction, (entry: ActivityLogEntry) => string> = {
  add: (e) => `${e.actorName}님이 ${e.placeName}을(를) 추가했어요.`,
  delete: (e) => `${e.actorName}님이 ${e.placeName}을(를) 삭제했어요.`,
  time: (e) => `${e.actorName}님이 ${e.placeName}의 시간을 변경했어요.`,
  replace: (e) => `${e.actorName}님이 장소를 ${e.placeName}(으)로 바꿨어요.`,
  optimize: (e) => `${e.actorName}님이 일정을 최적화했어요.`,
  import: (e) => `${e.actorName}님이 다른 여행 기록을 불러왔어요.`,
  accommodation: (e) =>
    e.placeName
      ? `${e.actorName}님이 숙소를 ${e.placeName}(으)로 변경했어요.`
      : `${e.actorName}님이 숙소를 삭제했어요.`,
};

// 상세 조회 응답 타입 — 스키마가 바뀌어도 따라가도록 API 함수 반환 타입에서 뽑는다.
type ItineraryDetailData = Awaited<ReturnType<typeof itineraryApi.getItinerary>>;

export function ItineraryMain({
  itineraryId,
  groupId,
  tripTitle,
  initialDays: initialDaysData,
  initialDates: initialDatesData,
  dayIds,
  initialVersions,
  tripTimeBounds,
}: {
  itineraryId: string;
  groupId?: string;
  tripTitle?: string;
  initialDays: BaseStop[][];
  initialDates: string[];
  dayIds: string[];
  initialVersions: (number | undefined)[];
  tripTimeBounds: TripTimeBounds | null;
}) {
  const router = useRouter();
  // 실시간 공동편집 프레즌스(누가 어떤 항목을 보고 있는지)에 내 이름/아바타를 알리는 용도.
  const { data: myProfile } = useQuery({
    queryKey: userApi.keys.me(),
    queryFn: userApi.getMyProfile,
  });
  const searchParams = useSearchParams();
  const importedLogId = searchParams.get("importedLogId");
  const { importedLog, importedSpotThumbnails, isImportedLogError } =
    useImportedTravelLog(importedLogId);
  // 예전엔 URL의 `?days=`로 화면에 보여줄 날짜 수를 잘랐다. 잘린 날짜는 공동편집 문서에서도
  // 빠지는데, flush는 잘린 dayIds만 순회하며 그 day에 한해 "문서에 없고 서버에 있는 항목"을
  // 지우므로(flushDayToRest 참고) 잘린 날짜 자체는 애초에 flush 대상이 아니었다 — 즉 데이터가
  // 지워지는 문제는 아니었고, 화면에서만 뒷날짜가 사라져 편집이 불가능해지는 문제였다.
  // 레포에 `?days=` 링크가 남아 있지 않아 그대로 제거했고, 날짜 수는 항상 실제 일정 데이터를
  // 기준으로 삼는다.
  const initialDays = initialDaysData;
  const initialDates = initialDatesData;
  const dayIdsSliced = dayIds;
  // 확정 시점에 정한 시작/종료 시간 — 첫날은 시작 시간 이전, 마지막날은 종료 시간 이후로
  // 일정을 옮기지 못하게 막는 데 쓴다. 백엔드엔 시간이 저장되지 않아 로컬에만 있을 수 있다.
  const validateStopTime = (dayIdx: number, time: string) =>
    validateItineraryStopTime(dayIdx, time, dayIdsSliced.length, tripTimeBounds);

  const findStopAtTime = (dayIdx: number, time: string, excludedStopId?: string) =>
    (stopsPerDay[dayIdx] ?? []).find((stop) => stop.id !== excludedStopId && stop.time === time);

  const [currentDay, setCurrentDay] = useState(() => {
    const savedDay = searchParams.get("day");
    const day = savedDay === null ? NaN : Number(savedDay);
    if (
      searchParams.get("tripId") === itineraryId &&
      Number.isInteger(day) &&
      day >= 0 &&
      day < initialDays.length
    )
      return day;
    return getDefaultItineraryDay(initialDates);
  });

  // 현재 히스토리 항목에 날짜를 남겨 상세 화면에서 뒤로 왔을 때 복원한다.
  // 하단 탭으로 /itinerary에 새로 진입하면 오늘 기준으로 다시 선택한다.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tripId", itineraryId);
    url.searchParams.set("day", String(currentDay));
    window.history.replaceState(null, "", url);
  }, [itineraryId, currentDay]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"itinerary" | "error">("itinerary");
  const [modal, setModal] = useState<ModalType | null>(null);
  const [peerUpdateMessage, setPeerUpdateMessage] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();

  const [accommodation, setAccommodation] = useState<AccommodationPlace | null>(
    tripTimeBounds?.accommodationName
      ? {
          name: tripTimeBounds.accommodationName,
          address: tripTimeBounds.accommodationAddress ?? "",
          lat: tripTimeBounds.accommodationLat,
          lng: tripTimeBounds.accommodationLng,
        }
      : null,
  );

  // TODO(백엔드 연동 예정): 숙소는 저장되지만 동선/시간 AI 최적화(onOptimizeClick,
  // ItineraryOptimizeRequest)엔 아직 반영 안 된다. 최적화 요청에 숙소 좌표를 출발/도착
  // 기준점으로 넘기려면 최적화 API에 좌표 필드 추가가 먼저 필요함.
  // 화면의 숙소는 마운트 시점 상세 응답으로 초기화된다. 숙소가 바뀌었는데 상세 캐시를
  // 그대로 두면, 다른 화면에 갔다가 staleTime(60초) 안에 돌아왔을 때 옛 응답으로
  // 다시 초기화돼 방금 바뀐 숙소가 사라진 것처럼 보였다.
  const syncAccommodationCache = (place: AccommodationPlace | null) => {
    queryClient.setQueryData<ItineraryDetailData>(itineraryApi.keys.detail(itineraryId), (prev) =>
      prev
        ? {
            ...prev,
            accommodationName: place?.name ?? undefined,
            accommodationAddress: place?.address ?? undefined,
            accommodationLat: place?.lat,
            accommodationLng: place?.lng,
          }
        : prev,
    );
  };

  const handleAccommodationChange = (place: AccommodationPlace | null) => {
    const previous = accommodation;
    setAccommodation(place);
    syncAccommodationCache(place);

    itineraryApi
      .updateItinerary(itineraryId, {
        // 빈 문자열 = "지우기"를 명시적으로 보내는 신호. 필드 자체를 안 보내면(undefined)
        // JSON에서 키가 통째로 빠져서 백엔드가 "안 건드림"과 구분을 못 하기 때문에,
        // 지울 땐 null이 아니라 빈 문자열로 보낸다(백엔드에서 다시 null로 정규화함).
        accommodationName: place?.name ?? "",
        accommodationAddress: place?.address ?? "",
        accommodationLat: place?.lat,
        accommodationLng: place?.lng,
      })
      .then(() => {
        // 저장이 끝난 값만 같이 보고 있는 참여자에게 공유한다(실시간 반영).
        publishAccommodation(place);
        // 서버가 정규화한 값으로 최종 동기화.
        queryClient.invalidateQueries({ queryKey: itineraryApi.keys.detail(itineraryId) });
      })
      .catch(() => {
        // 저장이 실패했으면 화면도 되돌린다 — 안 되돌리면 저장된 것처럼 보인다.
        setAccommodation(previous);
        queryClient.invalidateQueries({ queryKey: itineraryApi.keys.detail(itineraryId) });
        showToast("숙소 정보를 저장하지 못했어요.", "error");
      });
  };

  const showToast = (message: string, variant: "itinerary" | "error" = "itinerary") => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  // 화면(Yjs)에는 반영됐는데 DB 저장이 실패한 변경이 있을 때. 조용히 넘어가면 사용자는
  // 저장된 줄 알고 새로고침했다가 항목이 사라지는 걸 보게 된다.
  //
  // 자동 재시도가 남아 있는 동안(willRetry)에는 "아직 저장 안 됐고 다시 시도 중"이라는
  // 사실만 한 번 알린다 — 재시도마다 띄우면 곧 성공할 저장까지 실패로 보이기 때문에
  // 첫 실패(attempt===1)에서만 띄운다. 재시도까지 모두 실패한 최종 실패에서는 무엇이
  // 문제인지 알 수 있게 실패 사유(백엔드 message 우선)를 그대로 보여준다.
  const handleSaveFailed = (info: FlushErrorInfo) => {
    // 재시도가 남아 있으면 알리지 않는다. 곧 성공할 저장을 실패로 보여주면
    // 사용자가 같은 편집을 다시 하게 되고, 그게 중복 생성으로 이어졌다.
    // 더 시도할 게 없을 때만 실제 실패 사유를 띄운다.
    if (info.willRetry) return;
    // 최종 실패 후 서버 최신 상태로 강제 동기화됐다면, 화면에 남아있던 저장 안 된 편집은
    // 이미 사라진 상태다 — 원래 실패 문구("~ 저장하지 못했어요")는 사용자가 다시 시도할
    // 대상이 남아있는 것처럼 보이게 하므로, 편집이 되돌아갔다는 사실을 그대로 알린다.
    if (info.reconciled) {
      showToast(
        "동시 편집이 겹쳐 방금 변경이 저장되지 못했어요. 최신 내용으로 되돌렸어요.",
        "error",
      );
      return;
    }
    showToast(info.message, "error");
  };

  // 낙관적 락(409) 충돌 — "네트워크 실패"가 아니라 "다른 사람이 먼저 저장한, 정상적인
  // 동시편집 충돌"이므로 에러 토스트가 아니라 평범한 안내로 보여준다. 재시도가 성공하든
  // 실패하든(useCollaborativeItinerary의 handleVersionConflict) 항상 한 번은 뜬다 — 재시도가
  // 성공해도 방금 화면에 있던 내용은 이미 다른 사람 편집으로 갈아끼워진 뒤이기 때문이다.
  const handleVersionConflict = () => {
    showToast("다른 사람이 먼저 수정해서 최신 내용으로 맞췄어요.");
  };

  // 다른 참여자가 만든 변경(추가/삭제/시간변경/교체/최적화/로그 불러오기)을 알려준다.
  // "로그 불러오기"처럼 일정 전체가 바뀌는 큰 변경은 안내 팝업으로, 나머지는 토스트로.
  const handleRemoteActivity = (entry: ActivityLogEntry) => {
    const message =
      ACTIVITY_MESSAGES[entry.action]?.(entry) ?? `${entry.actorName}님이 일정을 변경했어요.`;
    if (entry.action === "import") {
      setPeerUpdateMessage(message);
      setModal("peerUpdate");
      window.setTimeout(() => {
        setModal((current) => (current === "peerUpdate" ? null : current));
      }, 1800);
      return;
    }
    showToast(message);
  };

  // 순서가 REST에 반영(flush 성공)될 때마다 올라가는 값. 비워진 구간의 교통수단을 다시
  // 계산해달라고 백엔드에 물어보는 시점을 여기에 맞춘다 — 백엔드는 DB의 order_index로
  // "직전 항목"을 찾기 때문에, 순서가 아직 저장되기 전에 물어보면 옛 순서 기준의 엉뚱한
  // 구간이 돌아온다(useTransportBackfill 주석 참고).
  const [transportSyncTick, setTransportSyncTick] = useState(0);

  const {
    stopsPerDay,
    seeded: yjsSeeded,
    collaboratorsByStop,
    setFocusedStop,
    logActivity,
    flushNow,
    addStop: addYjsStop,
    deleteStop: deleteYjsStop,
    updateStopTime: updateYjsStopTime,
    replaceStop: replaceYjsStop,
    updateStopTransport: updateYjsStopTransport,
    updateStopStatus: updateYjsStopStatus,
    pushOptimizedOrder: pushYjsOptimizedOrder,
    replaceStopsWithImportedLog: replaceYjsStopsWithImportedLog,
    shiftFollowingStopTimes: shiftYjsFollowingStopTimes,
    publishAccommodation,
  } = useCollaborativeItinerary(
    itineraryId,
    dayIdsSliced,
    initialDays,
    initialVersions,
    myProfile?.id && myProfile.nickname
      ? {
          id: myProfile.id,
          nickname: myProfile.nickname,
          profileImageUrl: myProfile.profileImageUrl,
        }
      : undefined,
    handleRemoteActivity,
    // 저장 실패는 예전엔 조용히 삼켜져서, 화면엔 바뀐 시간/순서가 보이는데 서버에는
    // 반영되지 않은 채 새로고침하면 되돌아갔다. 무엇을 언제 알릴지는 handleSaveFailed 참고.
    handleSaveFailed,
    handleVersionConflict,
    // 저장이 끝나면 상세 캐시를 무효화한다. 저장 자체는 되는데 캐시(staleTime 60초)에
    // 옛 응답이 남아 있으면, 앱 안에서 이 화면에 다시 들어올 때 그 옛 응답으로 공동편집
    // 문서가 시딩돼 "바꾼 시간이 저장되지 않은 것처럼" 보였다(새로고침하면 캐시가 없어
    // 정상으로 보이던 이유).
    () => {
      queryClient.invalidateQueries({ queryKey: itineraryApi.keys.detail(itineraryId) });
      setTransportSyncTick((tick) => tick + 1);
    },
    // 다른 참여자가 숙소를 바꾸면 내 화면과 상세 캐시에도 바로 반영한다.
    (place) => {
      setAccommodation(place);
      syncAccommodationCache(place);
    },
  );

  // 시각 변경으로 순서가 바뀌면 이웃이 달라진 구간의 교통수단 카드가 비워진다
  // (rebuildTransport가 가짜 역명을 만들지 않으려고 일부러 비운다). 그 구간만 골라 서버가
  // 계산한 실제 경로로 다시 채운다 — 로컬 state가 아니라 Yjs 문서에 써서 같이 보고 있는
  // 다른 참여자 화면에도 반영되게 한다.
  useTransportBackfill({
    itineraryId,
    dayIds: dayIdsSliced,
    stopsPerDay,
    syncTick: transportSyncTick,
    enabled: yjsSeeded,
    applyTransport: updateYjsStopTransport,
  });
  const [tripDates, setTripDates] = useState<string[]>(initialDates);
  // initialDates는 마운트 시점 값을 useState 시드로만 쓰기 때문에, 트립 목록 화면에서
  // 여행 날짜를 수정해 detail이 리페치돼도 그 자체로는 반영되지 않는다(같은 itineraryId면
  // 리마운트도 안 됨). 값이 실제로 바뀔 때만 다시 동기화한다.
  const initialDatesKey = initialDates.join(",");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTripDates(initialDates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDatesKey]);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [timeValue, setTimeValue] = useState({ hour: 12, minute: 0 });

  const touchStartX = useRef(0);

  useApplyImportedTravelLog({
    importedLogId,
    importedLog,
    importedSpotThumbnails,
    yjsSeeded,
    dayIdsSliced,
    replaceYjsStopsWithImportedLog,
    logActivity,
    flushNow,
    setCurrentDay,
    showToast,
  });

  const activeDayStops = stopsPerDay[activeDayIdx] ?? [];
  const activeStopIdx = activeDayStops.findIndex((s) => s.id === activeStopId);
  const activeStop = activeStopIdx >= 0 ? activeDayStops[activeStopIdx] : undefined;
  // 이동수단 모달의 도착지(카카오맵 길찾기 좌표용) — transport는 "이 스팟 → 다음 스팟" 구간이다.
  const activeNextStop = activeStopIdx >= 0 ? activeDayStops[activeStopIdx + 1] : undefined;
  const selectedRouteOptionId = getActiveTransportOptionId(activeStop);

  const closeModal = () => setModal(null);

  const openDelete = (dayIdx: number, id: string) => {
    setActiveDayIdx(dayIdx);
    setActiveStopId(id);
    setModal("delete");
  };
  const openTime = (dayIdx: number, id: string, time: string) => {
    const [h, m] = time.split(":").map(Number);
    setTimeValue({ hour: h, minute: m });
    setActiveDayIdx(dayIdx);
    setActiveStopId(id);
    setModal("time");
  };
  const openTransport = (dayIdx: number, id: string) => {
    setActiveDayIdx(dayIdx);
    setActiveStopId(id);
    setModal("transport");
  };
  const openVerify = (dayIdx: number, id: string) => {
    setActiveDayIdx(dayIdx);
    setActiveStopId(id);
    setModal("verify");
  };

  const confirmDelete = () => {
    if (activeStopId) {
      logActivity("delete", activeStop?.placeName ?? "장소");
      deleteYjsStop(activeDayIdx, activeStopId);
    }
    closeModal();
    showToast("관광지가 삭제되었어요.", "error");
  };
  const confirmTime = () => {
    const timeStr = `${String(timeValue.hour).padStart(2, "0")}:${String(timeValue.minute).padStart(2, "0")}`;
    const validationError = validateStopTime(activeDayIdx, timeStr);
    if (validationError) {
      showToast(validationError, "error");
      return;
    }
    const conflict = findStopAtTime(activeDayIdx, timeStr, activeStopId ?? undefined);
    if (conflict) {
      showToast(`${conflict.placeName}과(와) 같은 시간이에요. 다른 시간을 골라주세요.`, "error");
      return;
    }
    if (activeStopId) {
      logActivity("time", activeStop?.placeName ?? "장소");
      updateYjsStopTime(activeDayIdx, activeStopId, timeStr);
    }
    closeModal();
    showToast("시간이 변경되었어요.");
  };
  const { travelModeOptions, confirmTransport } = useItineraryTransport({
    itineraryId,
    dayIdsSliced,
    activeDayIdx,
    activeStopId,
    activeStop,
    stopsPerDay,
    tripTimeBounds,
    modal,
    closeModal,
    updateYjsStopTransport,
    shiftYjsFollowingStopTimes,
    showToast,
  });
  const confirmVerify = () => {
    if (activeStopId) updateYjsStopStatus(activeDayIdx, activeStopId, "completed");
  };

  const { startOptimize, optimizeDone } = useItineraryOptimization({
    currentDay,
    dayIdsSliced,
    stopsPerDay,
    tripTimeBounds,
    setModal,
    pushYjsOptimizedOrder,
    logActivity,
    showToast,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    if (diff > 0 && currentDay < stopsPerDay.length - 1) setCurrentDay((d) => d + 1);
    if (diff < 0 && currentDay > 0) setCurrentDay((d) => d - 1);
  };

  // PATCH로는 spotId(장소 자체)를 바꿀 수 없어서, 같은 위치에서 통째로 새 장소로 교체한다
  // (flush 시점에 delete+add로 반영됨 — flushItineraryToRest 참고).
  const replacePlace = (dayIdx: number, stopId: string, place: SearchPlace) => {
    const existingTime = stopsPerDay[dayIdx]?.find((s) => s.id === stopId)?.time ?? "00:00";
    replaceYjsStop(dayIdx, stopId, {
      id: `temp-${crypto.randomUUID()}`,
      spotId: place.id,
      time: existingTime,
      placeName: place.name,
      imageUrl: place.imageUrl,
      category: place.collectionCategory,
      status: place.status === "completed" ? "completed" : "verify",
    });
    logActivity("replace", place.name);
    showToast("관광지가 추가되었어요.");
  };

  const confirmTimeInline = (dayIdx: number, stopId: string, time: string) => {
    const validationError = validateStopTime(dayIdx, time);
    if (validationError) {
      showToast(validationError, "error");
      return;
    }
    // 같은 날 같은 시간에 두 곳을 둘 수는 없다 — 순서가 뒤엉키고 이동수단 계산도 깨진다.
    const conflict = findStopAtTime(dayIdx, time, stopId);
    if (conflict) {
      showToast(`${conflict.placeName}과(와) 같은 시간이에요. 다른 시간을 골라주세요.`, "error");
      return;
    }
    logActivity("time", stopsPerDay[dayIdx]?.find((s) => s.id === stopId)?.placeName ?? "장소");
    updateYjsStopTime(dayIdx, stopId, time);
    showToast("시간이 변경되었어요.");
  };

  const addNewStop = (dayIdx: number, place: SearchPlace) => {
    // "+" 버튼은 10개가 차면 미리 숨기지만(ItineraryTimeline), 다른 참여자가 실시간으로
    // 거의 동시에 채워 넣는 경우처럼 그 사이 정원이 찼을 수 있어 여기서도 한 번 더 막는다.
    // 여길 통과해도 최종 판단은 항상 백엔드(addItem)가 한다.
    if ((stopsPerDay[dayIdx]?.length ?? 0) >= MAX_STOPS_PER_DAY) {
      showToast(
        `하루 일정에는 관광지를 최대 ${MAX_STOPS_PER_DAY}개까지만 추가할 수 있어요.`,
        "error",
      );
      return;
    }
    const defaultTime = getDefaultStopTime(
      stopsPerDay[dayIdx] ?? [],
      dayIdx,
      dayIdsSliced.length,
      tripTimeBounds,
    );
    const conflict = findStopAtTime(dayIdx, defaultTime);
    if (conflict) {
      showToast(
        `${conflict.placeName}과(와) 같은 시간이에요. 기존 일정의 시간을 먼저 변경해주세요.`,
        "error",
      );
      return;
    }
    const newStop: BaseStop = {
      id: `temp-${crypto.randomUUID()}`,
      spotId: place.id,
      time: defaultTime,
      placeName: place.name,
      imageUrl: place.imageUrl,
      category: place.collectionCategory,
      status: place.status === "completed" ? "completed" : "verify",
    };
    logActivity("add", place.name);
    addYjsStop(dayIdx, newStop);
    showToast("관광지가 추가되었어요.");
  };

  const allDayStops: ItineraryStop[][] = stopsPerDay.map((dayStops, dayIdx) =>
    dayStops.map((stop) => ({
      ...stop,
      activeEditors: collaboratorsByStop.get(`${dayIdx}:${stop.id}`) ?? [],
      onDelete: () => openDelete(dayIdx, stop.id),
      onTimeClick: () => openTime(dayIdx, stop.id, stop.time),
      onTimeConfirm: (time: string) => confirmTimeInline(dayIdx, stop.id, time),
      onAddPlace: (place: SearchPlace) => replacePlace(dayIdx, stop.id, place),
      onTransportClick: stop.transport ? () => openTransport(dayIdx, stop.id) : undefined,
      onVerify: stop.status === "verify" ? () => openVerify(dayIdx, stop.id) : undefined,
    })),
  );

  // 로그 담기는 "일정 상세 조회 → Yjs 시딩 → 반영"이 순서대로 끝나야 화면에 나온다.
  // 그동안 담기 전 타임라인이 그대로 보여서 "눌렀는데 아무 일도 안 일어난다"처럼 느껴졌다.
  // 그래서 로그 상세 응답(importedLog)이 도착하고 Yjs 시딩(yjsSeeded)이 끝날 때까지 로딩으로
  // 덮는다 — URL 정리와는 무관하다. 위 반영 이펙트가 history.replaceState로 주소만 바꾸는데,
  // 그건 Next의 searchParams를 갱신하지 않아 importedLogId는 언마운트까지 남아 있다.
  // 로그 조회가 실패하면(삭제된 로그 등) 담을 게 없으므로 로딩을 걷어낸다 —
  // 안 그러면 영영 안 끝나는 오버레이에 갇힌다.
  const isImportingLog =
    !!importedLogId &&
    !isImportedLogError &&
    (!importedLog || !importedSpotThumbnails || !yjsSeeded);

  return (
    <LoadingBoundary isLoading={isImportingLog} message="로그를 일정에 담고 있어요">
      <PageCard>
        <ItineraryFlowResumeBanner />
        <ItineraryHeader
          currentDay={currentDay}
          tripName={tripTitle ?? "부지렁즈"}
          onLogsClick={() => router.push("/itinerary/logs")}
          onOptimizeClick={() => setModal("optimize")}
          onTripsClick={() => router.push("/itinerary/trips")}
          onMembersClick={() => setModal("members")}
        />
        <AccommodationSearchField
          value={accommodation}
          onChange={handleAccommodationChange}
          renderTrigger={({ value: place, onOpen }) => (
            <div className="mb-3 flex items-center gap-2 rounded-[14px] border border-main-blue bg-system-navbg px-4 py-2">
              <HotelIcon width={14} height={14} className="shrink-0 fill-sub-gray" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-sub-deepgray">
                {place?.name ?? "숙소를 등록해보세요"}
              </span>
              <button
                type="button"
                onClick={onOpen}
                aria-label="숙소 수정"
                className="flex size-[20px] shrink-0 items-center justify-center rounded-md bg-main-blue active:opacity-70"
              >
                <PencilIcon width={12} height={12} className="fill-main-white" aria-hidden />
              </button>
            </div>
          )}
        />
        <SlidingTimeline
          allDayStops={allDayStops}
          currentDay={currentDay}
          tripDates={tripDates}
          onAddNewPlace={addNewStop}
          onDayChange={setCurrentDay}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onFocusChange={setFocusedStop}
        />
      </PageCard>

      <ItineraryModals
        modal={modal}
        activeStop={activeStop}
        activeNextStop={activeNextStop}
        itineraryId={itineraryId}
        groupId={groupId}
        travelModeOptions={travelModeOptions}
        timeValue={timeValue}
        selectedRouteOptionId={selectedRouteOptionId}
        peerUpdateMessage={peerUpdateMessage}
        accommodationName={accommodation?.name}
        onClose={closeModal}
        onConfirmDelete={confirmDelete}
        onConfirmTime={confirmTime}
        onConfirmTransport={confirmTransport}
        onConfirmVerify={confirmVerify}
        onVerifyContinue={() => showToast("관광지를 수집했어요!")}
        onTimeChange={setTimeValue}
        onOptimizeStart={startOptimize}
        isOptimizeDone={optimizeDone}
      />

      <Toast
        isVisible={toastMessage !== null}
        onHide={() => setToastMessage(null)}
        message={toastMessage ?? ""}
        variant={toastVariant}
      />
    </LoadingBoundary>
  );
}

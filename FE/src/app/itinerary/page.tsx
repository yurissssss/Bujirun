"use client";

import { ItineraryMain } from "@/features/itinerary/components/ItineraryMain";

import { EmptyState, ErrorState, LoadingBoundary, LoadingState, PageCard } from "@/components";
import { ItineraryFlowResumeBanner } from "@/features/itinerary";
import { selectItinerary } from "@/features/itinerary/utils/itinerarySelection";
import { mapItineraryDetailToDays, toHourMinute } from "@/features/itinerary/utils/scheduleUtils";
import { itineraryApi } from "@/shared/api/domains";
import {
  LAST_VIEWED_ITINERARY_EVENT,
  LAST_VIEWED_ITINERARY_KEY,
} from "@/shared/constants/itinerary";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";

// 상세 조회 실패를 "정말 없는 경우"와 "지금 못 불러온 경우"로 가른다. 상태 코드는 레포의
// 기존 방식(axios 에러의 response.status — join/[code], MypageProfile 등과 동일)으로 본다.
const DETAIL_RETRY_LIMIT = 2;

function getErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

// 404(없음)/403(참여자 아님)은 다시 물어도 답이 같고, 사용자에게 사실대로 알려줘야 한다.
function isItineraryGoneError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 404 || status === 403;
}

// 4xx는 재시도해도 결과가 같으니 즉시 포기하고, 5xx와 네트워크 오류(status를 못 얻는 경우)는
// 몇 번 다시 시도한다 — 이 백엔드는 일시적 503 이력이 있어서(generate 타임아웃 등) 한 번
// 흔들린 것만으로 멀쩡한 일정을 "삭제됨"으로 단정하면 안 된다.
function shouldRetryItineraryDetail(failureCount: number, error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status !== undefined && status >= 400 && status < 500) return false;
  return failureCount < DETAIL_RETRY_LIMIT;
}

function subscribeToLastViewedItinerary(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LAST_VIEWED_ITINERARY_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LAST_VIEWED_ITINERARY_EVENT, onStoreChange);
  };
}

function getLastViewedItinerarySnapshot(): string | null {
  try {
    return window.localStorage.getItem(LAST_VIEWED_ITINERARY_KEY);
  } catch {
    return null;
  }
}

function getLastViewedItineraryServerSnapshot(): null {
  return null;
}

function ItineraryEmptyState() {
  const router = useRouter();

  return (
    <PageCard>
      <ItineraryFlowResumeBanner />
      <EmptyState
        title="아직 여행 일정이 없어요"
        description={
          <>
            부지런즈와 함께
            <br />
            여행을 시작해볼까요?
          </>
        }
        primaryAction={{
          label: "여행 시작하기",
          onClick: () => router.push("/itinerary/trips/new"),
        }}
      />
    </PageCard>
  );
}

function RouteLoadingFallback() {
  return (
    <PageCard>
      <LoadingState variant="inline" />
    </PageCard>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <ItineraryPageContent />
    </Suspense>
  );
}

function ItineraryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTripId = searchParams.get("tripId");
  const lastViewedItineraryId = useSyncExternalStore(
    subscribeToLastViewedItinerary,
    getLastViewedItinerarySnapshot,
    getLastViewedItineraryServerSnapshot,
  );

  const { data: itineraries, isLoading: isListLoading } = useQuery({
    queryKey: itineraryApi.keys.lists(),
    queryFn: itineraryApi.getItineraries,
  });

  // 목록에서 직접 선택한 일정이 최우선. 하단 탭처럼 지정 없이 들어오면 오늘 진행 중인
  // 일정 → 가장 가까운 예정 일정 순으로 고르고, 오늘 일정이 여러 개면 마지막 조회 일정을
  // 먼저 보여준다.
  const selectedItinerary = itineraries
    ? selectItinerary(itineraries, requestedTripId, lastViewedItineraryId)
    : undefined;
  // tripId를 명시적으로 받았으면 목록에 아직 없어도 그 id를 그대로 연다. 확정 직후엔
  // 목록 응답에 새 일정이 아직 안 들어와 있는 경우가 있는데, 예전에는 그 id를 조용히
  // 버리고 "최근 수정" 일정으로 폴백해서 방금 만든 게 아닌 엉뚱한 일정이 열렸다
  // (새로고침해야 제대로 나오던 원인). 상세 조회가 실패하면 아래에서 안내한다.
  const itineraryId = requestedTripId ?? selectedItinerary?.id;

  useEffect(() => {
    if (!itineraryId) return;
    try {
      window.localStorage.setItem(LAST_VIEWED_ITINERARY_KEY, itineraryId);
      window.dispatchEvent(new Event(LAST_VIEWED_ITINERARY_EVENT));
    } catch {
      // 저장소 사용이 제한된 환경에서도 일정 자체는 정상 노출한다.
    }
  }, [itineraryId]);

  const {
    data: detail,
    isLoading: isDetailLoading,
    isError: isDetailError,
    error: detailError,
    isFetching: isDetailFetching,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: itineraryApi.keys.detail(itineraryId ?? ""),
    queryFn: () => itineraryApi.getItinerary(itineraryId as string),
    enabled: !!itineraryId,
    retry: shouldRetryItineraryDetail,
    // Yjs 문서 시딩(seedYjsDays)은 "문서가 비어 있을 때" 딱 한 번, 마운트 시점의 이 응답으로
    // 일어난다. 전역 staleTime(60초) 안에 이 화면에 다시 들어오면 그 응답이 "삭제 전" 값일 수
    // 있는데, 그렇게 굳은 항목은 방(room)이 살아있는 한 다시 시딩되지 않아 서버엔 없는 채로
    // 계속 남는다. 그러면 flush가 그 항목을 PATCH/DELETE하며 404를, 순서 반영에선 "항목 구성이
    // 일치하지 않습니다" 400을 무한히 반복한다(2026-09-13 배포본 콘솔에서 확인).
    // 그래서 이 화면에 들어올 때는 캐시가 신선하더라도 항상 한 번 다시 받는다. staleTime 자체는
    // 건드리지 않아서 낙관적 업데이트나 다른 화면의 캐시 동작은 그대로다.
    refetchOnMount: "always",
  });

  const isLoading = isListLoading || isDetailLoading;

  // 위 재조회가 끝나기 전의 (캐시) 응답으로 ItineraryMain을 마운트하면 시딩이 그 값으로 굳어
  // 버리므로, 이번 진입에서 한 번 새로 받은 뒤에 마운트한다. 한 번 통과한 뒤에는 다시 닫히지
  // 않는다 — 이후의 배경 재조회까지 여기서 막으면 화면이 통째로 다시 마운트되며 Yjs 연결과
  // 편집 상태가 끊긴다. 조회가 실패해도(재시도 소진) isDetailFetching이 내려가며 열리므로
  // 로딩에 갇히지 않는다.
  const [seedReadyItineraryId, setSeedReadyItineraryId] = useState<string | null>(null);
  if (itineraryId && detail && !isDetailFetching && seedReadyItineraryId !== itineraryId) {
    setSeedReadyItineraryId(itineraryId);
  }
  const isWaitingForFreshDetail = !!itineraryId && seedReadyItineraryId !== itineraryId;

  // 링크로 받은 tripId가 실제로 삭제됐거나 내 일정이 아닌 경우(404/403). 다른 일정을 대신
  // 열면 "내가 만든 일정이 아닌데 열렸다"가 되므로, 무엇이 일어났는지 알려준다.
  if (requestedTripId && isDetailError && isItineraryGoneError(detailError)) {
    return (
      <PageCard>
        <ItineraryFlowResumeBanner />
        <EmptyState
          title="일정을 찾을 수 없어요"
          description="삭제됐거나 참여 중이 아닌 일정이에요."
          primaryAction={{
            label: "여행 목록 보기",
            onClick: () => router.push("/itinerary/trips"),
          }}
        />
      </PageCard>
    );
  }

  // 그 밖의 실패(5xx·네트워크)는 일정이 없어진 게 아니라 지금 못 불러온 것뿐이다.
  // 자동 재시도를 다 쓴 뒤에도 사용자가 직접 다시 시도할 수 있어야 하므로 재조회 액션을 준다
  // (다시 시도 중에는 LoadingBoundary가 덮어서 "눌렀는데 반응이 없다"로 보이지 않게 한다).
  if (requestedTripId && isDetailError) {
    const status = getErrorStatus(detailError);
    return (
      <LoadingBoundary isLoading={isDetailFetching} message="일정을 불러오는 중이에요">
        <PageCard>
          <ItineraryFlowResumeBanner />
          <ErrorState
            // 설명 문구는 ErrorState의 상태코드 프리셋(500/503)을 그대로 쓴다 — 제목만
            // 이 화면 기준으로 바꿔서, 다른 화면의 오류 안내와 톤이 갈리지 않게 한다.
            code={status === 503 ? 503 : 500}
            title="일정을 불러오지 못했어요"
            primaryAction={{
              label: "다시 시도",
              onClick: () => {
                void refetchDetail();
              },
            }}
            secondaryAction={{
              label: "여행 목록 보기",
              onClick: () => router.push("/itinerary/trips"),
            }}
          />
        </PageCard>
      </LoadingBoundary>
    );
  }

  if (!itineraryId || !detail) {
    return (
      <LoadingBoundary isLoading={isLoading} message="일정을 불러오는 중이에요">
        <ItineraryEmptyState />
      </LoadingBoundary>
    );
  }

  // 시작/종료 시간, 숙소 전부 백엔드(Itinerary 엔티티)에 저장된 값을 그대로 쓴다.
  // 백엔드가 "HH:MM:SS"로 내려주므로 분까지만(HH:MM) 잘라서 쓴다.
  const tripTimeBounds =
    detail.startTime && detail.endTime
      ? {
          // 백엔드가 "09:20:00"처럼 초까지 내려주는 경우가 있어 "HH:mm"으로 맞춰서 쓴다.
          // 이 값이 타임라인 첫 항목 시간으로 그대로 노출되기도 해서(초까지 보이던 버그)
          // 여기서 한 번만 정규화하고 아래 비교/표시는 전부 이 값을 쓴다.
          startTime: toHourMinute(detail.startTime) ?? detail.startTime,
          endTime: toHourMinute(detail.endTime) ?? detail.endTime,
          accommodationName: detail.accommodationName,
          accommodationAddress: detail.accommodationAddress,
          accommodationLat: detail.accommodationLat,
          accommodationLng: detail.accommodationLng,
        }
      : null;
  const { days, dates, dayIds, versions } = mapItineraryDetailToDays(detail, tripTimeBounds);

  return (
    <LoadingBoundary
      isLoading={isLoading || isWaitingForFreshDetail}
      message="일정을 불러오는 중이에요"
    >
      <ItineraryMain
        key={itineraryId}
        itineraryId={itineraryId}
        groupId={detail.groupId}
        tripTitle={detail.title ?? selectedItinerary?.title}
        initialDays={days}
        initialDates={dates}
        dayIds={dayIds}
        initialVersions={versions}
        tripTimeBounds={tripTimeBounds}
      />
    </LoadingBoundary>
  );
}

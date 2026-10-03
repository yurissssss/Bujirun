"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import plusSmallIcon from "@/assets/icons/itinerary/plus-small.svg?url";
import { PageCard, Toast, EmptyState, BackButton } from "@/components";
import { TripCard, TripEditModal, TripDeleteModal, TripDeleteToast } from "@/features/itinerary";
import { ItineraryFlowResumeBanner, TripListSkeleton } from "@/features/itinerary/components";
import type { Trip } from "@/features/itinerary";
import { itineraryApi } from "@/shared/api/domains";
import { getErrorMessage } from "@/shared/utils";
import { toHourMinute } from "@/features/itinerary/utils/scheduleUtils";

type ModalState = { type: "edit"; trip: Trip } | { type: "delete"; trip: Trip } | null;

// apiTime이 없으면(옛날 트립 등 아직 시간이 저장 안 된 경우에만) 00:00으로 대체한다 —
// 실제 저장된 시간이 있는데 여기서 무시하고 00:00을 보여주면, 사용자가 이름/날짜만
// 고치고 저장해도 진짜 시작/종료 시간이 조용히 자정으로 덮어써진다.
function toTripDate(apiDate?: string, apiTime?: string): string {
  // 백엔드가 "09:20:00"처럼 초까지 내려주기도 해서 "HH:mm"으로 맞춰서 쓴다.
  const time = toHourMinute(apiTime) ?? "00:00";
  if (!apiDate) {
    const today = new Date();
    return `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")} ${time}`;
  }
  return `${apiDate.replaceAll("-", ".")} ${time}`;
}

function toApiDate(tripDate: string): string {
  return tripDate.split(" ")[0].replaceAll(".", "-");
}

// "YYYY.MM.DD HH:mm"에서 시간만 뽑아낸다
function toApiTime(tripDate: string): string {
  return tripDate.split(" ")[1] ?? "00:00";
}

// 종료일이 어제 이전인 일정만 목록에서 숨긴다. 데이터는 삭제하지 않으며,
// 오늘 종료되는 일정은 하루가 끝날 때까지 계속 보여준다.
function isPastTrip(endAt?: string): boolean {
  if (!endAt) return false;

  const [year, month, day] = endAt.split("-").map(Number);
  if (!year || !month || !day) return false;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tripEndDate = new Date(year, month - 1, day);
  return tripEndDate < todayStart;
}

export default function TripsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>(null);
  const [completedAction, setCompletedAction] = useState<"delete" | "leave" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const { data: summaries, isLoading } = useQuery({
    queryKey: itineraryApi.keys.lists(),
    queryFn: itineraryApi.getItineraries,
  });

  const trips: Trip[] = (summaries ?? [])
    .filter((summary) => !isPastTrip(summary.endAt))
    // API 응답 순서에 의존하지 않고 여행 시작일이 빠른 순서로 고정한다.
    // 날짜가 없는 구버전 데이터는 정상적인 일정 뒤로 보내고, 같은 날이면 시작 시간이
    // 빠른 일정부터 보여준다. filter가 새 배열을 만들기 때문에 쿼리 캐시는 변경하지 않는다.
    .sort((a, b) => {
      if (!a.startAt) return b.startAt ? 1 : 0;
      if (!b.startAt) return -1;

      const dateOrder = a.startAt.localeCompare(b.startAt);
      if (dateOrder !== 0) return dateOrder;
      return (toHourMinute(a.startTime) ?? "00:00").localeCompare(
        toHourMinute(b.startTime) ?? "00:00",
      );
    })
    .map((summary) => ({
      id: summary.id ?? "",
      name: summary.title ?? "제목 없음",
      startDate: toTripDate(summary.startAt, summary.startTime),
      endDate: toTripDate(summary.endAt, summary.endTime),
      groupId: summary.groupId,
    }));

  const invalidateTrips = () => {
    queryClient.invalidateQueries({ queryKey: itineraryApi.keys.all });
  };

  const handleSelect = useCallback(
    (id: string) => {
      router.push(`/itinerary?tripId=${id}`);
    },
    [router],
  );

  const handleEdit = useCallback(
    async (id: string) => {
      const trip = trips.find((t) => t.id === id);
      if (!trip) return;

      try {
        // 목록 응답의 시간 필드가 비어 있는 구버전/캐시 응답에서도 생성 당시 시간이
        // 00:00으로 덮이지 않도록, 수정 직전에 상세 API 값을 기준으로 모달을 연다.
        const detail = await queryClient.fetchQuery({
          queryKey: itineraryApi.keys.detail(id),
          queryFn: () => itineraryApi.getItinerary(id),
        });
        setModal({
          type: "edit",
          trip: {
            ...trip,
            name: detail.title ?? trip.name,
            startDate: toTripDate(detail.startAt, detail.startTime),
            endDate: toTripDate(detail.endAt, detail.endTime),
          },
        });
      } catch {
        setErrorMessage("여행 정보를 불러오지 못했어요. 다시 시도해주세요.");
      }
    },
    [queryClient, trips],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const trip = trips.find((t) => t.id === id);
      if (trip) setModal({ type: "delete", trip });
    },
    [trips],
  );

  const handleEditConfirm = useCallback(
    async (updated: Trip) => {
      // "무엇이 실제로 바뀌었나"의 기준은 모달을 열 때 쓴 값이어야 한다. 모달은 상세 API
      // 값으로 열리는데(handleEdit), 목록 캐시엔 같은 시간이 "09:00:00"처럼 초까지 들어있거나
      // 아예 없을 수도 있어서 캐시와 비교하면 바뀌지 않았는데도 바뀐 것으로 잡힌다.
      const original = modal?.type === "edit" ? modal.trip : null;
      setModal(null);
      const startAt = toApiDate(updated.startDate);
      const endAt = toApiDate(updated.endDate);
      const startTime = toApiTime(updated.startDate);
      const endTime = toApiTime(updated.endDate);
      const originalStartAt = original ? toApiDate(original.startDate) : null;
      const originalEndAt = original ? toApiDate(original.endDate) : null;
      const originalStartTime = original ? toHourMinute(toApiTime(original.startDate)) : null;
      const originalEndTime = original ? toHourMinute(toApiTime(original.endDate)) : null;

      // 이미 시작한 여행은 날짜를 그대로 다시 보내는 것만으로도 막힌다 —
      // UpdateItineraryRequest.startAt에 @FutureOrPresent가 걸려 있어서 과거 시작일이면
      // "지난 날짜로는 일정을 생성할 수 없습니다" 400이 된다. 목록은 종료일이 지나지 않은
      // 여행을 계속 보여주니(어제 시작해 내일 끝나는 여행) 이름만 고치는 것도 불가능해진다.
      // 그래서 값이 실제로 바뀌지 않은 날짜 필드는 아예 보내지 않는다.
      const sendStartAt = originalStartAt === null || startAt !== originalStartAt;
      // 시간도 같은 이유로 바뀐 것만 보낸다. 여기에 더해 자정은 저장하지 않는다. 서버에 시간이
      // 없는 일정은 모달이 00:00을 대신 보여주는데, 그 값을 그대로 저장하면 여행 종료 시각이
      // 자정으로 박히고 마지막 날 일정이 전부 00:00으로 뭉개진다(scheduleUtils.boundMinutes
      // 주석 참고). 실제로 자정에 시작하거나 끝나는 여행은 없으므로 00:00은 "시간 미지정"으로
      // 보고 필드를 뺀다 — 그래야 이미 저장돼 있던 시간도 덮이지 않는다.
      const sendStartTime = startTime !== "00:00" && startTime !== originalStartTime;
      const sendEndTime = endTime !== "00:00" && endTime !== originalEndTime;

      // 그런데 운영 백엔드(ItineraryService.update)는 startAt/endAt이 하나도 없으면
      // updatePeriod를 아예 호출하지 않고(`if (req.startAt() != null || req.endAt() != null)`),
      // startTime/endTime은 그 updatePeriod 안에서만 반영된다. 그래서 날짜는 그대로 두고
      // 시각만 바꾸면 PATCH는 200인데 서버엔 아무것도 저장되지 않는다 — 낙관적 캐시로 잠깐
      // 보이다가 아래 invalidate에서 서버 값으로 원복된다. 시각이 바뀐 요청에서는 날짜 필드를
      // 하나 같이 보내 그 분기를 열어줘야 한다. startAt이 아니라 endAt을 보내는 이유:
      //  1. startAt/endAt 둘 다 @FutureOrPresent다. 어제 시작해 내일 끝나는 진행 중 여행은
      //     startAt을 그대로 되보내는 것만으로 400이 되지만, 이 목록은 종료일이 지난 여행을
      //     숨기므로(isPastTrip — endAt이 오늘보다 이전이면 제외) 화면에 떠 있는 여행의
      //     endAt은 항상 오늘 이후다. 즉 endAt은 값이 안 바뀌어도 되보내기 안전하다.
      //  2. Itinerary.updatePeriod는 필드별로 null을 건너뛴다(startAt != null일 때만 대입).
      //     endAt만 보내도 이미 저장된 startAt/startTime은 지워지지 않는다.
      //  3. 백엔드의 Day 날짜 재정렬은 startAt이 "실제로 바뀐" 경우에만 돌기 때문에, 같은
      //     endAt을 되보내는 것으로는 Day 날짜도 움직이지 않는다.
      const sendEndAt =
        originalEndAt === null || endAt !== originalEndAt || sendStartTime || sendEndTime;

      // 시작 시간이 실제로 밀렸으면 백엔드가 이후 일정들의 방문 시각도 같은 만큼 밀어준다
      // (ItineraryService.update 참고) — 사용자가 그걸 모르고 넘어가지 않게 안내한다.
      // 원래 시간이 없던(미지정) 여행은 밀 기준이 없으니 안내하지 않는다.
      const timeShifted =
        sendStartTime && Boolean(originalStartTime) && originalStartTime !== "00:00";

      // 네트워크 응답을 기다리지 않고 목록에 바로 반영 — 실패하면 finally의 invalidate가
      // 서버 값으로 다시 맞춰준다. 보내지 않는 필드는 캐시에서도 건드리지 않는다.
      queryClient.setQueryData<typeof summaries>(itineraryApi.keys.lists(), (prev) =>
        prev?.map((summary) =>
          summary.id === updated.id
            ? {
                ...summary,
                title: updated.name,
                ...(sendStartAt ? { startAt } : {}),
                ...(sendEndAt ? { endAt } : {}),
                ...(sendStartTime ? { startTime } : {}),
                ...(sendEndTime ? { endTime } : {}),
              }
            : summary,
        ),
      );

      try {
        await itineraryApi.updateItinerary(updated.id, {
          title: updated.name,
          ...(sendStartAt ? { startAt } : {}),
          ...(sendEndAt ? { endAt } : {}),
          ...(sendStartTime ? { startTime } : {}),
          ...(sendEndTime ? { endTime } : {}),
        });
        if (timeShifted) {
          setInfoMessage("시작 시간이 바뀌어서 이후 일정 시간도 함께 조정됐어요.");
        }
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "여행 수정에 실패했어요. 다시 시도해주세요."));
      } finally {
        invalidateTrips();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modal],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (modal?.type !== "delete") return;
    const { id: tripId, groupId } = modal.trip;
    setModal(null);
    try {
      // 그룹 일정은 다른 참여자의 일정에 영향을 주지 않도록 삭제가 아닌 나가기로 처리한다.
      if (groupId) {
        await itineraryApi.leaveItinerary(tripId);
        setCompletedAction("leave");
      } else {
        await itineraryApi.deleteItinerary(tripId);
        setCompletedAction("delete");
      }
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          groupId
            ? "여행 일정에서 나가지 못했어요. 다시 시도해주세요."
            : "여행 삭제에 실패했어요. 다시 시도해주세요.",
        ),
      );
    } finally {
      invalidateTrips();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal]);

  const closeModal = useCallback(() => setModal(null), []);

  return (
    <PageCard className="relative">
      {/* + 버튼 */}
      <button
        className="absolute top-[28px] right-[32px] size-[24px] rounded-lg bg-sub-coral flex items-center justify-center active:opacity-80 z-10"
        onClick={() => router.push("/itinerary/trips/new")}
      >
        <Image
          src={plusSmallIcon}
          alt=""
          width={20}
          height={20}
          className="brightness-0 invert"
          aria-hidden
        />
      </button>

      {/* 뒤로가기는 직전 화면이 아니라 항상 일정 메인으로 보낸다. 이 화면은 일정 탭 헤더 /
          빈 상태 / 이어하기 배너 등 여러 경로로 들어와서, history.back()이면 생성 플로우
          중간 화면 같은 엉뚱한 곳으로 돌아갈 수 있다. */}
      <BackButton
        variant="plain"
        iconSize={13}
        className="absolute left-[32px] top-[28px] size-[24px]"
        onClick={() => router.push("/itinerary")}
      />

      {/* 헤더 */}
      <div className="flex flex-col items-center gap-1.5 pb-6">
        <span className="font-ssurround font-bold text-lg text-text-heading">여행 목록</span>
      </div>

      {/* 목록이 비었을 땐 숨긴다 — 보여줄 여행이 없는데 "이런 여행만 보여드려요"는
          안내가 아니라 잡음이다. */}
      {(isLoading || trips.length > 0) && (
        <p className="pl-4 pb-2 text-xs text-sub-darkgray font-medium">
          * 진행 중이거나 예정된 여행만 보여드려요.
        </p>
      )}

      {/* 생성 중에 튕겼던 사람이 다시 들어올 입구 */}
      <ItineraryFlowResumeBanner />

      {/* 여행 목록 — 목록 화면은 캐릭터 로딩보다 실제 카드 모양 스켈레톤이 덜 튄다.
          (로딩이 끝나도 레이아웃이 그대로라 "깜빡임"이 안 생긴다) */}
      {isLoading ? (
        <div className="flex-1 overflow-hidden pb-6">
          <TripListSkeleton />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-6 flex flex-col gap-3.5">
          {trips.length === 0 ? (
            <EmptyState
              title="아직 여행이 없어요"
              description="오른쪽 위 (+)로 새 여행을 만들어보세요"
              secondaryAction={{
                label: "로그 둘러보기",
                onClick: () => router.push("/itinerary/logs"),
              }}
              primaryAction={{
                label: "관광지 보러가기",
                onClick: () => router.push("/home/recommend"),
              }}
            />
          ) : (
            trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onSelect={handleSelect}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}

      {/* 수정 모달 */}
      {modal?.type === "edit" && (
        <TripEditModal
          key={modal.trip.id}
          isOpen
          trip={modal.trip}
          onClose={closeModal}
          onConfirm={handleEditConfirm}
        />
      )}

      {/* 삭제 모달 */}
      {modal?.type === "delete" && (
        <TripDeleteModal
          isOpen
          tripName={modal.trip.name}
          isGroupTrip={Boolean(modal.trip.groupId)}
          onClose={closeModal}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* 삭제 토스트 */}
      <TripDeleteToast action={completedAction} onHide={() => setCompletedAction(null)} />

      <Toast
        isVisible={errorMessage !== null}
        onHide={() => setErrorMessage(null)}
        message={errorMessage ?? ""}
        variant="error"
      />
      <Toast
        isVisible={infoMessage !== null}
        onHide={() => setInfoMessage(null)}
        message={infoMessage ?? ""}
        variant="success"
      />
    </PageCard>
  );
}

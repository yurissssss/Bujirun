"use client";

import { Fragment, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Modal, Toast, Button, LoadingState } from "@/components";
import EmergencyIcon from "@/assets/icons/itinerary/emergency-on.svg?svgr";
import { ParticipantAvatarGrid } from "@/features/itinerary/components";
import { itineraryApi } from "@/shared/api/domains";
import { useIsGroupHost } from "@/features/itinerary/hooks/useIsGroupHost";
import { useVoteSessionPolling } from "@/features/itinerary/hooks/useVoteSessionPolling";
import { useItineraryGenerationLockStore, useItineraryFlowStore } from "@/shared/stores";
import { useItineraryFlowProgress } from "@/features/itinerary/hooks/useItineraryFlowProgress";
import { useItineraryFlowTimer } from "@/features/itinerary/hooks/useItineraryFlowTimer";
import { ItineraryFlowCountdown } from "@/features/itinerary/components/ItineraryFlowCountdown";
import {
  VoteConfirmedModal,
  getVoteConfirmedReason,
  type VoteConfirmedNotice,
} from "@/features/itinerary/components/VoteConfirmedModal";

function getWinnerPlan(votes: Record<string, number>): string | null {
  const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  if (sorted.length < 2) return sorted[0]?.[0] ?? null;
  // 동률이면 null 반환
  if (sorted[0][1] === sorted[1][1]) return null;
  return sorted[0][0];
}

function getTiedPlans(votes: Record<string, number>): string[] {
  const max = Math.max(...Object.values(votes));
  return Object.entries(votes)
    .filter(([, v]) => v === max)
    .map(([k]) => k);
}

function PageLoadingFallback() {
  return (
    <div className="flex h-full flex-col">
      <LoadingState />
    </div>
  );
}

export default function VoteWaitingPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <VoteWaitingContent />
    </Suspense>
  );
}

function VoteWaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalSlots = Math.min(6, Math.max(2, Number(searchParams.get("count")) || 6));
  const totalDays = Math.max(1, Number(searchParams.get("days")) || 1);
  const sessionId = searchParams.get("sessionId") ?? "";
  const groupId = searchParams.get("groupId") ?? "";
  const isHost = useIsGroupHost(groupId);
  const tripName = searchParams.get("name") ?? "여행";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const startTime = searchParams.get("startTime") ?? "";
  const endTime = searchParams.get("endTime") ?? "";
  const accommodation = searchParams.get("accommodation") ?? "";
  const accommodationAddress = searchParams.get("accommodationAddress") ?? "";
  const accommodationLat = searchParams.get("accommodationLat") ?? "";
  const accommodationLng = searchParams.get("accommodationLng") ?? "";
  const [selectedTiePlan, setSelectedTiePlan] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<
    "success" | "error" | "warning" | "itinerary" | "default"
  >("default");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  // 3분 제한이 지난 뒤 방장이 "지금 표로 확정"을 눌렀는데 동률이면, 전원 투표 전이라도
  // 기존 동률 모달을 띄워서 방장이 직접 고르게 한다.
  const [isHostSkipping, setIsHostSkipping] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  // 동률 모달은 닫는 길이 없으면 플랜을 고르는 것 외에 빠져나갈 수 없다(모달 오버레이가
  // 하단 탭까지 덮는다). 명시적으로 닫았을 때만 숨기고, 화면에서 다시 열 수 있게 한다.
  const [isTieDismissed, setIsTieDismissed] = useState(false);
  const {
    remainingMs,
    isOver,
    isSynced,
    isError: isTimerError,
  } = useItineraryFlowTimer(groupId, "vote-waiting", sessionId);
  const unlockGeneration = useItineraryGenerationLockStore((state) => state.unlock);
  const clearFlow = useItineraryFlowStore((state) => state.clearFlow);
  const queryClient = useQueryClient();

  useItineraryFlowProgress("vote-waiting", searchParams.toString(), groupId, {
    sessionId,
    tripName,
  });

  // 확정 직후엔 일정 목록 캐시(staleTime 60초)에 새 일정이 아직 없다. 그대로 /itinerary로
  // 보내면 목록에서 못 찾고 "직전에 보던 일정"으로 폴백해서 예전 일정이 열린다.
  // 그래서 목록을 무효화하고, 방금 만들어진 일정 id를 tripId로 직접 지정해서 이동한다.
  const goToNewItinerary = async (itineraryId?: string) => {
    unlockGeneration();
    clearFlow();
    try {
      // 비활성 상태인 목록 캐시도 실제로 다시 받아온 뒤 이동해야, 일정 탭이 새 id를
      // 아직 모르는 상태에서 기존 일정으로 폴백하지 않는다.
      await queryClient.invalidateQueries({
        queryKey: itineraryApi.keys.lists(),
        refetchType: "all",
      });
      // 상세도 미리 받아둔다 — 일정 화면은 마운트 시점 데이터로 Yjs를 시딩하기 때문에,
      // 상세가 아직 없는 채로 열리면 빈 상태가 굳어서 새로고침 전까지 제대로 안 보인다.
      if (itineraryId) {
        await queryClient.prefetchQuery({
          queryKey: itineraryApi.keys.detail(itineraryId),
          queryFn: () => itineraryApi.getItinerary(itineraryId),
        });
      }
    } finally {
      router.push(itineraryId ? `/itinerary?tripId=${itineraryId}` : "/itinerary");
    }
  };

  // 확정되면 바로 넘기지 않고, 어떤 안으로 왜 정해졌는지 먼저 알린 뒤 넘어간다.
  const [confirmedNotice, setConfirmedNotice] = useState<VoteConfirmedNotice | null>(null);
  const showConfirmedNotice = (notice: VoteConfirmedNotice) =>
    setConfirmedNotice((prev) => prev ?? notice);

  // 방장이 finalize를 호출하면 status가 "confirmed"로 바뀐다. 이는 클라이언트가
  // voteCounts로 계산한 winnerPlan/동률 로직과 별개로 백엔드가 실제로 확정했음을
  // 보장하는 신호라서, 동률이라 방장 선택을 기다리던 참여자를 포함해 전원을
  // 확실하게 일정 화면으로 보낸다(어떤 안으로 정해졌는지 안내한 뒤).
  const { voteStatus } = useVoteSessionPolling(sessionId, {
    onConfirmed: (_sessionId, itineraryId, status) =>
      showConfirmedNotice({
        plan: status?.confirmedPlan,
        reason: getVoteConfirmedReason(status, totalSlots),
        itineraryId,
      }),
    onError: () => {
      setToastVariant("error");
      setToastMessage("투표 현황을 불러오지 못했어요.");
    },
  });
  const voteCounts = voteStatus?.voteCounts ?? {};
  const doneCount = Math.min(totalSlots, voteStatus?.totalVotes ?? 0);
  // 아무도 투표하지 않으면 voteCounts가 {A:0,B:0,C:0}으로 내려와서 "0표끼리 동률"로 잡힌다.
  // 그래서 실제로 들어온 표가 있는지를 따로 본다(totalVotes가 비어 오는 경우까지 감안해
  // 표 합계와 함께 확인한다).
  const castVoteCount = Object.values(voteCounts).reduce((sum, count) => sum + (count ?? 0), 0);
  const hasAnyVote = Math.max(voteStatus?.totalVotes ?? 0, castVoteCount) > 0;
  const winnerPlan = getWinnerPlan(voteCounts);
  const tiedPlans = getTiedPlans(voteCounts);
  // 표가 있는 진짜 동률일 때만 동률 모달을 띄운다.
  const isTieUnresolved =
    hasAnyVote &&
    tiedPlans.length > 1 &&
    !winnerPlan &&
    !selectedTiePlan &&
    (doneCount >= totalSlots || isHostSkipping);
  // 확정 안내가 뜨면 동률 모달은 닫는다(참여자는 방장이 고른 결과를 확정 안내로 본다).
  const showTieModal = isTieUnresolved && !isTieDismissed && !confirmedNotice;

  // 제한 시간이 지나면 방장은 아직 투표 안 한 사람을 기다리지 않고 현재 표로 확정할 수 있다.
  const handleHostSkip = () => {
    setShowSkipConfirm(false);
    // 표가 한 장도 없는 경우를 최다 득표/동률 판정보다 먼저 걸러야 한다. 0표 상태에서는
    // 최다 득표도 없고 모든 안이 "같은 0표"라, 그냥 두면 사실과 다른 동률 모달이 뜬다.
    if (!hasAnyVote) {
      setToastVariant("warning");
      setToastMessage("아직 투표한 사람이 없어요. 조금만 더 기다려주세요.");
      return;
    }
    if (winnerPlan) {
      setToastVariant("success");
      setToastMessage(`${winnerPlan}안이 최다 투표로 선택됐어요! 🎉`);
      void confirmPlan(winnerPlan);
      return;
    }
    if (tiedPlans.length > 1) {
      setIsTieDismissed(false);
      setIsHostSkipping(true);
      return;
    }
    // 표는 있다는데 안별 집계가 비어 온 경우 — 조용히 아무 일도 안 일어나면 방장은
    // 버튼이 먹지 않는 것으로 보이므로 이유를 알려준다.
    setToastVariant("error");
    setToastMessage("투표 현황을 확인하지 못했어요. 잠시 후 다시 시도해주세요.");
  };

  // 모달에서 빠져나가는 길. 방장이 마감을 눌러서 열린 모달이면 "마감 전"으로 되돌려서
  // 대기 화면의 마감 버튼으로 언제든 다시 들어올 수 있게 하고, 전원 투표로 열린 모달이면
  // 잠시 닫아둔 뒤 같은 화면에서 다시 열 수 있게 한다.
  const handleTieDismiss = () => {
    if (isHostSkipping) {
      setIsHostSkipping(false);
      return;
    }
    setIsTieDismissed(true);
  };

  const confirmPlan = async (planType: string) => {
    setIsConfirming(true);
    try {
      // 확정은 리더 전용 API라 방장 클라이언트만 실제로 호출하고,
      // 참여자는 방장이 확정할 때까지 기다렸다가 같은 화면 흐름으로 넘어간다.
      // itineraryId 없이 먼저 이동하면 기존 일정이 선택되고 폴링도 중단된다.
      // 참여자는 onConfirmed에서 새 id를 받을 때까지 이 화면에서 대기한다.
      if (!isHost) return;

      // finalize 요청에 숙소/시간까지 함께 실어서 원자적으로 저장한다 — 세션이
      // "confirmed"로 바뀌는 시점과 숙소 저장 시점 사이에 참여자가 일정 화면으로
      // 넘어가버려 숙소 정보가 비어 보이던 race condition을 없애기 위함.
      const newItineraryId = await itineraryApi.finalizeItinerary(sessionId, {
        freePass: false,
        selectedPlan: planType,
        title: tripName,
        startDate,
        endDate,
        startTime,
        endTime,
        accommodationName: accommodation,
        accommodationAddress,
        ...(accommodationLat ? { accommodationLat: Number(accommodationLat) } : {}),
        ...(accommodationLng ? { accommodationLng: Number(accommodationLng) } : {}),
        // C안(자유 편집형)은 AI가 만든 내용이 없어서, 빈 Day만 일수에 맞게 만들어달라고 명시해야 한다.
        ...(planType === "C"
          ? {
              days: Array.from({ length: totalDays }, (_, i) => ({
                day: i + 1,
                spotContentIds: [],
              })),
            }
          : {}),
      });
      showConfirmedNotice({
        plan: planType,
        reason: getVoteConfirmedReason(voteStatus, totalSlots, planType),
        itineraryId: newItineraryId,
      });
    } catch {
      setToastVariant("error");
      setToastMessage("일정을 확정하지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsConfirming(false);
    }
  };

  // 전원 투표 완료 처리
  useEffect(() => {
    if (doneCount < totalSlots) return;

    if (!winnerPlan) return;

    // 단독 1위: 토스트 후 일정 메인 이동
    const toastTimer = window.setTimeout(() => {
      setToastVariant("success");
      setToastMessage(`${winnerPlan}안이 최다 투표로 선택됐어요! 🎉`);
    }, 0);
    const timer = window.setTimeout(() => {
      confirmPlan(winnerPlan);
    }, 1800);
    return () => {
      window.clearTimeout(toastTimer);
      window.clearTimeout(timer);
    };
    // confirmPlan은 매 렌더마다 새로 만들어져서 참조 자체를 deps에 넣으면 안 됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneCount, totalSlots, winnerPlan]);

  const handleTiePick = (plan: string) => {
    setSelectedTiePlan(plan);
    setToastVariant("success");
    setToastMessage(`방장이 ${plan}안을 선택했어요! 🎉`);
    window.setTimeout(() => {
      confirmPlan(plan);
    }, 1800);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pb-16">
      <div className="flex w-full flex-col items-center rounded-[30px] border border-white/40 bg-gradient-to-b from-system-glassfrom to-system-glassto px-[30px] py-[42px] backdrop-blur-[15px]">
        <p className="text-center font-paperlogy text-xl font-medium leading-[23px] text-text-heading">
          {doneCount >= totalSlots ? (
            <>
              투표가 완료됐어요! 🎉
              <br />
              일정을 확정하고 있어요...
            </>
          ) : (
            <>
              친구들이 아직 투표 중이에요...
              <br />
              잠시만 기다려주세요 😇
            </>
          )}
        </p>

        <p className="mt-[27px] text-center font-paperlogy text-md font-bold text-sub-deepblue">
          ( {doneCount} / {totalSlots} )
        </p>

        <ParticipantAvatarGrid total={totalSlots} activeCount={doneCount} className="mt-5" />

        {/* 동률 모달을 닫아둔 상태 — 닫고 나면 되돌아올 길이 없으면 안 되므로 다시 여는 버튼을 둔다. */}
        {isTieUnresolved && isTieDismissed && (
          <div className="mt-5 flex w-full flex-col items-center gap-2">
            <p className="text-center font-paperlogy text-sm font-normal text-text-primary">
              {isHost
                ? "투표가 동률이에요. 방장이 최종 일정을 골라주세요."
                : "투표가 동률이에요. 방장이 최종 일정을 고르고 있어요."}
            </p>
            <Button variant="primary" onClick={() => setIsTieDismissed(false)}>
              동률 결과 다시 보기
            </Button>
          </div>
        )}

        {/* 3분 제한 — 투표를 안 하고 사라진 사람 때문에 그룹 전체가 갇히지 않게,
            제한이 지나면 방장이 현재 표로 확정할 수 있다. */}
        {doneCount < totalSlots && (
          <div className="mt-5 flex w-full flex-col items-center gap-2">
            {!isSynced ? (
              <p className="text-center font-paperlogy text-sm text-sub-darkgray">
                {isTimerError
                  ? "남은 시간을 불러오지 못했어요. 다시 시도해 주세요"
                  : "남은 시간을 확인하고 있어요"}
              </p>
            ) : isOver ? (
              isHost ? (
                <>
                  <p className="text-center font-paperlogy text-sm font-normal text-text-primary break-keep">
                    시간이 끝났어요.
                    <br />
                    다음 단계로 넘어가 주세요
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowSkipConfirm(true)}
                    disabled={isConfirming}
                  >
                    {isConfirming ? "확정 중..." : "기다리지 않고 진행하기"}
                  </Button>
                </>
              ) : (
                <p className="text-center font-paperlogy text-sm font-normal text-text-primary break-keep">
                  시간이 끝났어요.
                  <br />
                  방장이 다음 단계로 넘어가기를 기다리고 있어요
                </p>
              )
            ) : (
              <ItineraryFlowCountdown remainingMs={remainingMs} isHost={isHost} />
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showSkipConfirm}
        onClose={() => setShowSkipConfirm(false)}
        confirmVariant="warning"
        icon={<EmergencyIcon width={25} height={25} className="text-sub-coral" aria-hidden />}
        title="투표를 마감할까요?"
        description={"아직 투표하지 않은 친구의 표는\n반영되지 않아요."}
        cancelText="더 기다리기"
        confirmText="확정하기"
        onCancel={() => setShowSkipConfirm(false)}
        onConfirm={handleHostSkip}
      />

      {/* 동률 모달 */}
      <Modal
        isOpen={showTieModal}
        onClose={() => {}}
        hideCloseButton
        title="투표 동률이에요!"
        description={
          isHost
            ? `${tiedPlans.join("안과 ")}안이 같은 표를 받았어요.\n방장이 최종 일정을 선택해주세요.`
            : `${tiedPlans.join("안과 ")}안이 같은 표를 받았어요.\n방장이 최종 일정을 선택 중이에요...`
        }
        childrenVariant="card"
        hideActions
        footer={
          <div className="flex w-full flex-col gap-2">
            {isHost && (
              <div className="flex w-full gap-3">
                {tiedPlans.map((plan) => (
                  <Button
                    key={plan}
                    variant="primary"
                    onClick={() => handleTiePick(plan)}
                    disabled={isConfirming}
                    className="flex-1"
                  >
                    {isConfirming ? "확정 중..." : `${plan}안 선택`}
                  </Button>
                ))}
              </div>
            )}
            {/* 배경/Esc로는 못 닫게 두고(실수로 닫히면 확정이 멈춘 것처럼 보인다),
                명시적으로 누를 때만 닫는다. 하단 탭이 모달에 덮여 있어서 닫을 길이
                없으면 확정 전까지 이 화면에 갇힌다. */}
            {!isConfirming && (
              <Button variant="secondary" onClick={handleTieDismiss}>
                {isHostSkipping ? "더 기다리기" : isHost ? "잠시 닫아두기" : "닫고 기다리기"}
              </Button>
            )}
          </div>
        }
      >
        <div className="flex w-full items-center">
          {tiedPlans.map((plan, i) => (
            <Fragment key={plan}>
              {i > 0 && <div key={`divider-${i}`} className="h-8 w-[1px] bg-main-blue/30" />}
              <div className="flex flex-1 flex-col items-center gap-1">
                <span className="font-proup text-2xl text-main-blue">{plan}</span>
                <div className="flex items-center gap-[2px] font-proup text-sm font-normal leading-none text-sub-pink">
                  <span>♥</span>
                  <span>{voteCounts[plan] ?? 0}</span>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </Modal>

      <VoteConfirmedModal notice={confirmedNotice} onGo={goToNewItinerary} />

      <Toast
        isVisible={toastMessage !== null}
        onHide={() => setToastMessage(null)}
        message={toastMessage ?? ""}
        variant={toastVariant}
      />
    </div>
  );
}

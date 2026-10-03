"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/shared/utils";
import { Card, Modal, SpeechBubble, Toast, LoadingState, ErrorState, PageCard } from "@/components";
import VoteIcon from "@/assets/icons/itinerary/vote-yea.svg?svgr";
import checkIconWhite from "@/assets/icons/itinerary/check_white.png";
import infoIcon from "@/assets/icons/itinerary/info.png";
import freepassBlueIcon from "@/assets/icons/itinerary/freepass-blue.png";
import flagImg from "@/assets/place/flag.png";
import houseImg from "@/assets/place/house.png";
import busanStationImg from "@/assets/place/busan-station.png";
import { groupApi, itineraryApi } from "@/shared/api/domains";
import { useItineraryGenerationLockStore, useItineraryFlowStore } from "@/shared/stores";
import { useItineraryFlowProgress } from "@/features/itinerary/hooks/useItineraryFlowProgress";
import {
  getDefaultItemTime,
  getFallbackImage,
  toHourMinute,
} from "@/features/itinerary/utils/scheduleUtils";
import { useIsGroupHost } from "@/features/itinerary/hooks/useIsGroupHost";
import { useVoteSessionPolling } from "@/features/itinerary/hooks/useVoteSessionPolling";
import type { components } from "@/shared/api/schema";
import { RecommendationReasonCard } from "@/features/itinerary/components/RecommendationReasonCard";
import {
  VoteConfirmedModal,
  getVoteConfirmedReason,
  type VoteConfirmedNotice,
} from "@/features/itinerary/components/VoteConfirmedModal";

const PLAN_LABELS: Record<string, string> = {
  A: "취향 집중형",
  B: "균형 최적형",
  C: "자유 편집형",
};

// 그룹 일정 생성은 최대 60초까지 걸릴 수 있어서, 대기 시간에 따라 메시지를 바꿔
// 멈춘 것처럼 보이지 않게 한다.
const GENERATE_LOADING_MESSAGES = [
  { afterMs: 0, message: "일정을 생성하고 있어요" },
  { afterMs: 15_000, message: "AI가 열심히 동선을 짜고 있어요" },
  { afterMs: 35_000, message: "조금만 더 기다려주세요, 최대 1분 정도 걸려요" },
] as const;

function useGeneratingMessage(isGenerating: boolean) {
  const [message, setMessage] = useState<string>(GENERATE_LOADING_MESSAGES[0].message);

  useEffect(() => {
    if (!isGenerating) return;
    const timers = GENERATE_LOADING_MESSAGES.map(({ afterMs, message }) =>
      window.setTimeout(() => setMessage(message), afterMs),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [isGenerating]);

  return isGenerating ? message : GENERATE_LOADING_MESSAGES[0].message;
}

type Place = { id: string; name: string; image: string; time?: string; category?: string };
type Day = { day: number; label: string; places: Place[] };
type Plan = { id: string; days: Day[]; voteCount: number; summaryReason?: string };

type PlanOption = components["schemas"]["PlanOption"];

function mapPlanOption(planId: string, plan?: PlanOption): Plan {
  return {
    id: planId,
    voteCount: 0,
    summaryReason: plan?.summaryReason,
    days: (plan?.days ?? []).map((d, i) => ({
      day: d.day ?? i + 1,
      label: `Day ${d.day ?? i + 1}`,
      places: (d.spots ?? []).map((s, j) => ({
        id: s.contentId ?? `${planId}-${i}-${j}`,
        name: s.name ?? "",
        image: s.thumbnailUrl || getFallbackImage(s.contentId, s.name),
        category: s.category,
      })),
    })),
  };
}

// 백엔드 문구 끝의 마침표/물결 등을 정리하고 항상 "!"로 끝맺는다.
function formatReasonText(text: string): string {
  return `${text.trim().replace(/[.!?~]+$/, "")}!`;
}

// 하루 최대 3곳(아침/오후/저녁) 기준 슬롯. 첫날은 실제 시작 시간, 마지막날은 실제 종료
// 시간에 맞춰 갈 수 없는 시간대를 걸러낸다 (예: 오후 출발이면 첫날은 오후/저녁 2곳만).
type FreepassModalStep = "guide" | "confirm" | null;

function ResultPlaceNode({ place }: { place: Place }) {
  return (
    <div className="relative flex min-w-0 flex-col items-center">
      <p className="absolute left-1/2 -top-[30px] max-w-[78px] -translate-x-1/2 truncate whitespace-nowrap text-center font-paperlogy text-xs font-normal text-text-heading">
        {place.name}
      </p>
      <span className="absolute left-1/2 -top-[13px] z-10 size-3 -translate-x-1/2 rounded-full border-[1.5px] border-main-blue bg-main-white" />
      <div className="relative mt-[3px] h-[38px] w-[57px] overflow-hidden rounded-[8px] border border-main-blue bg-system-navbg">
        <Image src={place.image} alt={place.name} fill sizes="57px" className="object-cover" />
      </div>
    </div>
  );
}

function PageLoadingFallback() {
  return (
    <div className="flex h-full flex-col">
      <LoadingState />
    </div>
  );
}

export default function TripResultPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <TripResultContent />
    </Suspense>
  );
}

function TripResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const count = searchParams.get("count") ?? "6";
  const days = searchParams.get("days") ?? "3";
  const totalDays = Math.max(1, Number(days) || 3);
  const groupId = searchParams.get("groupId") ?? "";
  const tripName = searchParams.get("name") ?? "여행";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const requestedStartTime = searchParams.get("startTime") || "10:00";
  const requestedEndTime = searchParams.get("endTime") || "17:00";
  const accommodation = searchParams.get("accommodation") ?? "";
  const accommodationAddress = searchParams.get("accommodationAddress") ?? "";
  const accommodationLat = searchParams.get("accommodationLat") ?? "";
  const accommodationLng = searchParams.get("accommodationLng") ?? "";
  const isHost = useIsGroupHost(groupId);

  // 초대 화면이 3초 폴링으로 받아둔 값이 캐시에 남아 있어서, 그 뒤 들어온 멤버가
  // 이 화면에서 빠져 보일 수 있다. 마운트 시 한 번은 최신으로 맞춘다.
  const { data: members = [] } = useQuery({
    queryKey: groupApi.keys.members(groupId),
    queryFn: () => groupApi.getGroupMembers(groupId),
    enabled: !!groupId,
    refetchOnMount: "always",
  });

  // 스와이프 완료 직후 방장/참여자가 거의 동시에 이 페이지에 진입하면 각자의
  // generateGroupItinerary 요청이 경합해서 방장과 다른 결과가 나오는 경우가 있다.
  // 새로고침 한 번이면 백엔드에 이미 저장된 결과를 그대로 받아와 방장과 동일해지므로,
  // 진입 시 자동으로 한 번 새로고침해서 이 경합을 피한다.
  const hasReloaded = searchParams.get("reloaded") === "1";
  useEffect(() => {
    if (hasReloaded) return;
    const url = new URL(window.location.href);
    url.searchParams.set("reloaded", "1");
    window.location.replace(url.toString());
  }, [hasReloaded]);

  const {
    data: generated,
    isLoading: isGenerating,
    isError: isGenerateError,
    refetch: refetchGenerate,
  } = useQuery({
    queryKey: itineraryApi.keys.groupGenerate(groupId, startDate, endDate),
    queryFn: () =>
      itineraryApi.generateGroupItinerary(groupId, {
        startDate,
        endDate,
        startTime: requestedStartTime,
        endTime: requestedEndTime,
      }),
    enabled: hasReloaded && !!groupId && !!startDate && !!endDate,
  });

  // 그룹당 한 번만 생성되는 값이므로, 실제로 AI 생성에 쓰인 이 값이 항상 화면 표시의
  // 기준이다. 응답이 아직 없을 때(로딩 중)만 요청 시 보낸 값으로 잠깐 대체한다.
  // 백엔드 LocalTime은 "17:00:00"처럼 초까지 내려오므로 "HH:mm"으로 맞춰서 쓴다 —
  // 화면에 "17:00:00 여행 시작!"으로 초가 노출되고, 이 값이 그대로 다음 화면 쿼리와
  // 확정 요청까지 실려 나가기 때문에 여기 한 곳에서 정규화한다.
  const startTime = toHourMinute(generated?.startTime) || requestedStartTime;
  const endTime = toHourMinute(generated?.endTime) || requestedEndTime;

  const displayStartTime = startTime.slice(0, 5);
  const displayEndTime = endTime.slice(0, 5);

  const generatingMessage = useGeneratingMessage(isGenerating);
  const sessionId = generated?.voteSessionId ?? "";
  const [toastVariant, setToastVariant] = useState<
    "success" | "error" | "warning" | "itinerary" | "default"
  >("default");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const unlockGeneration = useItineraryGenerationLockStore((state) => state.unlock);
  const clearFlow = useItineraryFlowStore((state) => state.clearFlow);
  const queryClient = useQueryClient();

  // 확정 직후엔 일정 목록 캐시(staleTime 60초)에 새 일정이 아직 없다. 그대로 /itinerary로
  // 보내면 목록에서 못 찾고 "직전에 보던 일정"으로 폴백해서 예전 일정이 열린다.
  // 그래서 목록을 무효화하고, 방금 만들어진 일정 id를 tripId로 직접 지정해서 이동한다.
  const goToNewItinerary = async (itineraryId?: string) => {
    unlockGeneration();
    // 확정까지 끝났으면 더 이어할 게 없다 — "이어하기" 안내가 남지 않게 지운다.
    clearFlow();
    try {
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

  // 다른 참여자가 투표한 결과를 A/B/C 탭에 반영하기 위해 투표 현황을 폴링한다.
  // 다른 클라이언트가 먼저 프리패스 등으로 이미 확정해버린 경우, 더 투표할 필요가
  // 없으므로 일정 화면으로 보낸다.
  const { voteStatus } = useVoteSessionPolling(sessionId, {
    onConfirmed: (_sessionId, itineraryId, status) =>
      showConfirmedNotice({
        plan: status?.confirmedPlan,
        reason: getVoteConfirmedReason(status, Math.min(6, Math.max(2, Number(count) || 6))),
        itineraryId,
      }),
    onError: () => {
      setToastVariant("error");
      setToastMessage("투표 현황을 불러오지 못했어요.");
    },
  });
  const voteCounts = voteStatus?.voteCounts ?? {};

  const forwardParams = new URLSearchParams({
    count,
    days: String(totalDays),
    groupId,
    name: tripName,
    startDate,
    endDate,
    startTime,
    endTime,
    ...(sessionId ? { sessionId } : {}),
    ...(accommodation ? { accommodation } : {}),
    ...(accommodationAddress ? { accommodationAddress } : {}),
    ...(accommodationLat ? { accommodationLat } : {}),
    ...(accommodationLng ? { accommodationLng } : {}),
  }).toString();

  // 생성/투표 중에 튕겨도 같은 투표 세션으로 돌아올 수 있게 진행 상황을 남긴다.
  useItineraryFlowProgress("result", forwardParams, groupId, { sessionId, tripName });

  // days 수에 맞게 각 플랜 day 슬라이스 + 하루 최대 3곳(아침/오후/저녁) 슬롯에 맞춰 시간 배정
  const plans: Plan[] = [
    mapPlanOption("A", generated?.plans?.planA),
    mapPlanOption("B", generated?.plans?.planB),
    mapPlanOption("C", generated?.plans?.planC),
  ].map((plan) => {
    const slicedDays = plan.days.slice(0, totalDays);
    return {
      ...plan,
      voteCount: voteCounts[plan.id] ?? 0,
      // 예전엔 [아침/오후/저녁] 슬롯 개수만큼 places를 잘라서(slice) 보여줬는데, 여행
      // 종료 시간 때문에 슬롯이 걸러지면 API가 3곳을 줘도 마지막 날만 2곳으로 보였다.
      // 이제는 자르지 않고, 일정 탭과 같은 규칙으로 그날 시간대에 균등 배분한다.
      days: slicedDays.map((day, idx) => ({
        ...day,
        places: day.places.map((place, i) => ({
          ...place,
          time: getDefaultItemTime(idx, slicedDays.length, i, day.places.length, {
            startTime,
            endTime,
          }),
        })),
      })),
    };
  });

  const [activePlan, setActivePlan] = useState<string>("A");
  const [showInfo, setShowInfo] = useState(false);
  const [votedPlan, setVotedPlan] = useState<string | null>(null);
  const [voteConfirmPlan, setVoteConfirmPlan] = useState<string | null>(null);
  const [freepassModal, setFreepassModal] = useState<FreepassModalStep>(null);
  const [isFreepassMode, setIsFreepassMode] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const currentPlan = plans.find((p) => p.id === activePlan) ?? plans[0];
  const isFreeEditPlan = activePlan === "C";
  const reasonText = formatReasonText(
    currentPlan.summaryReason || "친구들 취향을 분석해서 추천한 일정이에요",
  );

  const getVoteCount = (plan: Plan) => plan.voteCount + (votedPlan === plan.id ? 1 : 0);

  const handlePlanVote = (planId: string) => {
    setVoteConfirmPlan(planId);
  };

  const handleVoteConfirm = async () => {
    if (!voteConfirmPlan) return;
    const planToVote = voteConfirmPlan;
    setVoteConfirmPlan(null);
    try {
      await itineraryApi.castVote(sessionId, { votedPlan: planToVote });
      setActivePlan(planToVote);
      setVotedPlan(planToVote);
      router.push(`/itinerary/trips/vote-waiting?${forwardParams}`);
    } catch {
      setToastVariant("error");
      setToastMessage("투표에 실패했어요. 다시 시도해주세요.");
    }
  };

  const handleFreepass = () => {
    setFreepassModal("guide");
  };

  const handleFreepassActivate = () => {
    setIsFreepassMode(true);
    setFreepassModal(null);
  };

  const handleFreepassConfirm = async () => {
    setFreepassModal(null);
    setIsConfirming(true);
    try {
      // finalize 요청에 숙소/시간까지 함께 실어서 원자적으로 저장한다 — 세션이
      // "confirmed"로 바뀌는 시점과 숙소 저장 시점 사이에 참여자가 일정 화면으로
      // 넘어가버려 숙소 정보가 비어 보이던 race condition을 없애기 위함.
      const newItineraryId = await itineraryApi.finalizeItinerary(sessionId, {
        freePass: true,
        selectedPlan: activePlan,
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
        ...(activePlan === "C"
          ? {
              days: Array.from({ length: totalDays }, (_, i) => ({
                day: i + 1,
                spotContentIds: [],
              })),
            }
          : {}),
      });
      showConfirmedNotice({ plan: activePlan, reason: "host", itineraryId: newItineraryId });
    } catch {
      setToastVariant("error");
      setToastMessage("일정을 확정하지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (!hasReloaded || isGenerating) {
    return (
      <div className="flex h-full flex-col">
        <LoadingState message={generatingMessage} />
      </div>
    );
  }

  if (isGenerateError) {
    return (
      // 흰 화면으로 전체를 덮지 않고, 일정 탭의 다른 오류 화면처럼 배경 위 카드 안에 보여준다.
      <PageCard>
        <ErrorState
          code={503}
          title="일정 생성에 실패했어요"
          description="잠시 후 다시 시도해주세요."
          primaryAction={{
            label: "다시 시도",
            onClick: () => refetchGenerate(),
          }}
          secondaryAction={{
            label: "홈으로 돌아가기",
            onClick: () => router.push("/home"),
          }}
        />
      </PageCard>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <RecommendationReasonCard
        reasonText={reasonText}
        members={members}
        isFreeEditPlan={isFreeEditPlan}
      />

      {/* 투표 섹션 - PageCard 스타일 */}
      <div className="-mx-6 flex flex-1 flex-col overflow-hidden rounded-tl-[40px] rounded-tr-[40px] bg-white">
        {/* 헤더 - 고정 */}
        <div className="shrink-0 px-[28px] pt-[28px]">
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <span className="font-ssurround font-bold text-lg text-text-heading">
                마음에 드는 일정에 투표해주세요!
              </span>
              <button type="button" onClick={() => setShowInfo((v) => !v)} aria-label="투표 안내">
                <Image src={infoIcon} alt="안내" width={14} height={14} />
              </button>
            </div>

            {showInfo && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowInfo(false)} />
                <div className="absolute left-[60px] top-[calc(100%+8px)] z-20 rounded-[20px] border border-system-navbg bg-gradient-to-b from-system-glassfrom to-system-glassto px-[15px] py-[10px] backdrop-blur-[20px] shadow-xs">
                  <div className="flex flex-col gap-[10px] font-paperlogy text-2xs text-text-primary leading-snug whitespace-nowrap">
                    <p className="font-semibold">
                      😇 AI가 친구들의 취향을 분석해 3가지 일정을 추천해요.
                    </p>
                    <div className="flex flex-col gap-[6px]">
                      <p className="font-semibold">📌 A안 (취향 집중형)</p>
                      <p className="pl-5 font-medium">친구들의 취향을 균형 있게 반영한 일정</p>
                      <p className="font-semibold">📌 B안 (균형 최적형)</p>
                      <p className="pl-5 font-medium">친구들의 미수집 관광지 위주로 구성한 일정</p>
                      <p className="font-semibold">📌 C안 (자유 편집형)</p>
                      <p className="pl-5 font-medium">자유롭게 구성할 수 있는 일정</p>
                    </div>
                    <p className="font-medium">
                      ✅ 마음에 드는 일정에 투표해 최종 일정을 결정해요.
                    </p>
                    <p className="font-medium">
                      ✨ 방장은 투표 결과와 관계없이 원하는 일정을 선택할 수 있어요.
                    </p>
                    <p className="font-bold text-sub-coral">
                      ‼️ 프리패스 사용 시 참가자들의 투표 결과는 반영되지 않아요 ‼️
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 글래스 카드 - 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-[28px] pb-[10px]">
          <div className="relative -mx-[4px] mt-4 flex flex-col rounded-[20px] border border-system-navbg bg-gradient-to-b from-system-glassfrom to-system-glassto px-[16px] pt-[20px] pb-[24px] backdrop-blur-[15px]">
            {/* 안 선택 탭 + 투표 버튼 같은 라인 */}
            <div className="flex items-center gap-[5px]">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  aria-label={`${PLAN_LABELS[plan.id]} ${plan.id}안 보기`}
                  onClick={() => setActivePlan(plan.id)}
                  className={cn(
                    "flex items-center justify-center rounded-[10px] px-[12px] pt-[4px] pb-[2px] font-proup text-md text-main-white transition-colors",
                    activePlan === plan.id ? "bg-main-blue" : "bg-sub-lightblue",
                  )}
                >
                  {plan.id}
                </button>
              ))}
            </div>

            {/* 투표 버튼 - 우측 상단 절대 배치 */}
            <div className="absolute top-[16px] right-[16px] flex flex-col items-center gap-[4px]">
              <button
                type="button"
                aria-label={`${activePlan}안에 투표하기`}
                onClick={() => handlePlanVote(activePlan)}
                className={cn(
                  "flex items-center justify-center rounded-[10px] p-[5px]",
                  votedPlan === activePlan ? "bg-sub-pink" : "bg-sub-pink/50",
                )}
              >
                <Image src={checkIconWhite} alt="투표" width={14} height={14} aria-hidden />
              </button>
              <div className="flex items-center gap-[2px] font-proup text-sm font-normal leading-none text-sub-pink">
                <span>♥</span>
                <span>{getVoteCount(currentPlan)}</span>
              </div>
            </div>

            {/* 타임라인 - A/B 카드와 높이를 맞추기 위해 최소 높이를 공유 */}
            {activePlan === "C" ? (
              <Card
                variant="glass-sm"
                className="mt-3 flex flex-col items-center gap-1.5 px-8 py-10 text-center"
              >
                <p className="font-ssurround font-bold text-lg text-text-heading">
                  자유 편집형 일정
                </p>
                <p className="mt-1 font-paperlogy text-sm font-medium text-sub-darkgray leading-relaxed whitespace-pre-line">
                  {"친구들과 원하는 장소를 직접 추가해\n자유롭게 일정을 만들어보세요!"}
                </p>
              </Card>
            ) : (
              <div className="relative mt-3 ml-0">
                {/* 세로 점선 — 출발 중심(top:22px)에서 도착 중심(bottom:24px)까지만 */}
                <div className="absolute left-[22px] top-[22px] bottom-[24px] w-[2px] bg-[repeating-linear-gradient(to_bottom,var(--color-sub-deepblue)_0,var(--color-sub-deepblue)_6px,transparent_6px,transparent_12px)]" />

                {/* 출발 - 부산역 */}
                <div className="relative flex items-center gap-5">
                  <div className="relative z-10 flex h-[49px] w-[45px] shrink-0 items-center justify-center">
                    <div className="absolute inset-[-6px] rounded-full bg-main-blue/30 blur-md" />
                    <Image
                      src={busanStationImg}
                      alt=""
                      width={45}
                      height={45}
                      aria-hidden
                      className="relative z-10"
                    />
                  </div>
                  <SpeechBubble variant="white" tailDirection="left">
                    <span className="font-paperlogy text-xs font-medium leading-none text-sub-deepblue">
                      {displayStartTime} 여행 시작!
                    </span>
                  </SpeechBubble>
                </div>

                {/* 각 Day */}
                <div className="mt-5 flex flex-col gap-16">
                  {currentPlan.days.map((day) => (
                    <div key={day.day}>
                      <div className="relative flex items-center gap-[2px]">
                        <div className="relative z-10 h-[25px] w-[35px] shrink-0">
                          <span className="absolute left-[9.5px] top-1/2 z-0 h-[29px] w-[25px] -translate-y-1/2 rounded-full bg-main-white" />

                          <div className="absolute left-[5.5px] top-1/2 z-10 h-[33px] w-[33px] -translate-y-1/2 rounded-full bg-sub-pink/30 blur-md" />

                          <Image
                            src={flagImg}
                            alt=""
                            width={25}
                            height={25}
                            aria-hidden
                            className="absolute left-[9.5px] top-0 z-20"
                          />
                        </div>

                        <span className="whitespace-nowrap text-sm font-semibold text-sub-deepblue">
                          {day.label}
                        </span>

                        <div className="relative ml-1 h-[1.5px] w-[235px] rounded-full bg-main-blue">
                          <div className="absolute left-0 right-0 top-[7.5px] flex items-start justify-around gap-1">
                            {day.places.map((place) => (
                              <ResultPlaceNode key={place.id} place={place} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 도착 - 집 */}
                <div className="relative mt-[44px] flex items-center gap-5">
                  <div className="relative z-10 flex h-[49px] w-[45px] shrink-0 items-center justify-center">
                    <div className="absolute inset-[-6px] rounded-full bg-main-blue/30 blur-md" />
                    <Image
                      src={houseImg}
                      alt=""
                      width={45}
                      height={45}
                      aria-hidden
                      className="relative z-10"
                    />
                  </div>
                  <SpeechBubble variant="white" tailDirection="left">
                    <span className="font-paperlogy text-xs font-medium leading-none text-sub-deepblue">
                      {displayEndTime} 여행 끝!
                    </span>
                  </SpeechBubble>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 프리패스 버튼 - 하단 고정 */}
        <div className="shrink-0 px-[28px] pb-[24px] pt-[12px]">
          <button
            type="button"
            onClick={
              isHost
                ? isFreepassMode
                  ? () => setFreepassModal("confirm")
                  : handleFreepass
                : undefined
            }
            disabled={!isHost || isConfirming}
            className={cn(
              "flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] font-ssurround font-bold text-md text-main-white transition-opacity",
              isHost ? "bg-main-blue" : "bg-sub-gray cursor-not-allowed",
            )}
          >
            {isConfirming ? (
              <span>일정 확정 중...</span>
            ) : isFreepassMode ? (
              <span>{activePlan} 일정으로 선택하기</span>
            ) : (
              <>
                <Image
                  src={freepassBlueIcon}
                  alt=""
                  width={15}
                  height={15}
                  aria-hidden
                  className="-translate-y-0.5 brightness-0 invert"
                />
                <span>방장 마음대로 프리패스!</span>
              </>
            )}
          </button>
        </div>
      </div>

      <Modal
        isOpen={voteConfirmPlan !== null}
        onClose={() => setVoteConfirmPlan(null)}
        icon={<VoteIcon width={28} height={28} className="text-sub-deepblue" aria-hidden />}
        title="이 일정으로 투표할까요?"
        description={`${voteConfirmPlan}안에 투표하시겠어요?`}
        cancelText="취소"
        confirmText="투표하기"
        onCancel={() => setVoteConfirmPlan(null)}
        onConfirm={handleVoteConfirm}
        className="max-w-[320px] rounded-[28px] px-7 py-9"
      />

      <Modal
        isOpen={freepassModal === "guide"}
        onClose={() => setFreepassModal(null)}
        icon={<Image src={freepassBlueIcon} alt="" width={25} height={25} aria-hidden />}
        title="방장 마음대로 프리패스!"
        description={"투표 결과와 상관없이\n방장이 원하는 추천 일정을 선택할 수 있어요."}
        childrenVariant="card"
        childrenClassName="py-2"
        cancelText="취소"
        confirmText="프리패스"
        onCancel={() => setFreepassModal(null)}
        onConfirm={handleFreepassActivate}
        className="max-w-[320px] rounded-[28px] px-7 py-9 gap-7"
      >
        <p className="text-center font-paperlogy text-xs font-medium text-sub-darkgray">
          * 사용 시 현재 투표 결과는 반영되지 않아요.
        </p>
      </Modal>

      <Modal
        isOpen={freepassModal === "confirm"}
        onClose={() => setFreepassModal(null)}
        icon={<Image src={freepassBlueIcon} alt="" width={25} height={25} aria-hidden />}
        title="방장 마음대로 프리패스!"
        description={`${activePlan} 일정으로 선택하시겠어요?\n선택한 일정이 최종 일정으로 확정돼요.`}
        childrenVariant="card"
        childrenClassName="py-2"
        cancelText="취소"
        confirmText="확정하기"
        onCancel={() => setFreepassModal(null)}
        onConfirm={handleFreepassConfirm}
        className="max-w-[320px] rounded-[28px] px-7 py-9 gap-7"
      >
        <p className="text-center font-paperlogy text-xs font-medium text-sub-darkgray">
          * 다른 사람의 일정을 불러오면 현재 일정은 사라져요.
        </p>
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

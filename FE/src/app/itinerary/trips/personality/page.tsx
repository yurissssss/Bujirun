"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import faceImg from "@/assets/character/face.png";
import swipeRightIcon from "@/assets/icons/itinerary/swipe-right.png";
import swipeLeftIcon from "@/assets/icons/itinerary/swipe-left.png";
import EmergencyIcon from "@/assets/icons/itinerary/emergency-on.svg?svgr";
import { SpeechBubble, Toast, Button, LoadingState, Modal } from "@/components";
import { collectionApi, swipeApi } from "@/shared/api/domains";
import { useItineraryGenerationLockStore } from "@/shared/stores";
import { useItineraryFlowProgress } from "@/features/itinerary/hooks/useItineraryFlowProgress";

const TOTAL_SLOTS = 6; // mock - 실제로는 searchParams 또는 API

function SmallAvatar() {
  return (
    <div className="relative size-[35px] overflow-hidden rounded-full bg-main-blue">
      <div className="relative size-[41px] -translate-x-[3px] -translate-y-[3px]">
        <Image src={faceImg} alt="" fill sizes="41px" className="object-cover" aria-hidden />
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

export default function TripPersonalityPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <TripPersonalityContent />
    </Suspense>
  );
}

function TripPersonalityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalSlots = Math.min(6, Math.max(2, Number(searchParams.get("count")) || TOTAL_SLOTS));
  const days = searchParams.get("days") ?? "1";
  const groupId = searchParams.get("groupId") ?? "";
  const isGuest = searchParams.get("role") === "guest";
  const accommodation = searchParams.get("accommodation") ?? "";
  const accommodationAddress = searchParams.get("accommodationAddress") ?? "";
  const accommodationLat = searchParams.get("accommodationLat") ?? "";
  const accommodationLng = searchParams.get("accommodationLng") ?? "";
  const forwardParams = new URLSearchParams({
    count: String(totalSlots),
    days,
    groupId,
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

  useItineraryFlowProgress("personality", searchParams.toString(), groupId, {
    tripName: searchParams.get("name") ?? undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(isGuest);
  const [pendingStart, setPendingStart] = useState<"like-all" | "swipe" | null>(null);
  const lockGeneration = useItineraryGenerationLockStore((state) => state.lock);

  // "난 다 좋아"도 실제 스와이프처럼 서버에 좋아요 기록을 남겨야 그룹 일정
  // 자동생성이 취합할 스와이프 데이터가 생긴다 (안 보내면 백엔드 generate가 500).
  // 도감을 이미 많이/다 채운 계정은 getSwipeDeck()이 빈 배열을 줄 수 있는데, 이 경우
  // 아무것도 못 보내고 다음 화면(대기→결과)에서야 원인 모를 생성 실패로 이어지던 문제가
  // 있었다 — 여기서 바로 구체적인 이유를 알려주고 실패 상태로는 넘어가지 않게 막는다.
  const handleLikeAll = async () => {
    setIsSubmitting(true);
    try {
      const deck = await collectionApi.getSwipeDeck();
      const swipes = (deck ?? [])
        .map((spot) => spot.contentId)
        .filter((contentId): contentId is string => !!contentId)
        .map((contentId) => ({ contentId, liked: true }));
      if (swipes.length === 0) {
        useItineraryGenerationLockStore.getState().unlock();
        setToastMessage("이미 도감을 다 채우셨네요! 그룹 일정 생성이 어려울 수 있어요.");
        return;
      }
      await swipeApi.submitSwipes({ swipes, groupId: groupId || undefined });
      router.push(`/itinerary/trips/waiting?${forwardParams}`);
    } catch {
      useItineraryGenerationLockStore.getState().unlock();
      setToastMessage("좋아요 등록에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartConfirm = () => {
    const nextStep = pendingStart;
    setPendingStart(null);
    lockGeneration();

    if (nextStep === "like-all") {
      void handleLikeAll();
      return;
    }

    if (nextStep === "swipe") {
      router.push(`/itinerary/trips/swipe?${forwardParams}`);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pb-8">
      <div className="w-full rounded-[30px] border border-white/40 bg-gradient-to-b from-system-glassfrom to-system-glassto px-[30px] py-[35px] backdrop-blur-[15px] flex flex-col items-center">
        {/* 말풍선 */}
        <SpeechBubble variant="white" tailDirection="bottom" tailCenter>
          <span className="font-dxsubtitles text-md text-text-primary px-2 whitespace-nowrap">
            친구들이 모두 모였어요!
          </span>
        </SpeechBubble>

        {/* 친구 아바타 한 줄 */}
        <div className="mt-2 flex gap-1.5">
          {Array.from({ length: totalSlots }, (_, i) => (
            <SmallAvatar key={i} />
          ))}
        </div>

        {/* 타이틀 */}
        <p
          className="mt-5 font-ssurround font-bold text-lg text-black text-center"
          style={{ lineHeight: "28px" }}
        >
          그럼 이제부터
          <br />
          여행일정을 짜러 가볼까요?
        </p>

        {/* 안내 카드 */}
        <div className="mt-[20px] w-full rounded-[20px] border-[0.5px] border-main-blue bg-white px-4 py-5 flex flex-col items-center gap-2">
          <p className="font-paperlogy font-normal text-md text-text-primary text-center">
            * 카드를 넘겨보면서
            <br />
            마음에 드는 장소를 골라주세요!
          </p>
          <div className="mt-1 flex flex-col items-start gap-1">
            <div className="flex items-center gap-[5px]">
              <Image src={swipeRightIcon} alt="" width={15} height={15} aria-hidden />
              <span className="font-paperlogy font-normal text-sm text-text-primary">
                오른쪽: 좋아요
              </span>
            </div>
            <div className="flex items-center gap-[5px]">
              <Image src={swipeLeftIcon} alt="" width={15} height={15} aria-hidden />
              <span className="font-paperlogy font-normal text-sm text-text-primary">
                왼쪽 : 별로에요
              </span>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="mt-[24px] flex w-full gap-3">
          <Button
            variant="secondary"
            onClick={() => setPendingStart("like-all")}
            disabled={isSubmitting}
            className="flex-1 disabled:opacity-50"
          >
            난 다 좋아!
          </Button>
          <Button variant="primary" onClick={() => setPendingStart("swipe")} className="flex-1">
            취향분석 할래!
          </Button>
        </div>
      </div>

      <Modal
        isOpen={pendingStart !== null}
        onClose={() => setPendingStart(null)}
        confirmVariant="warning"
        icon={<EmergencyIcon width={25} height={25} className="text-sub-coral" aria-hidden />}
        title="시작 전 꼭 확인해주세요!"
        description={
          "지금부터 투표가 끝날 때까지\n현재 화면을 유지해주세요.\n중간에 나가도 일정 탭에서 이어서 만들 수 있어요."
        }
        cancelText="취소"
        confirmText="확인하고 시작"
        onCancel={() => setPendingStart(null)}
        onConfirm={handleStartConfirm}
      />

      <Toast
        isVisible={toastMessage !== null}
        onHide={() => setToastMessage(null)}
        message={toastMessage ?? ""}
        variant="error"
      />
      <Toast
        isVisible={showExitWarning}
        onHide={() => setShowExitWarning(false)}
        message="중간에 나가면 참여 정보가 초기화될 수 있어요"
        variant="warning"
        duration={5000}
      />
    </div>
  );
}

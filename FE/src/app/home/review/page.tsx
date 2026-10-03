"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MOOD_VALUE } from "@/features/home/components/MoodOptions";
import { itineraryApi, travelLogApi, userApi } from "@/shared/api/domains";
import { ErrorState, LoadingBoundary } from "@/components";
import { ReviewPromptModal } from "@/features/home/components/ReviewPromptModal";
import { TripReceiptModal } from "@/features/receipt/components/TripReceiptModal";
import type { ReceiptData, ReviewPromptSubmitData } from "@/features/receipt/types/receipt";
import { convertTripLogToReceipt } from "@/features/receipt/utils/convertTripLogToReceipt";
import { resolveProfileImage } from "@/components/profile/profileImages";
import { skipReview } from "@/shared/utils/skippedReviews";

export default function HomeReceiptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 리뷰 페이지 진입 전에는 log가 없으므로 itineraryId를 받음
  const itineraryId = searchParams.get("itineraryId");

  const {
    data: itinerary,
    isLoading: isTripLoading,
    isError: isTripError,
    refetch: refetchTrip,
  } = useQuery({
    queryKey: itineraryApi.keys.detail(itineraryId ?? ""),
    queryFn: () => itineraryApi.getItinerary(itineraryId!),
    enabled: !!itineraryId,
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(true);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<ReceiptData | undefined>();

  const { data: myProfile } = useQuery({
    queryKey: userApi.keys.me(),
    queryFn: userApi.getMyProfile,
  });

  const profileImage = resolveProfileImage(myProfile?.profileImageUrl);

  // "취소"/X로 이 팝업을 닫으면 이 페이지엔 모달 외엔 아무 것도 렌더링되는 게 없어서
  // (아래 return의 <main>에 이 두 모달뿐), 홈으로 돌려보내지 않으면 빈 화면에 그대로
  // 갇힌다 — 닫기 버튼이 안 먹는 것처럼 보이는 원인이었음. closeReceiptModal과 동일하게
  // /home으로 되돌려보낸다.
  //
  // 또한 취소해도 영수증(mood/theme)은 여전히 안 채워져 있어서, 취소한 걸 기록해두지 않으면
  // TodayItinerary의 자동 리다이렉트가 다음 홈 진입 때 바로 이 팝업을 다시 띄워버려 못
  // 빠져나가는 무한루프가 된다. 서버에 "다시 묻지 않음"으로 저장해(기기를 바꿔도 유지됨)
  // 다시 뜨지 않게 하고, 요청이 실패하거나 아직 안 끝난 사이에도 즉시 막히도록 localStorage
  // 기록(skipReview)도 함께 남긴다.
  const closeReviewModal = () => {
    if (itineraryId) {
      skipReview(itineraryId);
      travelLogApi.dismissReceiptPrompt(itineraryId).catch((error) => {
        // 실패해도 localStorage 기록으로 이 기기에선 다시 뜨지 않으므로 흐름을 막지 않는다.
        console.error("영수증 팝업 '다시 묻지 않음' 저장 실패: ", error);
      });
    }
    setIsReviewModalOpen(false);
    router.push("/home");
  };

  const closeReceiptModal = () => {
    setIsReceiptModalOpen(false);
    router.push("/home");
  };

  const handleCreateReceipt = async ({ mood, theme }: ReviewPromptSubmitData) => {
    if (!itineraryId) {
      console.error("itineraryId가 없습니다.");
      return;
    }

    try {
      // 종료된 일정이면 백엔드가 이 화면 진입 전(홈의 자동 리다이렉트 판단 시점)에 이미
      // 로그를 자동 생성해뒀다(2026-08-30~, 영수증 발행 여부와 무관하게 생성됨) — 그 로그를
      // 찾아 mood/theme만 채운다. 혹시 못 찾으면(자동 생성 대상이 아니었던 경우 등) 그때
      // 새로 만든다. itineraryId만으로는 로그를 직접 조회할 수 없어 exists 배치 조회를 씀.
      const [existing] = await travelLogApi.checkLogExists([itineraryId]);
      const logId =
        existing?.logId ??
        (
          await travelLogApi.createLog({
            itineraryId,
            isPublic: true,
          })
        ).id;

      if (!logId) {
        throw new Error("로그 ID를 확인할 수 없습니다.");
      }

      // 로그에 리뷰 정보 저장
      await travelLogApi.updateLog(logId, {
        isPublic: true,
        mood: MOOD_VALUE[mood],
        theme,
      });

      // mood, theme가 반영된 최신 로그 조회
      const latestTravelLog = await travelLogApi.getLog(logId);

      const receipt = convertTripLogToReceipt(
        latestTravelLog,
        myProfile?.id ?? "",
        myProfile?.nickname ?? "",
        profileImage,
      );

      setGeneratedReceipt(receipt);
      setIsReviewModalOpen(false);
      setIsReceiptModalOpen(true);
    } catch (error) {
      console.error("영수증 발행 실패: ", error);
    }
  };

  return (
    <main className="relative flex h-full flex-col">
      <LoadingBoundary isLoading={isTripLoading} message="여행 정보를 불러오는 중이에요">
        {isTripError || !itineraryId ? (
          <ErrorState
            title="여행 정보를 불러오지 못했어요"
            primaryAction={{
              label: itineraryId ? "다시 시도" : "홈으로",
              onClick: () => {
                if (itineraryId) void refetchTrip();
                else router.push("/home");
              },
            }}
            secondaryAction={{ label: "홈으로", onClick: () => router.push("/home") }}
          />
        ) : (
          <ReviewPromptModal
            isOpen={isReviewModalOpen}
            tripTitle={itinerary?.title?.trim() || "이름 없는 여행"}
            onClose={closeReviewModal}
            onConfirm={handleCreateReceipt}
          />
        )}
      </LoadingBoundary>

      <TripReceiptModal
        isOpen={isReceiptModalOpen}
        receipt={generatedReceipt}
        onDetail={() => {
          if (!generatedReceipt) return;

          router.push(`/collection/records/log/${generatedReceipt.tripId}`);
        }}
        onClose={closeReceiptModal}
      />
    </main>
  );
}

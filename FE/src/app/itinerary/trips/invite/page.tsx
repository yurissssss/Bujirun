"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ParticipantAvatarGrid, ShareInviteModal } from "@/features/itinerary/components";
import { groupApi, userApi } from "@/shared/api/domains";
import { LoadingState, Toast } from "@/components";
import { useItineraryFlowProgress } from "@/features/itinerary/hooks/useItineraryFlowProgress";
import { formatTripPeriod } from "@/shared/utils";

function PageLoadingFallback() {
  return (
    <div className="flex h-full flex-col">
      <LoadingState />
    </div>
  );
}

export default function TripInvitePage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <TripInviteContent />
    </Suspense>
  );
}

function TripInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalSlots = Math.min(6, Math.max(2, Number(searchParams.get("count")) || 6));
  const days = searchParams.get("days") ?? "1";
  const groupId = searchParams.get("groupId") ?? "";
  const inviteCode = searchParams.get("inviteCode") ?? "";
  const tripName = searchParams.get("name") ?? "여행";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const startTime = searchParams.get("startTime") ?? "";
  const endTime = searchParams.get("endTime") ?? "";
  const accommodation = searchParams.get("accommodation") ?? "";
  const accommodationAddress = searchParams.get("accommodationAddress") ?? "";
  const accommodationLat = searchParams.get("accommodationLat") ?? "";
  const accommodationLng = searchParams.get("accommodationLng") ?? "";
  const role = searchParams.get("role") === "guest" ? "guest" : "host";
  useItineraryFlowProgress("invite", searchParams.toString(), groupId, { tripName });

  const [showShareModal, setShowShareModal] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(role === "host");

  const { data: members } = useQuery({
    queryKey: groupApi.keys.members(groupId),
    queryFn: () => groupApi.getGroupMembers(groupId),
    enabled: !!groupId,
    refetchInterval: 3000,
  });
  const joinedCount = Math.max(1, members?.length ?? 1);

  const { data: myProfile } = useQuery({
    queryKey: userApi.keys.me(),
    queryFn: userApi.getMyProfile,
  });

  const goToPersonality = () => {
    const nextParams = new URLSearchParams({
      role,
      count: String(totalSlots),
      days,
      groupId,
      name: tripName,
      startDate,
      endDate,
      startTime,
      endTime,
      ...(accommodation ? { accommodation } : {}),
      ...(accommodationAddress ? { accommodationAddress } : {}),
      ...(accommodationLat ? { accommodationLat } : {}),
      ...(accommodationLng ? { accommodationLng } : {}),
    });
    router.push(`/itinerary/trips/personality?${nextParams.toString()}`);
  };

  useEffect(() => {
    if (joinedCount < totalSlots) return;
    const timer = setTimeout(goToPersonality, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    days,
    joinedCount,
    totalSlots,
    router,
    groupId,
    tripName,
    startDate,
    endDate,
    startTime,
    endTime,
  ]);

  const nickname = myProfile?.nickname ?? "친구";
  // 공유 문구에도 여행 기간을 넣어준다 — 초대받는 사람이 링크를 열기 전에
  // 언제 가는 여행인지 알 수 있어야 한다.
  const tripPeriod = formatTripPeriod(startDate, endDate, days);
  const shareDescription = tripPeriod
    ? `${tripPeriod}\n부지런에서 함께 일정을 만들어봐요 🤩`
    : "부지런에서 함께 부산 여행 일정을 만들어봐요 🤩";
  // 공유받은 친구가 접속할 수 있도록 로컬/미리보기 주소 대신 서비스 주소를 사용한다.
  const shareOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://bujirun.store").origin;
  const inviteUrl = `${shareOrigin}/join/${encodeURIComponent(inviteCode)}?${new URLSearchParams({
    count: String(totalSlots),
    days,
    startDate,
    endDate,
    // 시작/종료 시각까지 넘겨야 초대받은 멤버의 결과(투표) 화면 시간이 방장과 같아진다.
    startTime,
    endTime,
  }).toString()}`;
  const shareImageUrl = `${shareOrigin}/images/invite-character.png`;

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pb-16">
      <div className="w-full rounded-[30px] border border-white/40 bg-gradient-to-b from-system-glassfrom to-system-glassto px-6 py-[40px] backdrop-blur-[15px] flex flex-col items-center">
        {/* 안내 문구 */}
        <p
          className="font-paperlogy font-medium text-xl text-text-heading text-center"
          style={{ lineHeight: "23px" }}
        >
          친구들이 모두 모이면
          <br />
          일정을 짜러 갈 수 있어요 🥰
        </p>

        {/* 여행 기간 — 초대로 들어온 팀원도 언제 가는 여행인지 바로 알 수 있게 */}
        {tripPeriod && (
          <p className="mt-[10px] font-paperlogy font-bold text-sm text-sub-deepblue text-center leading-[1.45] break-keep">
            {tripPeriod}
          </p>
        )}

        {/* 참여 카운트 */}
        <p className="mt-[27px] font-paperlogy font-bold text-md text-sub-deepblue text-center">
          ( {joinedCount} / {totalSlots} )
        </p>

        {/* 친구 아바타 - 친구 수별 행 배치 */}
        <ParticipantAvatarGrid total={totalSlots} activeCount={joinedCount} className="mt-5" />

        {/* 친구 초대 링크 */}
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="mt-[27px] font-paperlogy font-normal text-sm text-text-primary underline decoration-solid underline-offset-2"
        >
          친구 초대하기
        </button>
      </div>

      <ShareInviteModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`${nickname}님이 ‘${tripName}’에 초대했어요 🌊`}
        description={shareDescription}
        imageUrl={shareImageUrl}
        inviteUrl={inviteUrl}
      />

      <Toast
        isVisible={showExitWarning}
        onHide={() => setShowExitWarning(false)}
        message="중간에 나가면 일정이 초기화될 수 있어요"
        variant="warning"
        duration={5000}
      />
    </div>
  );
}

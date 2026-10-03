"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { groupApi, itineraryApi } from "@/shared/api/domains";
import { reissueAccessToken } from "@/shared/api";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { savePendingInvite } from "@/shared/utils/pendingInvite";
import { formatTripPeriod } from "@/shared/utils";
import { KakaoLoginButton } from "@/components/ui/KakaoLoginButton";
import { LoadingState } from "@/components";

type JoinStatus =
  | "checking"
  | "unauthenticated"
  | "joining"
  | "success"
  | "full"
  | "closed"
  | "error";

function PageLoadingFallback() {
  return <LoadingState />;
}

export default function JoinGroupPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <JoinGroupContent params={params} />
    </Suspense>
  );
}

function JoinGroupContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const count = searchParams.get("count") ?? undefined;
  const days = searchParams.get("days") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  // 여행 시작/종료 시각이 없으면 초대받은 멤버의 결과(투표) 화면이 기본값을 쓰게 되어
  // 방장 화면과 시간이 어긋난다 — 초대 링크에 실려온 값을 끝까지 넘겨준다.
  const startTime = searchParams.get("startTime") ?? undefined;
  const endTime = searchParams.get("endTime") ?? undefined;
  const tripPeriod = formatTripPeriod(startDate, endDate, days);
  const [status, setStatus] = useState<JoinStatus>("checking");
  const [groupName, setGroupName] = useState("");

  // 로그인 전 초대 미리보기(그룹명/초대자/멤버수) — 백엔드 미배포 시 조용히 실패해도 무방하므로
  // 에러는 무시하고 없으면 기본 문구로 폴백한다.
  const { data: invitePreview, isPending: isInvitePreviewPending } = useQuery({
    queryKey: groupApi.keys.invitePreview(code),
    queryFn: () => groupApi.previewInvite(code),
    retry: false,
    staleTime: 60_000,
  });
  // 정원이 찼더라도 기존 멤버의 재접속은 허용해야 하므로 공개 미리보기만 보고 막지 않는다.
  // 실제 신규 참여 여부는 인증된 join API가 서버에서 판별한다.
  const displayedStatus: JoinStatus = invitePreview?.completed ? "closed" : status;

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    // 로그인/그룹 가입보다 먼저 공개 미리보기로 완료 여부를 확인한다.
    // 이미 확정된 일정이면 비로그인 사용자도 가입·투표 흐름에 진입하지 않는다.
    if (isInvitePreviewPending) return;
    if (invitePreview?.completed) {
      return;
    }

    // accessToken은 메모리에만 있어서(useAuthStore) 새로고침이나 하드 네비게이션 후엔 항상 비어 있다.
    // /join은 AuthProvider의 public 경로라 자동 reissue도 타지 않으므로, 여기서 직접
    // refresh_token 쿠키로 재발급을 시도해야 "이미 로그인한 사람"이 로그인 화면을 다시 보지 않는다.
    // (이게 없으면 카카오 로그인 → 콜백이 /join으로 하드 이동 → 토큰 유실 → 다시 로그인 요구, 무한 반복)
    const ensureAuthenticated = async () => {
      if (useAuthStore.getState().accessToken) return true;
      return Boolean(await reissueAccessToken());
    };

    ensureAuthenticated().then((isAuthenticated) => {
      if (cancelled) return;

      if (!isAuthenticated) {
        savePendingInvite({ code, count, days, startDate, endDate, startTime, endTime });
        setStatus("unauthenticated");
        return;
      }

      setStatus("joining");

      groupApi
        .joinGroup({ inviteCode: code })
        .then(async (group) => {
          if (cancelled) return;
          setGroupName(group.name ?? "여행");
          setStatus("success");

          // 이미 일정이 만들어진 그룹이면 인원 모으기 → 성향 → 스와이프 → 투표를 다시
          // 태울 이유가 없다(완성된 일정의 초대 코드로 들어와도 투표 화면이 뜨던 버그).
          // 일정 목록은 그룹 멤버에게도 내려오므로 groupId로 찾아 바로 그 일정을 연다.
          const existingItinerary = await itineraryApi
            .getItineraries()
            .then((list) => list.find((itinerary) => itinerary.groupId === group.id))
            .catch(() => undefined);
          if (cancelled) return;
          if (existingItinerary?.id) {
            timer = window.setTimeout(() => {
              router.replace(`/itinerary?tripId=${existingItinerary.id}`);
            }, 1200);
            return;
          }

          const inviteParams = new URLSearchParams({ groupId: group.id ?? "", role: "guest" });
          inviteParams.set("inviteCode", group.inviteCode ?? code);
          if (count) inviteParams.set("count", count);
          if (days) inviteParams.set("days", days);
          if (group.name) inviteParams.set("name", group.name);
          if (startDate) inviteParams.set("startDate", startDate);
          if (endDate) inviteParams.set("endDate", endDate);
          if (startTime) inviteParams.set("startTime", startTime);
          if (endTime) inviteParams.set("endTime", endTime);
          timer = window.setTimeout(() => {
            router.replace(`/itinerary/trips/invite?${inviteParams.toString()}`);
          }, 1200);
        })
        .catch((error) => {
          if (cancelled) return;
          if (axios.isAxiosError(error) && error.response?.status === 409) {
            const message = String(error.response.data?.message ?? "");
            setStatus(message.includes("정원") ? "full" : "closed");
            return;
          }
          setStatus("error");
        });
    });

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [
    code,
    count,
    days,
    startDate,
    endDate,
    startTime,
    endTime,
    router,
    invitePreview,
    isInvitePreviewPending,
  ]);

  // 언제 가는 여행인지는 로그인 전/참여 중/참여 완료 어느 화면에서든 보여야 해서
  // 문구만 상태별로 바꾸고 기간 줄은 그대로 재사용한다. (구버전 링크는 날짜가 없어 렌더 안 됨)
  const periodLine = tripPeriod ? (
    <p className="mt-[10px] font-paperlogy font-bold text-sm text-sub-deepblue text-center leading-[1.45] break-keep">
      {tripPeriod}
    </p>
  ) : null;

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pb-16">
      <div className="w-full rounded-[30px] border border-white/40 bg-gradient-to-b from-system-glassfrom to-system-glassto px-6 py-[40px] backdrop-blur-[15px] flex flex-col items-center">
        {displayedStatus === "unauthenticated" && (
          <>
            {/* 그룹명/닉네임 길이에 따라 줄바꿈 위치가 달라져서 강제 개행(<br />) 대신
                break-keep으로 단어 중간이 끊기지 않게만 하고 자연스럽게 흐르도록 둔다. */}
            <p className="font-paperlogy font-medium text-xl text-text-heading text-center leading-[1.45] break-keep text-balance">
              {invitePreview?.groupName && invitePreview?.inviterNickname
                ? `${invitePreview.inviterNickname}님이 ‘${invitePreview.groupName}’에 초대했어요 🌊`
                : "부지런 여행 초대장이 도착했어요 🌊"}
            </p>
            {periodLine}
            <p className="mt-[10px] font-paperlogy font-medium text-md text-text-heading text-center leading-[1.45] break-keep text-balance">
              카카오로 로그인하면 바로 참여할 수 있어요
            </p>
            <div className="mt-[27px] w-full">
              <KakaoLoginButton />
            </div>
          </>
        )}
        {(displayedStatus === "checking" || displayedStatus === "joining") && (
          <>
            <p
              className="font-paperlogy font-medium text-xl text-text-heading text-center break-keep"
              style={{ lineHeight: "23px" }}
            >
              초대 코드를 확인하고 있어요...
            </p>
            {periodLine}
          </>
        )}
        {displayedStatus === "success" && (
          <>
            <p
              className="font-paperlogy font-medium text-xl text-text-heading text-center break-keep"
              style={{ lineHeight: "23px" }}
            >
              ‘{groupName}’에 참여했어요 🎉
              <br />
              잠시 후 일정 화면으로 이동할게요
            </p>
            {periodLine}
          </>
        )}
        {displayedStatus === "closed" && (
          <>
            <p className="font-paperlogy font-medium text-xl text-text-heading text-center leading-[1.45] break-keep text-balance">
              ‘{groupName || invitePreview?.groupName || "여행"}’은(는) 이미 완성된 일정이에요.
              <br />
              초대 및 투표 참여가 종료됐어요.
            </p>
            {periodLine}
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="mt-[27px] font-paperlogy font-normal text-sm text-text-primary underline decoration-solid underline-offset-2"
            >
              홈으로 돌아가기
            </button>
          </>
        )}
        {displayedStatus === "full" && (
          <>
            <p className="font-paperlogy font-medium text-xl text-text-heading text-center leading-[1.45] break-keep text-balance">
              ‘{groupName || invitePreview?.groupName || "여행"}’은(는) 모집 인원이 모두 찼어요.
              <br />
              정원을 초과해 참여할 수 없어요.
            </p>
            {periodLine}
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="mt-[27px] font-paperlogy font-normal text-sm text-text-primary underline decoration-solid underline-offset-2"
            >
              홈으로 돌아가기
            </button>
          </>
        )}
        {displayedStatus === "error" && (
          <>
            <p
              className="font-paperlogy font-medium text-xl text-text-heading text-center break-keep"
              style={{ lineHeight: "23px" }}
            >
              유효하지 않은 초대 링크예요.
              <br />
              링크를 다시 확인해주세요.
            </p>
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="mt-[27px] font-paperlogy font-normal text-sm text-text-primary underline decoration-solid underline-offset-2"
            >
              홈으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

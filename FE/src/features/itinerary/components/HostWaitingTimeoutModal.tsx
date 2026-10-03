"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Modal } from "@/components";
import EmergencyIcon from "@/assets/icons/itinerary/emergency-on.svg?svgr";
import { itineraryApi, swipeApi } from "@/shared/api/domains";
import {
  isItineraryFlowExpired,
  useItineraryFlowStore,
  type ItineraryFlowProgress,
} from "@/shared/stores";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useIsGroupHost } from "../hooks/useIsGroupHost";
import { useItineraryFlowTimer } from "../hooks/useItineraryFlowTimer";
import { buildTripResultQuery } from "../utils/tripFlowParams";

// 취향분석 대기·투표 대기 타이머가 끝나도 팀원은 방장이 넘겨줄(확정할) 때까지 대기 화면에
// 머문다. 방장이 대기 화면이 아닌 곳(다른 탭, 아직 스와이프·투표 중 등)에 있으면 시간이 끝난
// 걸 몰라서 그룹 전체가 계속 갇혔다. 그래서 방장이 앱 어디에 있든 알리고 바로 넘길 수 있게 한다.
const TASTE_STEPS = new Set<ItineraryFlowProgress["step"]>(["personality", "swipe", "waiting"]);
const VOTE_STEPS = new Set<ItineraryFlowProgress["step"]>(["result", "vote-waiting"]);

export function HostWaitingTimeoutModal() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const flow = useItineraryFlowStore((state) => state.flow);

  // 로그인 전이거나 만들던 그룹 일정이 없으면 아무 요청도 보내지 않는다.
  if (!accessToken || !flow?.groupId || isItineraryFlowExpired(flow)) return null;
  if (TASTE_STEPS.has(flow.step)) {
    return <TasteWaitingWatcher key={flow.groupId} flow={flow} />;
  }
  if (VOTE_STEPS.has(flow.step) && flow.sessionId) {
    return <VoteWaitingWatcher key={flow.sessionId} flow={flow} sessionId={flow.sessionId} />;
  }
  return null;
}

function TasteWaitingWatcher({ flow }: { flow: ItineraryFlowProgress }) {
  const router = useRouter();
  const pathname = usePathname();
  const { groupId } = flow;
  const isHost = useIsGroupHost(groupId);
  const [isDismissed, setIsDismissed] = useState(false);

  const { data: swipeStatus } = useQuery({
    queryKey: swipeApi.keys.status(groupId),
    queryFn: () => swipeApi.getSwipeStatus(groupId),
    enabled: isHost,
    refetchInterval: 5000,
  });

  // 대기 타이머는 첫 참여자가 대기 화면에 들어올 때 서버에서 시작된다(조회 API가 곧 시작
  // API). 아무도 취향분석을 끝내기 전에 조회하면 방장이 타이머를 먼저 시작시켜 버리므로,
  // 누군가 끝낸 뒤에만 본다. 전원 완료했거나 이미 결과로 넘어갔으면 볼 필요가 없다.
  const doneCount = swipeStatus?.doneCount ?? 0;
  const totalCount = swipeStatus?.totalCount ?? 0;
  const isTimerRunning =
    isHost && doneCount > 0 && !swipeStatus?.allDone && !swipeStatus?.generationStarted;
  const { isOver } = useItineraryFlowTimer(isTimerRunning ? groupId : "", "waiting");

  // 대기 화면에는 같은 안내와 "기다리지 않고 진행하기" 버튼이 이미 있다.
  const isOnWaitingPage = pathname.startsWith("/itinerary/trips/waiting");

  return (
    <HostTimeoutModal
      isOpen={isTimerRunning && isOver && !isOnWaitingPage && !isDismissed}
      title="취향분석 시간이 끝났어요"
      description={`${totalCount}명 중 ${doneCount}명이 취향분석을 마치고 기다리고 있어요.\n아직 안 한 친구는 이번 추천에 취향이 반영되지 않아요.\n(일정에서 빠지는 건 아니에요)`}
      actionText="진행하기"
      onAction={() => {
        setIsDismissed(true);
        router.push(
          `/itinerary/trips/result?${buildTripResultQuery(new URLSearchParams(flow.query))}`,
        );
      }}
    />
  );
}

function VoteWaitingWatcher({
  flow,
  sessionId,
}: {
  flow: ItineraryFlowProgress;
  sessionId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { groupId } = flow;
  const isHost = useIsGroupHost(groupId);
  const [isDismissed, setIsDismissed] = useState(false);
  const totalSlots = Math.min(
    6,
    Math.max(2, Number(new URLSearchParams(flow.query).get("count")) || 6),
  );

  const { data: voteStatus } = useQuery({
    queryKey: itineraryApi.keys.voteStatus(sessionId),
    queryFn: () => itineraryApi.getVoteStatus(sessionId),
    enabled: isHost,
    retry: false,
    refetchInterval: 5000,
  });

  // 투표 대기 타이머도 첫 투표자가 투표 대기 화면에 들어올 때 시작된다(조회가 곧 시작).
  // 아무도 투표하기 전에는 조회하지 않고, 이미 확정됐으면 볼 필요가 없다.
  const votedCount = Math.min(totalSlots, voteStatus?.totalVotes ?? 0);
  const isVoting = isHost && votedCount > 0 && voteStatus?.status !== "confirmed";
  const { isOver } = useItineraryFlowTimer(
    isVoting ? groupId : "",
    "vote-waiting",
    isVoting ? sessionId : undefined,
  );
  // 전원이 투표해도 확정은 방장 화면만 할 수 있어서, 방장이 없으면 시간이 남아도 갇힌다.
  const isAllVoted = votedCount >= totalSlots;

  // 최다 득표 확정 / 동률 선택 / 0표 안내는 투표 대기 화면에 이미 있으므로 그리로 보낸다.
  const isOnVoteWaitingPage = pathname.startsWith("/itinerary/trips/vote-waiting");

  return (
    <HostTimeoutModal
      isOpen={isVoting && (isOver || isAllVoted) && !isOnVoteWaitingPage && !isDismissed}
      title={isAllVoted ? "모두 투표를 마쳤어요" : "투표 시간이 끝났어요"}
      description={`${totalSlots}명 중 ${votedCount}명이 투표하고 기다리고 있어요.\n방장님이 일정을 확정해주세요.`}
      actionText="확정하러 가기"
      onAction={() => {
        setIsDismissed(true);
        // result 단계의 쿼리도 투표 대기 화면으로 넘기던 값(sessionId 포함)과 같다.
        router.push(`/itinerary/trips/vote-waiting?${flow.query}`);
      }}
    />
  );
}

// 팀원들이 방장만 기다리고 있으므로 "더 기다리기"는 두지 않는다. 닫기(X/바깥 클릭/ESC)로도
// 닫히지 않게 해서, 방장이 버튼으로 넘겨주도록 한다.
function HostTimeoutModal({
  isOpen,
  title,
  description,
  actionText,
  onAction,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      hideCloseButton
      hideActions
      confirmVariant="warning"
      icon={<EmergencyIcon width={25} height={25} className="text-sub-coral" aria-hidden />}
      title={title}
      description={description}
      footer={
        <Button variant="warning" onClick={onAction}>
          {actionText}
        </Button>
      }
    />
  );
}

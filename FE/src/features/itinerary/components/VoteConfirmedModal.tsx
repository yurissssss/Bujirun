"use client";

import { useEffect, useRef } from "react";
import { Button, Modal } from "@/components";
import VoteIcon from "@/assets/icons/itinerary/vote-yea.svg?svgr";
import type { components } from "@/shared/api/schema";

type VoteStatusResponse = components["schemas"]["VoteStatusResponse"];

// 전원 투표로 최다 득표안이 정해졌는지, 방장이 골라서(시간 종료·동률·프리패스) 정했는지.
export type VoteConfirmedReason = "vote" | "host";

export interface VoteConfirmedNotice {
  plan?: string;
  reason: VoteConfirmedReason;
  itineraryId?: string;
}

// 안내 후 자동으로 일정 화면으로 넘어가기까지의 시간.
const AUTO_GO_MS = 2500;

// 확정된 세션의 투표 현황만 보고 이유를 정한다 — 참여자는 방장이 어떤 버튼으로 확정했는지
// 모르므로, "전원이 투표했고 확정안이 단독 최다 득표"면 투표로 정해진 것으로 본다.
export function getVoteConfirmedReason(
  status: VoteStatusResponse | undefined,
  totalSlots: number,
  plan = status?.confirmedPlan,
): VoteConfirmedReason {
  const counts = status?.voteCounts ?? {};
  const allVoted = (status?.totalVotes ?? 0) >= totalSlots;
  const planCount = plan ? (counts[plan] ?? 0) : 0;
  const isSoleTop =
    !!plan &&
    planCount > 0 &&
    Object.entries(counts).every(([key, count]) => key === plan || (count ?? 0) < planCount);
  return allVoted && isSoleTop ? "vote" : "host";
}

function getDescription({ plan, reason }: VoteConfirmedNotice) {
  if (!plan) return "일정 화면으로 넘어갈게요.";
  return reason === "vote"
    ? `모두 투표해서 ${plan}안이 최다 득표로 선택됐어요.\n일정 화면으로 넘어갈게요.`
    : `방장이 ${plan}안으로 확정했어요.\n일정 화면으로 넘어갈게요.`;
}

// 일정이 확정되면 방장·팀원 모두에게 어떤 안으로 정해졌는지 알리고 일정 화면으로 보낸다.
// 잠깐 보여준 뒤 자동으로 넘어가고, 바로 넘어가고 싶으면 버튼을 누른다.
export function VoteConfirmedModal({
  notice,
  onGo,
}: {
  notice: VoteConfirmedNotice | null;
  onGo: (itineraryId?: string) => void;
}) {
  const wentRef = useRef(false);
  const go = () => {
    if (!notice || wentRef.current) return;
    wentRef.current = true;
    onGo(notice.itineraryId);
  };

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(go, AUTO_GO_MS);
    return () => window.clearTimeout(timer);
    // go는 매 렌더마다 새로 만들어지지만 notice가 같으면 같은 동작이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice]);

  return (
    <Modal
      isOpen={notice !== null}
      onClose={() => {}}
      hideCloseButton
      hideActions
      icon={<VoteIcon width={25} height={25} className="text-main-blue" aria-hidden />}
      title={notice?.plan ? `${notice.plan}안으로 결정됐어요! 🎉` : "일정이 확정됐어요! 🎉"}
      description={notice ? getDescription(notice) : undefined}
      footer={
        <Button variant="primary" onClick={go}>
          일정 보러 가기
        </Button>
      }
    />
  );
}

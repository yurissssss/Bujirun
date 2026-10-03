import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// 일정 생성 플로우에서 "지금 어디까지 왔는지"를 기기에 남겨둔다. 생성 중에 앱이 튕기거나
// 새로고침되면 화면 상태(groupId/날짜/숙소/voteSessionId)가 URL 쿼리에만 있어서 전부 날아가고,
// 다시 들어갈 입구가 없어서 그 사람만 영구히 플로우 밖으로 떨어지는 문제가 있었다.
// 그래서 sessionStorage(탭 단위)가 아니라 localStorage에 저장한다 — 앱을 완전히 닫고
// 다시 열어도 "이어하기"로 돌아올 수 있어야 한다.
export type ItineraryFlowStep =
  | "invite"
  | "personality"
  | "swipe"
  | "waiting"
  | "result"
  | "vote-waiting";

const FLOW_STEP_PATHS: Record<ItineraryFlowStep, string> = {
  invite: "/itinerary/trips/invite",
  personality: "/itinerary/trips/personality",
  swipe: "/itinerary/trips/swipe",
  waiting: "/itinerary/trips/waiting",
  result: "/itinerary/trips/result",
  "vote-waiting": "/itinerary/trips/vote-waiting",
};

// 하루가 지난 기록은 이미 남이 확정했거나 그냥 버려진 방일 가능성이 높아서 더 권하지 않는다.
export const ITINERARY_FLOW_TTL_MS = 24 * 60 * 60 * 1000;

export type ItineraryFlowProgress = {
  step: ItineraryFlowStep;
  // 해당 단계 페이지가 그대로 쓰던 쿼리스트링(count/days/groupId/name/날짜/숙소/sessionId…)
  query: string;
  groupId: string;
  tripName?: string;
  // 투표 세션이 만들어진 뒤(result 이후)에만 있다. 이어하기 전에 이미 확정됐는지 확인하는 데 쓴다.
  sessionId?: string;
  updatedAt: number;
};

type ItineraryFlowState = {
  flow: ItineraryFlowProgress | null;
  saveFlow: (progress: Omit<ItineraryFlowProgress, "updatedAt">) => void;
  clearFlow: () => void;
};

export const useItineraryFlowStore = create<ItineraryFlowState>()(
  persist(
    (set) => ({
      flow: null,
      saveFlow: (progress) => set({ flow: { ...progress, updatedAt: Date.now() } }),
      clearFlow: () => set({ flow: null }),
    }),
    {
      name: "bujirun-itinerary-flow-progress",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function getItineraryFlowHref(flow: ItineraryFlowProgress): string {
  const path = FLOW_STEP_PATHS[flow.step];
  return flow.query ? `${path}?${flow.query}` : path;
}

export function isItineraryFlowExpired(flow: ItineraryFlowProgress): boolean {
  return Date.now() - flow.updatedAt > ITINERARY_FLOW_TTL_MS;
}

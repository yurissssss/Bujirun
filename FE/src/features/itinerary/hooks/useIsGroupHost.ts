"use client";

import { useQuery } from "@tanstack/react-query";
import { groupApi, userApi } from "@/shared/api/domains";

// 방장 전용 액션(확정/타이브레이크) 노출 여부 판단용.
// 방 생성자(createdBy)와 내 계정 id가 같으면 방장이다.
export function useIsGroupHost(groupId: string) {
  const { data: profile } = useQuery({
    queryKey: userApi.keys.me(),
    queryFn: userApi.getMyProfile,
  });

  // 이 목록은 "새 여행 만들기" 폼에서도 같은 키로 먼저 받아둔다(TripSetupForm). 기본
  // staleTime이 60초라, 방을 만든 직후 이 화면에 오면 방이 생기기 "전"에 받아둔 목록을
  // 그대로 써서 방장인데도 isHost가 false가 되고(확정/프리패스/건너뛰기 버튼이 막힘),
  // 새로고침해야 정상으로 돌아오는 문제가 있었다. 방장 판정은 화면에 들어올 때마다
  // 최신 목록으로 해야 해서 이 쿼리만 항상 다시 받는다(응답이 작은 목록 API).
  const { data: groups } = useQuery({
    queryKey: groupApi.keys.mine(),
    queryFn: groupApi.getMyGroups,
    enabled: !!groupId,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const group = groups?.find((g) => g.id === groupId);
  return !!profile?.id && !!group?.createdBy && profile.id === group.createdBy;
}

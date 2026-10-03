// 인원 수별로 아바타를 몇 명씩 줄바꿈할지 정의 — 친구초대 대기화면(ParticipantAvatarGrid)과
// 동행 친구 모달(TripMembersModal)이 같은 배치 규칙을 쓰도록 공유한다.
const SLOT_LAYOUTS: Record<number, number[]> = {
  1: [1],
  2: [2],
  3: [3],
  4: [2, 2],
  5: [2, 3],
  6: [3, 3],
};

export function buildAvatarRows(total: number): number[][] {
  const rowCounts = SLOT_LAYOUTS[total] ?? SLOT_LAYOUTS[6];
  let idx = 0;

  return rowCounts.map((count) =>
    Array.from({ length: count }, () => {
      const current = idx;
      idx += 1;
      return current;
    }),
  );
}

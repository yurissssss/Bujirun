// Tailwind는 `bg-${color}`처럼 런타임에 조립한 클래스명은 스캔하지 못한다(빌드 시 정적
// 문자열만 인식) — 색상별 완성된 클래스명을 리터럴로 나열해두고 그대로 반환한다.
export const PARTICIPANT_COLOR_CLASSES = [
  "bg-sub-deepblue",
  "bg-sub-lightblue",
  "bg-sub-pink",
  "bg-sub-green",
  "bg-sub-violet",
  "bg-sub-coral",
] as const;

export interface ParticipantColorPeer {
  id?: string;
  colorClass?: string;
}

function hashToIndex(userId: string): number {
  let hash = 0;
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % PARTICIPANT_COLOR_CLASSES.length;
}

// 같은 사람은 늘 같은 색으로 보이는 게 우선이라, 시작 색을 userId 해시로 고정한다
// (새로고침·재접속·다른 기기에서도 같은 색). 예전엔 접속할 때마다 남은 색 중 랜덤으로
// 뽑아서, 방에 다시 들어오기만 해도 색이 바뀌었다.
//
// 그룹 최대 인원(6명)이 팔레트 색상 수와 같아 해시 시작 색은 겹칠 수 있다. 그때 양쪽이
// 모두 "상대 색을 피한다"를 돌리면 서로 색을 주고받으며 계속 흔들리므로, 양보는 userId가
// 큰 쪽만 한다 — 누가 양보할지가 고정되니 같은 사람들이 다시 모여도 색 조합이 그대로다.
export function resolveParticipantColorClass(
  userId: string,
  peers: Iterable<ParticipantColorPeer>,
): string {
  const blocked = new Set<string>();
  for (const peer of peers) {
    if (!peer.colorClass) continue;
    // 상대 id를 모르면(프레즌스가 아직 id 없이 온 피어) 겹친 채 두는 쪽이 더 나쁘므로 양보한다.
    if (peer.id === undefined || peer.id < userId) blocked.add(peer.colorClass);
  }

  const start = hashToIndex(userId);
  for (let i = 0; i < PARTICIPANT_COLOR_CLASSES.length; i++) {
    const candidate = PARTICIPANT_COLOR_CLASSES[(start + i) % PARTICIPANT_COLOR_CLASSES.length];
    if (!blocked.has(candidate)) return candidate;
  }
  return PARTICIPANT_COLOR_CLASSES[start];
}

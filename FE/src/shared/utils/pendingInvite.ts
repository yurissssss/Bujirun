const PENDING_INVITE_KEY = "bujirun_pending_invite";

// 초대 링크를 연 뒤 카카오 로그인·회원가입까지 마치는 데 필요한 시간만 유효하면 된다.
// 만료가 없으면 예전에 초대 링크를 한 번 열어본 브라우저에서는 한참 뒤에 "그냥 로그인"만
// 해도 저장돼 있던 초대 코드가 소비되면서 남의 초대 흐름(친구 초대 → 성향 → 스와이프)으로
// 끌려간다 — 초대를 받은 적 없는 사용자가 일정 생성 화면을 보게 되는 원인.
const PENDING_INVITE_TTL_MS = 30 * 60 * 1000;

export interface PendingInvite {
  code: string;
  count?: string;
  days?: string;
  startDate?: string;
  endDate?: string;
  // 여행 시작/종료 시각. 이게 초대 링크로 전달되지 않으면 초대받은 멤버는 결과(투표)
  // 화면에서 기본값(10:00/17:00)을 쓰게 되어 방장 화면과 시간이 달라진다.
  startTime?: string;
  endTime?: string;
}

interface StoredPendingInvite extends PendingInvite {
  savedAt?: number;
}

// 초대 링크(/join/[code])로 들어온 비로그인 유저가 로그인·회원가입을 마치고
// 다시 초대 참여 흐름으로 복귀할 수 있도록 코드와 방 정보(count/days)를 잠깐 저장해둔다.
export function savePendingInvite(invite: PendingInvite) {
  const stored: StoredPendingInvite = { ...invite, savedAt: Date.now() };
  try {
    window.localStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(stored));
  } catch {
    // 저장에 실패해도 초대 흐름만 복귀가 안 될 뿐이라 로그인 자체는 막지 않는다.
  }
}

// 초대 흐름이 아닌 로그인/로그아웃에서 잔재를 지우기 위한 명시적 제거.
export function clearPendingInvite() {
  try {
    window.localStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    // 접근 불가한 환경(프라이빗 모드 등)에서는 애초에 저장도 안 됐다.
  }
}

export function consumePendingInvite(): PendingInvite | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PENDING_INVITE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  // 유효하든 만료됐든 읽는 즉시 지운다 — 만료된 값이 남아 다음 로그인까지 따라가면 안 된다.
  clearPendingInvite();

  try {
    const stored = JSON.parse(raw) as StoredPendingInvite;
    if (!stored?.code) return null;
    // savedAt이 없는 값은 만료 도입 전에 저장된 잔재이므로 만료로 본다.
    if (!stored.savedAt || Date.now() - stored.savedAt > PENDING_INVITE_TTL_MS) return null;

    return {
      code: stored.code,
      count: stored.count,
      days: stored.days,
      startDate: stored.startDate,
      endDate: stored.endDate,
      startTime: stored.startTime,
      endTime: stored.endTime,
    };
  } catch {
    return null;
  }
}

// 초대 흐름에서 /join으로 되돌아갈 때 붙일 쿼리. 필드가 늘어날 때마다 세 군데(콜백,
// 회원가입 완료 모달, 초대 링크)를 따로 고치다 빠뜨리는 일이 없도록 한곳에 모아둔다.
export function buildPendingInviteQuery(invite: PendingInvite): string {
  const params = new URLSearchParams();
  if (invite.count) params.set("count", invite.count);
  if (invite.days) params.set("days", invite.days);
  if (invite.startDate) params.set("startDate", invite.startDate);
  if (invite.endDate) params.set("endDate", invite.endDate);
  if (invite.startTime) params.set("startTime", invite.startTime);
  if (invite.endTime) params.set("endTime", invite.endTime);
  return params.toString();
}

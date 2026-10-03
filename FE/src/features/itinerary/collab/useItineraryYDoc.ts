"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { reissueAccessToken } from "@/shared/api/client";
import { getJwtExpiryMs } from "@/shared/utils/jwt";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

// 나중에 화면에 상태 문구를 붙일 수 있도록 status를 한 단계 더 나눈 값. 다만 지금은 값만
// 노출해 둔 상태이고, 이 값을 읽는 화면은 아직 없다(화면 연결은 후속 작업).
// - "idle": 연결을 시도할 조건이 아직 아니다(일정 id 없음 / 로그인 안 됨) → "대기"
// - "connecting" / "connected" / "disconnected": 실제 소켓 상태 → "연결 중 / 연결됨 / 끊김"
// - "unconfigured": WS 주소 설정이 없어(또는 https에서 ws://라) 시도 자체를 안 했다
//   → "협업 서버 설정 누락". status로는 "disconnected"로 내려가므로, "잠깐 끊김"과
//   "아예 못 씀"을 구분해야 하는 UI는 (연결되면) 이 값을 봐야 한다.
export type CollabConnectionState = ConnectionStatus | "idle" | "unconfigured";

// node는 연결 시 1회만 토큰을 검증해서, 만료 후 401을 브라우저가 읽어내는 방식으로는
// 재연결을 안정적으로 못 잡는다 — 만료 이만큼 전에 미리 재발급 + 재연결한다.
const REFRESH_BUFFER_MS = 60_000;

// 이탈 시 flush(onBeforeDisconnect)가 끝나기를 기다리는 상한. 이 시간을 넘기면 소켓을
// 영원히 붙잡고 있지 않도록 그냥 destroy하고, 그 사실을 콘솔에 남긴다.
const FLUSH_WAIT_TIMEOUT_MS = 5_000;

// onBeforeDisconnect가 Promise를 돌려주지 않는(=동기 시그니처) 호출부를 위한 유예 시간.
// 완료 시점을 알 방법이 없으므로 "최선 노력"으로 이만큼만 연결/문서를 살려두고,
// 그 사이에 도착한 REST 응답(새 항목의 real id)이 문서에 반영돼 서버까지 전파되게 한다.
const SYNC_FLUSH_GRACE_MS = 1_500;

// 탭 이탈 flush가 연달아 터지지 않게 하는 최소 간격(탭 전환을 반복하면
// visibilitychange가 계속 발생한다).
const UNLOAD_FLUSH_MIN_INTERVAL_MS = 1_000;

// WS 주소 폴백 기준: 개발(NODE_ENV === "development")에서만 localhost로 폴백한다.
// 프로덕션 빌드에서 env가 비어 있으면 예전처럼 ws://localhost:1234로 조용히 붙는 대신
// 아예 연결을 시도하지 않는다 — 운영 브라우저에서 localhost는 열릴 수 없는데
// y-websocket은 지수 백오프로 무한 재시도하고, https 페이지의 ws://는 mixed content로
// 차단되기까지 해서, 사용자는 "협업이 되고 있다"고 오해하게 된다.
function resolveWsUrl(): { url: string; reason?: undefined } | { url: null; reason: string } {
  const configured = process.env.NEXT_PUBLIC_YJS_WS_URL?.trim();

  if (!configured) {
    if (process.env.NODE_ENV === "development") return { url: "ws://localhost:1234" };
    return { url: null, reason: "NEXT_PUBLIC_YJS_WS_URL이 설정되지 않았습니다." };
  }

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    configured.startsWith("ws://")
  ) {
    return {
      url: null,
      reason: `https 페이지에서는 ws:// 주소(${configured})로 연결할 수 없습니다. wss://로 설정해 주세요.`,
    };
  }

  return { url: configured };
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

// pending이 끝나거나 timeoutMs가 지나면 resolve한다. 반환값 true = 타임아웃.
async function waitForFlush(pending: PromiseLike<unknown>, timeoutMs: number): Promise<boolean> {
  let timer: number | undefined;
  const timedOut = new Promise<boolean>((resolve) => {
    timer = window.setTimeout(() => resolve(true), timeoutMs);
  });
  const finished = Promise.resolve(pending).then(
    () => false,
    (error: unknown) => {
      // 실패해도 더 기다릴 이유는 없다(상위 훅이 재시도/에러 UI를 이미 담당한다).
      console.error("[itinerary-collab] 이탈 직전 flush가 실패했습니다.", error);
      return false;
    },
  );

  const result = await Promise.race([finished, timedOut]);
  if (timer !== undefined) window.clearTimeout(timer);
  return result;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

// doc은 호출부(useCollaborativeItinerary)가 만들어 넘긴다 — flush 로직이 그 doc을
// onBeforeDisconnect 콜백 시점보다 먼저 참조할 수 있어야 해서, 이 훅 안에서 새로 만들면
// 순환 참조가 생긴다.
//
// 부지런-node(Yjs WebSocket 서버) room 이름 = itinerary UUID.
// 서버가 UUID 형식이 아닌 room은 즉시 연결을 끊는다.
//
// onBeforeDisconnect: 소켓을 끊기(destroy) 직전에 한 번 호출된다. 이탈 시
// "PATCH 저장 → disconnect" 순서를 지키기 위한 훅 포인트 — 매 렌더 최신 콜백을 ref로
// 들고 있다가(=stale closure 방지) cleanup에서 그 ref를 호출한다.
// Promise를 돌려주면 그 완료(최대 FLUSH_WAIT_TIMEOUT_MS)까지 연결과 문서를 살려둔 뒤
// destroy한다 — flush 응답으로 받은 real id를 resolveTempId가 문서에 쓰는 시점까지
// provider가 붙어 있어야, Redis 문서에 temp-* id가 남고 DB엔 real id가 있는 불일치
// (다음 접속에서 그 항목이 삭제→재생성되며 방문 인증/교통 정보가 유실되는 사고)를 막는다.
// Promise를 돌려주지 않는 기존(동기) 호출부도 그대로 동작한다 — 그 경우엔 완료를 알 수
// 없어서 SYNC_FLUSH_GRACE_MS만큼만 최선 노력으로 기다린다.
export function useItineraryYDoc(
  itineraryId: string | null,
  doc: Y.Doc,
  onBeforeDisconnect?: () => void | Promise<void>,
) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasToken = accessToken !== null;
  // 소켓에서 올라오는 원시 상태만 state로 들고, "연결을 시도조차 하지 않는" 경우
  // (로그인 전, 일정 id 없음, WS 주소 설정 누락)는 아래에서 렌더 중 파생값으로 만든다 —
  // effect 본문에서 setState를 하지 않기 위함(react-hooks/set-state-in-effect: 연쇄 렌더).
  const [socketStatus, setSocketStatus] = useState<ConnectionStatus>("connecting");
  const [synced, setSynced] = useState(false);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const onBeforeDisconnectRef = useRef(onBeforeDisconnect);
  // 연결 세대. cleanup이 flush를 기다리는 동안 같은 doc으로 재마운트(StrictMode,
  // 라우팅 왕복)가 일어나면 이 값이 증가하므로, 옛 cleanup은 "내 세대가 이미 지났다"를
  // 알아채고 새 연결을 건드리지 않은 채 자기 provider만 즉시 닫는다.
  const generationRef = useRef(0);
  const lastUnloadFlushAtRef = useRef(0);

  // cleanup 안에서 generationRef.current를 직접 읽으면 exhaustive-deps가 "ref 값은 그때쯤
  // 바뀌어 있다"고 경고하는데, 여기서는 바로 그 "최신 값"을 보는 것이 목적이라 함수로 감싼다.
  const isStaleGeneration = (generation: number) => generationRef.current !== generation;

  useEffect(() => {
    onBeforeDisconnectRef.current = onBeforeDisconnect;
  });

  // 연결 생성/파괴는 itineraryId와 "토큰 유무"에만 반응한다. 토큰 값 자체가 바뀔 때마다
  // (선제 재발급 등) provider를 통째로 새로 만들면 매번 연결이 끊겼다 열리므로, 토큰 값
  // 변화는 아래 별도 effect에서 기존 provider에 반영한다.
  useEffect(() => {
    if (!itineraryId || !hasToken) return;

    const { url: wsUrl, reason } = resolveWsUrl();
    if (!wsUrl) {
      // 조용히 localhost로 폴백하지 않는다 — 무한 재시도/mixed content를 만드는 대신
      // 아예 연결하지 않고 connectionState를 "unconfigured"로 내린다. 다만 그 값을 읽는
      // 화면이 아직 없어서, 지금 사용자에게 보이는 안내는 없고 콘솔 에러만 남는다
      // (프로덕션에서 env가 비면 협업 없이 로컬 편집만 되는 상태 — 안내는 후속 작업).
      console.error(`[itinerary-collab] 실시간 협업 서버에 연결하지 않습니다: ${reason}`);
      return;
    }

    const generation = ++generationRef.current;
    const provider = new WebsocketProvider(wsUrl, itineraryId, doc, {
      params: { token: accessToken ?? "" },
    });
    providerRef.current = provider;

    const handleStatus = ({ status: next }: { status: ConnectionStatus }) => setSocketStatus(next);
    const handleSync = (isSynced: boolean) => setSynced(isSynced);
    provider.on("status", handleStatus);
    provider.on("sync", handleSync);

    return () => {
      // 상태 구독은 즉시 끊는다(지연 destroy 동안 옛 연결의 status가 새 연결 상태를
      // 덮어쓰지 않도록). 문서/소켓은 flush가 끝날 때까지 그대로 살려둔다.
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      if (providerRef.current === provider) providerRef.current = null;
      setSynced(false);
      // 다음 세대가 자기 상태를 처음 알려줄 때까지 옛 연결의 "connected"가 남아 있지
      // 않도록 되돌린다(생성자가 쏘는 첫 "connecting"은 리스너 등록 전이라 못 받는다).
      setSocketStatus("connecting");

      let pending: void | Promise<void> = undefined;
      try {
        pending = onBeforeDisconnectRef.current?.();
      } catch (error) {
        console.error("[itinerary-collab] 이탈 직전 flush 호출이 실패했습니다.", error);
      }

      // React cleanup은 async를 기다려주지 않으므로, destroy를 이 비동기 흐름 뒤로 미룬다.
      void (async () => {
        // 마이크로태스크 하나를 양보해, 같은 커밋에서 곧바로 이어지는 재마운트의
        // 세대 증가를 먼저 관찰한다.
        await Promise.resolve();
        if (isStaleGeneration(generation)) {
          // 새 연결이 같은 doc을 이미 이어받았다 — flush 응답으로 인한 문서 변경은 그쪽
          // 소켓으로 전파되므로 기다릴 필요가 없고, 소켓 두 개를 오래 물고 있을 이유도 없다.
          provider.destroy();
          return;
        }

        if (isPromiseLike(pending)) {
          const timedOut = await waitForFlush(pending, FLUSH_WAIT_TIMEOUT_MS);
          if (timedOut) {
            console.warn(
              `[itinerary-collab] 이탈 직전 flush가 ${FLUSH_WAIT_TIMEOUT_MS}ms 안에 끝나지 않아 연결을 먼저 닫습니다. 마지막 변경이 서버에 반영되지 않았을 수 있습니다.`,
            );
          }
        } else {
          // 동기 콜백: 완료 시점을 알 수 없어 최선 노력으로만 기다린다.
          await delay(SYNC_FLUSH_GRACE_MS);
        }

        provider.destroy();
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryId, hasToken, doc]);

  // 탭/브라우저가 그냥 닫히거나 백그라운드로 내려가면 React cleanup이 아예 돌지 않아서,
  // 디바운스 대기 중이던 편집이 그대로 사라진다. 그래서 이탈 시점에 flush를 한 번 시도한다.
  //
  // 이벤트 선택 근거: beforeunload는 모바일(iOS Safari, Android Chrome)에서 탭 폐기/앱
  // 전환/프로세스 종료 시 발생이 보장되지 않고, 등록 자체가 bfcache 자격을 깎는다.
  // pagehide는 bfcache 진입과 실제 unload 모두에서 발생하고, visibilitychange(hidden)은
  // "백그라운드로 내려간 뒤 그대로 죽는" 모바일 경로에서 마지막으로 실행이 보장되는
  // 유일한 신호다 — 둘 다 걸고 중복은 아래 간격 가드로 막는다.
  //
  // 어디까지나 "최선 노력"이다: 이 시점 이후의 비동기 완료(PATCH 응답, 그 응답으로 문서를
  // 고치는 resolveTempId, 소켓 전파)는 보장되지 않는다. sendBeacon으로 바꿀 수도 없다 —
  // flush는 Authorization 헤더가 붙은 여러 건의 PATCH/POST이고, 응답(새 항목의 real id)을
  // 받아 문서에 반영해야 하는 흐름이기 때문. 그래서 이 경로는 "2초 디바운스 대기분을
  // 그래도 한 번 던져본다"는 성격이고, 확실한 저장은 상위 훅의 디바운스 flush가 담당한다.
  useEffect(() => {
    if (!itineraryId) return;

    const flushBestEffort = (reason: string) => {
      const now = Date.now();
      if (now - lastUnloadFlushAtRef.current < UNLOAD_FLUSH_MIN_INTERVAL_MS) return;
      lastUnloadFlushAtRef.current = now;
      try {
        // 변경이 없으면 상위 flush가 요청을 만들지 않으므로(스냅샷 diff), 이 호출이
        // 그대로 네트워크 폭주가 되지는 않는다.
        void onBeforeDisconnectRef.current?.();
      } catch (error) {
        console.error(`[itinerary-collab] 이탈(${reason}) flush 호출이 실패했습니다.`, error);
      }
    };

    const handlePageHide = () => flushBestEffort("pagehide");
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushBestEffort("visibilitychange");
    };

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [itineraryId]);

  // 토큰 값이 바뀔 때마다(자체 선제 재발급이든 다른 곳에서의 재발급이든) 기존 소켓을 죽이지
  // 않고 params만 갱신한 뒤 가볍게 재연결한다. y-websocket의 disconnect/connect는 destroy와
  // 달리 doc/awareness 바인딩을 유지한 채 다음 연결부터 새 params를 적용한다.
  useEffect(() => {
    const provider = providerRef.current;
    if (!provider || !accessToken) return;
    if (provider.params.token === accessToken) return;
    provider.params = { token: accessToken };
    provider.disconnect();
    provider.connect();
  }, [accessToken]);

  // 토큰 만료 전에 선제적으로 재발급한다. 성공하면 store가 갱신되고, 위 effect가 그 변화를
  // 감지해 재연결까지 처리한다. 재발급 실패(로그아웃 등)면 그냥 멈춘다.
  useEffect(() => {
    if (!accessToken) return;
    const expiryMs = getJwtExpiryMs(accessToken);
    if (expiryMs === null) return;

    const delayMs = Math.max(0, expiryMs - Date.now() - REFRESH_BUFFER_MS);
    const timer = setTimeout(() => {
      reissueAccessToken();
    }, delayMs);

    return () => clearTimeout(timer);
  }, [accessToken]);

  // provider는 렌더링에 필요 없는 외부 연결 핸들이라 ref로만 노출한다 (필요 시 getProvider() 호출 시점에 읽는다).
  // useCallback으로 참조를 고정해 이 함수를 deps로 쓰는 상위 훅의 effect가 매 렌더 재실행되지 않게 한다.
  const getProvider = useCallback(() => providerRef.current, []);

  // 연결을 시도하는 조건인지는 순수 입력(일정 id, 토큰 유무, WS 주소 설정)에서 바로 나오므로
  // 렌더 중에 계산한다. 순서가 중요하다: 로그인/일정 id가 없는 "대기"가 설정 누락보다 먼저다
  // (그래야 SSR/첫 렌더에서 window를 보는 https 검사 결과에 화면이 흔들리지 않는다).
  const wsConfig = resolveWsUrl();
  const connectionState: CollabConnectionState =
    !itineraryId || !hasToken ? "idle" : wsConfig.url === null ? "unconfigured" : socketStatus;

  return {
    // 기존 키 유지. 다만 연결을 아예 시도하지 않는 상태에서 영원히 "connecting"으로 남지
    // 않도록 "disconnected"로 내려준다(끊김/설정 누락 구분은 connectionState로).
    status:
      connectionState === "idle" || connectionState === "unconfigured"
        ? ("disconnected" as ConnectionStatus)
        : connectionState,
    synced,
    getProvider,
    // 아래는 화면 표시용으로 노출만 해둔 파생값이다 — 기존 키는 그대로 두고 추가만 했고,
    // 지금은 소비하는 화면이 없다(useCollaborativeItinerary가 그대로 재노출만 한다).
    // 후속 작업에서 안내 UI에 연결할 값이므로 "안 쓰인다"고 지우지 말 것. 매핑 계획:
    // "연결됨"(isConnected) / "연결 중"(connectionState === "connecting") /
    // "끊김"(disconnected) / "설정 누락"(isCollabUnavailable) / "대기"(idle).
    connectionState,
    isConnected: connectionState === "connected",
    isCollabUnavailable: connectionState === "unconfigured",
  };
}

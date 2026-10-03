import { loadKakaoShareSdk } from "./kakaoSdk";

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (settings: Record<string, unknown>) => void;
      };
    };
  }
}

// JavaScript SDK 도메인과 별도로 앱 > 제품 링크 관리에 공유할 웹 도메인을 등록해야 한다.
// 미등록 도메인은 카카오가 링크를 대체하므로 webUrl이 있어도 PC에서 열리지 않을 수 있다.
// 공유 화면에서 미리 준비하고 버튼 클릭 시에는 네트워크 요청을 기다리지 않는다.
export async function initKakaoShare(): Promise<boolean> {
  if (typeof window === "undefined" || !(await loadKakaoShareSdk()) || !window.Kakao) return false;
  if (window.Kakao.isInitialized()) return true;

  // 카카오 디벨로퍼스 앱은 JavaScript 키가 하나뿐이라, 카카오맵에 쓰는 키를 그대로 재사용한다.
  const jsKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!jsKey) return false;

  try {
    window.Kakao.init(jsKey);
    return window.Kakao.isInitialized();
  } catch {
    return false;
  }
}

interface ShareInviteLinkParams {
  title: string;
  description: string;
  imageUrl: string;
  inviteUrl: string;
}

// 카카오톡 공유 카드로 전송을 시도한다. SDK가 준비돼 있지 않으면 false를 반환한다.
export function shareInviteLink({
  title,
  description,
  imageUrl,
  inviteUrl,
}: ShareInviteLinkParams): boolean {
  // 클릭 이벤트 안에서 즉시 호출해야 브라우저가 공유 창을 팝업으로 차단하지 않는다.
  if (typeof window === "undefined" || !window.Kakao?.isInitialized()) return false;

  try {
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl,
        imageWidth: 800,
        imageHeight: 800,
        link: { mobileWebUrl: inviteUrl, webUrl: inviteUrl },
      },
      buttons: [
        {
          title: "웹에서 참여하기",
          link: { mobileWebUrl: inviteUrl, webUrl: inviteUrl },
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

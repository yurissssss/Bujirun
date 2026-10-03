const KAKAO_SHARE_SCRIPT_ID = "kakao-share-sdk";

const scriptPromises = new Map<string, Promise<boolean>>();

function loadScript(id: string, src: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  const pending = scriptPromises.get(id);
  if (pending) return pending;

  const promise = new Promise<boolean>((resolve) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") {
      resolve(true);
      return;
    }

    const script = existing ?? document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve(true);
    });
    script.addEventListener("error", () => {
      // 실패한 결과를 계속 재사용하면 네트워크가 복구돼도 공유를 다시 시도할 수 없다.
      scriptPromises.delete(id);
      script.remove();
      resolve(false);
    });
    if (!existing) document.head.appendChild(script);
  });

  scriptPromises.set(id, promise);
  return promise;
}

export function loadKakaoShareSdk(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Kakao) return Promise.resolve(true);
  return loadScript(
    KAKAO_SHARE_SCRIPT_ID,
    "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js",
  );
}

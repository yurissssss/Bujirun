// accessToken은 JWT — payload(가운데 세그먼트)만 base64url 디코드해서 만료 시각을 읽는다.
// 서명 검증은 하지 않는다(백엔드가 이미 검증한 토큰을 그대로 신뢰하는 용도).
export function getJwtExpiryMs(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

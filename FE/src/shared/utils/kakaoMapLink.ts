// 카카오맵 "길찾기/위치보기" 딥링크. 좌표가 없으면 지도를 띄울 수 없으므로 undefined를
// 돌려주고, 호출부는 그때 버튼 자체를 숨긴다(PlaceDetailContent의 `mapUrl &&` 조건).
export function getKakaoMapUrl(
  name?: string,
  lat?: number | null,
  lng?: number | null,
): string | undefined {
  if (!name || lat == null || lng == null) return undefined;
  return `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;
}

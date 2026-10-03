"use client";

import type { TransportLeg } from "./TransportCard";

export interface RouteOption {
  id: string;
  legs: TransportLeg[];
  durationMin: number;
  cost: number;
  isRecommended?: boolean;
}

// 길찾기 출발지/도착지. 좌표가 있으면 그대로 쓰고, 없을 때만 이름으로 키워드 검색한다
// (키워드 검색은 전국 대상이라 동명의 다른 지역 장소가 잡힐 수 있다 — 송정해수욕장 → 강릉 등).
export interface RoutePoint {
  name: string;
  lat?: number;
  lng?: number;
}

type Coords = { x: string; y: string };

function toCoords(point: RoutePoint): Coords | null {
  return point.lat != null && point.lng != null
    ? { x: String(point.lng), y: String(point.lat) }
    : null;
}

export function openKakaoMapRoute(fromPoint: RoutePoint, toPoint: RoutePoint) {
  const from = fromPoint.name;
  const to = toPoint.name;
  const openWithCoords = (fx: string, fy: string, tx: string, ty: string) => {
    // 앱 딥링크 (sp/ep = 위도,경도 순)
    window.location.href = `kakaomap://route?sp=${fy},${fx}&ep=${ty},${tx}&by=PUBLICTRANSIT`; // 대중교통 값은 PUBLICTRANSIT
    // 앱 미설치 시 1.5초 후 웹 fallback — link/from/.../to/... 형식으로 출발지+도착지 지정
    const fallbackTimer = setTimeout(() => {
      // link/to(도착지만) → link/from/to(출발지+도착지)
      window.open(
        `https://map.kakao.com/link/from/${encodeURIComponent(from)},${fy},${fx}/to/${encodeURIComponent(to)},${ty},${tx}`,
        "_blank",
      );
    }, 1500);
    // 앱이 열려 페이지가 백그라운드로 가면 웹 fallback 취소 (앱에서 돌아왔을 때 웹 탭이 또 열리지 않게)
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) clearTimeout(fallbackTimer);
      },
      { once: true },
    );
  };

  const geocodeAndOpen = () => {
    const kakao = window.kakao!;
    kakao.maps.load(() => {
      const ps = new kakao.maps.services.Places();
      const coords: (Coords | null)[] = [toCoords(fromPoint), toCoords(toPoint)];
      let done = 0;

      const tryOpen = () => {
        done++;
        if (done < 2) return;
        const f = coords[0];
        const t = coords[1];
        if (f && t) {
          openWithCoords(f.x, f.y, t.x, t.y);
        } else {
          // 검색 실패 시 목적지만 웹으로
          window.open(`https://map.kakao.com/link/search/${encodeURIComponent(to)}`, "_blank");
        }
      };

      [from, to].forEach((name, idx) => {
        if (coords[idx]) {
          tryOpen();
          return;
        }
        ps.keywordSearch(name, (res, status) => {
          if (status === kakao.maps.services.Status.OK) coords[idx] = res[0];
          tryOpen();
        });
      });
    });
  };

  // 둘 다 좌표가 있으면 SDK(키워드 검색) 없이 바로 연다.
  const fromCoords = toCoords(fromPoint);
  const toCoordsValue = toCoords(toPoint);
  if (fromCoords && toCoordsValue) {
    openWithCoords(fromCoords.x, fromCoords.y, toCoordsValue.x, toCoordsValue.y);
    return;
  }

  if (window.kakao?.maps) {
    geocodeAndOpen();
    return;
  }

  // SDK 아직 미로드 — 최대 5초 대기
  const start = Date.now();
  const id = setInterval(() => {
    if (window.kakao?.maps) {
      clearInterval(id);
      geocodeAndOpen();
    } else if (Date.now() - start > 5000) {
      clearInterval(id);
      window.open(`https://map.kakao.com/link/search/${encodeURIComponent(to)}`, "_blank");
    }
  }, 200);
}

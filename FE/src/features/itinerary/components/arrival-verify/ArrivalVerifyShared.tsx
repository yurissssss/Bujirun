"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import { Card } from "@/components";

export function PlaceBadge({ placeName }: { placeName: string }) {
  return (
    <div className="inline-flex items-center gap-1 bg-main-blue px-[10px] py-[4px]">
      <span className="text-base leading-none" aria-hidden>
        📍
      </span>
      <span className="font-ssurround text-lg font-bold text-main-white">{placeName}</span>
    </div>
  );
}

export function Notice({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <Card
      variant="glass-sm"
      className="flex min-h-[34px] w-full items-center justify-center gap-2 rounded-xl border-[0.5px] border-system-scroll px-3 py-2 text-center"
    >
      {icon}
      <span className="text-sm font-medium text-sub-darkgray">{children}</span>
    </Card>
  );
}

export function CharacterImage({
  src,
  alt,
  className = "h-[156px] w-[156px]",
}: {
  src: StaticImageData | string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Image src={src} alt={alt} fill sizes="250px" className="object-contain" />
    </div>
  );
}

export function PermissionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="h-[42px] w-full rounded-lg bg-main-blue font-ssurround text-sm font-bold text-main-white active:opacity-80"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function MapPreview() {
  const mapRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [error, setError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      Promise.resolve().then(() => setError(true));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setError(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  useEffect(() => {
    if (!coords || !mapRef.current) return;

    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    if (!appKey) {
      Promise.resolve().then(() => setError(true));
      return;
    }

    type KakaoMaps = {
      load: (callback: () => void) => void;
      LatLng: new (latitude: number, longitude: number) => unknown;
      Map: new (
        container: HTMLElement,
        options: {
          center: unknown;
          level: number;
        },
      ) => unknown;
      Marker: new (options: { position: unknown }) => {
        setMap: (map: unknown) => void;
      };
    };

    const kakaoWindow = window as typeof window & {
      kakao?: {
        maps: KakaoMaps;
      };
    };

    const renderMap = () => {
      if (!mapRef.current || !kakaoWindow.kakao) return;

      kakaoWindow.kakao.maps.load(() => {
        if (!mapRef.current || !kakaoWindow.kakao) return;

        const position = new kakaoWindow.kakao.maps.LatLng(coords.latitude, coords.longitude);

        const map = new kakaoWindow.kakao.maps.Map(mapRef.current, {
          center: position,
          level: 3,
        });

        const marker = new kakaoWindow.kakao.maps.Marker({
          position,
        });

        marker.setMap(map);
      });
    };

    if (kakaoWindow.kakao) {
      renderMap();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-kakao-map="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", renderMap, {
        once: true,
      });

      return () => {
        existingScript.removeEventListener("load", renderMap);
      };
    }

    const script = document.createElement("script");

    script.src = `https://dapi.kakao.com/v2/maps/sdk.js` + `?appkey=${appKey}&autoload=false`;

    script.async = true;
    script.dataset.kakaoMap = "true";

    script.addEventListener("load", renderMap, {
      once: true,
    });

    script.addEventListener("error", () => setError(true), { once: true });

    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", renderMap);
    };
  }, [coords]);

  if (error) {
    return (
      <div className="flex h-[166px] w-full items-center justify-center overflow-hidden rounded-[10px] bg-system-searchbg">
        <span className="text-sm text-sub-gray">현재 위치를 불러오지 못했어요.</span>
      </div>
    );
  }

  if (!coords) {
    return (
      <div className="flex h-[166px] w-full items-center justify-center overflow-hidden rounded-[10px] bg-system-searchbg">
        <span className="text-sm text-sub-gray">현재 위치를 불러오는 중이에요.</span>
      </div>
    );
  }

  return <div ref={mapRef} className="h-[166px] w-full overflow-hidden rounded-[10px]" />;
}

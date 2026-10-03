"use client";

import { useEffect, useState } from "react";
import CloseIcon from "@/assets/icons/mypage/close.svg?svgr";
import HotelIcon from "@/assets/icons/itinerary/hotel.svg?svgr";
import { Modal, SearchBar, EmptyState, ErrorState, LoadingBoundary } from "@/components";
import { cn } from "@/shared/utils";
import { useDebouncedValue } from "@/shared/hooks";
import type { KakaoPlaceResult } from "@/shared/types/kakao-map";

export interface AccommodationPlace {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface AccommodationSearchFieldProps {
  value: AccommodationPlace | null;
  onChange: (place: AccommodationPlace | null) => void;
  // 기본 트리거(입력창/칩) 대신 다른 화면에 맞는 트리거를 직접 그리고 싶을 때 사용.
  // 검색 모달을 여는 함수만 넘겨주고, 모달 자체는 이 컴포넌트가 계속 관리한다.
  renderTrigger?: (args: {
    value: AccommodationPlace | null;
    onOpen: () => void;
  }) => React.ReactNode;
}

// 카카오맵 SDK는 layout.tsx에서 autoload=false로 로드되므로, 최초 사용 시점에
// kakao.maps.load()로 한 번 초기화해줘야 한다 (openKakaoMapRoute의 지오코딩과 동일한 패턴).
function loadKakaoMaps(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve(true));
      return;
    }
    const start = Date.now();
    const id = window.setInterval(() => {
      if (window.kakao?.maps) {
        window.clearInterval(id);
        window.kakao.maps.load(() => resolve(true));
      } else if (Date.now() - start > 5000) {
        window.clearInterval(id);
        resolve(false);
      }
    }, 200);
  });
}

// 카카오 로컬 카테고리 그룹 코드 — 숙박(AD5).
// 숙소 입력란이므로 호텔·모텔·게스트하우스 등 숙박시설만 검색되게 한다
// (전체 검색이면 식당·카페·관광지까지 다 나와서 고르기 어렵다).
// 이미 저장돼 있는 값은 검색과 무관하게 그대로 표시된다.
const ACCOMMODATION_CATEGORY_CODE = "AD5";

// 카카오 키워드 검색이 한 번에 돌려주는 최대치. 예전엔 8개로 끊었는데, 이름이 비슷한
// 숙소가 많아서 정작 찾던 곳이 잘려 안 보이는 경우가 있었다(목록은 스크롤된다).
const MAX_RESULTS = 15;

// 입력이 멎고 나서 검색하도록 기다린다. 예전엔 "해"·"해운"처럼 치는 도중의 검색이
// 0건이라 빈 화면이 번쩍이는 걸 막으려고 두 글자부터 검색했는데, 정작 "신라"·"롯데"처럼
// 짧은 이름을 칠 때 목록이 안 떠서 "검색이 안 된다"로 느껴졌다. 한 글자부터 검색하고,
// 대신 대기 시간을 줄여 결과가 빨리 따라붙게 한다.
const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 1;

export function AccommodationSearchField({
  value,
  onChange,
  renderTrigger,
}: AccommodationSearchFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoPlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // 카카오 지도 SDK 로드 실패나 검색 API 오류 — 결과 없음(ZERO_RESULT)과는 구분한다.
  const [hasSearchError, setHasSearchError] = useState(false);
  const [pendingOutsideBusanPlace, setPendingOutsideBusanPlace] = useState<KakaoPlaceResult | null>(
    null,
  );
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    // 모달이 닫혀 있을 땐 검색할 필요가 없다.
    if (!isOpen) return;
    const keyword = debouncedQuery.trim();
    if (keyword.length < MIN_QUERY_LENGTH) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    setHasSearchError(false);
    loadKakaoMaps().then((loaded) => {
      if (cancelled) return;
      if (!loaded || !window.kakao?.maps) {
        setIsSearching(false);
        setHasSearchError(true);
        return;
      }
      const places = new window.kakao.maps.services.Places();
      places.keywordSearch(
        keyword,
        (res, status) => {
          if (cancelled) return;
          const services = window.kakao!.maps.services;
          setIsSearching(false);
          // ZERO_RESULT는 "결과 없음"이라 에러가 아니다 — 그 외만 에러로 본다.
          setHasSearchError(
            status !== services.Status.OK && status !== services.Status.ZERO_RESULT,
          );
          setResults(status === services.Status.OK ? res.slice(0, MAX_RESULTS) : []);
        },
        { category_group_code: ACCOMMODATION_CATEGORY_CODE, size: MAX_RESULTS },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isOpen]);

  // 검색은 끝났는데 결과가 하나도 없는 상태(에러나 로딩 중과는 구분).
  // 검색어가 아직 짧아서 검색을 안 보낸 동안에는 결과 영역 자체를 접어둔다.
  const isSearchable = query.trim().length >= MIN_QUERY_LENGTH;
  const isEmptyResult = isSearchable && !isSearching && !hasSearchError && results.length === 0;

  const handleOpen = () => {
    setQuery("");
    setResults([]);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
  };

  const selectPlace = (place: KakaoPlaceResult) => {
    onChange({
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      lat: Number(place.y),
      lng: Number(place.x),
    });
    handleClose();
  };

  const handleSelect = (place: KakaoPlaceResult) => {
    const addresses = `${place.road_address_name} ${place.address_name}`;
    if (!addresses.includes("부산")) {
      setPendingOutsideBusanPlace(place);
      return;
    }

    selectPlace(place);
  };

  const handleOutsideBusanConfirm = () => {
    if (!pendingOutsideBusanPlace) return;
    selectPlace(pendingOutsideBusanPlace);
    setPendingOutsideBusanPlace(null);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <>
      {renderTrigger ? (
        renderTrigger({ value, onOpen: handleOpen })
      ) : value ? (
        <div
          role="button"
          tabIndex={0}
          onClick={handleOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleOpen();
          }}
          className="flex w-full items-start gap-2 rounded-[10px] border border-main-blue py-[10px] pl-[15px] pr-3 text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-xs text-text-heading">{value.name}</p>
            <p className="truncate font-medium text-2xs text-sub-gray">{value.address}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            aria-label="숙소 선택 지우기"
            className="mt-[2px] flex shrink-0 items-center justify-center p-0 leading-none"
          >
            <CloseIcon width={14} height={14} className="text-main-blue" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="w-full rounded-[10px] border border-sub-gray py-[10px] pl-[15px] pr-10 text-left font-paperlogy font-medium text-xs text-sub-gray transition-colors"
        >
          숙소명이나 주소로 검색해보세요
        </button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="숙소 검색"
        hideActions
        childrenVariant="plain"
      >
        <div className="flex w-full flex-col gap-3">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="숙소명이나 주소로 검색해보세요"
            className="!w-full"
            iconSize={11}
          />
          {/* 열자마자 큰 빈 상자가 보이지 않도록, 검색어가 있을 때만 결과 영역을 펼친다. */}
          {/* 빈 상태는 캐릭터가 들어가 결과 목록보다 세로로 길어서, 그때만 높이를 늘려
              문구 마지막 줄이 잘리지 않게 한다. */}
          <div
            className={cn(
              "relative w-full overflow-y-auto transition-[height] duration-200 ease-out",
              !isSearchable ? "h-0" : isEmptyResult ? "h-[330px]" : "h-[276px]",
            )}
          >
            <LoadingBoundary
              isLoading={isSearching}
              message="검색하는 중이에요..."
              variant="inline"
              delay={200}
              minDuration={500}
            >
              {!isSearchable ? null : hasSearchError ? (
                <ErrorState
                  variant="compact"
                  code={503}
                  title="검색을 불러오지 못했어요."
                  description="잠시 후 다시 시도해주세요!"
                />
              ) : results.length === 0 ? (
                <EmptyState
                  title="검색 결과가 없어요"
                  description={
                    <>
                      &quot;{debouncedQuery.trim()}&quot; 숙소를 찾지 못했어요.
                      <br />
                      숙소명이나 주소를 다시 확인해보세요!
                    </>
                  }
                />
              ) : (
                <ul className="flex flex-col gap-1">
                  {results.map((place) => (
                    <li key={place.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(place)}
                        className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left active:bg-system-navbg"
                      >
                        <span className="font-paperlogy font-semibold text-xs text-text-primary">
                          {place.place_name}
                        </span>
                        <span className="font-paperlogy font-medium text-2xs text-sub-gray">
                          {place.road_address_name || place.address_name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </LoadingBoundary>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={pendingOutsideBusanPlace !== null}
        onClose={() => setPendingOutsideBusanPlace(null)}
        icon={<HotelIcon width={24} height={24} aria-hidden />}
        title="숙소 위치를 확인해주세요"
        description={`선택하신 숙소는 부산 외 지역에 있어요.\n이 숙소가 맞는지 한 번 더 확인해주세요 😊`}
        cancelText="다시 선택하기"
        confirmText="그대로 선택하기"
        onConfirm={handleOutsideBusanConfirm}
        className="!max-w-[300px]"
      />
    </>
  );
}

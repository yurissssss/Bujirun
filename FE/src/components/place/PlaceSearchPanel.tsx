"use client";

import { getPlaceCollectionStatus } from "@/shared/utils/placeCollection";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PlaceMarker } from "@/components/place/PlaceMarker";
import CloseIcon from "@/assets/icons/mypage/close.svg?svgr";
import { SearchBar, EmptyState } from "@/components";
import { PlaceSearchSkeleton } from "./PlaceSkeletons";
import { PlaceSearchItem } from "./PlaceSearchItem";
import { ConsonantIndexBar } from "./ConsonantIndexBar";
import { CategoryFilterDropdown } from "./CategoryFilterDropdown";
import type { Category } from "@/components";
import { cn } from "@/shared/utils";
import { spotApi } from "@/shared/api/domains";
import { getCategoryFromKo, CATEGORY_LABEL_KO } from "@/shared/constants/category";
import type { SpotSearchCategory } from "@/shared/constants/category";
import { getFallbackImage } from "@/features/itinerary/utils/scheduleUtils";
import { useDebouncedValue } from "@/shared/hooks";

type SortOption = "추천순" | "이름순";
type CategoryFilter = SpotSearchCategory | "all";

const SORT_OPTIONS: SortOption[] = ["추천순", "이름순"];

const CONSONANTS = [
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const CONSONANT_MAP = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const CONSONANT_NORMALIZE: Record<string, string> = {
  ㄲ: "ㄱ",
  ㄸ: "ㄷ",
  ㅃ: "ㅂ",
  ㅆ: "ㅅ",
  ㅉ: "ㅈ",
};

function getInitial(name: string): string {
  const code = name.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return name[0];
  const raw = CONSONANT_MAP[Math.floor((code - 0xac00) / 28 / 21)];
  return CONSONANT_NORMALIZE[raw] ?? raw;
}

export type SearchPlace = {
  id: string;
  name: string;
  collectionCategory: Category;
  // 도감(수집) 대상이 아닌 관광지는 수집 상태 자체가 의미 없어서 undefined —
  // 이 경우 배지를 아예 안 보여준다.
  status?: "uncollected" | "completed";
  imageUrl: string;
};

export interface PlaceSearchState {
  searchValue: string;
  sortBy: SortOption;
  categoryFilter: CategoryFilter;
}

interface PlaceSearchPanelProps {
  onClose?: () => void;
  onPlaceSelect?: (place: SearchPlace) => void;
  // 상세보기 갔다가 뒤로 왔을 때 검색 상태를 복원하고 싶은 화면(예: URL 쿼리로 저장)을 위한 훅.
  // 안 넘기면 기존처럼 컴포넌트가 자체 state로만 관리한다.
  initialSearchState?: Partial<PlaceSearchState>;
  onSearchStateChange?: (state: PlaceSearchState) => void;
}

export function PlaceSearchPanel({
  onClose,
  onPlaceSelect,
  initialSearchState,
  onSearchStateChange,
}: PlaceSearchPanelProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(initialSearchState?.searchValue ?? "");
  const [sortBy, setSortBy] = useState<SortOption>(initialSearchState?.sortBy ?? "추천순");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(
    initialSearchState?.categoryFilter ?? "all",
  );
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (sortBy !== "이름순") return;
    const list = listRef.current;
    if (!list) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const consonant = (e.target as HTMLElement).dataset.consonant;
            if (consonant) setActiveSection(consonant);
          }
        });
      },
      { root: list, threshold: 0.5 },
    );
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sortBy]);

  const debouncedSearchValue = useDebouncedValue(searchValue, 300);

  useEffect(() => {
    onSearchStateChange?.({ searchValue: debouncedSearchValue, sortBy, categoryFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchValue, sortBy, categoryFilter]);

  // category는 서버 쿼리로 안 넘긴다 — 백엔드 필터 파라미터가 어떤 값을 받는지 보장이
  // 안 돼서, 항목별로 이미 내려오는 collectionCategory 필드를 우리 4개 카테고리로 매핑해
  // 프론트에서 직접 필터링한다(아래 categoryFiltered).
  const { data: searchResults, isLoading } = useQuery({
    queryKey: spotApi.keys.search({
      keyword: debouncedSearchValue || undefined,
      sort: sortBy === "추천순" ? "RECOMMEND" : "NAME",
    }),
    queryFn: () =>
      spotApi.searchSpots({
        keyword: debouncedSearchValue || undefined,
        sort: sortBy === "추천순" ? "RECOMMEND" : "NAME",
      }),
  });

  const mapped: SearchPlace[] = (searchResults ?? []).map((spot) => ({
    id: spot.spotId ?? spot.name ?? "",
    name: spot.name ?? "이름 미상",
    collectionCategory: getCategoryFromKo(spot.collectionCategory ?? "", spot.name),
    // 도감에 없는 관광지(isCollection: false)는 수집 여부 배지를 아예 안 보여준다.
    status: getPlaceCollectionStatus(spot),
    imageUrl: spot.thumbnailUrl || getFallbackImage(spot.spotId, spot.name),
  }));

  const filtered: SearchPlace[] =
    categoryFilter === "all"
      ? mapped
      : mapped.filter((place) => place.collectionCategory === CATEGORY_LABEL_KO[categoryFilter]);

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ko"));

  const grouped = sorted.reduce<Record<string, typeof sorted>>((acc, place) => {
    const initial = getInitial(place.name);
    if (!acc[initial]) acc[initial] = [];
    acc[initial].push(place);
    return acc;
  }, {});

  const activeConsonants = CONSONANTS.filter((c) => grouped[c]);

  const scrollToSection = (consonant: string) => {
    const el = sectionRefs.current[consonant];
    const list = listRef.current;
    if (!el || !list) return;
    setActiveSection(consonant);
    isScrollingRef.current = true;
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 700);
    const top = el.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    list.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mb-3 flex items-center justify-center self-end -translate-y-0.5"
          aria-label="관광지 검색 닫기"
        >
          <CloseIcon width={18} height={18} className="text-sub-darkgray" aria-hidden />
        </button>
      )}

      {/* 검색바 */}
      <div className="pb-3.5">
        <SearchBar
          value={searchValue}
          onChange={(v) => {
            setSearchValue(v);
            if (v) setCategoryFilter("all");
          }}
          // x를 누르면 검색어만 지우는 게 아니라 검색 때문에 바뀐 필터까지 되돌려서
          // "검색하기 전" 상태로 돌아가게 한다.
          onClear={() => setCategoryFilter("all")}
          placeholder=" "
          className="!h-[30px] !w-full !rounded-lg !bg-system-searchbg !py-0"
          inputClassName="!!text-xs !font-normal !text-sub-deepgray placeholder:!text-sub-gray"
          iconSize={11}
        />
      </div>

      {/* 정렬 + 카테고리 필터 */}
      <div className="flex items-center pb-5">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => {
              if (opt === sortBy) return;
              setSortBy(opt);
              setSearchValue("");
              setCategoryFilter("all");
              if (opt === "이름순") setTimeout(() => scrollToSection("ㄱ"), 0);
            }}
            className={cn(
              "relative rounded-md px-1.5 py-1 text-xs font-medium",
              sortBy === opt ? "bg-system-navbg text-sub-deepblue" : "text-sub-gray",
            )}
          >
            {opt}
            {sortBy === opt && (
              <span className="absolute bottom-0 left-0.5 right-0.5 h-[0.5px] rounded-full bg-sub-deepblue" />
            )}
          </button>
        ))}

        <div className="ml-auto">
          <CategoryFilterDropdown value={categoryFilter} onChange={setCategoryFilter} />
        </div>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <PlaceSearchSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          variant="compact"
          title="검색 결과가 없어요"
          description={
            <>
              &quot;{debouncedSearchValue}&quot;에 대한 결과를 찾지 못했어요.
              <br />
              관광지 이름을 다시 확인해보세요.
            </>
          }
        />
      ) : sortBy === "추천순" ? (
        <div className="flex flex-col gap-2.5 overflow-x-hidden">
          {filtered.map((place) => (
            <PlaceSearchItem
              key={place.id}
              name={place.name}
              category={place.collectionCategory}
              status={place.status}
              imageUrl={place.imageUrl}
              onClick={() => {
                if (onPlaceSelect) {
                  onPlaceSelect({
                    id: place.id,
                    name: place.name,
                    collectionCategory: place.collectionCategory,
                    status: place.status,
                    imageUrl: place.imageUrl,
                  });
                } else {
                  onClose?.();
                  router.push(`/itinerary/place/${place.id}`);
                }
              }}
              className="rounded-2xl border border-system-glassborder shadow-[2px_2px_6px_0px_var(--color-system-glassborder)]"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 gap-3 overflow-hidden">
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {activeConsonants.map((consonant) => (
              <div
                key={consonant}
                ref={(el) => {
                  sectionRefs.current[consonant] = el;
                }}
                data-consonant={consonant}
              >
                <div className="mb-3 flex w-full items-center rounded-md bg-system-searchbg py-0.5 pl-1.5">
                  <span className="text-xs font-medium text-sub-deepblue">{consonant}</span>
                </div>

                <div className="pl-1">
                  {grouped[consonant].map((place, idx) => (
                    <div key={place.id}>
                      <button
                        className={cn(
                          "flex w-full items-center gap-1.5 text-left active:opacity-70",
                          idx === 0 ? "pt-0 pb-2.5" : "py-2.5",
                        )}
                        onClick={() => {
                          if (onPlaceSelect) {
                            onPlaceSelect({
                              id: place.id,
                              name: place.name,
                              collectionCategory: place.collectionCategory,
                              status: place.status,
                              imageUrl: place.imageUrl,
                            });
                          } else {
                            onClose?.();
                            router.push(`/itinerary/place/${place.id}`);
                          }
                        }}
                      >
                        <PlaceMarker size={12} status={place.status} />

                        <span className="min-w-0 flex-1 truncate text-sm font-normal text-text-primary">
                          {place.name}
                        </span>
                      </button>

                      {idx < grouped[consonant].length - 1 && (
                        <div className="h-[0.3px] w-[calc(100%_-_12px)] bg-sub-lightgray" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mb-0.5" />
              </div>
            ))}
          </div>

          <ConsonantIndexBar
            activeConsonants={activeConsonants}
            activeSection={activeSection}
            onSelect={scrollToSection}
          />
        </div>
      )}
    </div>
  );
}

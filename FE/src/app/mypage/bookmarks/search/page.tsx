"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackButton, PageCard, PlaceSearchPanel } from "@/components";
import type { SearchPlace, PlaceSearchState } from "@/components";

export default function BookmarkSearchPage() {
  return (
    <Suspense>
      <BookmarkSearchContent />
    </Suspense>
  );
}

function BookmarkSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePlaceSelect = (place: SearchPlace) => {
    router.push(`/mypage/bookmarks/spot/${place.id}`);
  };

  // 상세보기 갔다가 뒤로 왔을 때 검색어/정렬/필터가 초기화되지 않도록 URL 쿼리에 저장해두고
  // 복원한다 — router.push로 이동하면 이 페이지는 다시 마운트되므로 컴포넌트 state만으론 못 지킨다.
  const handleSearchStateChange = (state: PlaceSearchState) => {
    const params = new URLSearchParams();
    if (state.searchValue) params.set("q", state.searchValue);
    if (state.sortBy !== "추천순") params.set("sort", state.sortBy);
    if (state.categoryFilter !== "all") params.set("category", state.categoryFilter);
    router.replace(`/mypage/bookmarks/search?${params.toString()}`, { scroll: false });
  };

  return (
    <PageCard>
      <div className="flex flex-col h-full gap-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3 shrink-0">
          <BackButton className="bg-transparent" onClick={() => router.back()} />
          <h1 className="font-ssurround font-bold text-lg text-text-heading">관광지 검색</h1>
        </div>

        {/* 검색 패널 */}
        <div className="flex-1 overflow-hidden">
          <PlaceSearchPanel
            onPlaceSelect={handlePlaceSelect}
            initialSearchState={{
              searchValue: searchParams.get("q") ?? "",
              sortBy: searchParams.get("sort") === "이름순" ? "이름순" : "추천순",
              categoryFilter:
                (searchParams.get("category") as PlaceSearchState["categoryFilter"]) ?? "all",
            }}
            onSearchStateChange={handleSearchStateChange}
          />
        </div>
      </div>
    </PageCard>
  );
}

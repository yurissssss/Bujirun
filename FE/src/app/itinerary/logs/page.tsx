"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AngleLeftIcon from "@/assets/icons/itinerary/angle-left.svg?svgr";
import { PageCard, FilterChips, EmptyState, LoadingState } from "@/components";
import { LogCard } from "@/features/itinerary";
import { travelLogApi } from "@/shared/api/domains";
import { getFallbackImage } from "@/features/itinerary/utils/scheduleUtils";

// 서버가 한 번에 전체 목록을 내려주므로(페이지네이션 파라미터 없음), 화면 노출 개수만 클라이언트에서 조절
const PAGE_SIZE = 5;

const CATEGORIES = ["전체", "바다", "자연", "문화", "체험"] as const;
type Category = (typeof CATEGORIES)[number];
type SortType = "최신순" | "인기순";

export default function LogsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category>("전체");
  const [sortBy, setSortBy] = useState<SortType>("최신순");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const logQuery = {
    category: selectedCategory === "전체" ? undefined : selectedCategory,
    sort: sortBy === "인기순" ? "popular" : "latest",
  };

  const { data: publicLogs, isLoading: isFetchingLogs } = useQuery({
    queryKey: travelLogApi.keys.public(logQuery),
    queryFn: () => travelLogApi.getPublicLogs(logQuery),
  });

  const allFiltered = (publicLogs ?? []).map((log) => ({
    id: log.id ?? "",
    imageUrl: log.thumbnailPhotoUrl || getFallbackImage(log.id),
    placeName: log.firstSpotName ?? log.title ?? "제목 없음",
    extraCount: Math.max(0, (log.totalSpots ?? 1) - 1),
    author: log.authorNickname ?? "익명",
    duration: log.duration ?? "",
    date: (log.startDate ?? "").replaceAll("-", "."),
    downloadCount: log.addedCount ?? 0,
  }));

  const hasMore = page * PAGE_SIZE < allFiltered.length;
  const visibleLogs = allFiltered.slice(0, page * PAGE_SIZE);

  // 카테고리/정렬 바뀌면 페이지 초기화
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [selectedCategory, sortBy]);

  // TODO: API 연결 시 이 함수에서 cursor/page 파라미터로 다음 페이지 요청
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setTimeout(() => {
      setPage((p) => p + 1);
      setIsLoading(false);
    }, 500);
  }, [isLoading, hasMore]);

  // 바닥 감지 → 다음 페이지 로드
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <PageCard>
      {/* 헤더 */}
      <div className="flex items-center gap-4 pb-4">
        <button onClick={() => router.back()} className="flex items-center justify-center shrink-0">
          <AngleLeftIcon width={16} height={16} className="fill-sub-gray" aria-hidden />
        </button>
        <span className="font-ssurround font-bold text-lg text-text-heading">로그 둘러보기</span>
      </div>

      {/* 카테고리 칩 */}
      <FilterChips
        options={CATEGORIES}
        selected={selectedCategory}
        onChange={setSelectedCategory}
        className="pb-4 justify-center"
      />

      {/* 정렬 */}
      <div className="flex justify-end items-center gap-2 pb-4">
        <button
          onClick={() => setSortBy("최신순")}
          className={`text-xs ${
            sortBy === "최신순" ? "font-semibold text-sub-deepblue" : "font-medium text-sub-gray"
          }`}
        >
          최신순
        </button>
        <div className="w-[1px] h-[10px] bg-sub-gray/40" />
        <button
          onClick={() => setSortBy("인기순")}
          className={`text-xs ${
            sortBy === "인기순" ? "font-semibold text-sub-deepblue" : "font-medium text-sub-gray"
          }`}
        >
          인기순
        </button>
      </div>

      {/* 로그 목록 */}
      {isFetchingLogs ? (
        <LoadingState message="로그를 불러오는 중이에요" />
      ) : (
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-6 flex flex-col gap-7">
          {visibleLogs.length === 0 ? (
            <div className="flex flex-1 -translate-y-20 items-center justify-center">
              <EmptyState
                variant="compact"
                title="해당 카테고리의 로그가 없어요."
                description="다른 카테고리의 여행 로그를 둘러보세요."
              />
            </div>
          ) : (
            <>
              {visibleLogs.map((log) => (
                <LogCard
                  key={log.id}
                  imageUrl={log.imageUrl}
                  placeName={log.placeName}
                  extraCount={log.extraCount}
                  author={log.author}
                  duration={log.duration}
                  date={log.date}
                  downloadCount={log.downloadCount}
                  onClick={() => router.push(`/itinerary/logs/${log.id}`)}
                />
              ))}

              <div ref={sentinelRef} className="h-1 shrink-0" />

              {isLoading && <LoadingState message="로그를 불러오는 중이에요" />}
            </>
          )}
        </div>
      )}
    </PageCard>
  );
}

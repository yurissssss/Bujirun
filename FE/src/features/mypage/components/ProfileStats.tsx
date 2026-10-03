import { CategoryChip, type Category } from "@/components/ui/CategoryChip";

// 마이페이지 프로필 카드 - 활동 지표 (총 여행 기록 / 수집 관광지 / 최애 카테고리)
// /collection/records 상단 요약 카드와 스타일·항목을 동일하게 맞춤
interface ProfileStatsProps {
  travelLogCount: number;
  collectedCount: number;
  favoriteCategory?: Category;
  // 각 항목 클릭 시 이동 — 넘기지 않으면 해당 항목은 클릭 불가(기존 동작 유지)
  onTravelLogClick?: () => void;
  onCollectedClick?: () => void;
}

export function ProfileStats({
  travelLogCount,
  collectedCount,
  favoriteCategory,
  onTravelLogClick,
  onCollectedClick,
}: ProfileStatsProps) {
  return (
    <div className="grid w-full grid-cols-3 text-center">
      {/* 총 여행 기록 */}
      <button
        type="button"
        onClick={onTravelLogClick}
        disabled={!onTravelLogClick}
        className="flex flex-col items-center gap-1 border-r border-dashed border-sub-gray active:opacity-70 disabled:active:opacity-100"
      >
        <p className="whitespace-nowrap text-sm font-bold text-text-primary">총 여행 기록</p>
        <p className="text-2xl font-bold text-sub-deepblue">
          {travelLogCount ?? 0}
          <span className="ml-1 text-sm text-text-primary">회</span>
        </p>
      </button>

      {/* 수집 관광지 */}
      <button
        type="button"
        onClick={onCollectedClick}
        disabled={!onCollectedClick}
        className="flex flex-col items-center gap-1 border-r border-dashed border-sub-gray active:opacity-70 disabled:active:opacity-100"
      >
        <p className="whitespace-nowrap text-sm font-bold text-text-primary">수집 관광지</p>
        <p className="text-2xl font-bold text-sub-deepblue">
          {collectedCount ?? 0}
          <span className="ml-1 text-sm text-text-primary">곳</span>
        </p>
      </button>

      {/* 최애 카테고리 (클릭 불가 유지) */}
      <div className="flex flex-col items-center gap-2">
        <p className="whitespace-nowrap text-sm font-bold text-text-primary">최애 카테고리</p>
        {favoriteCategory ? (
          <CategoryChip category={favoriteCategory} />
        ) : (
          <span className="text-sm text-sub-gray">-</span>
        )}
      </div>
    </div>
  );
}

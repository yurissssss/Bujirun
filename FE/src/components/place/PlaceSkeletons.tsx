import { Skeleton } from "@/components/ui/Skeleton";

function SearchCardSkeleton() {
  return (
    <div className="flex h-[81px] w-full items-start gap-1.5 rounded-2xl border border-system-glassborder bg-main-white px-2.5 py-2 shadow-[2px_2px_6px_0px_var(--color-system-glassborder)]">
      <Skeleton className="h-14 w-20 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <Skeleton className="h-3.5 w-3/4 rounded-full" />
        <Skeleton className="h-4 w-12 rounded-md" />
      </div>
      <Skeleton className="mt-auto h-5 w-11 rounded-md" />
    </div>
  );
}

export function PlaceSearchSkeleton() {
  return (
    <div className="flex flex-col gap-2.5" role="status" aria-label="관광지 검색 결과 불러오는 중">
      {Array.from({ length: 4 }, (_, index) => (
        <SearchCardSkeleton key={index} />
      ))}
    </div>
  );
}

function LargePlaceCardSkeleton() {
  return (
    <div className="flex h-[98px] w-full items-start gap-3 rounded-[20px] border-[0.3px] border-sub-lightblue bg-main-white px-[14px] py-[13px] shadow-[2px_2px_6px_var(--color-system-scroll)]">
      <Skeleton className="h-[72px] w-[108px] shrink-0 rounded-[15px]" />
      <div className="flex h-[72px] flex-1 flex-col">
        <Skeleton className="mt-1 h-4 w-4/5 rounded-full" />
        <Skeleton className="mt-2 h-5 w-14 rounded-md" />
        <Skeleton className="mt-auto ml-auto h-5 w-12 rounded-md" />
      </div>
    </div>
  );
}

export function PlaceCardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="관광지 목록 불러오는 중">
      {Array.from({ length: count }, (_, index) => (
        <LargePlaceCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function HomePlaceRowSkeleton() {
  return (
    <div role="status" aria-label="추천 관광지 불러오는 중">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <div className="flex gap-4 overflow-hidden pb-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[90px] w-[144px] shrink-0 rounded-[15px]" />
        ))}
      </div>
    </div>
  );
}

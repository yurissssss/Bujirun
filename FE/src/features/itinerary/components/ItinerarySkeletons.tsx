import { Skeleton } from "@/components/ui/Skeleton";

// 실제 카드와 같은 높이/여백을 쓴다 — 로딩이 끝나는 순간 레이아웃이 튀지 않아야
// "깜빡였다"는 느낌이 안 난다.
function TripCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-system-glassborder bg-main-white/60 px-6 py-4">
      <Skeleton className="size-3.5 shrink-0 rounded-md" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-2/5 rounded-full" />
        <Skeleton className="h-3 w-3/5 rounded-full" />
      </div>
      <Skeleton className="size-5 shrink-0 rounded-md" />
      <Skeleton className="size-5 shrink-0 rounded-md" />
    </div>
  );
}

export function TripListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3.5" role="status" aria-label="여행 목록 불러오는 중">
      {Array.from({ length: count }, (_, index) => (
        <TripCardSkeleton key={index} />
      ))}
    </div>
  );
}

// LogCard와 동일한 높이(223px) + 사진/본문 비율을 맞춘다.
function LogCardSkeleton() {
  return (
    <div className="flex h-[223px] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-sub-lightgray/60 bg-main-white">
      <Skeleton className="h-[140px] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <Skeleton className="h-3.5 w-3/5 rounded-full" />
        <Skeleton className="h-3 w-2/5 rounded-full" />
        <Skeleton className="h-3 w-1/3 rounded-full" />
      </div>
    </div>
  );
}

export function LogListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="로그 목록 불러오는 중">
      {Array.from({ length: count }, (_, index) => (
        <LogCardSkeleton key={index} />
      ))}
    </div>
  );
}

// 일정 타임라인: 왼쪽 시간축 + 오른쪽 카드가 반복되는 형태를 그대로 흉내낸다.
export function ItineraryTimelineSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-5 px-2 pt-4" role="status" aria-label="일정 불러오는 중">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex gap-3">
          <div className="flex flex-col items-center gap-2 pt-2">
            <Skeleton className="h-3 w-9 rounded-full" />
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="h-14 w-[2px] rounded-full" />
          </div>
          <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-system-glassborder bg-main-white/60 p-3">
            <Skeleton className="h-[72px] w-full rounded-xl" />
            <Skeleton className="h-3.5 w-2/5 rounded-full" />
            <Skeleton className="h-3 w-1/4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

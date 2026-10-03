import { BackButton } from "@/components";
import { PageCard } from "@/components/layout/PageCard";
import { RecommendedPlaceList } from "@/features/home/components/RecommendedPlaceList";

export default function Page() {
  return (
    <PageCard>
      <div className="flex h-full flex-col gap-5">
        <div className="flex shrink-0 items-center gap-3">
          <BackButton className="bg-transparent" />
          <h1 className="font-ssurround font-bold text-lg text-text-heading leading-none">
            여기는 어때요?
          </h1>
        </div>
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto">
            <RecommendedPlaceList />
          </div>
          <div className="w-[2px] shrink-0" />
        </div>
      </div>
    </PageCard>
  );
}

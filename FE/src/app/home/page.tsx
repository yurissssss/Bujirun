"use client";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Card, PageCard, StaircaseGlassCard } from "@/components";
import marineCharacter from "@/assets/character/marine.png";
import { userApi } from "@/shared/api/domains";
import { useCollectionProgress } from "@/shared/hooks/useCollectionProgress";
import { CollectionProgress } from "@/features/home/components/CollectionProgress";
import { TodayItinerary } from "@/features/home/components/TodayItinerary";
import { PlaceSection } from "@/features/home/components/PlaceSection";

function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[16px] shrink-0 fill-sub-deepblue" aria-hidden="true">
      <path d="M21.462,7.832h-.596c-.828,0-1.5,.671-1.5,1.5s.672,1.5,1.5,1.5h.596c.828,0,1.5-.671,1.5-1.5s-.672-1.5-1.5-1.5Z" />
      <path d="M19.729,6.332c.383,0,.767-.146,1.06-.438l.422-.421c.586-.585,.588-1.535,.002-2.122-.585-.585-1.534-.588-2.121-.002l-.422,.421c-.586,.585-.588,1.535-.002,2.122,.293,.293,.677,.44,1.062,.44Z" />
      <path d="M20.788,12.77c-.587-.584-1.536-.583-2.121,.004-.585,.586-.583,1.536,.004,2.121l.422,.42c.293,.292,.676,.438,1.059,.438,.385,0,.77-.147,1.062-.441,.585-.586,.583-1.536-.004-2.121l-.422-.42Z" />
      <path d="M9.803,16.74c-.781,.083-1.553,.126-2.29,.126-1.572,0-3.042-.191-4.37-.568-.112-.032-.222-.067-.331-.106,.552,1.83,1.3,3.686,2.073,5.101,.576,1.054,1.631,1.708,2.753,1.708h.005c.664,0,1.259-.214,1.773-.635,.87-.714,1.27-1.891,1.042-3.072-.153-.795-.377-1.662-.656-2.554Z" />
      <path d="M15.286,1.001c-.346-.019-.685,.158-.881,.443-.09,.123-2.049,2.763-4.743,2.469-2.239-.244-4.25-.12-5.975,.37-1.413,.402-2.447,1.671-2.573,3.159-.05,.586-.076,1.061-.076,1.889s.027,1.303,.076,1.889c.126,1.488,1.16,2.758,2.573,3.159,1.725,.49,3.735,.616,5.975,.37,2.734-.294,4.701,2.411,4.704,2.41,.175,.321,.512,.519,.875,.519,.019,0,.038,0,.057-.001,.385-.022,.722-.265,.867-.622,.045-.111,1.095-2.771,1.095-7.724s-1.05-7.614-1.095-7.725c-.145-.359-.492-.585-.879-.606Z" />
    </svg>
  );
}

export default function HomePage() {
  const { total: collectionTotal, count: collectionCount } = useCollectionProgress();
  const { data: profile } = useQuery({
    queryKey: userApi.keys.me(),
    queryFn: userApi.getMyProfile,
  });

  const nickname = profile?.nickname?.trim();
  return (
    <main className="flex h-full flex-col">
      <div className="flex shrink-0 items-start justify-between gap-4 px-4">
        <div className="min-w-0 text-text-heading">
          <p className="font-dxsubtitles text-md">안녕{nickname ? `, ${nickname}` : ""} 👋</p>
          <h1 className="mt-2 whitespace-pre-line font-proup text-2xl leading-[1.25]">
            {"오늘은 어디를\n탐험해볼까요?"}
          </h1>
        </div>

        <Image
          src={marineCharacter}
          alt="마린룩 캐릭터"
          className="-translate-y-1 z-10 h-[140px] w-auto shrink-0 object-contain"
          priority
        />
      </div>

      <Card variant="glass-lg" className="relative shrink-0 rounded-[32px] mt-[-28px] mb-2 py-6">
        <div className="flex items-center gap-2">
          <h2 className="font-ssurround text-xl text-text-heading">부산도감</h2>
          <div className="flex items-center gap-1">
            <MegaphoneIcon />
            <p className="text-xs text-text-primary">부산의 명소를 방문하고 도감을 채워보세요.</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <CollectionProgress count={collectionCount} total={collectionTotal} />

          <div className="flex flex-1 flex-col gap-3">
            <div className="origin-left">
              <StaircaseGlassCard
                line1="뚜벅뚜벅"
                line2="부산에 발자국 남기는 중…"
                font="mona"
                size="sm"
                color="sub-coral"
                offsetX={25}
              />
            </div>
            <p>
              <span className="text-2xl font-semibold text-sub-deepblue">{collectionCount}</span>
              <span className="text-md font-medium text-sub-deepgray">{` / ${collectionTotal} 수집완료`}</span>
            </p>
          </div>
        </div>
      </Card>

      <PageCard className="relative z-20 mt-3 flex-1 overflow-y-auto py-8">
        <TodayItinerary />
        <div className="mt-8">
          <PlaceSection />
        </div>
      </PageCard>
    </main>
  );
}

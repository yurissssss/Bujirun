"use client";

import Image from "next/image";
import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import pawIcon from "@/assets/icons/itinerary/paw-print.png";
import { collectionApi, swipeApi } from "@/shared/api/domains";
import { getFallbackImage } from "@/features/itinerary/utils/scheduleUtils";
import { EmptyState, LoadingBoundary, LoadingState, Toast } from "@/components";
import { useItineraryFlowProgress } from "@/features/itinerary/hooks/useItineraryFlowProgress";

const SWIPE_THRESHOLD = 80;
const SWIPE_ANIMATION_MS = 300;

function PageLoadingFallback() {
  return <LoadingState />;
}

export default function TripSwipePage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <TripSwipeContent />
    </Suspense>
  );
}

function TripSwipeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const count = searchParams.get("count") ?? "6";
  const days = searchParams.get("days") ?? "1";
  const groupId = searchParams.get("groupId") ?? "";
  const name = searchParams.get("name") ?? "";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const startTime = searchParams.get("startTime") ?? "";
  const endTime = searchParams.get("endTime") ?? "";
  const accommodation = searchParams.get("accommodation") ?? "";
  const accommodationAddress = searchParams.get("accommodationAddress") ?? "";
  const accommodationLat = searchParams.get("accommodationLat") ?? "";
  const accommodationLng = searchParams.get("accommodationLng") ?? "";
  const forwardParams = new URLSearchParams({
    count,
    days,
    groupId,
    name,
    startDate,
    endDate,
    startTime,
    endTime,
    ...(accommodation ? { accommodation } : {}),
    ...(accommodationAddress ? { accommodationAddress } : {}),
    ...(accommodationLat ? { accommodationLat } : {}),
    ...(accommodationLng ? { accommodationLng } : {}),
  }).toString();

  useItineraryFlowProgress("swipe", searchParams.toString(), groupId, { tripName: name });

  const {
    data: spotsData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: collectionApi.keys.swipeDeck(),
    queryFn: () => collectionApi.getSwipeDeck(),
  });

  const places = useMemo(
    () =>
      (spotsData ?? []).map((spot) => ({
        id: spot.contentId ?? "",
        name: spot.name ?? "",
        image: spot.swipeImageUrl || getFallbackImage(spot.contentId ?? spot.spotId, spot.name),
      })),
    [spotsData],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState<"left" | "right" | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<"like" | "dislike" | null>(null);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const startXRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const swipesRef = useRef<{ contentId: string; liked: boolean }[]>([]);
  const total = places.length;
  const place = places[currentIndex];
  // 다음 1~2장을 미리 받아둔다 — 안 그러면 스와이프하는 순간에야 fetch가 시작돼서,
  // 느린 네트워크/기기에서 새 카드로 넘어간 뒤에도 한동안 직전 사진이 그대로 보이는(이름은
  // 바뀌었는데 사진만 안 바뀌어서 "이미지가 중복된다"로 보이는) 현상이 있었다.
  // next/image가 실제로 쓰는 최적화 URL(/_next/image?...)과 동일한 요청을 미리 보내야
  // 브라우저 캐시가 재사용된다 — 원본 URL로 raw <img> 프리로드하면 캐시 키가 달라서 무효했다.
  const preloadPlaces = places.slice(currentIndex + 1, currentIndex + 3);
  const progress = total > 0 ? (currentIndex + 1) / total : 0;

  const handleSwipe = (direction: "left" | "right") => {
    // 렉/빠른 연속 제스처로 같은 카드가 애니메이션 도중 다시 스와이프되면(onDragEnd가 재진입),
    // currentIndex가 아직 안 바뀐 상태라 같은 스팟이 swipesRef에 중복으로 쌓이고 결과 제출 시
    // 같은 spot이 두 번 좋아요/싫어요로 잡히는 문제가 있었다 — 애니메이션 중엔 무시.
    if (isAnimatingRef.current) return;
    if (!place) return;
    isAnimatingRef.current = true;
    const liked = direction === "right";
    swipesRef.current.push({ contentId: place.id, liked });

    setSelectedReaction(liked ? "like" : "dislike");
    setIsAnimatingOut(direction);
    setTimeout(async () => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= total) {
        // 마지막 결과가 서버에 저장된 뒤에만 대기 화면으로 이동한다. 실패를 무시하고
        // 먼저 이동하면 완료 인원이 올라가지 않아 그룹 전원이 대기 화면에 갇힐 수 있다.
        setIsSubmittingFinal(true);
        try {
          await swipeApi.submitSwipes({
            swipes: swipesRef.current,
            groupId: groupId || undefined,
          });
          router.push(`/itinerary/trips/waiting?${forwardParams}`);
        } catch {
          // 마지막 선택을 되돌려 같은 카드를 다시 제출할 수 있게 한다.
          swipesRef.current.pop();
          setIsAnimatingOut(null);
          setSelectedReaction(null);
          isAnimatingRef.current = false;
          setToastMessage("취향 분석 결과를 저장하지 못했어요. 마지막 카드를 다시 선택해주세요.");
        } finally {
          setIsSubmittingFinal(false);
        }
        return;
      }
      setCurrentIndex(nextIndex);
      setDragX(0);
      setIsAnimatingOut(null);
      setSelectedReaction(null);
      isAnimatingRef.current = false;
    }, SWIPE_ANIMATION_MS);
  };

  const onDragStart = (clientX: number) => {
    if (isAnimatingOut) return;
    startXRef.current = clientX;
    setIsDragging(true);
  };
  const onDragMove = (clientX: number) => {
    if (!isDragging) return;
    setDragX(clientX - startXRef.current);
  };
  const onDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX > SWIPE_THRESHOLD) handleSwipe("right");
    else if (dragX < -SWIPE_THRESHOLD) handleSwipe("left");
    else setDragX(0);
  };

  const cardRotate = dragX * 0.06;
  const likeOpacity = Math.min(1, Math.max(0, dragX / SWIPE_THRESHOLD));
  const nopeOpacity = Math.min(1, Math.max(0, -dragX / SWIPE_THRESHOLD));

  const cardStyle = isAnimatingOut
    ? {
        transform: `translateX(${isAnimatingOut === "right" ? 400 : -400}px) rotate(${isAnimatingOut === "right" ? 20 : -20}deg)`,
        transition: `transform ${SWIPE_ANIMATION_MS}ms ease-out, opacity ${SWIPE_ANIMATION_MS}ms ease-out`,
        opacity: 0,
      }
    : {
        transform: `translateX(${dragX}px) rotate(${cardRotate}deg)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
      };

  if (!place) {
    return (
      <div className="absolute inset-0 z-10 -translate-y-10 bg-main-white">
        <LoadingBoundary isLoading={isLoading} message="관광지를 불러오는 중이에요">
          <EmptyState
            title="추천할 관광지를 찾지 못했어요"
            description="잠시 후 다시 시도하거나 이전 단계로 돌아가보세요."
            secondaryAction={{
              label: "뒤로가기",
              onClick: () => router.back(),
            }}
            primaryAction={{
              label: isFetching ? "불러오는 중..." : "다시 시도",
              onClick: () => void refetch(),
            }}
            className="h-full"
          />
        </LoadingBoundary>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center px-6 pb-[40px]">
      {/* 취향 분석 중 pill */}
      <div className="w-full rounded-[10px] border border-white/40 bg-gradient-to-b from-system-glassfrom to-system-glassto px-6 py-2 text-center backdrop-blur-[15px]">
        <span className="font-ssurround font-bold text-lg text-text-heading">취향 분석 중...</span>
      </div>

      {/* 프로그레스 바 */}
      <div className="mt-5 flex w-full items-center gap-0">
        <div
          className="h-[3px] rounded-full bg-text-heading transition-all duration-300"
          style={{ width: `calc(${progress * 100}% - 10px)` }}
        />
        <div className="shrink-0 transition-all duration-300">
          <Image src={pawIcon} alt="" width={20} height={20} aria-hidden />
        </div>
        <div className="h-[3px] flex-1 rounded-full bg-sub-lightblue" />
      </div>

      {/* 카운터 */}
      <p className="mt-3 font-paperlogy font-bold text-md text-text-heading">
        {currentIndex + 1}/{total}
      </p>

      {/* 스와이프 카드 */}
      <div className="relative mt-5 flex w-full flex-1 items-center justify-center">
        {/* 카드 — key로 카드(스팟)가 바뀔 때마다 강제 리마운트한다. key 없이 src만 바꾸면
            새 이미지가 다 받아지기 전까지 화면엔 직전 카드 사진이 남아있는 채로 이름(텍스트,
            즉시 반영됨)만 새 걸로 바뀌는 구간이 생겨서, 느린 네트워크에서 "사진이 중복된다"로
            보이는 원인이었다. */}
        <div
          key={place.id}
          className="relative h-full w-full cursor-grab rounded-[30px] overflow-hidden shadow-lg select-none active:cursor-grabbing"
          style={cardStyle}
          onMouseDown={(e) => onDragStart(e.clientX)}
          onMouseMove={(e) => onDragMove(e.clientX)}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
          onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
          onTouchEnd={onDragEnd}
        >
          <Image
            src={place.image}
            alt={place.name}
            fill
            sizes="(max-width: 390px) calc(100vw - 48px), 342px"
            className="object-cover pointer-events-none"
            draggable={false}
            priority
          />
          {isAnimatingOut && (
            <div
              className={`pointer-events-none absolute inset-0 ${
                isAnimatingOut === "right" ? "bg-main-blue/25" : "bg-text-heading/30"
              }`}
              aria-hidden
            />
          )}
          <p className="absolute bottom-4 left-4 right-4 font-ssurround font-bold text-lg text-white drop-shadow">
            {place.name}
          </p>
        </div>

        {selectedReaction && (
          <div
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
            aria-hidden
          >
            <div className="flex size-[88px] animate-[bounce_300ms_ease-out_1] items-center justify-center rounded-[24px] border border-white/70 bg-white/90 text-5xl shadow-lg backdrop-blur-sm">
              {selectedReaction === "like" ? "❣️" : "☹️"}
            </div>
          </div>
        )}

        {isSubmittingFinal && (
          <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[30px] bg-white/90 backdrop-blur-sm">
            <LoadingState variant="inline" message="취향 분석 결과를 저장하고 있어요" />
          </div>
        )}

        {/* 별로에요 버튼 - 왼쪽 드래그 시 강조 / 오른쪽 드래그 시 흐려짐 */}
        <button
          type="button"
          aria-label="별로예요"
          disabled={isAnimatingOut !== null}
          onClick={() => handleSwipe("left")}
          className="absolute left-0 top-1/2 z-20 flex size-[32px] items-center justify-center rounded-[10px] bg-white/85 transition-all duration-150 active:scale-90 disabled:pointer-events-none"
          style={{
            opacity: Math.max(0.3, 0.8 - likeOpacity * 0.5) + nopeOpacity * 0.2,
            transform: "translate(-50%, -50%)",
          }}
        >
          <span className="text-lg leading-none">☹️</span>
        </button>

        {/* 좋아요 버튼 - 오른쪽 드래그 시 강조 / 왼쪽 드래그 시 흐려짐 */}
        <button
          type="button"
          aria-label="좋아요"
          disabled={isAnimatingOut !== null}
          onClick={() => handleSwipe("right")}
          className="absolute right-0 top-1/2 z-20 flex size-[32px] items-center justify-center rounded-[10px] bg-white/85 transition-all duration-150 active:scale-90 disabled:pointer-events-none"
          style={{
            opacity: Math.max(0.3, 0.8 - nopeOpacity * 0.5) + likeOpacity * 0.2,
            transform: "translate(50%, -50%)",
          }}
        >
          <span className="text-lg leading-none">❣️</span>
        </button>

        {/* 다음 카드 이미지 프리로드용(화면엔 안 보임) — 실제 카드와 동일한 sizes로 next/image
            최적화 URL을 미리 요청해서, 카드가 넘어갈 때 브라우저 캐시를 그대로 히트하게 한다. */}
        {preloadPlaces.slice(0, 1).map((p) => (
          <div key={p.id} className="absolute h-px w-px overflow-hidden opacity-0" aria-hidden>
            <Image
              src={p.image}
              alt=""
              fill
              sizes="(max-width: 390px) calc(100vw - 48px), 342px"
              loading="eager"
              fetchPriority="low"
            />
          </div>
        ))}
      </div>

      <Toast
        isVisible={toastMessage !== null}
        onHide={() => setToastMessage(null)}
        message={toastMessage ?? ""}
        variant="error"
      />
    </div>
  );
}

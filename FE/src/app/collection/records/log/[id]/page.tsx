"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageCard, ErrorState, LoadingBoundary, Toast } from "@/components";
import { LogDetailContent } from "@/components/log/LogDetailContent";
import { SwitchButton } from "@/features/collection/components/SwitchButton";
import { travelLogApi } from "@/shared/api/domains";

type LogStop = {
  itemId: string;
  photoId: string;
  representative: boolean;
  visited: boolean;
  time: string;
  place: string;
  imageUrl: string;
  tags: string[];
  hashtagIds: string[];
};

type LogDay = {
  day: number;
  date: string;
  stops: LogStop[];
};

export default function LogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [localVisibility, setLocalVisibility] = useState<boolean | null>(null);
  const [editedDays, setEditedDays] = useState<LogDay[] | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [showPublicNotice, setShowPublicNotice] = useState(false);

  useEffect(() => {
    if (!showPublicNotice) return;

    const timer = window.setTimeout(() => {
      setShowPublicNotice(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [showPublicNotice]);

  const {
    data: travelLog,
    isLoading,
    isError,
  } = useQuery({
    queryKey: travelLogApi.keys.detail(id),
    queryFn: () => travelLogApi.getLog(id),
    enabled: !!id,
  });

  const apiDays = useMemo<LogDay[]>(
    () =>
      travelLog?.days?.map((day) => ({
        day: day.dayNumber ?? 1,
        date: day.date ?? "",
        stops:
          day.items?.map((item) => {
            const displayedPhoto =
              item.photos?.find((photo) => photo.representative) ?? item.photos?.[0];

            return {
              itemId: item.id ?? "",
              photoId: displayedPhoto?.id ?? "",
              representative: displayedPhoto?.representative ?? false,
              visited: item.visited ?? true,
              time: item.arrivalTime ?? "",
              place: item.spotName ?? "",
              imageUrl: displayedPhoto?.photoUrl ?? "",
              tags:
                item.hashtags
                  ?.map((hashtag) => hashtag.tag)
                  .filter((tag): tag is string => !!tag) ?? [],
              hashtagIds:
                item.hashtags
                  ?.map((hashtag) => hashtag.id)
                  .filter((hashtagId): hashtagId is string => !!hashtagId) ?? [],
            };
          }) ?? [],
      })) ?? [],
    [travelLog],
  );

  const days = editedDays ?? apiDays;
  const isVisible = localVisibility ?? travelLog?.isPublic ?? false;

  // 공개/비공개 전환: 서버에 반영 후 성공/실패에 따라 토스트 표시
  const updateVisibilityMutation = useMutation({
    mutationFn: (nextIsPublic: boolean) => travelLogApi.updateLog(id, { isPublic: nextIsPublic }),
    onSuccess: (_, nextIsPublic) => {
      setLocalVisibility(nextIsPublic);
      setShowPublicNotice(nextIsPublic);

      setToast({
        message: nextIsPublic ? "공개로 전환했어요" : "비공개로 전환했어요",
        variant: "success",
      });

      queryClient.invalidateQueries({ queryKey: travelLogApi.keys.detail(id) });
    },
    onError: () => {
      setToast({
        message: "전환에 실패했어요. 다시 시도해주세요",
        variant: "error",
      });
    },
  });

  const handleVisibilityToggle = () => {
    updateVisibilityMutation.mutate(!isVisible);
  };

  const handleAddTag = async (dayIndex: number, stopIndex: number, tag: string) => {
    const targetStop = days[dayIndex]?.stops[stopIndex];

    if (!targetStop?.itemId || !targetStop.visited) return;

    const normalizedTag = tag.replace(/^#/, "");

    const createdHashtag = await travelLogApi.addHashtag(id, targetStop.itemId, {
      tag: normalizedTag,
    });

    setEditedDays((prevDays) => {
      const baseDays = prevDays ?? apiDays;

      return baseDays.map((day, dIdx) =>
        dIdx !== dayIndex
          ? day
          : {
              ...day,
              stops: day.stops.map((stop, sIdx) =>
                sIdx !== stopIndex
                  ? stop
                  : {
                      ...stop,
                      tags: [...stop.tags, createdHashtag.tag ?? normalizedTag],
                      hashtagIds: [...stop.hashtagIds, createdHashtag.id ?? ""],
                    },
              ),
            },
      );
    });
  };

  const handleDeleteTag = async (dayIndex: number, stopIndex: number, tagIndex: number) => {
    const targetStop = days[dayIndex]?.stops[stopIndex];

    if (!targetStop?.itemId || !targetStop.visited) return;

    const hashtagId = targetStop.hashtagIds[tagIndex];

    if (!hashtagId) return;

    await travelLogApi.deleteHashtag(id, targetStop.itemId, hashtagId);

    setEditedDays((prevDays) => {
      const baseDays = prevDays ?? apiDays;

      return baseDays.map((day, dIdx) =>
        dIdx !== dayIndex
          ? day
          : {
              ...day,
              stops: day.stops.map((stop, sIdx) =>
                sIdx !== stopIndex
                  ? stop
                  : {
                      ...stop,
                      tags: stop.tags.filter((_, tIdx) => tIdx !== tagIndex),
                      hashtagIds: stop.hashtagIds.filter((_, tIdx) => tIdx !== tagIndex),
                    },
              ),
            },
      );
    });
  };

  const handleSetRepresentativePhoto = async (dayIndex: number, stopIndex: number) => {
    const targetStop = days[dayIndex]?.stops[stopIndex];

    if (
      !targetStop?.itemId ||
      !targetStop.visited ||
      !targetStop.photoId ||
      targetStop.representative
    ) {
      return;
    }

    await travelLogApi.setRepresentativePhoto(id, targetStop.itemId, targetStop.photoId);

    setEditedDays((prevDays) => {
      const baseDays = prevDays ?? apiDays;

      return baseDays.map((day, dIdx) => ({
        ...day,
        stops: day.stops.map((stop, sIdx) => ({
          ...stop,
          representative: dIdx === dayIndex && sIdx === stopIndex,
        })),
      }));
    });
  };

  const firstStopName = days[0]?.stops[0]?.place ?? "";

  const totalStops = days.reduce((count, day) => count + day.stops.length, 0);

  const extraCount = Math.max(totalStops - 1, 0);

  return (
    <PageCard>
      <LoadingBoundary isLoading={isLoading} message="로그를 불러오는 중이에요">
        {isError || !travelLog ? (
          <ErrorState
            code={404}
            title="로그를 찾을 수 없어요"
            description="삭제되었거나 존재하지 않는 로그예요."
            primaryAction={{
              label: "여행 기록으로 돌아가기",
              onClick: () => router.push("/collection/records"),
            }}
          />
        ) : (
          <LogDetailContent
            log={{
              title: travelLog.title ?? "여행 기록",
              placeName: firstStopName,
              extraCount,
              duration: travelLog.duration ?? "",
              date: travelLog.startDate ?? "",
              days,
            }}
            onBack={() => router.back()}
            headerRight={
              <div className="relative">
                <SwitchButton isPublic={isVisible} onClick={handleVisibilityToggle} />

                {showPublicNotice && (
                  <div className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 rounded-xl border border-sub-coral bg-system-coralbg px-3.5 py-[9px] shadow-md">
                    <p className="whitespace-nowrap text-center text-sm font-semibold leading-5 text-sub-coral">
                      사진도 함께 공개돼요. 개인정보나 촬영 내용에 유의해주세요.
                    </p>
                  </div>
                )}
              </div>
            }
            editableTags
            onAddTag={handleAddTag}
            onDeleteTag={handleDeleteTag}
            editableRepresentativePhoto
            onSetRepresentativePhoto={handleSetRepresentativePhoto}
          />
        )}
      </LoadingBoundary>

      <Toast
        isVisible={toast !== null}
        onHide={() => setToast(null)}
        message={toast?.message ?? ""}
        variant={toast?.variant ?? "default"}
      />
    </PageCard>
  );
}

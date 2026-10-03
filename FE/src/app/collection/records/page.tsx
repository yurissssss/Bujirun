"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import shelfImage from "@/assets/collection/shelf-all.png";
import { cn } from "@/shared/utils";
import { useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { travelLogApi, userApi, spotApi } from "@/shared/api/domains";
import { SPOT_LIST_STALE_TIME_MS } from "@/shared/api/domains/spot";
import { convertTripLogToReceipt } from "@/features/receipt/utils/convertTripLogToReceipt";
import { resolveProfileImage } from "@/components/profile/profileImages";
import { RecordDeleteModal } from "@/features/collection/components/RecordDeleteModal";
import { TripReceiptModal } from "@/features/receipt/components/TripReceiptModal";
import type { ReceiptData, ReviewPromptSubmitData } from "@/features/receipt/types/receipt";
import bookIcon from "@/assets/icons/collection/book.png";
import { Card, CategoryChip, PageCard, Toast, EmptyState, LoadingBoundary } from "@/components";
import type { Category } from "@/components/ui/CategoryChip";
import { TripRecordItem } from "@/features/collection/components/TripRecordItem";
import { getCategoryFromKo } from "@/shared/constants/category";
import { ReceiptPromptModal } from "@/features/collection/components/ReceiptPromptModal";
import { ReviewPromptModal } from "@/features/home/components/ReviewPromptModal";

const MOOD_VALUE_MAP: Record<ReviewPromptSubmitData["mood"], number> = {
  "🥰": 1,
  "😆": 2,
  "😌": 3,
  "🫠": 4,
  "😡": 5,
};

export default function CollectionRecordsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [summaryView, setSummaryView] = useState<"records" | "places">(
    searchParams.get("view") === "places" ? "places" : "records",
  );
  const {
    data: myLogs = [],
    isLoading: isLogsLoading,
    isError: isLogsError,
  } = useQuery({
    queryKey: travelLogApi.keys.mine(),
    queryFn: travelLogApi.getMyLogs,
  });
  const { data: spots = [] } = useQuery({
    queryKey: spotApi.keys.search(),
    queryFn: () => spotApi.searchSpots(),
    staleTime: SPOT_LIST_STALE_TIME_MS,
  });

  const collectedPlaces = useMemo(
    () => spots.filter((spot) => spot.isCollection && spot.collected),
    [spots],
  );
  const collectedPlaceCount = collectedPlaces.length;

  const collectedPlaceRows = useMemo(() => {
    const rows = [];

    for (let index = 0; index < collectedPlaces.length; index += 3) {
      rows.push(collectedPlaces.slice(index, index + 3));
    }

    return rows;
  }, [collectedPlaces]);

  const favoriteCategory = useMemo(() => {
    const count = collectedPlaces.reduce<Partial<Record<Category, number>>>((acc, place) => {
      const collectionCategory = getCategoryFromKo(place.collectionCategory, place.name);

      acc[collectionCategory] = (acc[collectionCategory] ?? 0) + 1;

      return acc;
    }, {});

    return Object.entries(count).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0]?.[0] as
      | Category
      | undefined;
  }, [collectedPlaces]);

  const records = useMemo(
    () =>
      myLogs.map((log, index) => ({
        id: index + 1,
        logId: log.id ?? "",
        itineraryId: log.itineraryId ?? "",
        title: log.title ?? "여행 기록",
        period: log.startDate ?? "",
      })),
    [myLogs],
  );

  const itineraryIds = useMemo(
    () => records.map((record) => record.itineraryId).filter(Boolean),
    [records],
  );

  const { data: logStatuses = [] } = useQuery({
    queryKey: ["travel-logs", "exists", itineraryIds],
    queryFn: () => travelLogApi.checkLogExists(itineraryIds),
    enabled: itineraryIds.length > 0,
  });

  const [selectedDeleteTripId, setSelectedDeleteTripId] = useState<number | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedPromptTripId, setSelectedPromptTripId] = useState<number | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isReceiptPromptOpen, setIsReceiptPromptOpen] = useState(false);
  const [isReviewPromptOpen, setIsReviewPromptOpen] = useState(false);

  const openDeleteModal = useCallback((tripId: number) => {
    setSelectedDeleteTripId(tripId);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setSelectedDeleteTripId(null);
  }, []);

  const openReceiptModal = useCallback((tripId: number) => {
    setSelectedTripId(tripId);
    setIsReceiptOpen(true);
  }, []);

  const closeReceiptPromptModal = useCallback(() => {
    setIsReceiptPromptOpen(false);
    setSelectedPromptTripId(null);
  }, []);

  const closeReviewPromptModal = useCallback(() => {
    setIsReviewPromptOpen(false);
    setSelectedPromptTripId(null);
  }, []);

  const openReviewPromptModal = useCallback(() => {
    setIsReceiptPromptOpen(false);
    setIsReviewPromptOpen(true);
  }, []);

  const handleRecordClick = useCallback(
    (tripId: number) => {
      const record = records.find((item) => item.id === tripId);

      if (!record) return;

      const status = logStatuses.find((item) => item.itineraryId === record.itineraryId);

      if (!status) return;

      if (status.receiptCompleted) {
        openReceiptModal(tripId);
        return;
      }

      if (status.promptDismissed) {
        router.push(`/collection/records/log/${record.logId}`);
        return;
      }

      setSelectedPromptTripId(tripId);
      setIsReceiptPromptOpen(true);
    },
    [logStatuses, openReceiptModal, records, router],
  );

  const closeReceiptModal = useCallback(() => {
    setIsReceiptOpen(false);
    setSelectedTripId(null);
  }, []);

  const selectedDeleteTrip = records.find((record) => record.id === selectedDeleteTripId) ?? null;

  const selectedPromptTrip = records.find((record) => record.id === selectedPromptTripId) ?? null;

  const selectedLogId = records.find((record) => record.id === selectedTripId)?.logId ?? "";

  const { data: selectedTravelLog, isLoading: isReceiptLoading } = useQuery({
    queryKey: travelLogApi.keys.detail(selectedLogId),
    queryFn: () => travelLogApi.getLog(selectedLogId),
    enabled: isReceiptOpen && !!selectedLogId,
  });

  const { data: me } = useQuery({
    queryKey: userApi.keys.me(),
    queryFn: userApi.getMyProfile,
  });

  const profileImage = resolveProfileImage(me?.profileImageUrl);

  const selectedReceipt: ReceiptData | undefined =
    selectedTravelLog && me?.id && me?.nickname
      ? convertTripLogToReceipt(selectedTravelLog, me.id, me.nickname, profileImage)
      : undefined;

  const handleSkipReceipt = async (dontAskAgain: boolean) => {
    if (!selectedPromptTrip) return;

    try {
      if (dontAskAgain) {
        await travelLogApi.dismissReceiptPrompt(selectedPromptTrip.itineraryId);

        await queryClient.invalidateQueries({
          queryKey: ["travel-logs", "exists"],
        });
      }

      closeReceiptPromptModal();

      router.push(`/collection/records/log/${selectedPromptTrip.logId}`);
    } catch (error) {
      console.error("영수증 발행 팝업 설정 실패: ", error);

      setToast({
        message: "설정을 저장하지 못했어요.",
        variant: "error",
      });
    }
  };

  const handleReviewConfirm = async (data: ReviewPromptSubmitData) => {
    if (!selectedPromptTrip?.logId) return;

    try {
      await travelLogApi.updateLog(selectedPromptTrip.logId, {
        mood: MOOD_VALUE_MAP[data.mood],
        theme: data.theme,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: travelLogApi.keys.mine(),
        }),
        queryClient.invalidateQueries({
          queryKey: travelLogApi.keys.detail(selectedPromptTrip.logId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["travel-logs", "exists"],
        }),
      ]);

      setIsReviewPromptOpen(false);
      setIsReceiptOpen(true);
      setSelectedPromptTripId(null);
    } catch (error) {
      console.error("여행 리뷰 저장 실패: ", error);

      setToast({
        message: "여행 리뷰 저장에 실패했어요.",
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (selectedDeleteTripId === null) return;

    const targetRecord = records.find((record) => record.id === selectedDeleteTripId);

    if (!targetRecord?.logId) return;

    try {
      await travelLogApi.deleteLog(targetRecord.logId);

      await queryClient.invalidateQueries({
        queryKey: travelLogApi.keys.mine(),
      });

      closeDeleteModal();

      setToast({
        message: "여행 기록이 삭제되었어요.",
        variant: "success",
      });
    } catch (error) {
      console.error("여행 기록 삭제 실패: ", error);

      setToast({
        message: "여행 기록 삭제에 실패했어요.",
        variant: "error",
      });
    }
  };

  return (
    <section className="relative flex h-full flex-col gap-6">
      <Card variant="white" className="rounded-[25px]">
        <div className="px-5 py-2">
          <div className="flex items-center gap-2">
            <Image src={bookIcon} alt="여행 기록" width={55} height={55} />
            <div className="flex flex-col gap-1">
              <h1 className="font-ssurround text-lg text-text-heading">여행 기록</h1>
              <p className="text-md text-text-primary">부산에서 남긴 추억들을 모아봤어요.</p>
            </div>
          </div>

          <div className="my-5 border-t border-dashed border-sub-gray" />

          <div className="-mx-3 grid grid-cols-3 text-center">
            <button
              type="button"
              onClick={() => setSummaryView("records")}
              className="flex flex-col items-center gap-1 border-r border-dashed border-sub-gray"
            >
              <p
                className={cn(
                  "text-sm font-bold",
                  summaryView === "records" ? "text-sub-deepgray" : "text-text-primary",
                )}
              >
                총 여행 기록
              </p>
              <p className="text-2xl font-bold text-sub-deepblue">
                {records.length}
                <span
                  className={cn(
                    "ml-1 text-sm",
                    summaryView === "records" ? "text-sub-deepgray" : "text-text-primary",
                  )}
                >
                  회
                </span>
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSummaryView("places")}
              className="flex flex-col items-center gap-1 border-r border-dashed border-sub-gray"
            >
              <p
                className={cn(
                  "text-sm font-bold",
                  summaryView === "places" ? "text-sub-deepgray" : "text-text-primary",
                )}
              >
                수집 관광지
              </p>
              <p className="text-2xl font-bold text-sub-deepblue">
                {collectedPlaceCount}
                <span
                  className={cn(
                    "ml-1 text-sm",
                    summaryView === "places" ? "text-sub-deepgray" : "text-text-primary",
                  )}
                >
                  곳
                </span>
              </p>
            </button>

            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-bold text-text-primary">최애 카테고리</p>
              {favoriteCategory ? (
                <CategoryChip category={favoriteCategory} />
              ) : (
                <span className="text-sm text-sub-gray">-</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <PageCard>
        {summaryView === "records" ? (
          <div className="flex flex-1 flex-col gap-5 pt-4">
            <LoadingBoundary isLoading={isLogsLoading} message="여행 기록을 불러오는 중이에요">
              {!isLogsError && records.length === 0 && (
                <div className="flex flex-1 -translate-y-17 items-center justify-center">
                  <EmptyState
                    variant="compact"
                    title="아직 저장된 여행 기록이 없어요"
                    description="여행을 시작하고 기록을 남겨보세요!"
                    primaryAction={{
                      label: "여행 시작하기",
                      onClick: () => router.push("/itinerary/trips/new"),
                    }}
                  />
                </div>
              )}

              {!isLogsError &&
                records.map((record) => (
                  <TripRecordItem
                    key={record.logId}
                    id={record.id}
                    title={record.title}
                    period={record.period}
                    onDelete={openDeleteModal}
                    onTitleClick={handleRecordClick}
                  />
                ))}
            </LoadingBoundary>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-6">
            {collectedPlaceRows.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState
                  variant="compact"
                  title="아직 수집한 관광지가 없어요"
                  description="부산을 여행하며 관광지를 수집해보세요!"
                />
              </div>
            ) : (
              collectedPlaceRows.map((row, rowIndex) => (
                <div key={`shelf-${rowIndex}`} className="relative pt-4">
                  <div className="grid grid-cols-3 gap-3 px-4">
                    {row.map((place) => (
                      <div key={place.spotId} className="flex min-w-0 flex-col items-center gap-4">
                        <button
                          type="button"
                          onClick={() => router.push(`/collection/place/${place.spotId}`)}
                          className="z-10"
                        >
                          <Image
                            src={`/collection/${place.name}.webp`}
                            alt={place.name ?? "관광지 이미지"}
                            width={72}
                            height={72}
                            unoptimized
                            className="aspect-square w-[72px] object-contain border border-collection-border"
                          />
                        </button>

                        <span className="z-10 block w-full truncate text-center text-sm font-bold leading-4 text-text-primary">
                          {place.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Image
                    src={shelfImage}
                    alt="선반 이미지"
                    className="-mt-9.5 h-auto w-full"
                    priority={rowIndex === 0}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </PageCard>

      <RecordDeleteModal
        isOpen={selectedDeleteTrip !== null}
        tripName={selectedDeleteTrip?.title ?? ""}
        period={selectedDeleteTrip?.period ?? ""}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
      />

      <ReceiptPromptModal
        isOpen={isReceiptPromptOpen && selectedPromptTrip !== null}
        tripName={selectedPromptTrip?.title ?? ""}
        onClose={closeReceiptPromptModal}
        onSkip={handleSkipReceipt}
        onConfirm={() => {
          if (!selectedPromptTrip) return;

          setSelectedTripId(selectedPromptTrip.id);
          openReviewPromptModal();
        }}
      />

      <ReviewPromptModal
        isOpen={isReviewPromptOpen && selectedPromptTrip !== null}
        tripTitle={selectedPromptTrip?.title ?? ""}
        onClose={closeReviewPromptModal}
        onConfirm={handleReviewConfirm}
      />

      <TripReceiptModal
        isOpen={isReceiptOpen && !isReceiptLoading}
        receipt={selectedReceipt}
        onDownloadComplete={() =>
          setToast({
            message: "영수증이 저장되었어요.",
            variant: "success",
          })
        }
        onDownloadError={() =>
          setToast({
            message: "영수증 저장에 실패했어요.",
            variant: "error",
          })
        }
        onDetail={() => {
          if (selectedTripId === null) return;

          const selectedRecord = records.find((record) => record.id === selectedTripId);

          if (!selectedRecord?.logId) return;

          router.push(`/collection/records/log/${selectedRecord.logId}`);
        }}
        onClose={closeReceiptModal}
      />

      <Toast
        isVisible={toast !== null}
        onHide={() => setToast(null)}
        message={toast?.message ?? ""}
        variant={toast?.variant ?? "default"}
      />
    </section>
  );
}

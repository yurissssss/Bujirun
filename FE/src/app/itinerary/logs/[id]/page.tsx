"use client";

// src/app/itinerary/logs/[id]/page.tsx
// 다른 사람 로그 읽기 전용 상세 + 일정 담기 버튼
// GET /api/logs/{id} → TravelLogDetailResponse

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import calendarPlusIcon from "@/assets/icons/itinerary/calendar-plus.svg?url";
import { getLastViewedItineraryId } from "@/shared/constants/itinerary";
import { PageCard, ErrorState, LoadingBoundary, Toast } from "@/components";
import { LogDetailContent, toLogDetailData } from "@/components/log/LogDetailContent";
import { ImportLogModal, ReportLogModal } from "@/features/itinerary";
import { useQuery } from "@tanstack/react-query";
import { itineraryApi, travelLogApi } from "@/shared/api/domains";
import { useAuthStore } from "@/shared/stores/useAuthStore";

// 로그 상세 데이터 조회 훅
function useLogDetail(id: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: travelLogApi.keys.detail(id),
    queryFn: () => travelLogApi.getLog(id),
    enabled: !!accessToken && !!id,
  });
}

export default function LogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  // 담을 여행이 하나도 없으면 "내 일정에 추가"는 할 수 있는 일이 없다. 예전에는 그래도
  // 버튼이 눌려서, 담기를 누르면 일정 화면으로 보내놓고 아무 일도 일어나지 않았다.
  // (여행이 없을 때 여행 목록 화면이 로그 둘러보기로 안내하는 경로가 있어서 실제로 자주
  //  밟힌다 — 그 경로로 들어온 사람은 둘러보기만 할 수 있어야 한다.)
  const { data: itineraries, isLoading: isItinerariesLoading } = useQuery({
    queryKey: itineraryApi.keys.lists(),
    queryFn: itineraryApi.getItineraries,
  });
  const hasItinerary = (itineraries?.length ?? 0) > 0;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const importTimerRef = useRef<number | null>(null);
  const { data: log, isLoading } = useLogDetail(id);

  useEffect(() => {
    return () => {
      const timerId = importTimerRef.current;
      if (timerId) window.clearTimeout(timerId);
    };
  }, []);

  const handleCloseAddModal = () => {
    const timerId = importTimerRef.current;
    if (timerId) window.clearTimeout(timerId);
    importTimerRef.current = null;
    setIsImporting(false);
    setShowAddModal(false);
  };

  // 실제 담기 작업(로그 → 일정 변환)은 /itinerary 쪽 useCollaborativeItinerary가
  // importedLogId 쿼리 파라미터를 보고 처리한다(Yjs로 반영 + 다른 참여자에게도 실시간 전파).
  const handleImportLog = () => {
    setIsImporting(true);
    importTimerRef.current = window.setTimeout(() => {
      setIsImporting(false);
      setShowAddModal(false);
      // 담을 여행을 명시하지 않으면 일정 화면의 폴백 규칙("오늘 진행 중 → 최근 수정")이
      // 대상을 정해버려서, 보고 있던 여행이 아닌 다른 여행에 로그가 들어갔다.
      const targetTripId = getLastViewedItineraryId();
      router.push(
        targetTripId
          ? `/itinerary?importedLogId=${id}&tripId=${targetTripId}`
          : `/itinerary?importedLogId=${id}`,
      );
    }, 600);
  };

  const handleReport = () => {
    setToastMessage("신고가 완료되었어요.");
  };

  const reportableSpots =
    log?.days
      ?.flatMap((day) => day.items ?? [])
      .filter((item) => item.spotId && item.spotName && item.photos?.some((photo) => photo.id))
      .map((item) => ({
        spotId: item.spotId!,
        name: item.spotName!,
        photoIds:
          item.photos?.map((photo) => photo.id).filter((id): id is string => Boolean(id)) ?? [],
      })) ?? [];

  return (
    <PageCard>
      <LoadingBoundary isLoading={isLoading} message="로그를 불러오는 중이에요">
        {!log ? (
          <ErrorState
            code={404}
            title="로그를 찾을 수 없어요"
            description="삭제되었거나 존재하지 않는 로그예요."
            primaryAction={{
              label: "이전으로 돌아가기",
              onClick: () => router.back(),
            }}
          />
        ) : (
          <>
            <LogDetailContent
              log={toLogDetailData(log)}
              onBack={() => router.back()}
              headerRight={
                <div className="flex items-center gap-2">
                  {/* 사진 신고 버튼 */}
                  {reportableSpots.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowReportModal(true)}
                      aria-label="사진 신고"
                      className="flex size-[28px] shrink-0 items-center justify-center rounded-lg border-[0.5px] border-sub-coral bg-sub-lightcoral"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-sub-coral">
                        <path d="m24,23h0c0,.552-.448,1-1,1H1c-.552,0-1-.448-1-1h0c0-1.657,1.343-3,3-3h18c1.657,0,3,1.343,3,3Zm-1.789-16.797l1.5-1.517c.389-.393.385-1.025-.008-1.414-.394-.389-1.026-.385-1.414.008l-1.5,1.517c-.389.393-.385,1.025.008,1.414.195.192.449.289.703.289.258,0,.516-.099.711-.297Zm-3.823-3.243l.777-1.5c.254-.49.062-1.094-.428-1.348-.488-.254-1.094-.064-1.348.428l-.777,1.5c-.254.49-.062,1.094.428,1.348.146.076.304.112.459.112.361,0,.711-.196.889-.54ZM3.203,6.211c.393-.389.396-1.021.008-1.414l-1.5-1.517c-.387-.393-1.022-.396-1.414-.008-.393.389-.396,1.021-.008,1.414l1.5,1.517c.195.198.453.297.711.297.254,0,.509-.097.703-.289Zm3.757-2.823c.49-.254.682-.857.428-1.348l-.777-1.5c-.255-.492-.86-.682-1.348-.428-.49.254-.682.857-.428,1.348l.777,1.5c.178.344.527.54.889.54.155,0,.312-.036.459-.112Zm14.04,9.612v4c0,.553-.447,1-1,1H4c-.553,0-1-.447-1-1v-4c0-4.963,4.037-9,9-9s9,4.037,9,9Zm-8-3c0-.553-.447-1-1-1-2.206,0-4,1.794-4,4,0,.553.447,1,1,1s1-.447,1-1c0-1.103.897-2,2-2,.553,0,1-.447,1-1Z" />
                      </svg>
                    </button>
                  )}

                  {/* 내 일정에 담기 버튼 */}
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    disabled={!hasItinerary || isItinerariesLoading}
                    aria-label={
                      hasItinerary ? "내 일정에 추가" : "담을 여행이 없어 추가할 수 없어요"
                    }
                    title={hasItinerary ? undefined : "먼저 여행을 만들어야 담을 수 있어요"}
                    className="flex size-[28px] shrink-0 items-center justify-center rounded-lg border-[0.5px] border-main-blue bg-system-scroll disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Image src={calendarPlusIcon} alt="" width={16} height={16} aria-hidden />
                  </button>
                </div>
              }
            />

            <ReportLogModal
              isOpen={showReportModal}
              spots={reportableSpots}
              onClose={() => setShowReportModal(false)}
              onConfirm={handleReport}
            />

            <ImportLogModal
              isOpen={showAddModal}
              isLoading={isImporting}
              authorNickname={log.groupMembers?.[0]?.nickname ?? ""}
              onClose={handleCloseAddModal}
              onConfirm={handleImportLog}
            />
          </>
        )}
      </LoadingBoundary>

      <Toast
        isVisible={toastMessage !== null}
        onHide={() => setToastMessage(null)}
        message={toastMessage ?? ""}
        variant="success"
      />
    </PageCard>
  );
}

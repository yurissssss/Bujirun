"use client";
import { useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { travelLogApi, spotApi } from "@/shared/api/domains";
import { buildDaysFromTravelLogDetail } from "../utils/scheduleUtils";
import type { useCollaborativeItinerary } from "@/features/itinerary/collab/useCollaborativeItinerary";
type Collaboration = ReturnType<typeof useCollaborativeItinerary>;
type ShowToast = (message: string, variant?: "itinerary" | "error") => void;

export function useImportedTravelLog(importedLogId: string | null) {
  const queryClient = useQueryClient();
  // 다른 사람의 여행 로그를 이 일정에 그대로 불러오는 기능(로그 상세 페이지의 "일정 담기").
  const { data: importedLog, isError: isImportedLogError } = useQuery({
    queryKey: travelLogApi.keys.detail(importedLogId ?? ""),
    queryFn: () => travelLogApi.getLog(importedLogId as string),
    enabled: !!importedLogId,
  });
  // 로그의 spotThumbnailUrl은 로그를 만들 때 박아둔 스냅샷이라 비어 있는 항목이 있다.
  // 그대로 두면 관광지 자리에 폴백(부산 일반 사진)이 박히므로, 비어 있는 스팟만 관광지
  // 단건 조회로 실제 썸네일을 받아온다. 이미 값이 있는 스팟은 건드리지 않는다.
  const missingThumbnailSpotIds = useMemo(
    () =>
      Array.from(
        new Set(
          (importedLog?.days ?? []).flatMap((day) =>
            (day.items ?? [])
              .filter((item) => !item.spotThumbnailUrl && item.spotId)
              .map((item) => item.spotId as string),
          ),
        ),
      ),
    [importedLog],
  );

  // 조회에 실패한 스팟은 폴백 이미지로 남기고 불러오기 자체는 진행한다(allSettled) —
  // 이미지 하나 때문에 로그 담기 전체가 막히면 손해가 더 크다.
  const { data: importedSpotThumbnails } = useQuery({
    queryKey: [...travelLogApi.keys.detail(importedLogId ?? ""), "spot-thumbnails"],
    queryFn: async () => {
      const results = await Promise.allSettled(
        missingThumbnailSpotIds.map((spotId) =>
          queryClient.fetchQuery({
            queryKey: spotApi.keys.detail(spotId),
            queryFn: () => spotApi.getSpot(spotId),
          }),
        ),
      );
      const thumbnails = new Map<string, string>();
      results.forEach((result, idx) => {
        if (result.status === "fulfilled" && result.value?.thumbnailUrl) {
          thumbnails.set(missingThumbnailSpotIds[idx], result.value.thumbnailUrl);
        }
      });
      return thumbnails;
    },
    enabled: !!importedLogId && !!importedLog,
    staleTime: Infinity,
  });
  return { importedLog, importedSpotThumbnails, isImportedLogError };
}

interface ApplyLogParams {
  importedLogId: string | null;
  importedLog: ReturnType<typeof useImportedTravelLog>["importedLog"];
  importedSpotThumbnails: Map<string, string> | undefined;
  yjsSeeded: boolean;
  dayIdsSliced: string[];
  replaceYjsStopsWithImportedLog: Collaboration["replaceStopsWithImportedLog"];
  logActivity: Collaboration["logActivity"];
  flushNow: Collaboration["flushNow"];
  setCurrentDay: Dispatch<SetStateAction<number>>;
  showToast: ShowToast;
}
export function useApplyImportedTravelLog({
  importedLogId,
  importedLog,
  importedSpotThumbnails,
  yjsSeeded,
  dayIdsSliced,
  replaceYjsStopsWithImportedLog,
  logActivity,
  flushNow,
  setCurrentDay,
  showToast,
}: ApplyLogParams) {
  useEffect(() => {
    if (!importedLogId || !importedLog) return;
    // 썸네일 보강이 끝나기 전에 반영하면 폴백 이미지가 먼저 박히고, 그 뒤에 이미지가
    // 바뀌는 게 아니라 그대로 굳는다(반영은 이 이펙트에서 한 번만 일어난다).
    if (!importedSpotThumbnails) return;
    // Yjs 문서가 아직 시딩 전이면 day별 items 배열 자체가 doc 안에 없어서, 이 시점에
    // pushYjsOptimizedOrder를 호출해도 조용히 아무 일도 안 일어난다(day map을 못 찾아
    // no-op) — "로그 불러오기 버튼을 눌러도 일정이 그대로"인 버그의 원인이었다. seeded가
    // true가 될 때(=day 구조가 doc에 만들어진 뒤)까지 기다렸다가 반영한다.
    if (!yjsSeeded) return;

    // 로그 응답의 각 항목에 spotId/주소/썸네일/카테고리가 이미 내려오므로 그대로 쓴다
    // (예전엔 이름으로 관광지를 다시 검색해 매칭했었는데, 백엔드가 spotId를 내려주기
    // 시작한 뒤에도 안 지워져 있던 워크어라운드였음 — 이름이 안 맞으면 엉뚱한 스팟에
    // 매칭되거나 spotId가 비어 REST addItem 저장 자체가 안 되는 문제가 있었음).
    const { days } = buildDaysFromTravelLogDetail(importedLog, importedSpotThumbnails);
    // 로그 쪽 day 수가 현재 일정보다 적을 수 있다(예: 2박3일 일정에 1박2일 로그를 불러오는
    // 경우) — 그럴 땐 로그가 채워주는 날짜까지만 덮어쓰고, 남는 뒷날은 원래 상태(대개 빈
    // 상태) 그대로 둔다. 로그 쪽 day 수가 더 많으면 초과분은 그냥 버린다(현재 일정 기준).
    // 여행 날짜(tripDates)는 로그가 아니라 지금 이 일정 고유의 값이라 손대지 않는다 —
    // 예전엔 로그의 dates로 덮어써서, 일정보다 짧은 로그를 불러오면 뒷날짜 자체가
    // 화면에서 통째로 사라지는(사실상 일정이 로그 길이로 줄어드는) 버그가 있었다.
    // pushYjsOptimizedOrder(재정렬 전용)는 "현재 배열에 이미 있는 id만" 반영하는 필터가
    // 있어서, 로그에서 새로 만들어진(한 번도 존재한 적 없는) id의 항목들을 넣으면 전부
    // 걸러져 day가 통째로 비어버렸다(2026-08-23 실서버 테스트로 재현). 로그 불러오기
    // 전용 함수로 교체.
    days.forEach((dayStops, idx) => {
      if (idx < dayIdsSliced.length) replaceYjsStopsWithImportedLog(idx, dayStops);
    });
    logActivity("import", "");
    flushNow();
    // 이 로그가 일정에 담긴 횟수(카운트 배지·인기순 정렬 기준)를 올린다. 실패해도 불러오기
    // 자체엔 지장 없으므로 조용히 삼킨다.
    travelLogApi.recordLogImport(importedLogId).catch(() => {});
    setCurrentDay(0);
    const toastTimer = window.setTimeout(() => {
      showToast("일정이 추가되었어요.");
      // importedLogId만 지우려던 게 tripId까지 같이 날려서, 다음 렌더에 URL이 빈
      // "/itinerary"로 읽혀 화면이 "오늘 진행중" 폴백 규칙으로 엉뚱한 일정으로
      // 넘어가 버렸다(2026-09-14 실브라우저 재현: 저장은 맞는 일정에 됐는데 화면만
      // 다른 일정으로 바뀜). importedLogId만 지우고 tripId는 유지한다.
      const url = new URL(window.location.href);
      url.searchParams.delete("importedLogId");
      window.history.replaceState(null, "", url);
    }, 300);

    return () => {
      window.clearTimeout(toastTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importedLogId, importedLog, importedSpotThumbnails, yjsSeeded]);
}

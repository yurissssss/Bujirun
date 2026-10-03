"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import {
  Button,
  Card,
  CategoryChip,
  FilterChips,
  StatusBadge,
  SearchBar,
  TimePicker,
  TextInput,
  Counter,
  KakaoLoginButton,
  Modal,
  SpeechBubble,
  Toast,
  PlaceCard,
  PlaceDetailSheet,
  PlaceInfoRow,
} from "@/components";
import {
  TransportCard,
  LogCard,
  ArrivalVerifyModal,
  VotePlaceCard,
  InviteCard,
  PlaceSearchItem,
} from "@/features/itinerary";
import { itineraryApi, spotApi, travelLogApi, groupApi, transitApi } from "@/shared/api/domains";
import { useAuthStore } from "@/shared/stores/useAuthStore";

const IMG = "https://picsum.photos/400/300";
const IMG2 = "https://picsum.photos/401/300";
const MOCK_FRIENDS = [{ imageUrl: IMG }, { imageUrl: IMG2 }, { imageUrl: IMG }, { imageUrl: IMG2 }];

function formatApiError(e: unknown): string {
  if (isAxiosError(e)) {
    return `[${e.response?.status ?? "?"}] ${JSON.stringify(e.response?.data ?? e.message, null, 2)}`;
  }
  return e instanceof Error ? e.message : String(e);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-0 bg-system-navbg py-2 z-10">
      <h2 className="font-bold text-xl text-main-blue border-b-2 border-main-blue pb-1">
        {children}
      </h2>
    </div>
  );
}

function ComponentLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm text-sub-gray font-semibold">{children}</h3>;
}

export default function TestPage() {
  const [search, setSearch] = useState("");
  const [filterChip, setFilterChip] = useState("전체");
  const [inputVal, setInputVal] = useState("");
  const [count, setCount] = useState(2);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);

  const [showBaseModal, setShowBaseModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  // 1. 로그인 토큰
  const [tokenInput, setTokenInput] = useState("");

  const handleSaveToken = () => {
    useAuthStore.getState().setAccessToken(tokenInput.trim() || null);
  };

  // 2. 관광지 검색 (스와이프 생성용 spotId 확보)
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<unknown>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleTestSearchSpots = async () => {
    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      const data = await spotApi.searchSpots({ keyword: searchKeyword || undefined });
      setSearchResult(data);
    } catch (e) {
      setSearchError(formatApiError(e));
    } finally {
      setSearchLoading(false);
    }
  };

  // 3. 일정 생성 (스와이프 기반 — 실제 동작하는 생성 경로)
  const [generateSpotIdInput, setGenerateSpotIdInput] = useState("");
  const [generateStartDateInput, setGenerateStartDateInput] = useState("");
  const [generateEndDateInput, setGenerateEndDateInput] = useState("");
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateResult, setGenerateResult] = useState<unknown>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleTestGenerateItinerary = async () => {
    setGenerateLoading(true);
    setGenerateError(null);
    setGenerateResult(null);
    try {
      const data = await itineraryApi.generateItinerary({
        swipes: generateSpotIdInput
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
          .map((contentId) => ({ contentId, liked: true })),
        startDate: generateStartDateInput,
        endDate: generateEndDateInput,
      });
      setGenerateResult(data);
    } catch (e) {
      setGenerateError(formatApiError(e));
    } finally {
      setGenerateLoading(false);
    }
  };

  // 4. 일정 생성 (일반 — swipe_sessions FK 문제로 500 날 수 있음, 참고용)
  const [createTitleInput, setCreateTitleInput] = useState("");
  const [createStartAtInput, setCreateStartAtInput] = useState("");
  const [createEndAtInput, setCreateEndAtInput] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createResult, setCreateResult] = useState<unknown>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleTestCreateItinerary = async () => {
    setCreateLoading(true);
    setCreateError(null);
    setCreateResult(null);
    try {
      const data = await itineraryApi.createItinerary({
        title: createTitleInput || undefined,
        startAt: createStartAtInput || undefined,
        endAt: createEndAtInput || undefined,
      });
      setCreateResult(data);
    } catch (e) {
      setCreateError(formatApiError(e));
    } finally {
      setCreateLoading(false);
    }
  };

  // 5. 일정 목록 조회
  const [apiLoading, setApiLoading] = useState(false);
  const [apiResult, setApiResult] = useState<unknown>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleTestGetItineraries = async () => {
    setApiLoading(true);
    setApiError(null);
    setApiResult(null);
    try {
      const data = await itineraryApi.getItineraries();
      setApiResult(data);
    } catch (e) {
      setApiError(formatApiError(e));
    } finally {
      setApiLoading(false);
    }
  };

  // 6. 일정 상세 조회
  const [itineraryIdInput, setItineraryIdInput] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailResult, setDetailResult] = useState<unknown>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const handleTestGetItinerary = async () => {
    setDetailLoading(true);
    setDetailError(null);
    setDetailResult(null);
    try {
      const data = await itineraryApi.getItinerary(itineraryIdInput.trim());
      setDetailResult(data);
    } catch (e) {
      setDetailError(formatApiError(e));
    } finally {
      setDetailLoading(false);
    }
  };

  // 7. Day 추가
  const [addDayItineraryIdInput, setAddDayItineraryIdInput] = useState("");
  const [addDayNumberInput, setAddDayNumberInput] = useState("");
  const [addDayDateInput, setAddDayDateInput] = useState("");
  const [addDayLoading, setAddDayLoading] = useState(false);
  const [addDayResult, setAddDayResult] = useState<unknown>(null);
  const [addDayError, setAddDayError] = useState<string | null>(null);

  const handleTestAddDay = async () => {
    setAddDayLoading(true);
    setAddDayError(null);
    setAddDayResult(null);
    try {
      const data = await itineraryApi.addDay(addDayItineraryIdInput.trim(), {
        dayNumber: Number(addDayNumberInput) || 1,
        date: addDayDateInput || undefined,
      });
      setAddDayResult(data);
    } catch (e) {
      setAddDayError(formatApiError(e));
    } finally {
      setAddDayLoading(false);
    }
  };

  // 8. 장소 추가
  const [addItemItineraryIdInput, setAddItemItineraryIdInput] = useState("");
  const [addItemDayIdInput, setAddItemDayIdInput] = useState("");
  const [addItemSpotIdInput, setAddItemSpotIdInput] = useState("");
  const [addItemArrivalTimeInput, setAddItemArrivalTimeInput] = useState("");
  const [addItemLoading, setAddItemLoading] = useState(false);
  const [addItemResult, setAddItemResult] = useState<unknown>(null);
  const [addItemError, setAddItemError] = useState<string | null>(null);

  const handleTestAddItem = async () => {
    setAddItemLoading(true);
    setAddItemError(null);
    setAddItemResult(null);
    try {
      const data = await itineraryApi.addItem(
        addItemItineraryIdInput.trim(),
        addItemDayIdInput.trim(),
        {
          spotId: addItemSpotIdInput.trim(),
          arrivalTime: addItemArrivalTimeInput || undefined,
        },
      );
      setAddItemResult(data);
    } catch (e) {
      setAddItemError(formatApiError(e));
    } finally {
      setAddItemLoading(false);
    }
  };

  // 9. 항목(장소) 시간 수정
  const [updateItemItineraryIdInput, setUpdateItemItineraryIdInput] = useState("");
  const [updateItemDayIdInput, setUpdateItemDayIdInput] = useState("");
  const [updateItemItemIdInput, setUpdateItemItemIdInput] = useState("");
  const [updateItemArrivalTimeInput, setUpdateItemArrivalTimeInput] = useState("");
  const [updateItemLoading, setUpdateItemLoading] = useState(false);
  const [updateItemResult, setUpdateItemResult] = useState<unknown>(null);
  const [updateItemError, setUpdateItemError] = useState<string | null>(null);

  const handleTestUpdateItem = async () => {
    setUpdateItemLoading(true);
    setUpdateItemError(null);
    setUpdateItemResult(null);
    try {
      const data = await itineraryApi.updateItem(
        updateItemItineraryIdInput.trim(),
        updateItemDayIdInput.trim(),
        updateItemItemIdInput.trim(),
        { arrivalTime: updateItemArrivalTimeInput || undefined },
      );
      setUpdateItemResult(data);
    } catch (e) {
      setUpdateItemError(formatApiError(e));
    } finally {
      setUpdateItemLoading(false);
    }
  };

  // 10. 항목(장소) 삭제
  const [deleteItemItineraryIdInput, setDeleteItemItineraryIdInput] = useState("");
  const [deleteItemDayIdInput, setDeleteItemDayIdInput] = useState("");
  const [deleteItemItemIdInput, setDeleteItemItemIdInput] = useState("");
  const [deleteItemLoading, setDeleteItemLoading] = useState(false);
  const [deleteItemResult, setDeleteItemResult] = useState<unknown>(null);
  const [deleteItemError, setDeleteItemError] = useState<string | null>(null);

  const handleTestDeleteItem = async () => {
    setDeleteItemLoading(true);
    setDeleteItemError(null);
    setDeleteItemResult(null);
    try {
      await itineraryApi.deleteItem(
        deleteItemItineraryIdInput.trim(),
        deleteItemDayIdInput.trim(),
        deleteItemItemIdInput.trim(),
      );
      setDeleteItemResult("삭제 완료");
    } catch (e) {
      setDeleteItemError(formatApiError(e));
    } finally {
      setDeleteItemLoading(false);
    }
  };

  // 11. Day 삭제
  const [deleteDayItineraryIdInput, setDeleteDayItineraryIdInput] = useState("");
  const [deleteDayIdInput, setDeleteDayIdInput] = useState("");
  const [deleteDayLoading, setDeleteDayLoading] = useState(false);
  const [deleteDayResult, setDeleteDayResult] = useState<unknown>(null);
  const [deleteDayError, setDeleteDayError] = useState<string | null>(null);

  const handleTestDeleteDay = async () => {
    setDeleteDayLoading(true);
    setDeleteDayError(null);
    setDeleteDayResult(null);
    try {
      await itineraryApi.deleteDay(deleteDayItineraryIdInput.trim(), deleteDayIdInput.trim());
      setDeleteDayResult("삭제 완료");
    } catch (e) {
      setDeleteDayError(formatApiError(e));
    } finally {
      setDeleteDayLoading(false);
    }
  };

  // 12. 여행 수정
  const [updateItineraryIdInput, setUpdateItineraryIdInput] = useState("");
  const [updateTitleInput, setUpdateTitleInput] = useState("");
  const [updateStatusInput, setUpdateStatusInput] = useState("");
  const [updateItineraryLoading, setUpdateItineraryLoading] = useState(false);
  const [updateItineraryResult, setUpdateItineraryResult] = useState<unknown>(null);
  const [updateItineraryError, setUpdateItineraryError] = useState<string | null>(null);

  const handleTestUpdateItinerary = async () => {
    setUpdateItineraryLoading(true);
    setUpdateItineraryError(null);
    setUpdateItineraryResult(null);
    try {
      const data = await itineraryApi.updateItinerary(updateItineraryIdInput.trim(), {
        title: updateTitleInput || undefined,
        status: updateStatusInput || undefined,
      });
      setUpdateItineraryResult(data);
    } catch (e) {
      setUpdateItineraryError(formatApiError(e));
    } finally {
      setUpdateItineraryLoading(false);
    }
  };

  // 13. 여행 삭제
  const [deleteItineraryIdInput, setDeleteItineraryIdInput] = useState("");
  const [deleteItineraryLoading, setDeleteItineraryLoading] = useState(false);
  const [deleteItineraryResult, setDeleteItineraryResult] = useState<unknown>(null);
  const [deleteItineraryError, setDeleteItineraryError] = useState<string | null>(null);

  const handleTestDeleteItinerary = async () => {
    setDeleteItineraryLoading(true);
    setDeleteItineraryError(null);
    setDeleteItineraryResult(null);
    try {
      await itineraryApi.deleteItinerary(deleteItineraryIdInput.trim());
      setDeleteItineraryResult("삭제 완료");
    } catch (e) {
      setDeleteItineraryError(formatApiError(e));
    } finally {
      setDeleteItineraryLoading(false);
    }
  };

  // 14. 로그 둘러보기
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsResult, setLogsResult] = useState<unknown>(null);
  const [logsError, setLogsError] = useState<string | null>(null);

  const handleTestGetPublicLogs = async () => {
    setLogsLoading(true);
    setLogsError(null);
    setLogsResult(null);
    try {
      const data = await travelLogApi.getPublicLogs();
      setLogsResult(data);
    } catch (e) {
      setLogsError(formatApiError(e));
    } finally {
      setLogsLoading(false);
    }
  };

  // 15. 여행 방 생성
  const [groupNameInput, setGroupNameInput] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupResult, setGroupResult] = useState<unknown>(null);
  const [groupError, setGroupError] = useState<string | null>(null);

  const handleTestCreateGroup = async () => {
    setGroupLoading(true);
    setGroupError(null);
    setGroupResult(null);
    try {
      const data = await groupApi.createGroup({ name: groupNameInput || "테스트 방" });
      setGroupResult(data);
    } catch (e) {
      setGroupError(formatApiError(e));
    } finally {
      setGroupLoading(false);
    }
  };

  // 16. 내 방 목록 조회
  const [myGroupsLoading, setMyGroupsLoading] = useState(false);
  const [myGroupsResult, setMyGroupsResult] = useState<unknown>(null);
  const [myGroupsError, setMyGroupsError] = useState<string | null>(null);

  const handleTestGetMyGroups = async () => {
    setMyGroupsLoading(true);
    setMyGroupsError(null);
    setMyGroupsResult(null);
    try {
      const data = await groupApi.getMyGroups();
      setMyGroupsResult(data);
    } catch (e) {
      setMyGroupsError(formatApiError(e));
    } finally {
      setMyGroupsLoading(false);
    }
  };

  // 17. 방 참여자 조회
  const [groupIdInput, setGroupIdInput] = useState("");
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersResult, setMembersResult] = useState<unknown>(null);
  const [membersError, setMembersError] = useState<string | null>(null);

  const handleTestGetMembers = async () => {
    setMembersLoading(true);
    setMembersError(null);
    setMembersResult(null);
    try {
      const data = await groupApi.getGroupMembers(groupIdInput.trim());
      setMembersResult(data);
    } catch (e) {
      setMembersError(formatApiError(e));
    } finally {
      setMembersLoading(false);
    }
  };

  // 18. 방 참여 (초대코드)
  const [joinInviteCodeInput, setJoinInviteCodeInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinResult, setJoinResult] = useState<unknown>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleTestJoinGroup = async () => {
    setJoinLoading(true);
    setJoinError(null);
    setJoinResult(null);
    try {
      const data = await groupApi.joinGroup({ inviteCode: joinInviteCodeInput.trim() });
      setJoinResult(data);
    } catch (e) {
      setJoinError(formatApiError(e));
    } finally {
      setJoinLoading(false);
    }
  };

  // 19. 그룹 일정 자동생성
  const [groupGenGroupIdInput, setGroupGenGroupIdInput] = useState("");
  const [groupGenStartDateInput, setGroupGenStartDateInput] = useState("");
  const [groupGenEndDateInput, setGroupGenEndDateInput] = useState("");
  const [groupGenLoading, setGroupGenLoading] = useState(false);
  const [groupGenResult, setGroupGenResult] = useState<unknown>(null);
  const [groupGenError, setGroupGenError] = useState<string | null>(null);

  const handleTestGenerateGroupItinerary = async () => {
    setGroupGenLoading(true);
    setGroupGenError(null);
    setGroupGenResult(null);
    try {
      const data = await itineraryApi.generateGroupItinerary(groupGenGroupIdInput.trim(), {
        startDate: groupGenStartDateInput,
        endDate: groupGenEndDateInput,
      });
      setGroupGenResult(data);
    } catch (e) {
      setGroupGenError(formatApiError(e));
    } finally {
      setGroupGenLoading(false);
    }
  };

  // 20. 투표 참여
  const [voteSessionIdInput, setVoteSessionIdInput] = useState("");
  const [votePlanInput, setVotePlanInput] = useState("");
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteResult, setVoteResult] = useState<unknown>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  const handleTestCastVote = async () => {
    setVoteLoading(true);
    setVoteError(null);
    setVoteResult(null);
    try {
      const data = await itineraryApi.castVote(voteSessionIdInput.trim(), {
        votedPlan: votePlanInput.trim(),
      });
      setVoteResult(data);
    } catch (e) {
      setVoteError(formatApiError(e));
    } finally {
      setVoteLoading(false);
    }
  };

  // 21. 투표 현황 조회
  const [voteStatusSessionIdInput, setVoteStatusSessionIdInput] = useState("");
  const [voteStatusLoading, setVoteStatusLoading] = useState(false);
  const [voteStatusResult, setVoteStatusResult] = useState<unknown>(null);
  const [voteStatusError, setVoteStatusError] = useState<string | null>(null);

  const handleTestGetVoteStatus = async () => {
    setVoteStatusLoading(true);
    setVoteStatusError(null);
    setVoteStatusResult(null);
    try {
      const data = await itineraryApi.getVoteStatus(voteStatusSessionIdInput.trim());
      setVoteStatusResult(data);
    } catch (e) {
      setVoteStatusError(formatApiError(e));
    } finally {
      setVoteStatusLoading(false);
    }
  };

  // 22. 일정 확정 (리더 전용)
  const [finalizeSessionIdInput, setFinalizeSessionIdInput] = useState("");
  const [finalizeSelectedPlanInput, setFinalizeSelectedPlanInput] = useState("");
  const [finalizeTitleInput, setFinalizeTitleInput] = useState("");
  const [finalizeStartDateInput, setFinalizeStartDateInput] = useState("");
  const [finalizeEndDateInput, setFinalizeEndDateInput] = useState("");
  const [finalizeFreePassInput, setFinalizeFreePassInput] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [finalizeResult, setFinalizeResult] = useState<unknown>(null);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

  const handleTestFinalize = async () => {
    setFinalizeLoading(true);
    setFinalizeError(null);
    setFinalizeResult(null);
    try {
      const data = await itineraryApi.finalizeItinerary(finalizeSessionIdInput.trim(), {
        freePass: finalizeFreePassInput,
        selectedPlan: finalizeSelectedPlanInput || undefined,
        title: finalizeTitleInput,
        startDate: finalizeStartDateInput,
        endDate: finalizeEndDateInput,
      });
      setFinalizeResult(data);
    } catch (e) {
      setFinalizeError(formatApiError(e));
    } finally {
      setFinalizeLoading(false);
    }
  };

  // 23. 일정 최적화 (Day 단위 동선 재정렬)
  const [optimizeDayIdInput, setOptimizeDayIdInput] = useState("");
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<unknown>(null);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);

  const handleTestOptimizeDay = async () => {
    setOptimizeLoading(true);
    setOptimizeError(null);
    setOptimizeResult(null);
    try {
      const data = await itineraryApi.optimizeDay(optimizeDayIdInput.trim(), {});
      setOptimizeResult(data);
    } catch (e) {
      setOptimizeError(formatApiError(e));
    } finally {
      setOptimizeLoading(false);
    }
  };

  // 24. 버스 실시간 도착정보
  const [busArsIdInput, setBusArsIdInput] = useState("");
  const [busRouteNoInput, setBusRouteNoInput] = useState("");
  const [busLoading, setBusLoading] = useState(false);
  const [busResult, setBusResult] = useState<unknown>(null);
  const [busFetched, setBusFetched] = useState(false);
  const [busError, setBusError] = useState<string | null>(null);

  const handleTestGetBusArrival = async () => {
    setBusLoading(true);
    setBusError(null);
    setBusResult(null);
    setBusFetched(false);
    try {
      const data = await transitApi.getBusArrival({
        arsId: busArsIdInput.trim(),
        routeNo: busRouteNoInput.trim(),
      });
      setBusResult(data);
      setBusFetched(true);
    } catch (e) {
      setBusError(formatApiError(e));
    } finally {
      setBusLoading(false);
    }
  };

  return (
    <div className="bg-system-navbg px-5 py-6 flex flex-col gap-8 overflow-y-auto overflow-x-hidden">
      <section className="flex flex-col gap-3">
        <SectionTitle>API 연동 테스트</SectionTitle>

        <ComponentLabel>1. 테스트용 accessToken (백엔드에서 발급받은 토큰 붙여넣기)</ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="accessToken 붙여넣기"
          />
          <Button variant="secondary" onClick={handleSaveToken}>
            토큰 저장
          </Button>
        </div>

        <ComponentLabel>
          2. GET /api/spots/search (스와이프 생성용 spotId 확보는 여기서 먼저)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="검색어 (비워두면 전체 조회)"
          />
          <Button variant="primary" onClick={handleTestSearchSpots} disabled={searchLoading}>
            {searchLoading ? "요청 중..." : "관광지 검색 테스트"}
          </Button>
        </div>
        {searchError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {searchError}
          </pre>
        )}
        {searchResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(searchResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          3. POST /api/itineraries/generate (⚠️ 저장 안 됨 — planA/B/C 미리보기만 반환, id 없음. 위
          검색 결과의 spotId 사용)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={generateSpotIdInput}
            onChange={(e) => setGenerateSpotIdInput(e.target.value)}
            placeholder="좋아요 누른 spot id 여러 개, 콤마로 구분"
          />
        </div>
        <div className="flex gap-2">
          <TextInput
            value={generateStartDateInput}
            onChange={(e) => setGenerateStartDateInput(e.target.value)}
            placeholder="시작일 YYYY-MM-DD"
          />
          <TextInput
            value={generateEndDateInput}
            onChange={(e) => setGenerateEndDateInput(e.target.value)}
            placeholder="종료일 YYYY-MM-DD"
          />
        </div>
        <Button variant="primary" onClick={handleTestGenerateItinerary} disabled={generateLoading}>
          {generateLoading ? "요청 중..." : "스와이프 일정 생성 테스트"}
        </Button>
        {generateError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {generateError}
          </pre>
        )}
        {generateResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(generateResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          4. POST /api/itineraries (여행 생성 — ⚠️ swipe_sessions FK 문제로 500. 현재 일정을
          저장하는 유일한 API인데 막혀있음, 백엔드 수정 필요)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={createTitleInput}
            onChange={(e) => setCreateTitleInput(e.target.value)}
            placeholder="제목"
          />
          <TextInput
            value={createStartAtInput}
            onChange={(e) => setCreateStartAtInput(e.target.value)}
            placeholder="시작일 YYYY-MM-DD"
          />
          <TextInput
            value={createEndAtInput}
            onChange={(e) => setCreateEndAtInput(e.target.value)}
            placeholder="종료일 YYYY-MM-DD"
          />
        </div>
        <Button variant="primary" onClick={handleTestCreateItinerary} disabled={createLoading}>
          {createLoading ? "요청 중..." : "여행 생성 테스트"}
        </Button>
        {createError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {createError}
          </pre>
        )}
        {createResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(createResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>5. GET /api/itineraries (목록 조회)</ComponentLabel>
        <Button variant="primary" onClick={handleTestGetItineraries} disabled={apiLoading}>
          {apiLoading ? "요청 중..." : "일정 목록 조회 테스트"}
        </Button>
        {apiError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {apiError}
          </pre>
        )}
        {apiResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          6. GET /api/itineraries/{"{id}"} (위 목록 결과의 id 붙여넣기)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={itineraryIdInput}
            onChange={(e) => setItineraryIdInput(e.target.value)}
            placeholder="itinerary id 붙여넣기"
          />
          <Button variant="primary" onClick={handleTestGetItinerary} disabled={detailLoading}>
            {detailLoading ? "요청 중..." : "일정 상세 조회 테스트"}
          </Button>
        </div>
        {detailError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {detailError}
          </pre>
        )}
        {detailResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(detailResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>7. POST /api/itineraries/{"{itineraryId}"}/days (Day 추가)</ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={addDayItineraryIdInput}
            onChange={(e) => setAddDayItineraryIdInput(e.target.value)}
            placeholder="itinerary id"
          />
          <TextInput
            value={addDayNumberInput}
            onChange={(e) => setAddDayNumberInput(e.target.value)}
            placeholder="dayNumber (예: 1)"
          />
          <TextInput
            value={addDayDateInput}
            onChange={(e) => setAddDayDateInput(e.target.value)}
            placeholder="date YYYY-MM-DD"
          />
        </div>
        <Button variant="primary" onClick={handleTestAddDay} disabled={addDayLoading}>
          {addDayLoading ? "요청 중..." : "Day 추가 테스트"}
        </Button>
        {addDayError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {addDayError}
          </pre>
        )}
        {addDayResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(addDayResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          8. POST /api/itineraries/{"{itineraryId}"}/days/{"{dayId}"}/items (장소 추가)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={addItemItineraryIdInput}
            onChange={(e) => setAddItemItineraryIdInput(e.target.value)}
            placeholder="itinerary id"
          />
          <TextInput
            value={addItemDayIdInput}
            onChange={(e) => setAddItemDayIdInput(e.target.value)}
            placeholder="day id"
          />
        </div>
        <div className="flex gap-2">
          <TextInput
            value={addItemSpotIdInput}
            onChange={(e) => setAddItemSpotIdInput(e.target.value)}
            placeholder="spot id"
          />
          <TextInput
            value={addItemArrivalTimeInput}
            onChange={(e) => setAddItemArrivalTimeInput(e.target.value)}
            placeholder="arrivalTime HH:mm"
          />
        </div>
        <Button variant="primary" onClick={handleTestAddItem} disabled={addItemLoading}>
          {addItemLoading ? "요청 중..." : "장소 추가 테스트"}
        </Button>
        {addItemError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {addItemError}
          </pre>
        )}
        {addItemResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(addItemResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          9. PATCH .../days/{"{dayId}"}/items/{"{itemId}"} (항목 시간 변경)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={updateItemItineraryIdInput}
            onChange={(e) => setUpdateItemItineraryIdInput(e.target.value)}
            placeholder="itinerary id"
          />
          <TextInput
            value={updateItemDayIdInput}
            onChange={(e) => setUpdateItemDayIdInput(e.target.value)}
            placeholder="day id"
          />
        </div>
        <div className="flex gap-2">
          <TextInput
            value={updateItemItemIdInput}
            onChange={(e) => setUpdateItemItemIdInput(e.target.value)}
            placeholder="item id"
          />
          <TextInput
            value={updateItemArrivalTimeInput}
            onChange={(e) => setUpdateItemArrivalTimeInput(e.target.value)}
            placeholder="새 arrivalTime HH:mm"
          />
        </div>
        <Button variant="primary" onClick={handleTestUpdateItem} disabled={updateItemLoading}>
          {updateItemLoading ? "요청 중..." : "항목 수정 테스트"}
        </Button>
        {updateItemError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {updateItemError}
          </pre>
        )}
        {updateItemResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(updateItemResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          10. DELETE .../days/{"{dayId}"}/items/{"{itemId}"} (항목 삭제)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={deleteItemItineraryIdInput}
            onChange={(e) => setDeleteItemItineraryIdInput(e.target.value)}
            placeholder="itinerary id"
          />
          <TextInput
            value={deleteItemDayIdInput}
            onChange={(e) => setDeleteItemDayIdInput(e.target.value)}
            placeholder="day id"
          />
        </div>
        <div className="flex gap-2">
          <TextInput
            value={deleteItemItemIdInput}
            onChange={(e) => setDeleteItemItemIdInput(e.target.value)}
            placeholder="item id"
          />
          <Button variant="warning" onClick={handleTestDeleteItem} disabled={deleteItemLoading}>
            {deleteItemLoading ? "요청 중..." : "항목 삭제 테스트"}
          </Button>
        </div>
        {deleteItemError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {deleteItemError}
          </pre>
        )}
        {deleteItemResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(deleteItemResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          11. DELETE /api/itineraries/{"{itineraryId}"}/days/{"{dayId}"} (Day 삭제)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={deleteDayItineraryIdInput}
            onChange={(e) => setDeleteDayItineraryIdInput(e.target.value)}
            placeholder="itinerary id"
          />
          <TextInput
            value={deleteDayIdInput}
            onChange={(e) => setDeleteDayIdInput(e.target.value)}
            placeholder="day id"
          />
          <Button variant="warning" onClick={handleTestDeleteDay} disabled={deleteDayLoading}>
            {deleteDayLoading ? "요청 중..." : "Day 삭제 테스트"}
          </Button>
        </div>
        {deleteDayError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {deleteDayError}
          </pre>
        )}
        {deleteDayResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(deleteDayResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>12. PATCH /api/itineraries/{"{id}"} (여행 수정)</ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={updateItineraryIdInput}
            onChange={(e) => setUpdateItineraryIdInput(e.target.value)}
            placeholder="itinerary id"
          />
          <TextInput
            value={updateTitleInput}
            onChange={(e) => setUpdateTitleInput(e.target.value)}
            placeholder="새 제목"
          />
          <TextInput
            value={updateStatusInput}
            onChange={(e) => setUpdateStatusInput(e.target.value)}
            placeholder="status"
          />
        </div>
        <Button
          variant="primary"
          onClick={handleTestUpdateItinerary}
          disabled={updateItineraryLoading}
        >
          {updateItineraryLoading ? "요청 중..." : "여행 수정 테스트"}
        </Button>
        {updateItineraryError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {updateItineraryError}
          </pre>
        )}
        {updateItineraryResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(updateItineraryResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>13. DELETE /api/itineraries/{"{id}"} (여행 삭제)</ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={deleteItineraryIdInput}
            onChange={(e) => setDeleteItineraryIdInput(e.target.value)}
            placeholder="itinerary id"
          />
          <Button
            variant="warning"
            onClick={handleTestDeleteItinerary}
            disabled={deleteItineraryLoading}
          >
            {deleteItineraryLoading ? "요청 중..." : "여행 삭제 테스트"}
          </Button>
        </div>
        {deleteItineraryError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {deleteItineraryError}
          </pre>
        )}
        {deleteItineraryResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(deleteItineraryResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>14. GET /api/logs/public</ComponentLabel>
        <Button variant="primary" onClick={handleTestGetPublicLogs} disabled={logsLoading}>
          {logsLoading ? "요청 중..." : "로그 둘러보기 테스트"}
        </Button>
        {logsError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {logsError}
          </pre>
        )}
        {logsResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(logsResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>15. POST /api/groups (여행 방 생성)</ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={groupNameInput}
            onChange={(e) => setGroupNameInput(e.target.value)}
            placeholder="방 이름"
          />
          <Button variant="primary" onClick={handleTestCreateGroup} disabled={groupLoading}>
            {groupLoading ? "요청 중..." : "방 생성 테스트"}
          </Button>
        </div>
        {groupError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {groupError}
          </pre>
        )}
        {groupResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(groupResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>16. GET /api/groups/me (내 방 목록)</ComponentLabel>
        <Button variant="primary" onClick={handleTestGetMyGroups} disabled={myGroupsLoading}>
          {myGroupsLoading ? "요청 중..." : "내 방 목록 조회 테스트"}
        </Button>
        {myGroupsError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {myGroupsError}
          </pre>
        )}
        {myGroupsResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(myGroupsResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          17. GET /api/groups/{"{groupId}"}/members (위 방 생성 결과의 id 붙여넣기)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={groupIdInput}
            onChange={(e) => setGroupIdInput(e.target.value)}
            placeholder="groupId 붙여넣기"
          />
          <Button variant="primary" onClick={handleTestGetMembers} disabled={membersLoading}>
            {membersLoading ? "요청 중..." : "참여자 조회 테스트"}
          </Button>
        </div>
        {membersError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {membersError}
          </pre>
        )}
        {membersResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(membersResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          18. POST /api/groups/join (초대코드로 방 참여 — 위 방 생성 결과의 inviteCode 붙여넣기)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={joinInviteCodeInput}
            onChange={(e) => setJoinInviteCodeInput(e.target.value)}
            placeholder="inviteCode 붙여넣기"
          />
          <Button variant="primary" onClick={handleTestJoinGroup} disabled={joinLoading}>
            {joinLoading ? "요청 중..." : "방 참여 테스트"}
          </Button>
        </div>
        {joinError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {joinError}
          </pre>
        )}
        {joinResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(joinResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          19. POST /api/itineraries/group/{"{groupId}"}/generate (그룹 일정 자동생성 — 위 방 생성
          결과의 groupId)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={groupGenGroupIdInput}
            onChange={(e) => setGroupGenGroupIdInput(e.target.value)}
            placeholder="groupId 붙여넣기"
          />
        </div>
        <div className="flex gap-2">
          <TextInput
            value={groupGenStartDateInput}
            onChange={(e) => setGroupGenStartDateInput(e.target.value)}
            placeholder="시작일 YYYY-MM-DD"
          />
          <TextInput
            value={groupGenEndDateInput}
            onChange={(e) => setGroupGenEndDateInput(e.target.value)}
            placeholder="종료일 YYYY-MM-DD"
          />
        </div>
        <Button
          variant="primary"
          onClick={handleTestGenerateGroupItinerary}
          disabled={groupGenLoading}
        >
          {groupGenLoading ? "요청 중..." : "그룹 일정 자동생성 테스트"}
        </Button>
        {groupGenError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {groupGenError}
          </pre>
        )}
        {groupGenResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(groupGenResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          20. POST /api/itineraries/vote-sessions/{"{sessionId}"}/votes (투표 참여 — 위 그룹 일정
          자동생성 결과의 voteSessionId)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={voteSessionIdInput}
            onChange={(e) => setVoteSessionIdInput(e.target.value)}
            placeholder="voteSessionId 붙여넣기"
          />
          <TextInput
            value={votePlanInput}
            onChange={(e) => setVotePlanInput(e.target.value)}
            placeholder="votedPlan (A/B/C)"
          />
          <Button variant="primary" onClick={handleTestCastVote} disabled={voteLoading}>
            {voteLoading ? "요청 중..." : "투표 테스트"}
          </Button>
        </div>
        {voteError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {voteError}
          </pre>
        )}
        {voteResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(voteResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          21. GET /api/itineraries/vote-sessions/{"{sessionId}"} (투표 현황 조회)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={voteStatusSessionIdInput}
            onChange={(e) => setVoteStatusSessionIdInput(e.target.value)}
            placeholder="voteSessionId 붙여넣기"
          />
          <Button variant="primary" onClick={handleTestGetVoteStatus} disabled={voteStatusLoading}>
            {voteStatusLoading ? "요청 중..." : "투표 현황 조회 테스트"}
          </Button>
        </div>
        {voteStatusError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {voteStatusError}
          </pre>
        )}
        {voteStatusResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(voteStatusResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          22. POST /api/itineraries/vote-sessions/{"{sessionId}"}/finalize (일정 확정 — 리더 전용,
          동률이면 selectedPlan 필수, freePass=true면 투표 결과 무시)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={finalizeSessionIdInput}
            onChange={(e) => setFinalizeSessionIdInput(e.target.value)}
            placeholder="voteSessionId 붙여넣기"
          />
          <TextInput
            value={finalizeSelectedPlanInput}
            onChange={(e) => setFinalizeSelectedPlanInput(e.target.value)}
            placeholder="selectedPlan (A/B/C, 선택)"
          />
        </div>
        <div className="flex gap-2">
          <TextInput
            value={finalizeTitleInput}
            onChange={(e) => setFinalizeTitleInput(e.target.value)}
            placeholder="여행 제목"
          />
          <TextInput
            value={finalizeStartDateInput}
            onChange={(e) => setFinalizeStartDateInput(e.target.value)}
            placeholder="시작일 YYYY-MM-DD"
          />
          <TextInput
            value={finalizeEndDateInput}
            onChange={(e) => setFinalizeEndDateInput(e.target.value)}
            placeholder="종료일 YYYY-MM-DD"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={finalizeFreePassInput}
            onChange={(e) => setFinalizeFreePassInput(e.target.checked)}
          />
          freePass (방장 프리패스로 즉시 확정)
        </label>
        <Button variant="primary" onClick={handleTestFinalize} disabled={finalizeLoading}>
          {finalizeLoading ? "요청 중..." : "일정 확정 테스트"}
        </Button>
        {finalizeError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {finalizeError}
          </pre>
        )}
        {finalizeResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(finalizeResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          23. PATCH /api/itineraries/days/{"{dayId}"}/optimize (일정 최적화 — 좌표 기반 동선 재정렬)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={optimizeDayIdInput}
            onChange={(e) => setOptimizeDayIdInput(e.target.value)}
            placeholder="day id 붙여넣기"
          />
          <Button variant="primary" onClick={handleTestOptimizeDay} disabled={optimizeLoading}>
            {optimizeLoading ? "요청 중..." : "일정 최적화 테스트"}
          </Button>
        </div>
        {optimizeError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {optimizeError}
          </pre>
        )}
        {optimizeResult !== null && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(optimizeResult, null, 2)}
          </pre>
        )}

        <ComponentLabel>
          24. GET /api/transit/arrival/bus (버스 실시간 도착정보 — 부산 정류소ID/노선번호 필요)
        </ComponentLabel>
        <div className="flex gap-2">
          <TextInput
            value={busArsIdInput}
            onChange={(e) => setBusArsIdInput(e.target.value)}
            placeholder="arsId (정류소 ID)"
          />
          <TextInput
            value={busRouteNoInput}
            onChange={(e) => setBusRouteNoInput(e.target.value)}
            placeholder="routeNo (노선번호, 예: 2012)"
          />
          <Button variant="primary" onClick={handleTestGetBusArrival} disabled={busLoading}>
            {busLoading ? "요청 중..." : "도착정보 테스트"}
          </Button>
        </div>
        {busError && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {busError}
          </pre>
        )}
        {busFetched && (
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs text-text-primary">
            {JSON.stringify(busResult, null, 2) ??
              "null (도착 예정 정보 없음 — arsId/routeNo 조합 확인)"}
          </pre>
        )}
      </section>

      <h1 className="font-bold text-2xl text-text-heading">컴포넌트 테스트</h1>

      {/* ════════════════════════════════ 공통 UI ════════════════════════════════ */}
      <SectionTitle>공통 UI</SectionTitle>

      <div className="flex flex-col gap-2">
        <ComponentLabel>Button</ComponentLabel>
        <Button variant="primary">primary</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="warning">warning</Button>
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>KakaoLoginButton</ComponentLabel>
        <KakaoLoginButton />
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>Card</ComponentLabel>
        <Card variant="glass-lg" className="p-4">
          <p className="text-md">glass-lg</p>
        </Card>
        <Card variant="glass-sm" className="p-4">
          <p className="text-md">glass-sm</p>
        </Card>
        <Card variant="white" className="p-4">
          <p className="text-md">white</p>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>FilterChips</ComponentLabel>
        <FilterChips
          options={["전체", "바다", "자연", "문화", "체험"] as const}
          selected={filterChip}
          onChange={setFilterChip}
          className="justify-center"
        />
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>CategoryChip</ComponentLabel>
        <div className="flex gap-2 flex-wrap">
          <CategoryChip category="sea" />
          <CategoryChip category="nature" />
          <CategoryChip category="culture" />
          <CategoryChip category="experience" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>StatusBadge</ComponentLabel>
        <div className="flex gap-2 flex-wrap">
          <StatusBadge status="completed" />
          <StatusBadge status="verify" />
          <StatusBadge status="uncollected" />
          <StatusBadge status="collected" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>SearchBar</ComponentLabel>
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>TextInput</ComponentLabel>
        <TextInput
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="2-6자 이내"
          maxLength={6}
        />
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>Counter</ComponentLabel>
        <Counter value={count} onChange={setCount} min={2} max={6} />
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>SpeechBubble</ComponentLabel>
        <SpeechBubble>말풍선 텍스트</SpeechBubble>
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>Modal (기본)</ComponentLabel>
        <Button variant="secondary" onClick={() => setShowBaseModal(true)}>
          Modal 열기
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>Modal / TimePicker</ComponentLabel>
        <Button variant="secondary" onClick={() => setShowTimePicker(true)}>
          TimePicker
        </Button>
        <Button variant="secondary" onClick={() => setShowDeleteModal(true)}>
          Modal — 삭제
        </Button>
        <Button variant="secondary" onClick={() => setShowAIModal(true)}>
          Modal — AI 최적화
        </Button>
        <Button variant="secondary" onClick={() => setShowLogout(true)}>
          Modal — 로그아웃
        </Button>
        <Button variant="secondary" onClick={() => setShowDeleteToast(true)}>
          Toast — 삭제
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>PlaceCard</ComponentLabel>
        <PlaceCard
          imageUrl={IMG}
          name="송도 해수욕장"
          category="sea"
          status="completed"
          onDelete={() => setShowDeleteModal(true)}
          onClick={() => setShowDetailSheet(true)}
        />
        <PlaceCard
          imageUrl={IMG}
          name="해운대 해수욕장"
          category="culture"
          status="verify"
          onDelete={() => setShowDeleteModal(true)}
        />
        <PlaceCard
          imageUrl={IMG}
          name="광안리 해수욕장"
          category="nature"
          status="pending"
          onDelete={() => setShowDeleteModal(true)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>PlaceInfoRow</ComponentLabel>
        <PlaceInfoRow
          items={[
            { icon: "🕐", label: "운영시간", value: "09:00 - 18:00" },
            { icon: "💰", label: "입장료", value: "무료" },
            { icon: "🏠", label: "주차", value: "공영 주차장" },
            { icon: "📞", label: "문의", value: "051-240-4000" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>PlaceDetailSheet</ComponentLabel>
        <Button variant="secondary" onClick={() => setShowDetailSheet(true)}>
          PlaceDetailSheet 열기
        </Button>
      </div>

      {/* ════════════════════════════════ 홈 탭 ════════════════════════════════ */}
      <SectionTitle>홈 탭</SectionTitle>

      {/* ════════════════════════════════ 일정 탭 ════════════════════════════════ */}
      <SectionTitle>일정 탭</SectionTitle>

      <div className="flex flex-col gap-2">
        <ComponentLabel>TransportCard</ComponentLabel>
        <TransportCard
          from="출발 장소"
          to="도착 장소"
          durationMin={30}
          cost={1500}
          isRecommended
          legs={[
            { type: "버스", routeName: "2012", from: "버스 출발 정류장", to: "버스 도착 정류장" },
            { type: "지하철", routeName: "1호선", from: "지하철 출발역", to: "지하철 도착역" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>PlaceSearchItem (추천순 — 이미지 있음)</ComponentLabel>
        <PlaceSearchItem
          imageUrl={IMG}
          name="감천 문화마을"
          category="culture"
          status="completed"
        />
        <PlaceSearchItem imageUrl={IMG} name="광안리 해수욕장" category="sea" status="pending" />
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>PlaceSearchItem (이름순 — 이미지 없음)</ComponentLabel>
        <PlaceSearchItem name="감천 문화마을" category="experience" />
        <PlaceSearchItem name="광안리 해수욕장" category="sea" />
        <PlaceSearchItem name="금정산성" category="nature" />
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>VotePlaceCard</ComponentLabel>
        <div className="flex gap-3">
          <VotePlaceCard imageUrl={IMG} name="송도 해수욕장" isSelected />
          <VotePlaceCard imageUrl={IMG2} name="광안리 해수욕장" />
          <VotePlaceCard imageUrl={IMG} name="해운대" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>LogCard</ComponentLabel>
        <LogCard
          imageUrl={IMG}
          placeName="송도 해수욕장"
          extraCount={3}
          author="은지미"
          duration="당일치기"
          date="2026.05.18"
          downloadCount={90}
        />
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>InviteCard</ComponentLabel>
        <InviteCard friends={MOCK_FRIENDS} total={6} onInvite={() => {}} />
      </div>

      <div className="flex flex-col gap-2">
        <ComponentLabel>ArrivalVerifyModal</ComponentLabel>
        <Button variant="secondary" onClick={() => setShowArrivalModal(true)}>
          ArrivalVerifyModal
        </Button>
      </div>

      <div className="h-10" />

      {/* ── 오버레이 ── */}
      <Modal
        isOpen={showBaseModal}
        onClose={() => setShowBaseModal(false)}
        icon="✦"
        title="모달 제목"
        description={"모달 설명이 들어오는 자리입니다.\n두 줄까지 가능해요."}
        confirmText="확인"
        cancelText="취소"
        onConfirm={() => setShowBaseModal(false)}
      />
      <TimePicker
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        hour={hour}
        minute={minute}
        onChange={(h, m) => {
          setHour(h);
          setMinute(m);
        }}
        onConfirm={() => setShowTimePicker(false)}
      />
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        icon="🗑"
        title="일정 삭제"
        description={"'송도 해수욕장'을(를)\n일정에서 삭제하시겠어요?"}
        confirmText="삭제하기"
        cancelText="취소"
        confirmVariant="warning"
        onConfirm={() => setShowDeleteModal(false)}
      >
        <span className="text-sm text-sub-gray text-center">* 삭제한 일정은 복구할 수 없어요.</span>
      </Modal>
      <Modal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        icon="✨"
        title="AI 일정 최적화"
        description={"관광지의 위치와 이동 경로를 분석해\n더 효율적인 여행 코스를 추천해드릴게요."}
        confirmText="최적화 시작"
        cancelText="취소"
        onConfirm={() => setShowAIModal(false)}
      >
        <div className="flex flex-col gap-1 text-md text-text-primary">
          <span>✨ 이동 동선 최적화</span>
          <span>⏰ 이동 시간 단축</span>
          <span>🚌 교통비 절약</span>
        </div>
      </Modal>
      <Modal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        icon="🚪"
        title="로그아웃"
        description={"정말 로그아웃 하시겠어요?\n다음 여행도 함께 해요!"}
        confirmText="로그아웃"
        cancelText="취소"
        onConfirm={() => setShowLogout(false)}
      >
        <span className="text-sm text-sub-gray text-center">* 언제든 다시 로그인할 수 있어요.</span>
      </Modal>
      <Toast
        isVisible={showDeleteToast}
        onHide={() => setShowDeleteToast(false)}
        message="여행이 삭제되었어요."
        variant="default"
      />
      <ArrivalVerifyModal
        spotId="3fa85f64-5717-4562-b3fc-2c963f66afa6"
        itineraryId="3fa85f64-5717-4562-b3fc-2c963f66afa6"
        isOpen={showArrivalModal}
        onClose={() => setShowArrivalModal(false)}
        placeName="송도 해수욕장"
        onVerify={() => setShowArrivalModal(false)}
        onLater={() => setShowArrivalModal(false)}
      />
      <PlaceDetailSheet
        isOpen={showDetailSheet}
        onClose={() => setShowDetailSheet(false)}
        imageUrl={IMG}
        name="송도 해수욕장"
        category="sea"
        status="pending"
        description="부산의 대표적인 해수욕장입니다."
        address="부산 서구 송도해변로 100"
        infoItems={[
          { icon: "🕐", label: "운영시간", value: "09:00 - 18:00" },
          { icon: "💰", label: "입장료", value: "무료" },
          { icon: "🏠", label: "주차", value: "공영 주차장" },
        ]}
        relatedLogs={[
          { imageUrl: IMG, userName: "은지미" },
          { imageUrl: IMG2, userName: "바니" },
          { imageUrl: IMG, userName: "쿠키" },
        ]}
        onViewMoreLogs={() => {}}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import CalendarIcon from "@/assets/icons/itinerary/calendar.svg?svgr";
import ClockIcon from "@/assets/icons/itinerary/clock.svg?svgr";
import FriendsIcon from "@/assets/icons/itinerary/friends.svg?svgr";
import HotelIcon from "@/assets/icons/itinerary/hotel.svg?svgr";
import TitleIcon from "@/assets/icons/itinerary/title.svg?svgr";
import NoIcon from "@/assets/icons/login-register/no.svg?svgr";
import YesIcon from "@/assets/icons/login-register/yes.svg?svgr";
import { Counter, Toast } from "@/components";
import {
  TripDateTimePicker,
  formatTripDateTime,
  parseTripDateTime,
  toApiDate,
} from "./TripDateTimePicker";
import { AccommodationSearchField } from "./AccommodationSearchField";
import type { AccommodationPlace } from "./AccommodationSearchField";
import { cn, getErrorMessage } from "@/shared/utils";
import { groupApi } from "@/shared/api/domains";

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now);
  start.setSeconds(0, 0);
  start.setMinutes(Math.ceil(start.getMinutes() / 10) * 10);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 17, 0);
  return { start: formatTripDateTime(start), end: formatTripDateTime(end) };
}

const DEFAULTS = getDefaultDates();

export function TripSetupForm() {
  const router = useRouter();
  const [tripName, setTripName] = useState("");
  const [startDate, setStartDate] = useState(DEFAULTS.start);
  const [endDate, setEndDate] = useState(DEFAULTS.end);
  const [friendCount, setFriendCount] = useState(2);
  const [accommodation, setAccommodation] = useState<AccommodationPlace | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { data: myGroups, isLoading: isGroupsLoading } = useQuery({
    queryKey: groupApi.keys.mine(),
    queryFn: groupApi.getMyGroups,
  });

  // 출발일이 도착일보다 뒤로 밀리면 도착일도 함께 당겨온다 — 이때 출발일과 정확히
  // 같은 값으로 맞추면 0박 여행이 되어버려서, 최소 1박(다음날)으로 보정한다.
  const handleStartDateChange = (next: string) => {
    setStartDate(next);
    const nextStart = parseTripDateTime(next);
    if (parseTripDateTime(endDate) <= nextStart) {
      const minEnd = new Date(nextStart);
      minEnd.setDate(minEnd.getDate() + 1);
      setEndDate(formatTripDateTime(minEnd));
    }
  };

  const handleInvalidDate = (reason: "min" | "max") => {
    setToastMessage(
      reason === "min" ? "지난 날짜/시간은 선택할 수 없어요." : "선택할 수 있는 기간을 벗어났어요.",
    );
  };

  const nameLength = tripName.length;
  const normalizedTripName = tripName.trim().toLocaleLowerCase("ko-KR");
  const isDuplicateName = Boolean(
    normalizedTripName &&
    myGroups?.some((group) => group.name?.trim().toLocaleLowerCase("ko-KR") === normalizedTripName),
  );
  const isNameValid = nameLength >= 2 && nameLength <= 15 && !isDuplicateName;
  const hasName = nameLength > 0;

  const getMaxEndDate = () => {
    const start = parseTripDateTime(startDate);
    const max = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 3, 23, 50);
    return formatTripDateTime(max);
  };

  const getTotalDays = () => {
    const start = parseTripDateTime(startDate);
    const end = parseTripDateTime(endDate);
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const nights = Math.max(0, Math.round((endDay.getTime() - startDay.getTime()) / 86400000));
    return nights + 1;
  };

  const handleInvite = async () => {
    if (!isNameValid || isCreating || isGroupsLoading) {
      if (isDuplicateName) setToastMessage("이미 사용 중인 여행명이에요.");
      return;
    }
    setIsCreating(true);
    try {
      const group = await groupApi.createGroup({ name: tripName, maxMembers: friendCount });
      const startDT = parseTripDateTime(startDate);
      const endDT = parseTripDateTime(endDate);
      const pad2 = (n: number) => String(n).padStart(2, "0");
      const params = new URLSearchParams({
        role: "host",
        count: String(friendCount),
        days: String(getTotalDays()),
        groupId: group.id ?? "",
        inviteCode: group.inviteCode ?? "",
        name: group.name ?? tripName,
        startDate: toApiDate(startDate),
        endDate: toApiDate(endDate),
        startTime: `${pad2(startDT.getHours())}:${pad2(startDT.getMinutes())}`,
        endTime: `${pad2(endDT.getHours())}:${pad2(endDT.getMinutes())}`,
        ...(accommodation
          ? {
              accommodation: accommodation.name,
              accommodationAddress: accommodation.address,
              ...(accommodation.lat != null ? { accommodationLat: String(accommodation.lat) } : {}),
              ...(accommodation.lng != null ? { accommodationLng: String(accommodation.lng) } : {}),
            }
          : {}),
      });
      router.push(`/itinerary/trips/invite?${params.toString()}`);
    } catch (error) {
      setToastMessage(getErrorMessage(error, "여행을 만들지 못했어요. 다시 시도해주세요."));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="-mx-6 -mt-8 flex flex-col gap-5 rounded-tl-[40px] rounded-tr-[40px] bg-white px-8 pt-10 pb-6">
      {/* 여행명 */}
      <section>
        <div className="flex items-center gap-1.5 mb-[10px]">
          <TitleIcon width={14} height={14} className="-translate-y-[1px]" aria-hidden />
          <span className="font-ssurround font-bold text-md text-text-heading">여행명</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={tripName}
            onChange={(e) => setTripName(e.target.value.slice(0, 15))}
            placeholder="여행 이름을 입력해주세요"
            className={cn(
              "w-full rounded-[10px] border py-[10px] pl-[15px] pr-10",
              "font-paperlogy font-medium text-xs text-sub-deepgray",
              "placeholder:font-paperlogy placeholder:font-medium placeholder:text-xs placeholder:text-sub-gray",
              "outline-none transition-colors",
              hasName ? "border-main-blue" : "border-sub-gray",
            )}
          />
          {hasName && (
            <div className="absolute right-[10px] top-1/2 -translate-y-1/2 flex items-center justify-center">
              {isNameValid ? (
                <YesIcon width={14} height={14} className="fill-sub-deepblue" aria-hidden />
              ) : (
                <button
                  type="button"
                  onClick={() => setTripName("")}
                  aria-label="지우기"
                  className="flex items-center justify-center p-0 leading-none"
                >
                  <NoIcon width={14} height={14} className="fill-sub-coral" aria-hidden />
                </button>
              )}
            </div>
          )}
        </div>
        {hasName && (
          <div className="mt-[6px] flex h-[17px] items-center justify-between px-[8px] font-paperlogy text-xs font-semibold">
            <p className="text-sub-coral">
              {isDuplicateName ? "이미 사용 중인 여행명이에요." : ""}
            </p>
            <p className="text-sub-gray">{nameLength}/15</p>
          </div>
        )}
      </section>

      {/* 여행기간 */}
      <section>
        <div className="flex items-center gap-1.5 mb-[10px]">
          <CalendarIcon width={14} height={14} aria-hidden />
          <span className="font-ssurround font-bold text-md text-text-heading">여행기간</span>
        </div>
        <div className="flex flex-col gap-3 rounded-[20px] border border-main-blue/20 bg-gradient-to-b from-system-glassfrom to-system-glassto px-[28px] py-[16px]">
          <div className="flex items-center gap-[14px]">
            <div className="flex items-center gap-[4px]">
              <ClockIcon width={12} height={12} aria-hidden />
              <span className="font-paperlogy font-semibold text-sm text-text-primary">
                시작 시간
              </span>
            </div>
            <TripDateTimePicker
              value={startDate}
              onChange={handleStartDateChange}
              minValue={formatTripDateTime(new Date())}
              onInvalidSelect={handleInvalidDate}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-[14px]">
            <div className="flex items-center gap-[4px]">
              <ClockIcon width={12} height={12} aria-hidden />
              <span className="font-paperlogy font-semibold text-sm text-text-primary">
                종료 시간
              </span>
            </div>
            <TripDateTimePicker
              value={endDate}
              onChange={setEndDate}
              minValue={startDate}
              maxValue={getMaxEndDate()}
              onInvalidSelect={handleInvalidDate}
              className="flex-1"
            />
          </div>
        </div>
      </section>

      {/* 숙소 */}
      <section>
        <div className="flex items-center gap-1.5 mb-[10px]">
          <HotelIcon width={14} height={14} aria-hidden />
          <span className="font-ssurround font-bold text-md text-text-heading">숙소</span>
          <span className="font-paperlogy font-medium text-xs text-sub-gray">(선택)</span>
        </div>
        <AccommodationSearchField value={accommodation} onChange={setAccommodation} />
      </section>

      {/* 친구 수 */}
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FriendsIcon width={14} height={14} aria-hidden />
          <span className="font-ssurround font-bold text-md text-text-heading">친구 수</span>
        </div>
        <Counter value={friendCount} onChange={setFriendCount} min={2} max={6} />
      </section>

      {/* 친구 초대하기 버튼 */}
      <button
        type="button"
        onClick={handleInvite}
        disabled={!isNameValid || isCreating || isGroupsLoading}
        className={cn(
          "h-[40px] w-full rounded-[10px] font-ssurround font-bold text-sm transition-colors",
          isNameValid
            ? "bg-main-blue text-white active:opacity-80"
            : "border-2 border-main-blue text-main-blue bg-transparent",
        )}
      >
        {isCreating ? "생성 중..." : "친구 초대하기"}
      </button>

      <Toast
        isVisible={toastMessage !== null}
        onHide={() => setToastMessage(null)}
        message={toastMessage ?? ""}
        variant="warning"
      />
    </div>
  );
}

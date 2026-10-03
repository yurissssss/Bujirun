import { useState } from "react";
import Image from "next/image";
import calendarIcon from "@/assets/icons/itinerary/calendar.svg?url";
import clockIcon from "@/assets/icons/itinerary/clock.svg?url";
import PencilIcon from "@/assets/icons/itinerary/pencil.svg?svgr";
import titleIcon from "@/assets/icons/itinerary/title.svg?url";
import { Card, Modal, TextInput, Toast } from "@/components";
import {
  formatTripDateTime,
  getMinTripEndDateTime,
  parseTripDateTime,
  TripDateTimePicker,
} from "./TripDateTimePicker";
import type { Trip } from "./TripCard";

interface TripEditModalProps {
  isOpen: boolean;
  trip: Trip;
  onClose: () => void;
  onConfirm: (updated: Trip) => void;
}

// 시각이 저장돼 있지 않은 여행은 이 모달이 시작/종료를 모두 "00:00"으로 보여준다
// (trips/page.tsx의 toTripDate가 빈 시간을 00:00으로 대체한다). 즉 여기서의 00:00은
// 사용자가 고른 자정이 아니라 "시간 미지정"이라는 뜻이다.
const isTimeUnspecified = (value: string) => (value.split(" ")[1] ?? "00:00") === "00:00";

// 시작·종료가 둘 다 미지정이면 "종료는 시작보다 뒤" 하한 보정/차단을 건너뛴다.
// 당일치기(숙박 0일) 여행은 minEndDate가 시작 + 1시간이라, 둘 다 00:00인 여행에서 이
// 가드가 그대로 돌면 이름만 고치려는 사용자에게도 종료가 01:00으로 밀려 보이고, 안내대로
// 한 번 더 저장하면 endTime=01:00이 실제로 저장된다. scheduleUtils.boundMinutes는 00:00만
// "미지정"으로 걸러내므로 01:00은 진짜 여행 종료 경계로 취급되고, 그러면 마지막 날 일정
// 시각이 전부 그 근처로 뭉개진다 — 레포 곳곳에 주석으로 남아 있는 "자정으로 덮지 않기"
// 방어가 우회되는 셈이다. 한쪽이라도 사용자가 실제 시각을 고른 경우에는 가드가 그대로
// 동작해야 한다(20:00 시작 / 18:00 종료 같은 저장을 막는 원래 의도).
const shouldSkipEndTimeGuard = (start: string, end: string) =>
  isTimeUnspecified(start) && isTimeUnspecified(end);

export function TripEditModal({ isOpen, trip, onClose, onConfirm }: TripEditModalProps) {
  const [name, setName] = useState(trip.name);
  const [startDate, setStartDate] = useState(() =>
    formatTripDateTime(parseTripDateTime(trip.startDate)),
  );
  const [endDate, setEndDate] = useState(() => formatTripDateTime(parseTripDateTime(trip.endDate)));
  // 처음 생성한 여행의 숙박 수만 고정한다. 시작/종료 시간은 각각 독립적으로 바꿀 수 있고,
  // 날짜를 옮길 때만 반대쪽 날짜가 같은 숙박 수만큼 따라간다.
  const [originalNights] = useState(() => {
    const initialStart = parseTripDateTime(trip.startDate);
    const initialEnd = parseTripDateTime(trip.endDate);
    const startDay = new Date(
      initialStart.getFullYear(),
      initialStart.getMonth(),
      initialStart.getDate(),
    );
    const endDay = new Date(initialEnd.getFullYear(), initialEnd.getMonth(), initialEnd.getDate());
    return Math.max(0, Math.round((endDay.getTime() - startDay.getTime()) / 86_400_000));
  });
  const minStartDate = formatTripDateTime(new Date());
  const minEndDate = getMinTripEndDateTime(startDate, originalNights);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartDateChange = (nextStartDate: string) => {
    const nextStart = parseTripDateTime(nextStartDate);
    const currentEnd = parseTripDateTime(endDate);
    const nextEnd = new Date(
      nextStart.getFullYear(),
      nextStart.getMonth(),
      nextStart.getDate() + originalNights,
      currentEnd.getHours(),
      currentEnd.getMinutes(),
    );

    // 당일치기는 시작을 뒤로 밀어도 종료 날짜가 같은 날이라, 종료 시각을 그대로 이어받으면
    // 시작 > 종료가 된다(종료 18:00인 여행의 시작을 20:00으로). 종료 픽커의 clamp는 사용자가
    // 종료 픽커를 직접 건드릴 때만 돌고 백엔드에도 start < end 검증이 없어서, 이 상태로
    // 저장되면 그 뒤로는 시간 수정이 전면 불가해진다. 종료를 하한까지 뒤로 밀되, 사용자가
    // 정해둔 시각을 조용히 바꾸지 않도록 화면(종료 픽커)에 반영하고 토스트로도 알린다.
    const earliestEnd = parseTripDateTime(getMinTripEndDateTime(nextStartDate, originalNights));
    const shouldPushEnd =
      !shouldSkipEndTimeGuard(nextStartDate, formatTripDateTime(nextEnd)) &&
      nextEnd.getTime() < earliestEnd.getTime();

    setStartDate(nextStartDate);
    setEndDate(formatTripDateTime(shouldPushEnd ? earliestEnd : nextEnd));
    if (shouldPushEnd) {
      setToastMessage("시작 시간이 더 늦어져서 종료 시간도 같이 옮겼어요.");
    }
  };

  const handleConfirm = () => {
    // 마지막 방어선. 이미 시작 > 종료로 저장돼 있던 여행을 열어 이름만 고친 경우처럼
    // 픽커를 건드리지 않아 clamp도 위의 보정도 돌지 않은 채로 저장될 수 있다. 이때도 몰래
    // 고쳐서 저장하지 않고, 보정한 종료 시각을 화면에 보여준 뒤 한 번 더 확인받는다.
    const earliestEnd = parseTripDateTime(minEndDate);
    if (
      !shouldSkipEndTimeGuard(startDate, endDate) &&
      parseTripDateTime(endDate).getTime() < earliestEnd.getTime()
    ) {
      setEndDate(formatTripDateTime(earliestEnd));
      setToastMessage("종료 시간을 시작 시간 뒤로 맞췄어요. 확인 후 다시 저장해주세요.");
      return;
    }

    onConfirm({ ...trip, name, startDate, endDate });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<PencilIcon width={25} height={25} className="icon-deepblue" aria-hidden />}
      title="일정 정보 수정"
      titleClassName="font-bold text-xl text-text-heading"
      childrenVariant="plain"
      childrenClassName="flex flex-col gap-6 items-start"
      cancelText="취소"
      confirmText="수정하기"
      onConfirm={handleConfirm}
    >
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <Image src={titleIcon} alt="" width={14} height={14} aria-hidden />
          <span className="text-md font-semibold text-text-heading">여행명</span>
        </div>
        <TextInput
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="여행 이름을 입력하세요"
          className="!h-[34px] w-full !rounded-lg !px-2.5 !text-xs !font-medium !text-text-primary"
        />
      </div>

      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Image src={calendarIcon} alt="" width={14} height={14} aria-hidden />
          <span className="text-md font-semibold text-text-heading">여행 기간</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <DateTimeLabel label="시작 시간" />
            <TripDateTimePicker
              value={startDate}
              onChange={handleStartDateChange}
              minValue={minStartDate}
              onInvalidSelect={() => setToastMessage("지난 날짜/시간은 선택할 수 없어요.")}
              className="flex-1 w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <DateTimeLabel label="종료 시간" />
            <TripDateTimePicker
              value={endDate}
              onChange={setEndDate}
              minValue={minEndDate}
              lockDate
              onInvalidSelect={() =>
                setToastMessage("종료 시간은 시작 시간보다 뒤여야 해서 자동으로 맞췄어요.")
              }
              className="flex-1 w-auto"
            />
          </div>
        </div>

        <Card variant="glass-sm" className="mt-5 w-full rounded-lg px-3 py-2">
          <p className="text-center text-sm font-medium text-sub-darkgray break-keep">
            * 처음 정한 여행 일수는 그대로 유지돼요. 시작 날짜를 옮기면 종료 날짜가 자동으로
            변경되고, 시간은 각각 바꿀 수 있어요.
            {originalNights === 0 && " 당일 여행은 종료 시간이 시작 시간보다 뒤로 유지돼요."}
          </p>
        </Card>
      </div>

      <Toast
        isVisible={toastMessage !== null}
        onHide={() => setToastMessage(null)}
        message={toastMessage ?? ""}
        variant="warning"
      />
    </Modal>
  );
}

function DateTimeLabel({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Image src={clockIcon} alt="" width={11} height={11} aria-hidden />
      <span className="text-xs font-semibold text-text-primary">{label}</span>
    </div>
  );
}

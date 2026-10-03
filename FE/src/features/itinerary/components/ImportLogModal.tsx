"use client";

import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import calendarPlusIcon from "@/assets/icons/itinerary/calendar-plus.svg?url";

interface ImportLogModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  authorNickname?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function ImportLogModal({
  isOpen,
  isLoading = false,
  authorNickname,
  onClose,
  onConfirm,
}: ImportLogModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<Image src={calendarPlusIcon} alt="" width={25} height={25} aria-hidden />}
      title="내 일정에 추가"
      titleClassName="tracking-[0.5px]"
      description={
        authorNickname
          ? `'${authorNickname}'님의 여행 일정을\n내 일정에 추가하시겠어요?`
          : `이 여행 일정을\n내 일정에 추가하시겠어요?`
      }
      childrenVariant="card"
      hideActions
      footer={
        <div className="flex w-full gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-[40px] disabled:opacity-60"
          >
            취소
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-[40px] disabled:opacity-60"
          >
            {isLoading ? "추가 중" : "추가하기"}
          </Button>
        </div>
      }
    >
      <p className="text-center font-medium text-sub-darkgray break-keep">
        * 불러온 일정 기간만큼 앞에서부터 채워지고, 겹치는 날짜의 기존 일정은 대체돼요.
      </p>
    </Modal>
  );
}

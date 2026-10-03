"use client";

import { useState } from "react";
import { Button, Modal } from "@/components";

interface ReceiptPromptModalProps {
  isOpen: boolean;
  tripName: string;
  onClose: () => void;
  onConfirm: () => void;
  onSkip: (dontAskAgain: boolean) => void;
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 fill-sub-deepblue" aria-hidden="true">
      <path d="M14.5,7h-5a1.5,1.5,0,0,0,0,3h5a1.5,1.5,0,0,0,0-3Z" />
      <path d="M12.5,12h-3a1.5,1.5,0,0,0,0,3h3a1.5,1.5,0,0,0,0-3Z" />
      <path d="M15.5,0h-7A5.506,5.506,0,0,0,3,5.5v17a1.5,1.5,0,0,0,2.171,1.342L8.453,22.2l2.8,1.6a1.5,1.5,0,0,0,1.488,0l2.8-1.6,3.282,1.642A1.5,1.5,0,0,0,21,22.5V5.5A5.506,5.506,0,0,0,15.5,0ZM18,20.073l-1.83-.915a1.5,1.5,0,0,0-1.415.039L12,20.772,9.245,19.2a1.5,1.5,0,0,0-1.415-.039L6,20.073V5.5A2.5,2.5,0,0,1,8.5,3h7A2.5,2.5,0,0,1,18,5.5Z" />
    </svg>
  );
}

export function ReceiptPromptModal({
  isOpen,
  tripName,
  onClose,
  onConfirm,
  onSkip,
}: ReceiptPromptModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const closeModal = () => {
    setDontAskAgain(false);
    onClose();
  };

  const handleSkip = () => {
    onSkip(dontAskAgain);
    setDontAskAgain(false);
  };

  const handleConfirm = () => {
    setDontAskAgain(false);
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      icon={<ReceiptIcon />}
      title="아직 영수증을 발행하지 않았어요"
      description={
        <div className="flex flex-col items-center gap-3">
          <span className="font-semibold text-sub-deepblue">{tripName}</span>
          <p className="text-center text-sm text-text-primary">
            여행의 기분과 테마를 기록하고
            <br />
            영수증을 발행하시겠어요?
          </p>
        </div>
      }
      childrenVariant="plain"
      hideActions
      footer={
        <div className="flex w-full gap-3">
          <Button type="button" variant="secondary" className="w-full" onClick={handleSkip}>
            아니요
          </Button>

          <Button type="button" variant="primary" className="w-full" onClick={handleConfirm}>
            영수증 발행
          </Button>
        </div>
      }
    >
      <label className="flex cursor-pointer items-center justify-center gap-1.5 text-sm font-semibold text-sub-deepgray transition-colors has-[:checked]:text-sub-darkblue">
        {" "}
        <input
          type="checkbox"
          checked={dontAskAgain}
          onChange={(event) => setDontAskAgain(event.target.checked)}
          className="peer sr-only"
        />
        <span className="flex size-4 items-center justify-center rounded-[5px] border-1 border-sub-deepgray bg-main-white transition-colors peer-checked:border-main-blue peer-checked:bg-main-blue peer-checked:[&>svg]:opacity-100">
          <svg
            viewBox="0 0 12 10"
            className="size-[9px] fill-none stroke-main-white opacity-0 transition-opacity"
            aria-hidden="true"
          >
            <path
              d="M1 5L4.5 8.5L11 1.5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        다시 묻지 않기
      </label>
    </Modal>
  );
}

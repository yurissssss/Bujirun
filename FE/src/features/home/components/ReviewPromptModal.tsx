"use client";

import { useState } from "react";
import { Button, Card, Modal } from "@/components";
import { cn } from "@/shared/utils";
import { MoodOptions, type MoodValue } from "./MoodOptions";

import type { ReviewPromptSubmitData } from "@/features/receipt/types/receipt";

interface ReviewPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ReviewPromptSubmitData) => void;
  tripTitle: string;
}

function ReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 fill-sub-deepblue" aria-hidden="true">
      <path d="M24,19c0,.553-.447,1-1,1h-4c-.553,0-1-.447-1-1s.447-1,1-1h4c.553,0,1,.447,1,1ZM8.25,6c-.69,0-1.25,.56-1.25,1.25s.56,1.25,1.25,1.25,1.25-.56,1.25-1.25-.56-1.25-1.25-1.25Zm-3.5,2.5c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25-1.25,.56-1.25,1.25,.56,1.25,1.25,1.25Zm10.25,7.5c-.553,0-1,.447-1,1v1H1c-.552,0-1,.447-1,1s.448,1,1,1H14v1c0,.553,.447,1,1,1s1-.447,1-1v-4c0-.553-.447-1-1-1Zm4.25-10c-.69,0-1.25,.56-1.25,1.25s.56,1.25,1.25,1.25,1.25-.56,1.25-1.25-.56-1.25-1.25-1.25Zm-3.5,2.5c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25-1.25,.56-1.25,1.25,.56,1.25,1.25,1.25Zm1.75,6.5c-2.317,0-4.349-1.222-5.5-3.052-1.151,1.83-3.183,3.052-5.5,3.052-3.584,0-6.5-2.916-6.5-6.5S2.916,2,6.5,2c2.317,0,4.349,1.222,5.5,3.052,1.151-1.83,3.183-3.052,5.5-3.052,3.584,0,6.5,2.916,6.5,6.5s-2.916,6.5-6.5,6.5Zm-6.5-6.5c0-2.481-2.019-4.5-4.5-4.5S2,6.019,2,8.5s2.019,4.5,4.5,4.5,4.5-2.019,4.5-4.5Zm11,0c0-2.481-2.019-4.5-4.5-4.5s-4.5,2.019-4.5,4.5,2.019,4.5,4.5,4.5,4.5-2.019,4.5-4.5Zm-3.439,1.061c-.584,.584-1.537,.584-2.121,0-.391-.391-1.023-.391-1.414,0s-.391,1.023,0,1.414c.683,.683,1.578,1.023,2.475,1.023s1.792-.341,2.475-1.023c.391-.391,.391-1.023,0-1.414s-1.023-.391-1.414,0Zm-14.536,.465c-.39,.391-.39,1.024,0,1.414,.39,.391,1.023,.391,1.414,0,.565-.566,1.555-.566,2.12,0,.195,.195,.452,.293,.708,.293s.512-.098,.707-.293c.391-.39,.391-1.023,0-1.414-1.321-1.322-3.629-1.322-4.95,0Z" />
    </svg>
  );
}

export function ReviewPromptModal({
  isOpen,
  onClose,
  onConfirm,
  tripTitle,
}: ReviewPromptModalProps) {
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
  const [theme, setTheme] = useState("");

  const trimmedTheme = theme.trim();
  const isSubmitDisabled = !selectedMood || trimmedTheme.length === 0;

  const handleConfirm = () => {
    if (!selectedMood || trimmedTheme.length === 0) return;

    onConfirm({ mood: selectedMood, theme: trimmedTheme });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<ReviewIcon />}
      title="여행 어떠셨나요?"
      cancelText="취소"
      confirmText="영수증 발행"
      onCancel={onClose}
      onConfirm={handleConfirm}
      childrenVariant="plain"
      className="max-w-[342px] px-8 pb-10 pt-12 gap-7"
      hideActions
      footer={
        <div className="mt-1 flex w-full gap-6">
          <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
            취소
          </Button>
          <Button
            type="button"
            variant="primary"
            className={cn(
              "w-full",
              isSubmitDisabled && "cursor-not-allowed bg-sub-lightgray hover:bg-sub-lightgray",
            )}
            disabled={isSubmitDisabled}
            onClick={handleConfirm}
          >
            영수증 발행
          </Button>
        </div>
      }
    >
      <div className="w-full bg-receipt-bg mb-7 px-7 py-5">
        <div className="grid grid-cols-[70px_1fr] items-center gap-y-2 font-courierprime text-lg text-text-receipt-main">
          <span className="font-bold tracking-wide">TITLE</span>
          <span className="font-semibold text-md">{tripTitle}</span>

          <span className="font-bold tracking-wide">MOOD</span>
          <MoodOptions selectedMood={selectedMood} onSelect={setSelectedMood} />

          <span className="font-bold tracking-wide">THEME</span>
          <input
            value={theme}
            maxLength={12}
            aria-label="여행 테마"
            className="h-7 w-full border-b border-sub-darkgray bg-transparent px-1 text-md font-semibold outline-none placeholder:text-sub-gray"
            placeholder="예: 바다. 산책"
            onChange={(e) => setTheme(e.target.value)}
          />
        </div>
      </div>

      <Card variant="glass-sm" className="w-full rounded-lg px-3 py-2">
        <p className="text-center text-sm font-medium text-sub-darkgray">
          * 여행 기록을 담은 여행 영수증을 발행해드릴게요!
        </p>
      </Card>
    </Modal>
  );
}

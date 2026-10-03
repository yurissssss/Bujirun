"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/shared/utils";
import { TextInput } from "@/components/ui/TextInput";

interface ReportLogModalProps {
  isOpen: boolean;
  spots: ReportableSpot[];
  onClose: () => void;
  onConfirm: () => void;
}

interface ReportableSpot {
  spotId: string;
  name: string;
  photoIds: string[];
}

const REPORT_REASONS = [
  "부적절한 사진이에요.",
  "개인정보가 포함되어 있어요.",
  "관광지와 관련 없는 사진이에요.",
  "기타",
] as const;

type ReportReason = (typeof REPORT_REASONS)[number];

export function ReportLogModal({ isOpen, spots, onClose, onConfirm }: ReportLogModalProps) {
  const [selectedSpotIds, setSelectedSpotIds] = useState<string[]>([]);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [otherReason, setOtherReason] = useState("");
  const otherReasonRef = useRef<HTMLDivElement>(null);

  const [isSpotOpen, setIsSpotOpen] = useState(true);
  const [isReasonOpen, setIsReasonOpen] = useState(false);

  const handleSpotToggle = (spotId: string) => {
    setSelectedSpotIds((prev) =>
      prev.includes(spotId) ? prev.filter((id) => id !== spotId) : [...prev, spotId],
    );
  };

  const handleClose = () => {
    setSelectedSpotIds([]);
    setSelectedReason(null);
    setIsSpotOpen(true);
    setIsReasonOpen(false);
    setOtherReason("");
    onClose();
  };

  const handleConfirm = () => {
    if (
      selectedSpotIds.length === 0 ||
      !selectedReason ||
      (selectedReason === "기타" && !otherReason.trim())
    )
      return;

    onConfirm();
    handleClose();
  };

  const isConfirmDisabled =
    selectedSpotIds.length === 0 ||
    !selectedReason ||
    (selectedReason === "기타" && !otherReason.trim());

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="사진 신고하기"
      confirmVariant="warning"
      confirmDisabled={isConfirmDisabled}
      childrenVariant="card"
      cancelText="취소"
      confirmText="신고하기"
      onConfirm={handleConfirm}
    >
      <div className="flex flex-col gap-4 max-h-83 overflow-y-auto">
        {/* 신고할 관광지 */}
        <section>
          <button
            type="button"
            onClick={() => setIsSpotOpen((prev) => !prev)}
            className="flex w-full items-center justify-between py-1 text-left"
          >
            <span className="font-ssurround text-sm text-text-heading">신고할 관광지 사진</span>

            <ChevronDown
              className={cn(
                "size-5 text-sub-gray transition-transform",
                isSpotOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          {isSpotOpen && (
            <div className="mt-3">
              {spots.length === 0 ? (
                <div className="flex min-h-10 items-center justify-center rounded-xl bg-main-white px-4 py-4">
                  <p className="text-center text-sm font-medium text-sub-darkgray">
                    신고할 수 있는 관광지 사진이 없어요.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {spots.map((spot) => {
                    const isSelected = selectedSpotIds.includes(spot.spotId);

                    return (
                      <button
                        key={spot.spotId}
                        type="button"
                        onClick={() => handleSpotToggle(spot.spotId)}
                        className={cn(
                          "flex w-full items-center justify-start rounded-xl border px-4 py-2.5 gap-3 text-sm font-medium transition-colors",
                          isSelected
                            ? "border-sub-coral bg-system-coralbg text-sub-coral"
                            : "border-sub-lightgray bg-main-white text-text-primary",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border",
                            isSelected
                              ? "border-sub-coral bg-sub-coral text-main-white"
                              : "border-sub-lightgray",
                          )}
                          aria-hidden
                        >
                          {isSelected && <Check className="size-3" strokeWidth={3} />}
                        </span>

                        <span>{spot.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 신고 사유 */}
        <section className="border-t border-sub-lightgray pt-4">
          <button
            type="button"
            onClick={() => setIsReasonOpen((prev) => !prev)}
            className="flex w-full items-center justify-between py-1 text-left"
          >
            <span className="font-ssurround text-sm text-text-heading">신고 사유</span>

            <ChevronDown
              className={cn(
                "size-5 text-sub-gray transition-transform",
                isReasonOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          {isReasonOpen && (
            <div className="mt-3 space-y-1">
              {REPORT_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;

                return (
                  <div key={reason}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReason(reason);

                        if (reason !== "기타") {
                          setOtherReason("");
                          return;
                        }

                        requestAnimationFrame(() => {
                          otherReasonRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest",
                          });
                        });
                      }}
                      className={
                        "flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium"
                      }
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border",
                          isSelected ? "border-sub-coral" : "border-sub-lightgray",
                        )}
                        aria-hidden
                      >
                        {isSelected && <span className="size-2.5 rounded-full bg-sub-coral" />}
                      </span>

                      <span className={cn(isSelected ? "text-sub-coral" : "text-text-primary")}>
                        {reason}
                      </span>
                    </button>

                    {reason === "기타" && isSelected && (
                      <div ref={otherReasonRef} className="px-2 pb-2 pt-1">
                        <TextInput
                          value={otherReason}
                          onChange={(event) => setOtherReason(event.target.value)}
                          placeholder="신고 사유를 입력해주세요."
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}

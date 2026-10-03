"use client";
import { useState } from "react";

import { Button, Modal } from "@/components";
import { TransportDetail } from "@/features/home/components/TransportDetail";
import { TransportSelectContent } from "@/features/home/components/TransportSelectContent";
import { getSelectedTransportOption } from "@/features/home/data/sampleTransport";
import type { TransportGroup, TransportOption } from "@/features/home/types/transport";

interface TransportDetailModalProps {
  isOpen: boolean;
  transportGroup: TransportGroup;
  selectedOptionId?: string;
  onClose: () => void;
  // 사용자가 목록에서 옵션을 고른 시점이 아니라, "확인" 버튼을 눌러 최종 확정한 시점에만
  // 호출된다. 반환값이 false면(예: 백엔드 반영 실패) 모달을 닫지 않고 그대로 둔다 —
  // 실패해도 모달이 닫혀버려서 사용자가 실패 사실을 못 보고 놓치는 문제를 막기 위함.
  onChange?: (option: TransportOption) => void | boolean | Promise<void | boolean>;
  onKakaoMapClick?: () => void;
}

export function TransportDetailModal({
  isOpen,
  transportGroup,
  selectedOptionId,
  onClose,
  onChange,
  onKakaoMapClick,
}: TransportDetailModalProps) {
  const [mode, setMode] = useState<"detail" | "select">("detail");
  const [hasChanged, setHasChanged] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [localSelectedOptionId, setLocalSelectedOptionId] = useState(
    selectedOptionId ?? transportGroup.selectedOptionId,
  );

  // 모달 인스턴스가 열림/닫힘과 무관하게 계속 유지되므로(isOpen만 토글),
  // 매번 새로 열릴 때 이전 경로/선택에서 남은 상태가 이어지지 않도록 초기화한다.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(isOpen);
    setMode("detail");
    setHasChanged(false);
    setIsConfirming(false);
    setLocalSelectedOptionId(selectedOptionId ?? transportGroup.selectedOptionId);
  } else if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
  }

  const selectedOption = getSelectedTransportOption(transportGroup, localSelectedOptionId);

  const handleClose = () => {
    // 확정 처리(onChange) 진행 중에는 배경 클릭/ESC로 모달이 먼저 닫혀서 "확정 안 했는데
    // 사라졌다"고 느끼는 일이 없도록, 처리 중에는 닫기를 막는다.
    if (isConfirming) return;
    setMode("detail");
    setHasChanged(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (hasChanged) {
      // 실제 반영(API 호출 등)은 여기, 사용자가 "확인"을 눌렀을 때만 일어난다.
      // 목록에서 옵션을 고르는 시점에는 미리보기만 하고 아무것도 반영하지 않는다.
      setIsConfirming(true);
      const result = await onChange?.(selectedOption);
      setIsConfirming(false);
      if (result !== false) {
        setMode("detail");
        setHasChanged(false);
        onClose();
      }
      return;
    }

    setMode("select");
  };

  const handleSelect = (option: TransportOption) => {
    setLocalSelectedOptionId(option.id);
    setHasChanged(true);
    setMode("detail");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="!gap-3"
      childrenVariant="plain"
      hideActions
      footer={
        mode === "detail" ? (
          <div className="mt-1 flex w-full justify-center gap-6">
            <Button
              type="button"
              variant="secondary"
              className="min-w-[100px] w-auto px-5"
              onClick={handleClose}
              disabled={isConfirming}
            >
              닫기
            </Button>
            <Button
              type="button"
              variant="primary"
              className="min-w-[100px] w-auto px-5"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? "처리 중..." : hasChanged ? "확인" : "변경"}
            </Button>
          </div>
        ) : undefined
      }
    >
      {mode === "detail" ? (
        <TransportDetail
          transportGroup={transportGroup}
          selectedOption={selectedOption}
          onKakaoMapClick={onKakaoMapClick}
        />
      ) : (
        <TransportSelectContent
          transportGroup={transportGroup}
          selectedOptionId={selectedOption.id}
          onSelect={handleSelect}
          onKakaoMapClick={onKakaoMapClick}
        />
      )}
    </Modal>
  );
}

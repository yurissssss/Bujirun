"use client";

import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import leaveIcon from "@/assets/icons/mypage/leave-coral.png";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const WITHDRAW_ITEMS = [
  "회원 정보 및 개인식별 정보가 삭제됩니다.",
  "여행 기록은 비공개 처리됩니다.",
  "탈퇴 후 30일 이내 재가입 시 계정이 복구됩니다.",
  "위 내용을 확인하였으며, 회원탈퇴에 동의합니다.",
];

export function WithdrawModal({ isOpen, onClose, onConfirm }: WithdrawModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<Image src={leaveIcon} alt="회원탈퇴" width={25} height={25} />}
      title="회원 탈퇴"
      titleClassName="tracking-[0.5px]"
      description="* 회원 탈퇴 시 아래 내용이 동의된 것으로 간주합니다."
      cancelText="취소"
      confirmText="회원 탈퇴"
      confirmVariant="warning"
      onConfirm={onConfirm}
      childrenClassName="px-[18px] py-[11px]"
    >
      {WITHDRAW_ITEMS.map((item) => (
        <div key={item} className="flex items-start gap-1">
          <span className="shrink-0 text-xs text-sub-coral">✅</span>
          <p className="text-xs font-medium leading-tight tracking-[-0.3px] text-text-primary">
            {item}
          </p>
        </div>
      ))}
    </Modal>
  );
}

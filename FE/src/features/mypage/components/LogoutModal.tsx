"use client";

import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import logoutIcon from "@/assets/icons/mypage/logout-blue.png";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<Image src={logoutIcon} alt="로그아웃" width={25} height={25} className="icon-coral" />}
      iconClassName="!bg-system-coralbg"
      title="로그아웃"
      titleClassName="tracking-[0.5px]"
      description={`정말 로그아웃 하시겠어요?\n다음 여행도 함께 할게요!`}
      cancelText="취소"
      confirmText="로그아웃"
      confirmVariant="warning"
      onConfirm={onConfirm}
    >
      <p className="text-center text-sm font-medium text-sub-darkgray">
        * 언제든 다시 로그인할 수 있어요.
      </p>
    </Modal>
  );
}

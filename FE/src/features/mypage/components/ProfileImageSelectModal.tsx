"use client";

// src/features/mypage/components/ProfileImageSelectModal.tsx
// 마이페이지 - 프로필 사진 선택 모달 (공통 Modal 컴포넌트 사용)
import { useState } from "react";
import type { StaticImageData } from "next/image";
import { Modal } from "@/components/ui/Modal";
import { ProfileImageSelector } from "@/components/profile/ProfileImageSelector";

interface ProfileImage {
  id: number;
  src: StaticImageData | string;
}

interface ProfileImageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ProfileImage[];
  currentId?: number | null;
  onConfirm: (id: number) => void;
}
// ProfileImageSelectModal.tsx - useEffect 제거
export function ProfileImageSelectModal({
  isOpen,
  onClose,
  images,
  currentId,
  onConfirm,
}: ProfileImageSelectModalProps) {
  const [selectedId, setSelectedId] = useState<number | null>(currentId ?? images[0]?.id ?? null);

  const handleConfirm = () => {
    if (selectedId === null) return;
    onConfirm(selectedId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="프로필 사진 선택"
      confirmText="완료"
      cancelText="취소"
      onConfirm={handleConfirm}
      childrenVariant="plain"
    >
      <ProfileImageSelector images={images} selectedId={selectedId} onSelect={setSelectedId} />
    </Modal>
  );
}

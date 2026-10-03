"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import FreepassIcon from "@/assets/icons/itinerary/freepass.svg?svgr";
import magicWandIcon from "@/assets/icons/itinerary/magic-wand.svg?url";
import seaCharacter from "@/assets/character/sea.png";
import { Modal } from "@/components";
import { LoadingProgressBar } from "./LoadingProgressBar";

interface AiOptimizeLoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * 최적화 API 호출이 완료되면 true로 넘어온다.
   * 프로그레스바가 100%로 완성되고 자동으로 onClose가 호출된다.
   */
  isDone?: boolean;
  onComplete?: () => void;
}

export function AiOptimizeLoadingModal({
  isOpen,
  onClose,
  isDone,
  onComplete,
}: AiOptimizeLoadingModalProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(0);
      return;
    }

    // isDone=true가 되면 100%로 완성 후 닫기
    if (isDone) {
      setProgress(100);
      const doneTimer = setTimeout(() => {
        onComplete?.();
        onClose();
      }, 400);
      return () => clearTimeout(doneTimer);
    } else {
      // API 호출 중: 90%까지만 채우고 대기
      const startTimer = setTimeout(() => setProgress(90), 50);
      return () => clearTimeout(startTimer);
    }
  }, [isOpen, isDone, onClose, onComplete]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={
        <Image
          src={magicWandIcon}
          alt=""
          width={25}
          height={25}
          className="block icon-coral"
          aria-hidden
        />
      }
      title="AI가 최적 경로를 찾고 있어요"
      hideActions
      childrenVariant="card"
      footer={
        <div className="flex flex-col items-center gap-3 w-full">
          <LoadingProgressBar progress={progress} />
          <Image
            src={seaCharacter}
            alt="캐릭터"
            width={250}
            height={187}
            className="object-contain"
          />
        </div>
      }
    >
      <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-sub-darkgray">
        <FreepassIcon width={12} height={12} className="fill-sub-deepblue" aria-hidden />
        여행 동선을 계산하는 중...
      </p>
    </Modal>
  );
}

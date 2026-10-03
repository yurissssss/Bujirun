"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import loading1 from "@/assets/character/loading/loading1.png";
import loading2 from "@/assets/character/loading/loading2.png";
import loading3 from "@/assets/character/loading/loading3.png";
import loading4 from "@/assets/character/loading/loading4.png";
import loading5 from "@/assets/character/loading/loading5.png";
import loadingTurtle from "@/assets/character/loading/loading_turtle.png";
import { Modal } from "@/components/ui/Modal";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { cn } from "@/shared/utils";

interface LoadingStateProps {
  message?: string;
  isComplete?: boolean;
  variant?: "modal" | "inline";
  className?: string;
}

const LOADING_IMAGES = [loading1, loading2, loading3, loading4] as const;

const LOADING_MESSAGES = [
  "부산으로 가는 중 ...",
  "관광지 사진도 찍고 🌄",
  "셀카도 찍고 📸",
  "쁘이 ✌️",
] as const;

const COMPLETE_IMAGE = loading5;
const COMPLETE_MESSAGE = "다 됐어요 ❣️";

export function LoadingState({
  message = "잠시만 기다려 주세요 😇",
  isComplete = false,
  variant = "modal",
  className,
}: LoadingStateProps) {
  const [progress, setProgress] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (isComplete) return;

    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev < 60) return Math.min(prev + 2, 60);
        if (prev < 80) return Math.min(prev + 1, 80);
        if (prev < 90) return Math.min(prev + 0.3, 90);

        return Math.min(prev + 0.05, 95);
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [isComplete]);

  useEffect(() => {
    if (isComplete) return;

    const interval = window.setInterval(() => {
      setImageIndex((prev) => (prev + 1) % LOADING_IMAGES.length);
    }, 1200);

    return () => window.clearInterval(interval);
  }, [isComplete]);

  const normalizedProgress = isComplete ? 100 : Math.min(Math.max(progress, 0), 95);

  const currentImage = isComplete ? COMPLETE_IMAGE : LOADING_IMAGES[imageIndex];

  const currentMessage = isComplete ? COMPLETE_MESSAGE : LOADING_MESSAGES[imageIndex];

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "absolute inset-0 flex h-full w-full flex-col items-center justify-center text-center font-ssurround text-md text-heading",
          className,
        )}
      >
        {message}
      </div>
    );
  }

  return (
    <Modal
      isOpen
      onClose={() => {}}
      hideActions
      hideCloseButton
      childrenVariant="plain"
      childrenClassName="!gap-0"
      className={cn(
        "!h-[350px] !w-[270px] !max-w-[270px] flex-col items-center bg-gradient-to-b from-system-scroll from-0% via-main-white via-60% to-main-white to-100% px-10",
        className,
      )}
    >
      <SpeechBubble
        variant="white"
        tailDirection="bottom"
        tailCenter
        bubbleClassName="!w-[190px] !rounded-3xl mt-1 py-2 justify-center font-ssurround text-md text-heading"
      >
        {currentMessage}
      </SpeechBubble>

      <div className="flex flex-col items-center mt-2">
        <div className="relative h-[160px] w-[160px]">
          <Image
            src={currentImage}
            alt={isComplete ? "로딩 완료 부지런 캐릭터" : "로딩 중인 부지런 캐릭터"}
            priority
            className="absolute inset-0 h-auto w-[160px] transition-opacity duration-500 ease-in-out"
          />
        </div>

        <div className="h-3 w-15 -translate-x-[2px] rounded-[50%] bg-system-scroll blur-[1px]" />
      </div>

      <div className="mt-7 w-full">
        <div className="relative h-2 w-full rounded-full bg-system-navbg">
          <div
            className="h-full rounded-full bg-main-blue transition-[width] duration-100 ease-linear"
            style={{ width: `${normalizedProgress}%` }}
          />

          <Image
            src={loadingTurtle}
            alt="진행바 아이콘"
            aria-hidden="true"
            className="absolute top-1/2 h-auto w-12 -translate-x-1/2 -translate-y-[60%] transition-[left] duration-100 ease-linear"
            style={{ left: `${normalizedProgress}%` }}
          />
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-primary">{message}</p>
    </Modal>
  );
}

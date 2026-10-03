"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import angleLeftIcon from "@/assets/icons/itinerary/angle-left.svg?url";
import { cn } from "@/shared/utils";

interface BackButtonProps {
  className?: string;
  onClick?: () => void;
  // "plain"은 배경 없이 아이콘만 — 헤더의 다른 아이콘 버튼과 같은 줄에 둘 때 사용.
  variant?: "filled" | "plain";
  iconSize?: number;
}

export function BackButton({
  className,
  onClick,
  variant = "filled",
  iconSize = 16,
}: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={onClick ?? (() => router.back())}
      className={cn(
        "size-[28px] rounded-lg flex items-center justify-center shrink-0",
        variant === "filled" ? "bg-system-scroll" : "bg-transparent active:opacity-70",
        className,
      )}
    >
      <Image src={angleLeftIcon} alt="" width={iconSize} height={iconSize} aria-hidden />
    </button>
  );
}

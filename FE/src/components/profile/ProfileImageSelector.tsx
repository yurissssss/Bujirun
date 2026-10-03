"use client";

import Image, { StaticImageData } from "next/image";
import { cn } from "@/shared/utils";
import { Card } from "@/components/ui/Card";

interface ProfileImage {
  id: number;
  src: StaticImageData | string;
}

interface ProfileImageSelectorProps {
  images: ProfileImage[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /**
   * 사용처별 디자인 차이
   * - "modal": 마이페이지 프로필 수정 모달 (74px 원형, gap 12px 균일)
   * - "signup": 회원가입 페이지 (80px 원형, gap-x 21px / gap-y 18px)
   */
  variant?: "modal" | "signup";
  className?: string;
}

/**
 * 프로필 사진 선택 그리드 컴포넌트
 * - 회원가입, 마이페이지 프로필 편집 등에서 공통으로 사용
 * - 화면별 디자인 차이는 variant prop으로 분기
 */
export function ProfileImageSelector({
  images,
  selectedId,
  onSelect,
  variant = "modal",
  className,
}: ProfileImageSelectorProps) {
  const isSignup = variant === "signup";

  return (
    <Card
      variant="glass-lg"
      className={cn(
        "rounded-[20px]",
        isSignup ? "py-[24px] px-[21.5px]" : "py-[16px] px-[8px]",
        className,
      )}
    >
      <div
        className={cn("grid grid-cols-3", isSignup ? "gap-x-[21px] gap-y-[18px]" : "gap-[12px]")}
      >
        {images.map(({ id, src }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              "relative rounded-full overflow-hidden transition-all active:scale-97",
              isSignup ? "w-[80px] h-[80px]" : "w-[74px] h-[74px]",
              // 선택 시 배경색으로만 구분 (테두리 없음)
              selectedId === id ? "bg-main-blue" : "bg-system-navbg",
            )}
          >
            <Image
              src={src}
              alt=""
              aria-hidden
              fill
              sizes={isSignup ? "110px" : "100px"}
              className="object-cover scale-[1.27] origin-[center_10%]"
            />
          </button>
        ))}
      </div>
    </Card>
  );
}

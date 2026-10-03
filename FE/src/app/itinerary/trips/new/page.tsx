"use client";

import Image from "next/image";
import travelImg from "@/assets/character/travel.png";
import { TripSetupForm } from "@/features/itinerary/components";
import { StaircaseGlassCard } from "@/components";

export default function TripNewPage() {
  return (
    <div className="min-h-full">
      {/* 한 화면 안에 폼까지 억지로 맞추지 않고 상단 비주얼 높이를 유지한다.
          전체 콘텐츠가 뷰포트보다 길어지면 AppShell의 메인 영역이 자연스럽게 스크롤된다. */}
      <div className="relative h-[300px]">
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <StaircaseGlassCard line1="친구와 함께" line2="부산으로 떠나볼까요?" />
        </div>

        <p
          className="absolute left-[16px] top-[110px] font-dxsubtitles font-medium text-lg text-text-primary text-left"
          style={{ lineHeight: "23px" }}
        >
          멋진 추억을 만들 수 있게
          <br />
          부지런이 도와줄게요!
        </p>
        <div className="absolute right-[4px] bottom-0 z-10">
          <Image src={travelImg} alt="" width={205} height={220} aria-hidden />
        </div>
      </div>

      {/* 여행 정보 입력 폼 */}
      <TripSetupForm />
    </div>
  );
}

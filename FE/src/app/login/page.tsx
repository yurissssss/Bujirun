"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { KakaoLoginButton } from "@/components/ui/KakaoLoginButton";
import characterImg from "@/assets/character/primary.png";
import {
  StaircaseGlassCard,
  LegalMenuModal,
  PrivacyPolicyModal,
  ServiceTermsModal,
} from "@/components";
import { clearPendingInvite } from "@/shared/utils/pendingInvite";

export default function LoginPage() {
  const [isLegalMenuOpen, setIsLegalMenuOpen] = useState(false);
  const [isServiceTermsOpen, setIsServiceTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // 이 화면을 거쳐 로그인하는 건 초대 참여가 아니라 "그냥 로그인"이다. 예전에 초대 링크를
  // 열어봤던 브라우저에 남은 초대 코드를 여기서 비워두지 않으면, 로그인 직후 콜백이 그
  // 코드를 소비해 초대받은 적도 없는 그룹의 일정 생성 흐름으로 끌고 간다.
  // (초대 링크로 들어온 사용자는 /join 안에서 바로 로그인하므로 이 화면을 지나지 않는다.)
  useEffect(() => {
    clearPendingInvite();
  }, []);

  return (
    <main className="relative flex flex-col items-center w-full h-full">
      <div className="flex flex-col items-center w-full h-full">
        {/* 말풍선 영역 */}
        <div className="mt-[120px] w-full pl-[24px]">
          <StaircaseGlassCard line1="반가워요!" line2="부산 여행을 떠나볼까요?" />
        </div>

        {/* 캐릭터 */}
        <div className="w-full flex justify-center mt-[30px]">
          <Image
            src={characterImg}
            alt="부지런 캐릭터"
            width={320}
            height={320}
            className="object-contain"
            priority
          />
        </div>

        {/* 하단 버튼 영역 */}
        <div className="mt-auto w-full ">
          <KakaoLoginButton />
          <p className="mt-3 text-center text-sm text-sub-darkgray font-medium pb-[150px]">
            * 로그인하면{" "}
            <button
              type="button"
              onClick={() => setIsLegalMenuOpen(true)}
              className="underline underline-offset-2 text-sub-deepblue active:opacity-70"
            >
              서비스 이용약관 및 개인정보 처리방침
            </button>
            에
            <br />
            동의한 것으로 간주합니다.
          </p>
        </div>
      </div>
      <LegalMenuModal
        isOpen={isLegalMenuOpen}
        onClose={() => setIsLegalMenuOpen(false)}
        onOpenServiceTerms={() => setIsServiceTermsOpen(true)}
        onOpenPrivacyPolicy={() => setIsPrivacyOpen(true)}
      />
      <ServiceTermsModal isOpen={isServiceTermsOpen} onClose={() => setIsServiceTermsOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />{" "}
    </main>
  );
}

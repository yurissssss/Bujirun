"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/shared/utils";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ProfileImageSelector } from "@/components/profile/ProfileImageSelector";
import { SignUpSuccessModal } from "@/features/auth/components/SignUpSuccessModal";
import { LegalMenuModal, PageCard, PrivacyPolicyModal, ServiceTermsModal } from "@/components";
import { PROFILE_IMAGES } from "@/components/profile/profileImages";
import { apiClient, unwrap } from "@/shared/api";
import type { OpBody, OpResponse } from "@/shared/api/types";

import YesIcon from "@/assets/icons/login-register/yes.svg?svgr";
import NoIcon from "@/assets/icons/login-register/no.svg?svgr";

export default function SignUpPage() {
  const [nickname, setNickname] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const [isLegalMenuOpen, setIsLegalMenuOpen] = useState(false);
  const [isServiceTermsOpen, setIsServiceTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const trimmedNickname = nickname.trim();
  const isNicknameValid =
    trimmedNickname.length >= 2 && trimmedNickname.length <= 6 && !isDuplicate;
  const isFormValid = isNicknameValid && selectedProfile !== null;

  // PATCH /api/users/me — 닉네임 + 프로필 이미지 저장
  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: (body: OpBody<"updateMyProfile">) =>
      apiClient.patch<OpResponse<"updateMyProfile">>("/api/users/me", body).then(unwrap),
    onSuccess: () => {
      setIsSuccessModalOpen(true);
    },
    onError: (error: unknown) => {
      // 닉네임 중복 등 서버 에러 처리
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setIsDuplicate(true);
      }
    },
  });

  const handleSignUp = () => {
    if (!isFormValid || isPending) return;

    // 선택한 프로필 이미지 id → 추후 URL로 교체 예정
    const selectedImage = PROFILE_IMAGES.find((img) => img.id === selectedProfile);

    updateProfile({
      nickname: trimmedNickname,
      // TODO: 프로필 이미지 URL 확정 후 실제 URL로 교체
      profileImageUrl: selectedImage ? String(selectedImage.id) : undefined,
    });
  };

  // 닉네임 변경 시 중복 플래그 초기화
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 6) return;
    setNickname(value);
    setIsDuplicate(false);
  };

  return (
    <>
      {/* 카드는 다른 화면과 같은 공용 PageCard 기준(헤더 바로 아래 고정)으로 띄운다.
          예전엔 absolute + h-[722px] 고정이라 카드 상단이 뷰포트 높이에 따라 움직였고,
          390x844 프레임에서는 다른 화면보다 34px 아래에서 시작해 상단 여백이 더 벌어졌다. */}
      <PageCard>
        {/* 타이틀 */}
        <p className="text-center font-ssurround font-bold text-2xl text-text-heading">회원가입</p>
        <div className="mt-10 flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto">
          {/* 닉네임 입력 */}
          <section className="flex flex-col gap-3">
            <label className="font-semibold text-lg text-text-primary">닉네임</label>
            <div className="relative">
              <TextInput
                placeholder="2 - 6자 이내"
                value={nickname}
                onChange={handleNicknameChange}
              />
              {isNicknameValid && (
                <div className="absolute right-3 top-[12px]">
                  <YesIcon width={16} height={16} aria-hidden className="fill-main-blue" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-1 pr-1">
              {isDuplicate ? (
                <div className="flex items-center gap-[4px]">
                  <NoIcon width={12} height={12} aria-hidden className="fill-sub-coral" />
                  <span className="font-semibold text-sm text-sub-coral">
                    이미 사용중인 닉네임이에요.
                  </span>
                </div>
              ) : (
                <span />
              )}
              <span className="font-semibold text-sm text-sub-gray">{nickname.length} / 6</span>
            </div>
          </section>

          {/* 프로필 사진 선택 */}
          <section className="flex flex-col gap-2">
            <label className="font-semibold text-lg text-text-primary">프로필 사진</label>
            <ProfileImageSelector
              images={PROFILE_IMAGES}
              selectedId={selectedProfile}
              onSelect={setSelectedProfile}
              variant="signup"
            />
          </section>
        </div>

        {/* 버튼 영역 */}
        <div className="shrink-0">
          {/* 동의 안내 - 배경 박스 없이 캡션 텍스트로, 버튼 위에 배치
              이용약관 콘텐츠가 별도로 없어 링크를 하나로 통합 (분리 시 실제로 없는 문서가 있는 것처럼 보임) */}
          <p className="mb-3 text-center text-xs leading-relaxed text-sub-gray">
            * 가입 완료 시{" "}
            <button
              type="button"
              onClick={() => setIsLegalMenuOpen(true)}
              className="underline underline-offset-2 text-sub-deepblue font-medium active:opacity-70"
            >
              이용약관 및 개인정보처리방침
            </button>
            에 동의한 것으로 간주됩니다.
          </p>

          <Button
            variant="primary"
            disabled={!isFormValid || isPending}
            onClick={handleSignUp}
            className={cn((!isFormValid || isPending) && "bg-sub-gray cursor-not-allowed")}
          >
            {isPending ? "처리 중..." : "회원가입 완료"}
          </Button>
        </div>
      </PageCard>
      <SignUpSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />
      <LegalMenuModal
        isOpen={isLegalMenuOpen}
        onClose={() => setIsLegalMenuOpen(false)}
        onOpenServiceTerms={() => setIsServiceTermsOpen(true)}
        onOpenPrivacyPolicy={() => setIsPrivacyOpen(true)}
      />
      <ServiceTermsModal isOpen={isServiceTermsOpen} onClose={() => setIsServiceTermsOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />{" "}
    </>
  );
}

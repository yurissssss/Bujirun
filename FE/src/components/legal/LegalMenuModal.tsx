"use client";

import { FileText, ShieldCheck } from "lucide-react";
import { Modal } from "@/components";

interface LegalMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenServiceTerms: () => void;
  onOpenPrivacyPolicy: () => void;
}

export function LegalMenuModal({
  isOpen,
  onClose,
  onOpenServiceTerms,
  onOpenPrivacyPolicy,
}: LegalMenuModalProps) {
  const handleServiceTermsClick = () => {
    onClose();
    onOpenServiceTerms();
  };

  const handlePrivacyPolicyClick = () => {
    onClose();
    onOpenPrivacyPolicy();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="이용약관 및 개인정보 처리방침"
      hideActions
      scrollBody
      childrenVariant="plain"
      closeButtonClassName="text-sub-gray"
    >
      <div className="flex w-full flex-col gap-3">
        <LegalMenuItem
          icon={FileText}
          title="서비스 이용약관"
          description="서비스 이용에 관한 내용을 확인하세요."
          onClick={handleServiceTermsClick}
        />

        <LegalMenuItem
          icon={ShieldCheck}
          title="개인정보 처리방침"
          description="개인정보 수집·이용 내용을 확인하세요."
          onClick={handlePrivacyPolicyClick}
        />
      </div>
    </Modal>
  );
}

function LegalMenuItem({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-sub-lightgray px-4 py-3 text-left transition-colors hover:bg-system-navbg active:opacity-70 [&:hover>svg]:text-main-blue"
    >
      <Icon size={20} strokeWidth={2} className="shrink-0 text-main-blue" aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-text-heading">{title}</p>
        <p className="mt-1 text-xs text-sub-darkgray">{description}</p>
      </div>

      <ChevronRightIcon className="h-2.5 w-2.5 shrink-0 text-sub-lightgray transition-colors" />
    </button>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M6.079,22.5a1.5,1.5,0,0,1,.44-1.06l7.672-7.672a2.5,2.5,0,0,0,0-3.536L6.529,2.565A1.5,1.5,0,0,1,8.65.444l7.662,7.661a5.506,5.506,0,0,1,0,7.779L8.64,23.556A1.5,1.5,0,0,1,6.079,22.5Z" />
    </svg>
  );
}

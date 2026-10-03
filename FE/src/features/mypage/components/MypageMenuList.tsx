"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, FileText } from "lucide-react";
import { MenuItem } from "./MenuItem";
import { LegalMenuModal, PrivacyPolicyModal, ServiceTermsModal } from "@/components";

export function MypageMenuList() {
  const router = useRouter();
  const [isLegalMenuOpen, setIsLegalMenuOpen] = useState(false);
  const [isServiceTermsOpen, setIsServiceTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handleBookmark = () => {
    router.push("/mypage/bookmarks");
  };

  return (
    <>
      <div className="flex flex-col gap-[9px]">
        <MenuItem icon={Bookmark} label="북마크 목록" onClick={handleBookmark} />
        <MenuItem
          icon={FileText}
          label="이용약관 및 개인정보 처리방침"
          onClick={() => setIsLegalMenuOpen(true)}
        />{" "}
      </div>
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

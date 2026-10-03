"use client";

import { Modal } from "@/components/ui/Modal";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POLICY_SECTIONS = [
  {
    title: "1. 개인정보의 처리 목적",
    content:
      "'부지런'은 부산 여행 일정 추천 및 여행 기록 서비스를 제공하기 위해 개인정보를 처리합니다.\n• 카카오 간편 로그인을 통한 회원 식별 및 계정 관리\n• 이용자 취향을 반영한 맞춤형 여행 일정 추천\n• 위치정보를 활용한 관광지 방문 인증\n• 그룹 여행 일정 공유 및 투표 기능 제공\n• 찜, 도감 수집, 여행 기록 등 개인화 기능 제공\n• 서비스 이용 현황 확인 및 서비스 품질 개선",
  },
  {
    title: "2. 처리하는 개인정보의 항목",
    content:
      "• 회원가입 및 로그인: 카카오 계정 고유 식별자(ID), 닉네임, 프로필 사진, 이메일(카카오 계정에서 제공되는 경우)\n• 서비스 이용 과정: 방문 인증 시 위치정보, 여행 일정 및 코스 정보, 방문 인증 기록 및 사진, 찜·도감 수집 정보, 여행 기록, 이용자 취향 선택 정보",
  },
  {
    title: "3. 개인정보의 처리 및 보유 기간",
    content:
      "• 개인정보는 원칙적으로 회원 탈퇴 시 지체 없이 파기합니다.\n• 탈퇴 후 계정 복구를 위해 방문 인증 기록 및 사진, 여행 기록 등 복구 대상 데이터는 탈퇴 신청일로부터 30일간 보관한 뒤 파기합니다. 카카오 계정과의 연동은 탈퇴 시 해제됩니다.\n• 공동 여행과 관련된 정보 중 다른 이용자의 일정 및 기록 유지에 필요한 데이터는 개인을 직접 식별하기 어렵도록 처리한 뒤 필요한 범위에서 보관될 수 있습니다.",
  },
  {
    title: "4. 개인정보의 제3자 제공에 관한 사항",
    content:
      "'부지런'은 원칙적으로 이용자의 개인정보를 개인정보 처리 목적의 범위 내에서 이용하며, 이용자의 동의 없이 제3자에게 제공하지 않습니다. 다만 법령에 특별한 규정이 있거나 법령상 의무를 이행하기 위해 필요한 경우에는 관련 법령이 정한 범위에서 제공할 수 있습니다.",
  },
  {
    title: "5. 개인정보의 파기 절차 및 방법",
    content:
      "개인정보의 보유 기간이 지나거나 처리 목적이 달성되어 개인정보가 불필요하게 된 경우 지체 없이 파기합니다. 전자적 파일 형태의 개인정보는 복구 또는 재생하기 어려운 방법으로 삭제합니다.",
  },
  {
    title: "6. 정보주체의 권리·의무 및 행사방법",
    content:
      "이용자는 자신의 개인정보에 대해 열람, 정정·삭제, 처리정지 등을 요청할 수 있습니다. 또한 서비스 내 [마이페이지 > 회원 탈퇴]를 통해 개인정보 수집·이용 동의를 철회하고 계정 삭제를 요청할 수 있습니다.",
  },
  {
    title: "7. 개인정보 관련 문의",
    content:
      "개인정보 처리와 관련한 문의, 불만 처리 또는 권리 행사 요청은 '부지런' 운영팀으로 문의할 수 있습니다.\n💌 문의 이메일: busanfriend@bujirun.com",
  },
  {
    title: "8. 개인정보 자동 수집 장치의 설치·운영에 관한 사항",
    content:
      "'부지런'은 로그인 상태 유지 및 인증을 위해 쿠키를 사용합니다. 인증에 사용되는 리프레시 토큰은 보안을 위해 HttpOnly 쿠키로 관리되며, 로그인 인증 및 액세스 토큰 재발급을 위해 사용됩니다. 해당 쿠키는 광고 또는 이용자 추적 목적으로 사용하지 않습니다.",
  },
  {
    title: "9. 개인정보 처리방침의 변경",
    content:
      "개인정보 처리방침의 내용이 변경되는 경우 변경 내용과 시행일을 서비스 내 공지 또는 별도의 안내를 통해 알립니다.",
  },
] as const;

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="개인정보 처리방침"
      hideActions
      scrollBody
      childrenVariant="plain"
      closeButtonClassName="text-sub-gray"
    >
      <div className="w-full">
        <div className="flex max-h-80 w-full flex-col gap-5 text-text-primary">
          {POLICY_SECTIONS.map((section) => (
            <section key={section.title} className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-text-heading">{section.title}</h3>

              <p className="whitespace-pre-line rounded-lg bg-sub-lightgray/30 px-3 py-3 break-keep text-xs leading-relaxed text-sub-deepgray">
                {section.content}
              </p>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}

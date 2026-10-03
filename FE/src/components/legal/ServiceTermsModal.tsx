"use client";

import { Modal } from "@/components";

interface ServiceTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SERVICE_TERMS = [
  {
    title: "1. 목적",
    content:
      "본 약관은 '부지런'이 제공하는 부산 여행 일정 추천 및 여행 기록 관련 서비스의 이용 조건과 서비스와 이용자 간의 권리·의무 및 책임 사항을 정하는 것을 목적으로 합니다.",
  },
  {
    title: "2. 서비스 제공 내용",
    content:
      "'부지런'은 이용자의 취향을 반영한 여행 일정 생성 및 추천, 관광지 정보 제공, 위치정보를 활용한 방문 인증, 찜 및 도감 수집, 여행 기록, 그룹 여행 일정 공유 및 투표 등의 기능을 제공합니다.",
  },
  {
    title: "3. 회원가입 및 계정 관리",
    content:
      "이용자는 카카오 계정을 이용해 회원가입 및 로그인을 할 수 있습니다. 이용자는 자신의 계정을 안전하게 관리해야 하며, 타인의 계정을 사용하거나 자신의 계정을 타인에게 부정하게 이용하도록 해서는 안 됩니다.",
  },
  {
    title: "4. 이용자의 의무",
    content:
      "이용자는 관련 법령과 본 약관을 준수해야 하며, 타인의 정보를 도용하거나 서비스의 정상적인 운영을 방해해서는 안 됩니다. 또한 위치 조작 등 부정한 방법으로 방문 인증, 도감 수집, 여행 기록 등의 기능을 이용해서는 안 됩니다.",
  },
  {
    title: "5. 서비스의 의무",
    content:
      "'부지런'은 관련 법령과 본 약관을 준수하며 안정적인 서비스 제공을 위해 노력합니다. 이용자의 개인정보는 개인정보 처리방침에 따라 보호하며, 서비스 운영 과정에서 확인된 오류나 장애를 해결하기 위해 합리적인 노력을 기울입니다.",
  },
  {
    title: "6. 서비스의 변경 및 중단",
    content:
      "서비스 운영 또는 기술상 필요한 경우 제공되는 기능의 전부 또는 일부가 변경되거나 일시적으로 중단될 수 있습니다. 서비스 이용에 중요한 영향을 미치는 변경 또는 중단이 있는 경우 서비스 내 공지 등 적절한 방법으로 안내합니다.",
  },
  {
    title: "7. 위치 및 관광 정보 안내",
    content:
      "서비스에서 제공하는 관광지 정보, 위치, 이동 경로 및 예상 소요시간 등의 정보는 실제 상황과 차이가 있을 수 있습니다. 이용자는 실제 교통 상황, 관광지 운영시간 및 현장 안내 등을 함께 확인해야 합니다.",
  },
  {
    title: "8. 회원 탈퇴",
    content:
      "이용자는 서비스 내 [마이페이지 > 회원 탈퇴]를 통해 언제든지 탈퇴를 요청할 수 있습니다. 회원 탈퇴 시 개인정보 및 서비스 이용 데이터의 보관·파기 등에 관한 사항은 개인정보 처리방침에 따릅니다.",
  },
  {
    title: "9. 책임의 제한",
    content:
      "천재지변, 통신 장애, 외부 서비스 장애 등 '부지런'이 합리적으로 통제하기 어려운 사유로 서비스 제공이 불가능한 경우 관련 법령이 허용하는 범위에서 책임이 제한될 수 있습니다. 서비스에서 제공하는 여행 일정 추천, 관광지 및 이동 관련 정보는 여행 계획을 돕기 위한 참고 정보이며 실제 상황과 다를 수 있습니다.",
  },
  {
    title: "10. 약관의 변경",
    content:
      "'부지런'은 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다. 약관이 변경되는 경우 적용일과 주요 변경 내용을 적용일 7일 전부터 서비스 내에서 안내하며, 이용자에게 불리한 내용으로 변경되는 경우에는 적용일 30일 전부터 안내합니다.",
  },
  {
    title: "11. 분쟁 해결",
    content:
      "'부지런'과 이용자 사이에 서비스 이용과 관련한 분쟁이 발생한 경우 상호 협의를 통해 해결하도록 노력하며, 협의로 해결되지 않는 경우 관련 법령에서 정한 절차에 따릅니다.",
  },
] as const;

export function ServiceTermsModal({ isOpen, onClose }: ServiceTermsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="서비스 이용약관"
      hideActions
      scrollBody
      childrenVariant="plain"
    >
      <div className="flex max-h-80 w-full flex-col gap-5 text-text-primary">
        {SERVICE_TERMS.map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-text-heading">{section.title}</h3>
            <p className="rounded-lg bg-sub-lightgray/30 px-3 py-3 break-keep text-xs leading-relaxed text-sub-deepgray">
              {section.content}
            </p>
          </section>
        ))}
      </div>
    </Modal>
  );
}

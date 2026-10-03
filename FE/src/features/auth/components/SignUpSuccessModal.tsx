"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { buildPendingInviteQuery, consumePendingInvite } from "@/shared/utils/pendingInvite";
import congsImg from "@/assets/character/congs.png";

interface SignUpSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 회원가입 완료 후 노출되는 성공 모달
export function SignUpSuccessModal({ isOpen, onClose }: SignUpSuccessModalProps) {
  const router = useRouter();

  const handleStart = () => {
    // 회원가입 완료 → 홈으로 이동 (accessToken은 콜백에서 이미 저장됨)
    // 초대 링크를 통해 들어온 신규 유저라면 초대 참여 흐름으로 복귀
    onClose();
    const pendingInvite = consumePendingInvite();
    if (!pendingInvite) {
      router.push("/");
      return;
    }
    const query = buildPendingInviteQuery(pendingInvite);
    router.push(`/join/${pendingInvite.code}${query ? `?${query}` : ""}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideCloseButton
      hideActions
      icon={<Image src={congsImg} alt="회원가입 성공" width={120} height={80} />}
      iconClassName="bg-transparent w-auto h-auto"
      className="pb-[40px]"
      title="회원가입 성공"
      titleClassName="font-ssurround text-xl tracking-[0.5px]"
      description={`회원가입이 완료되었어요.\n같이 여행을 떠나볼까요?`}
      footer={
        <div className="w-full flex flex-col items-center gap-[30px]">
          <Card
            variant="glass-sm"
            className="w-full h-[31px] flex items-center justify-center py-0 px-3 rounded-[10px]"
          >
            <p className="font-medium text-sm text-sub-darkgray text-center">
              친구들과 여행의 추억을 기록해보세요!
            </p>
          </Card>
          <Button
            variant="primary"
            className="w-full h-[40px] rounded-[10px] font-ssurround font-bold text-md"
            onClick={handleStart}
          >
            여행 시작하기
          </Button>
        </div>
      }
    />
  );
}

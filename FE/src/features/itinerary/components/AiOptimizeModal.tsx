import Image from "next/image";
import magicWandIcon from "@/assets/icons/itinerary/magic-wand.svg?url";
import { Modal } from "@/components";

interface AiOptimizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /**
   * 호출부(ItineraryModals)에서 계속 넘어오지만 이 모달에서는 쓰지 않는다.
   * 최적화 요청(ItineraryOptimizeRequest)에는 숙소 좌표를 담을 필드가 없고
   * 실제 호출도 빈 body라서, 최적화는 숙소를 전혀 기준으로 쓰지 않는다.
   * "숙소 기준"으로 오해할 수 있는 표시라 제거했다 — 등록한 숙소는 일정 화면
   * 상단 숙소 필드에서 그대로 확인·수정할 수 있다.
   * 백엔드에 숙소 기준 최적화가 추가되면 이 prop을 다시 쓰면 된다.
   */
  accommodationName?: string;
}

export function AiOptimizeModal({ isOpen, onClose, onConfirm }: AiOptimizeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={
        <Image
          src={magicWandIcon}
          alt=""
          width={25}
          height={25}
          className="block icon-coral"
          aria-hidden
        />
      }
      title="AI 일정 최적화"
      description={
        "관광지의 위치와 이동 경로를 분석해\n방문 순서와 도착 시간을\n다시 정리해드릴게요."
      }
      confirmText="최적화 시작"
      cancelText="취소"
      confirmVariant="primary"
      onConfirm={onConfirm}
      onCancel={onClose}
    >
      <div className="flex flex-col items-center w-full">
        <div className="flex flex-col items-start gap-0.5">
          <p className="text-sm font-medium text-sub-darkgray leading-none">✨ 방문 순서 재배치</p>
          <p className="text-sm font-medium text-sub-darkgray leading-none">
            ⏰ 도착 시간 자동 조정
          </p>
          <p className="text-sm font-medium text-sub-darkgray leading-none">
            🚌 이동 경로·교통수단 반영
          </p>
        </div>
      </div>
    </Modal>
  );
}

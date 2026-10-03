import Image from "next/image";
import removeIcon from "@/assets/icons/itinerary/remove.svg?url";
import { Modal } from "@/components";

interface TripDeleteModalProps {
  isOpen: boolean;
  tripName: string;
  isGroupTrip: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function TripDeleteModal({
  isOpen,
  tripName,
  isGroupTrip,
  onClose,
  onConfirm,
}: TripDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={
        <Image src={removeIcon} alt="" width={25} height={25} className="icon-coral" aria-hidden />
      }
      iconClassName="size-[48px]"
      title={isGroupTrip ? "여행 나가기" : "여행 삭제"}
      description={
        isGroupTrip
          ? `'${tripName}' 여행 일정에서\n나가시겠어요?`
          : `'${tripName}' 여행을\n삭제하시겠어요?`
      }
      childrenVariant="card"
      cancelText="취소"
      confirmText={isGroupTrip ? "나가기" : "삭제하기"}
      confirmVariant="warning"
      onConfirm={onConfirm}
    >
      <p className="text-center font-medium text-sub-darkgray">
        {isGroupTrip
          ? "* 내 목록에서는 사라지지만, 친구들의 여행 일정은 유지돼요."
          : "* 삭제한 여행은 복구할 수 없어요."}
      </p>
    </Modal>
  );
}

import { Modal } from "@/components";

interface RecordDeleteModalProps {
  isOpen: boolean;
  tripName: string;
  period: string;
  onClose: () => void;
  onConfirm: () => void;
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className="size-[25px] fill-sub-coral">
      <path d="M448,85.333h-66.133C371.66,35.703,328.002,0.064,277.333,0h-42.667c-50.669,0.064-94.327,35.703-104.533,85.333H64c-11.782,0-21.333,9.551-21.333,21.333S52.218,128,64,128h21.333v277.333C85.404,464.214,133.119,511.93,192,512h128c58.881-0.07,106.596-47.786,106.667-106.667V128H448c11.782,0,21.333-9.551,21.333-21.333S459.782,85.333,448,85.333z M234.667,362.667c0,11.782-9.551,21.333-21.333,21.333C201.551,384,192,374.449,192,362.667v-128c0-11.782,9.551-21.333,21.333-21.333c11.782,0,21.333,9.551,21.333,21.333V362.667z M320,362.667c0,11.782-9.551,21.333-21.333,21.333c-11.782,0-21.333-9.551-21.333-21.333v-128c0-11.782,9.551-21.333,21.333-21.333c11.782,0,21.333,9.551,21.333,21.333V362.667z M174.315,85.333c9.074-25.551,33.238-42.634,60.352-42.667h42.667c27.114,0.033,51.278,17.116,60.352,42.667H174.315z" />
    </svg>
  );
}

export function RecordDeleteModal({ isOpen, period, onClose, onConfirm }: RecordDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<TrashIcon />}
      title="여행 기록 삭제"
      className="px-8 py-10 gap-6"
      description={
        <p>
          <span className="mb-1 block underline underline-offset-2">{period}</span>
          여행 기록을 삭제하시겠어요?
        </p>
      }
      childrenVariant="card"
      cancelText="취소"
      confirmText="삭제하기"
      confirmVariant="warning"
      onConfirm={onConfirm}
    >
      <div className="flex w-full flex-col items-center gap-7">
        <p className="text-center text-sm font-medium text-sub-darkgray">
          * 삭제한 기록은 복구할 수 없어요.
        </p>
      </div>
    </Modal>
  );
}

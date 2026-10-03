import { memo, useCallback } from "react";

interface TripRecordItemProps {
  id: number;
  title: string;
  period: string;
  onDelete: (id: number) => void;
  onTitleClick: (id: number) => void;
}

// 영수증 아이콘
const ReceiptIcon = memo(function ReceiptIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[22px] w-[22px] shrink-0 fill-text-primary"
    >
      <path d="M16,0H8A5.006,5.006,0,0,0,3,5V23a1,1,0,0,0,1.564.825L6.67,22.386l2.106,1.439a1,1,0,0,0,1.13,0l2.1-1.439,2.1,1.439a1,1,0,0,0,1.131,0l2.1-1.438,2.1,1.437A1,1,0,0,0,21,23V5A5.006,5.006,0,0,0,16,0Zm3,21.1-1.1-.752a1,1,0,0,0-1.132,0l-2.1,1.439-2.1-1.439a1,1,0,0,0-1.131,0l-2.1,1.439-2.1-1.439a1,1,0,0,0-1.129,0L5,21.1V5A3,3,0,0,1,8,2h8a3,3,0,0,1,3,3Z" />
      <rect x="7" y="8" width="10" height="2" rx="1" />
      <rect x="7" y="12" width="8" height="2" rx="1" />
    </svg>
  );
});

// 삭제 아이콘
const TrashIcon = memo(function TrashIcon() {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className="h-[15px] w-[15px] fill-main-white">
      <path d="M448,85.333h-66.133C371.66,35.703,328.002,0.064,277.333,0h-42.667c-50.669,0.064-94.327,35.703-104.533,85.333H64c-11.782,0-21.333,9.551-21.333,21.333S52.218,128,64,128h21.333v277.333C85.404,464.214,133.119,511.93,192,512h128c58.881-0.07,106.596-47.786,106.667-106.667V128H448c11.782,0,21.333-9.551,21.333-21.333S459.782,85.333,448,85.333z M234.667,362.667c0,11.782-9.551,21.333-21.333,21.333C201.551,384,192,374.449,192,362.667v-128c0-11.782,9.551-21.333,21.333-21.333c11.782,0,21.333,9.551,21.333,21.333V362.667z M320,362.667c0,11.782-9.551,21.333-21.333,21.333c-11.782,0-21.333-9.551-21.333-21.333v-128c0-11.782,9.551-21.333,21.333-21.333c11.782,0,21.333,9.551,21.333,21.333V362.667z M174.315,85.333c9.074-25.551,33.238-42.634,60.352-42.667h42.667c27.114,0.033,51.278,17.116,60.352,42.667H174.315z" />
    </svg>
  );
});

export function TripRecordItem({ id, title, period, onDelete, onTitleClick }: TripRecordItemProps) {
  const handleTitleClick = useCallback(() => {
    onTitleClick(id);
  }, [id, onTitleClick]);
  const handleDelete = useCallback(() => onDelete(id), [id, onDelete]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex min-w-0 items-start gap-2">
        <ReceiptIcon />
        <div className="min-w-0">
          <button
            type="button"
            onClick={handleTitleClick}
            className="block max-w-full cursor-pointer truncate text-left text-md font-semibold text-text-primary underline underline-offset-2"
          >
            {title}
          </button>
          <p className="mt-1 text-sm font-medium text-sub-darkgray">{period}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        aria-label={`${title} 여행 기록 삭제`}
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[8px] bg-sub-coral"
      >
        <TrashIcon />
      </button>
    </div>
  );
}

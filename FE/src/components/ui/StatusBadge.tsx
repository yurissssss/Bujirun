import { cn } from "@/shared/utils";

export type PlaceStatus = "completed" | "verify" | "pending" | "uncollected" | "collected";

interface StatusBadgeProps {
  status: PlaceStatus;
  className?: string;
}

const STATUS_CONFIG: Record<PlaceStatus, { label: string; style: string }> = {
  completed: {
    label: "수집 완료",
    style: "bg-sub-gray text-white",
  },
  verify: {
    label: "인증하기",
    style: "bg-sub-pink text-white",
  },
  pending: {
    label: "인증하기",
    style: "bg-sub-pink text-white",
  },
  uncollected: {
    label: "미수집",
    style: "bg-sub-pink text-white",
  },
  collected: {
    label: "수집",
    style: "bg-main-blue text-white",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, style } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "py-1 px-2 rounded-md",
        "text-2xs font-semibold",
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}

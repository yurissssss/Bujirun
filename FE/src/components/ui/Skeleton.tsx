import type { HTMLAttributes } from "react";
import { cn } from "@/shared/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-lg bg-system-searchbg before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-shimmer_1.6s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-main-white/75 before:to-transparent motion-reduce:before:animate-none",
        className,
      )}
      {...props}
    />
  );
}

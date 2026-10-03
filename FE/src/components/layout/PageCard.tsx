import type { ReactNode } from "react";
import { cn } from "@/shared/utils";

interface PageCardProps {
  children?: ReactNode;
  className?: string;
}

export function PageCard({ children, className }: PageCardProps) {
  return (
    <div className="flex h-full flex-col relative -mx-6">
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden rounded-tl-[40px] rounded-tr-[40px] bg-white px-6 pt-8 pb-4",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

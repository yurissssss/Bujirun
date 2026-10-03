"use client";

import Image from "next/image";
import faceImg from "@/assets/character/face.png";
import { cn } from "@/shared/utils";
import { buildAvatarRows } from "../utils/avatarLayout";

function ParticipantAvatar({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "relative flex size-[72px] items-center justify-center overflow-hidden rounded-full",
        active ? "bg-main-blue" : "border-2 border-dashed border-main-blue bg-sub-lightblue",
      )}
    >
      <div
        className={cn(
          "relative size-[84px] shrink-0 rounded-full",
          !active && "opacity-30 grayscale",
        )}
      >
        <Image src={faceImg} alt="" fill sizes="84px" className="object-cover" aria-hidden />
      </div>
    </div>
  );
}

interface ParticipantAvatarGridProps {
  total: number;
  activeCount: number;
  className?: string;
}

export function ParticipantAvatarGrid({
  total,
  activeCount,
  className,
}: ParticipantAvatarGridProps) {
  const rows = buildAvatarRows(total);

  return (
    <div className={cn("flex flex-col items-center gap-y-3", className)}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-x-4">
          {row.map((idx) => (
            <ParticipantAvatar key={idx} active={idx < activeCount} />
          ))}
        </div>
      ))}
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/shared/utils";

interface VotePlaceCardProps {
  imageUrl: string;
  name?: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function VotePlaceCard({
  imageUrl,
  name,
  isSelected,
  onClick,
  className,
}: VotePlaceCardProps) {
  return (
    <div className={cn("flex flex-col gap-1 cursor-pointer", className)} onClick={onClick}>
      <div
        className={cn(
          "relative w-[72px] h-[56px] rounded-xl overflow-hidden",
          isSelected && "ring-2 ring-main-blue",
        )}
      >
        <Image src={imageUrl} alt={name ?? ""} fill sizes="72px" className="object-cover" />
      </div>
      {name && <p className="text-xs text-text-primary text-center truncate w-[72px]">{name}</p>}
    </div>
  );
}

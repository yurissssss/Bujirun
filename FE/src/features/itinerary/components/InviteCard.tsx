import Image from "next/image";
import { cn } from "@/shared/utils";
import { Card } from "@/components";

interface Friend {
  imageUrl?: string;
}

interface InviteCardProps {
  friends: Friend[];
  total: number;
  onInvite?: () => void;
  className?: string;
}

export function InviteCard({ friends, total, onInvite, className }: InviteCardProps) {
  const slots = Array.from({ length: total });

  return (
    <Card
      variant="glass-lg"
      className={cn("flex flex-col items-center gap-4 px-6 py-6", className)}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-semibold text-md text-text-heading leading-relaxed">
          친구들이 모두 모이면{"\n"}일정을 짜러 갈 수 있어요 🐾
        </p>
        <p className="text-md text-sub-gray">
          ({friends.length}/{total})
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 justify-items-center">
        {slots.map((_, i) => {
          const friend = friends[i];
          return (
            <div
              key={i}
              className={cn(
                "size-14 rounded-full overflow-hidden",
                !friend && "border-2 border-dashed border-sub-lightgray bg-transparent",
              )}
            >
              {friend?.imageUrl && (
                <div className="relative w-full h-full">
                  <Image
                    src={friend.imageUrl}
                    alt={`friend-${i}`}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={onInvite}>
        <span className="text-md text-sub-deepblue underline underline-offset-2">
          친구 초대하기
        </span>
      </button>
    </Card>
  );
}

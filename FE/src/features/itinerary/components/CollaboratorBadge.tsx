import Image from "next/image";
import { PROFILE_IMAGES } from "@/components/profile/profileImages";
import { cn } from "@/shared/utils";
import type { CollaboratorInfo } from "@/features/itinerary/collab/useCollaborativeItinerary";

// profileImageUrl이 숫자 문자열("1"~"9")이면 프리셋 로컬 이미지를 가리킨다
// (mypage/components/MypageProfile.tsx의 resolveProfileImage와 동일한 규칙).
function resolveAvatarSrc(avatarUrl?: string) {
  if (!avatarUrl) return null;
  const id = Number(avatarUrl);
  if (!isNaN(id)) return PROFILE_IMAGES.find((img) => img.id === id)?.src ?? null;
  return avatarUrl;
}

const MAX_VISIBLE = 3;

// 지금 이 항목을 보고 있는 다른 참여자들을 겹친 원형 아바타로 표시한다.
export function CollaboratorBadge({ editors }: { editors: CollaboratorInfo[] }) {
  if (editors.length === 0) return null;
  const visible = editors.slice(0, MAX_VISIBLE);
  const overflow = editors.length - visible.length;

  return (
    <div className="flex items-center -space-x-1">
      {visible.map((editor, idx) => {
        const avatarSrc = resolveAvatarSrc(editor.avatarUrl);
        return (
          <div
            key={editor.id ?? `${editor.name}-${idx}`}
            className={cn(
              "relative flex size-[30px] items-center justify-center overflow-hidden rounded-full border border-main-white",
              editor.colorClass,
            )}
            title={editor.name}
          >
            {avatarSrc ? (
              <Image src={avatarSrc} alt={editor.name} fill sizes="30px" className="object-cover" />
            ) : (
              <span className="text-[10px] font-semibold text-main-white">
                {editor.name.slice(0, 1)}
              </span>
            )}
          </div>
        );
      })}
      {overflow > 0 && (
        <div className="flex size-[30px] items-center justify-center rounded-full border border-main-white bg-sub-gray">
          <span className="text-[10px] font-semibold text-main-white">+{overflow}</span>
        </div>
      )}
    </div>
  );
}

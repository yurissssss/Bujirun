"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Modal, LoadingBoundary } from "@/components";
import { PROFILE_IMAGES } from "@/components/profile/profileImages";
import { groupApi } from "@/shared/api/domains";
import { buildAvatarRows } from "../utils/avatarLayout";

interface TripMembersModalProps {
  isOpen: boolean;
  groupId: string;
  onClose: () => void;
}

function resolveProfileImage(profileImageUrl: string | undefined, fallbackIndex: number) {
  const value = profileImageUrl?.trim();
  const presetId = value ? Number(value) : NaN;
  const presetImage = Number.isInteger(presetId)
    ? PROFILE_IMAGES.find((image) => image.id === presetId)
    : undefined;

  if (presetImage) return { src: presetImage.src, isPreset: true };

  if (value && /^(https?:\/\/|\/)/.test(value)) {
    return { src: value, isPreset: false };
  }

  return {
    src: PROFILE_IMAGES[fallbackIndex % PROFILE_IMAGES.length].src,
    isPreset: true,
  };
}

export function TripMembersModal({ isOpen, groupId, onClose }: TripMembersModalProps) {
  const { data: members, isLoading } = useQuery({
    queryKey: groupApi.keys.members(groupId),
    queryFn: () => groupApi.getGroupMembers(groupId),
    enabled: isOpen && !!groupId,
    // 누가 여행에서 나가도 다른 멤버 화면엔 알림이 오지 않는다. 전역 캐시(60초)를 그대로
    // 보여주면 새로고침 전까지 나간 사람이 남아 있으므로, 열 때 새로 받고 열려 있는 동안은
    // 초대 화면과 같은 간격(3초)으로 다시 받아온다.
    refetchOnMount: "always",
    refetchInterval: 3000,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="여행 멤버" hideActions childrenVariant="plain">
      <div className="w-full">
        {isLoading ? (
          <div className="flex min-h-[180px] w-full items-center justify-center">
            <LoadingBoundary isLoading variant="inline" message="멤버를 불러오는 중이에요">
              <div />
            </LoadingBoundary>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-y-4">
            {members &&
              buildAvatarRows(members.length).map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-x-4">
                  {row.map((i) => {
                    const member = members[i];

                    const profileImage = resolveProfileImage(member.profileImageUrl, i);

                    return (
                      <div
                        key={member.userId}
                        className="flex w-[64px] flex-col items-center gap-1.5"
                      >
                        <div className="relative size-[64px] shrink-0 overflow-hidden rounded-full bg-sub-lightblue">
                          <Image
                            src={profileImage.src}
                            alt=""
                            fill
                            sizes="64px"
                            unoptimized={!profileImage.isPreset}
                            className={
                              profileImage.isPreset
                                ? "object-cover scale-[1.27] origin-[center_10%]"
                                : "object-cover"
                            }
                            aria-hidden
                          />
                        </div>

                        <span className="flex max-w-full items-baseline justify-center gap-0.5 truncate text-sm font-semibold text-text-primary">
                          {member.isLeader && (
                            <span aria-label="방장" className="text-xs leading-none">
                              👑
                            </span>
                          )}
                          <span className="truncate">{member.nickname ?? "친구"}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

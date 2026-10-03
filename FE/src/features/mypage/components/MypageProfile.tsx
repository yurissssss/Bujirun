"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ProfileImageSelectModal } from "./ProfileImageSelectModal";
import { NicknameInlineEdit, type NicknameInlineEditRef } from "./NicknameInlineEdit";
import { ProfileStats } from "./ProfileStats";
import { PROFILE_IMAGES } from "@/components/profile/profileImages";
import { Toast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import type { Category } from "@/components/ui/CategoryChip";
import { userApi, travelLogApi, spotApi } from "@/shared/api/domains";
import { SPOT_LIST_STALE_TIME_MS } from "@/shared/api/domains/spot";
import { getCategoryFromKo } from "@/shared/constants/category";
import { CollectionProgress } from "./CollectionProgress";

const AVATAR_SIZE = 100;

function resolveProfileImage(profileImageUrl?: string | null) {
  if (!profileImageUrl) return PROFILE_IMAGES[0];

  const id = Number(profileImageUrl);
  if (!isNaN(id)) {
    return PROFILE_IMAGES.find((img) => img.id === id) ?? PROFILE_IMAGES[0];
  }

  if (profileImageUrl.startsWith("http://") || profileImageUrl.startsWith("https://")) {
    return { id: -1, src: profileImageUrl };
  }

  return PROFILE_IMAGES[0];
}

export function MypageProfile() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const nicknameEditRef = useRef<NicknameInlineEditRef>(null);

  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isNicknameDuplicate, setIsNicknameDuplicate] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: userApi.keys.me(),
    queryFn: userApi.getMyProfile,
  });

  const { data: myLogs = [] } = useQuery({
    queryKey: travelLogApi.keys.mine(),
    queryFn: () => travelLogApi.getMyLogs(),
  });

  const { data: spots = [] } = useQuery({
    queryKey: spotApi.keys.search(),
    queryFn: () => spotApi.searchSpots(),
    staleTime: SPOT_LIST_STALE_TIME_MS,
  });

  const collectedPlaces = useMemo(
    () => spots.filter((spot) => spot.isCollection && spot.collected),
    [spots],
  );

  const collectedCount = collectedPlaces.length;

  const totalCollectionCount = useMemo(
    () => spots.filter((spot) => spot.isCollection).length,
    [spots],
  );

  const favoriteCategory = useMemo(() => {
    const count = collectedPlaces.reduce<Partial<Record<Category, number>>>((acc, place) => {
      const collectionCategory = getCategoryFromKo(place.collectionCategory, place.name);
      acc[collectionCategory] = (acc[collectionCategory] ?? 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(count).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));
    return sorted[0]?.[0] as Category | undefined;
  }, [collectedPlaces]);

  const { mutate: updateNickname } = useMutation({
    mutationFn: (nickname: string) => userApi.updateMyProfile({ nickname }),
    onSuccess: () => {
      setIsNicknameDuplicate(false);
      queryClient.invalidateQueries({ queryKey: userApi.keys.me() });
      showToast("닉네임이 변경되었어요", "success");
      nicknameEditRef.current?.closeEdit();
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setIsNicknameDuplicate(true);
        return;
      }
      showToast("닉네임 변경에 실패했어요", "error");
    },
  });

  const { mutate: updateProfileImage } = useMutation({
    mutationFn: (imageId: number) => userApi.updateMyProfile({ profileImageUrl: String(imageId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userApi.keys.me() });
      showToast("프로필 사진이 변경되었어요", "success");
    },
    onError: () => {
      showToast("프로필 사진 변경에 실패했어요", "error");
    },
  });

  const showToast = useCallback((message: string, variant: "success" | "error") => {
    setToastMessage(message);
    setToastVariant(variant);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => setToastVisible(false), []);

  const handleNicknameValueChange = useCallback(() => {
    setIsNicknameDuplicate(false);
  }, []);

  const currentImage = resolveProfileImage(profile?.profileImageUrl);
  const nickname = profile?.nickname ?? "";
  const currentImageId = currentImage.id !== -1 ? currentImage.id : null;

  if (isLoading) {
    return (
      <Card variant="white" className="w-full pt-[24px] pb-[24px]">
        <div className="flex flex-col items-center gap-5">
          <div
            style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
            className="rounded-full bg-system-navbg animate-pulse"
          />
          <div className="h-5 w-20 rounded bg-system-navbg animate-pulse" />
          <div className="h-14 w-full rounded-2xl bg-system-navbg animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card variant="white" className="w-full py-8">
        <div className="flex flex-col items-center gap-4">
          <div
            style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
            className="relative shrink-0 rounded-full"
          >
            <button
              type="button"
              aria-label="프로필 사진 변경"
              onClick={() => setIsProfileImageModalOpen(true)}
              style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
              className="group relative shrink-0 rounded-full active:scale-[0.98]"
            >
              {/* 흐르는 테두리 */}
              <div
                className="absolute inset-0 rounded-full 
              bg-main-blue 
              group-hover:bg-[conic-gradient(var(--color-main-blue),var(--color-sub-violet),var(--color-main-white),var(--color-main-blue),var(--color-sub-violet),var(--color-main-white),var(--color-main-blue))] 
              group-hover:animate-spin-border"
              />
              {/* 프로필 이미지 */}
              <div className="absolute inset-[2px] overflow-hidden rounded-full bg-system-navbg">
                <Image
                  src={currentImage.src}
                  alt={`${nickname} 프로필 이미지`}
                  fill
                  sizes="100px"
                  className="object-cover scale-[1.27] origin-[center_10%]"
                />
              </div>
            </button>
          </div>

          <NicknameInlineEdit
            ref={nicknameEditRef}
            nickname={nickname}
            isDuplicate={isNicknameDuplicate}
            onConfirm={(newNickname) => updateNickname(newNickname)}
            onValueChange={handleNicknameValueChange}
          />

          <div className="w-full px-4 mt-2 mb-1">
            <CollectionProgress collectedCount={collectedCount} totalCount={totalCollectionCount} />
          </div>

          <ProfileStats
            travelLogCount={myLogs.length}
            collectedCount={collectedCount}
            favoriteCategory={favoriteCategory}
            onTravelLogClick={() => router.push("/collection/records")}
            onCollectedClick={() => router.push("/collection/records?view=places")}
          />
        </div>
      </Card>

      <ProfileImageSelectModal
        key={currentImageId}
        isOpen={isProfileImageModalOpen}
        onClose={() => setIsProfileImageModalOpen(false)}
        images={PROFILE_IMAGES}
        currentId={currentImageId}
        onConfirm={(id) => updateProfileImage(id)}
      />

      <Toast
        isVisible={toastVisible}
        onHide={hideToast}
        message={toastMessage}
        variant={toastVariant}
      />
    </>
  );
}

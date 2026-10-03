import profile01 from "@/assets/character/profile/profile_01.png";
import profile02 from "@/assets/character/profile/profile_02.png";
import profile03 from "@/assets/character/profile/profile_03.png";
import profile04 from "@/assets/character/profile/profile_04.png";
import profile05 from "@/assets/character/profile/profile_05.png";
import profile06 from "@/assets/character/profile/profile_06.png";
import profile07 from "@/assets/character/profile/profile_07.png";
import profile08 from "@/assets/character/profile/profile_08.png";
import profile09 from "@/assets/character/profile/profile_09.png";

export const PROFILE_IMAGES = [
  { id: 1, src: profile01 },
  { id: 2, src: profile02 },
  { id: 3, src: profile03 },
  { id: 4, src: profile04 },
  { id: 5, src: profile05 },
  { id: 6, src: profile06 },
  { id: 7, src: profile07 },
  { id: 8, src: profile08 },
  { id: 9, src: profile09 },
];

export function resolveProfileImage(profileImageUrl?: string) {
  if (!profileImageUrl) return PROFILE_IMAGES[0].src;
  const id = Number(profileImageUrl);
  if (!Number.isNaN(id)) {
    return PROFILE_IMAGES.find((image) => image.id === id)?.src ?? PROFILE_IMAGES[0].src;
  }
  return profileImageUrl;
}

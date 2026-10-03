import { cache } from "react";

interface InvitePreviewResponse {
  success?: boolean;
  data?: {
    groupName?: string;
    inviterNickname?: string;
    memberCount?: number;
  };
}

export interface InvitePreview {
  groupName: string;
  inviterNickname: string;
  memberCount: number;
}

export const getInvitePreview = cache(async (code: string): Promise<InvitePreview | null> => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) return null;

  try {
    const response = await fetch(
      `${apiBaseUrl.replace(/\/$/, "")}/api/groups/invites/${encodeURIComponent(code)}/preview`,
      { next: { revalidate: 60 } },
    );
    if (!response.ok) return null;

    const result = (await response.json()) as InvitePreviewResponse;
    const groupName = result.data?.groupName?.trim();
    const inviterNickname = result.data?.inviterNickname?.trim();
    const memberCount = result.data?.memberCount;
    if (!groupName || !inviterNickname || typeof memberCount !== "number") return null;

    return { groupName, inviterNickname, memberCount };
  } catch {
    return null;
  }
});

export function getInviteCopy(preview: InvitePreview | null) {
  if (!preview) {
    return {
      title: "부지런 여행 초대장이 도착했어요 🌊",
      description: "친구와 함께 부산 여행 일정을 만들어봐요 🤩",
    };
  }

  return {
    title: `${preview.inviterNickname}님이 ‘${preview.groupName}’에 초대했어요 🌊`,
    description: "부지런에서 함께 부산 여행 일정을 만들어봐요 🤩",
  };
}

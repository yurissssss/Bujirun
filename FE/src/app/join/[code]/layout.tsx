import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getInviteCopy, getInvitePreview } from "./invitePreview";

interface JoinLayoutProps {
  children: ReactNode;
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: JoinLayoutProps): Promise<Metadata> {
  const { code } = await params;
  const copy = getInviteCopy(await getInvitePreview(code));
  const invitePath = `/join/${encodeURIComponent(code)}`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: invitePath },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: invitePath,
      siteName: "부지런",
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
    },
  };
}

export default function JoinLayout({ children }: JoinLayoutProps) {
  return children;
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import kakaoTalkIcon from "@/assets/icons/itinerary/kakaotalk.png";
import LinkIcon from "@/assets/icons/itinerary/link.svg?svgr";
import { Modal, Card, Toast } from "@/components";
import { initKakaoShare, shareInviteLink } from "@/shared/utils/kakaoShare";

interface ShareInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  imageUrl: string;
  inviteUrl: string;
}

function getShortUrl(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function ShareInviteModal({
  isOpen,
  onClose,
  title,
  description,
  imageUrl,
  inviteUrl,
}: ShareInviteModalProps) {
  const [kakaoReady, setKakaoReady] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    void initKakaoShare().then((ready) => {
      if (active) setKakaoReady(ready);
    });
    return () => {
      active = false;
    };
  }, [isOpen]);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const copyInviteUrl = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = inviteUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("copy failed");
      }
      setToast({ message: "링크가 복사되었어요!", variant: "success" });
      onClose();
    } catch {
      setToast({ message: "링크를 복사하지 못했어요.", variant: "error" });
    }
  };

  const handleCopyLink = () => void copyInviteUrl();

  const handleKakaoShare = () => {
    if (!kakaoReady) {
      setToast({
        message: "카카오톡 공유를 준비 중이에요. 잠시 후 다시 눌러주세요.",
        variant: "error",
      });
      void initKakaoShare().then((ready) => {
        setKakaoReady(ready);
        if (!ready)
          setToast({
            message: "카카오톡 공유를 준비하지 못했어요. 다시 시도해 주세요.",
            variant: "error",
          });
      });
      return;
    }
    const shared = shareInviteLink({ title, description, imageUrl, inviteUrl });
    if (shared) {
      onClose();
      return;
    }
    setToast({ message: "카카오톡 공유를 열지 못했어요. 다시 시도해 주세요.", variant: "error" });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="공유하기" hideActions childrenVariant="plain">
        <div className="flex w-full flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => void handleKakaoShare()}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-system-glassborder bg-main-white px-3 py-2 active:opacity-70"
            >
              <Image
                src={kakaoTalkIcon}
                alt=""
                width={32}
                height={32}
                className="shrink-0"
                aria-hidden
              />
              <span className="text-sm font-semibold text-text-heading">카카오톡</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-system-glassborder bg-main-white px-3 py-2 active:opacity-70"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-system-searchbg">
                <LinkIcon width={14} height={14} className="fill-sub-gray" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-text-heading">링크 복사</span>
            </button>
          </div>

          {/* 여행명·닉네임이 길면 제목이 두 줄, 기간이 붙은 설명이 세 줄까지 늘어난다.
              줄 수를 넉넉히 잡고 leading을 맞춰야 마지막 줄이 잘리거나 붙어 보이지 않는다. */}
          <Card variant="glass-sm" className="flex flex-col gap-1 rounded-xl px-4 py-3 text-left">
            <p className="font-semibold text-sm text-text-heading leading-[1.45] break-keep line-clamp-2">
              {title}
            </p>
            <p className="text-xs text-sub-gray leading-[1.5] break-keep whitespace-pre-line line-clamp-3">
              {description}
            </p>
            <p className="text-xs font-medium text-main-blue truncate">{getShortUrl(inviteUrl)}</p>
          </Card>
        </div>
      </Modal>

      <Toast
        isVisible={toast !== null}
        onHide={() => setToast(null)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
      />
    </>
  );
}

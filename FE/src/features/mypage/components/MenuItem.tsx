"use client";

import Image from "next/image";
import type { StaticImageData } from "next/image";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";

interface MenuItemProps {
  icon?: ComponentType<LucideProps>;
  iconSrc?: StaticImageData | string;
  label: string;
  onClick?: () => void;
}

export function MenuItem({ icon: Icon, iconSrc, label, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full flex flex-row items-center gap-[12px]
        px-[20px] h-[55px]
        rounded-[15px] border-[0.5px] border-main-blue
        bg-main-white backdrop-blur-[15px]
        text-left
        active:scale-[0.98] transition-transform duration-100
      "
    >
      {iconSrc ? (
        <Image src={iconSrc} alt="" width={18} height={18} aria-hidden />
      ) : Icon ? (
        <Icon size={18} strokeWidth={2} className="text-text-primary" aria-hidden />
      ) : null}
      <span className="font-ssurround font-bold text-lg text-text-primary">{label}</span>
    </button>
  );
}

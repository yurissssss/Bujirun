"use client";

import Image from "next/image";

import kakaoMapLogo from "@/assets/icons/home/kakaomap_horizontal_ko.png";
import { TransportOptionCard } from "@/features/home/components/TransportOptionCard";
import type { TransportGroup, TransportOption } from "@/features/home/types/transport";

interface TransportSelectContentProps {
  transportGroup: TransportGroup;
  selectedOptionId: string;
  onSelect: (option: TransportOption) => void;
  onKakaoMapClick?: () => void;
}

export function TransportSelectContent({
  transportGroup,
  selectedOptionId,
  onSelect,
  onKakaoMapClick,
}: TransportSelectContentProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-start">
        <button
          type="button"
          className="rounded-lg bg-main-blue px-2.5 py-1 active:opacity-80"
          onClick={onKakaoMapClick}
        >
          <Image src={kakaoMapLogo} alt="카카오맵" width={60} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {transportGroup.options.map((option) => {
          const isSelected = option.id === selectedOptionId;

          return (
            <button
              key={option.id}
              type="button"
              className="text-left active:opacity-80"
              onClick={() => onSelect(option)}
            >
              <TransportOptionCard option={option} selected={isSelected} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

import type {
  TransportGroup,
  TransportOption,
  TransportType,
} from "@/features/home/types/transport";
import { cn } from "@/shared/utils";
import { TransportIcon } from "@/features/home/components/TransportIcons";
import { TransportLegItem } from "@/features/home/components/TransportLegItem";
import { formatTransportMeta } from "@/features/home/utils/formatTransportMeta";
import Image from "next/image";
import kakaoMapLogo from "@/assets/icons/home/kakaomap_horizontal_ko.png";

interface TransportDetailProps {
  transportGroup: TransportGroup;
  selectedOption: TransportOption;
  onKakaoMapClick?: () => void;
}

const TRANSPORT_COLORS: Record<TransportType, string> = {
  버스: "bg-main-blue",
  지하철: "bg-sub-pink",
  도보: "bg-sub-green",
  택시: "bg-sub-violet",
};

export function TransportDetail({
  transportGroup,
  selectedOption,
  onKakaoMapClick,
}: TransportDetailProps) {
  const { fromPlace, toPlace } = transportGroup;
  const { steps } = selectedOption;
  const metaText = formatTransportMeta(selectedOption);
  return (
    <div className="relative flex w-full min-w-0 flex-col gap-3 py-4">
      <div className="mb-1 flex min-w-0 items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-lg bg-main-blue px-2.5 py-1 active:opacity-80"
          onClick={onKakaoMapClick}
        >
          <Image src={kakaoMapLogo} alt="카카오맵" width={60} />
        </button>

        <span className="min-w-0 truncate text-sm font-semibold text-sub-darkgray">{metaText}</span>
      </div>
      <div
        className="pointer-events-none absolute bottom-[28px] left-[14px] top-[68px] w-[1.5px]"
        aria-hidden="true"
      >
        <div className="h-full w-full bg-[repeating-linear-gradient(to_bottom,var(--color-sub-gray)_0_4px,transparent_4px_9px)]" />
      </div>

      <div className="flex min-w-0 items-center gap-3 mb-2">
        <div className="relative z-10 flex size-7 shrink-0 items-center justify-center">
          <span className="size-3.5 rounded-full bg-sub-gray" />
        </div>
        <span className="min-w-0 break-words text-md font-semibold text-text-primary">
          {fromPlace ?? "출발 장소"}
        </span>
      </div>

      {steps.map((step) => (
        <div key={`${step.type}-${step.routeName}`} className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "relative z-10 flex size-7.5 shrink-0 items-center justify-center rounded-[12px]",
              TRANSPORT_COLORS[step.type],
            )}
          >
            <TransportIcon type={step.type} />
          </div>
          <TransportLegItem leg={step} />
        </div>
      ))}

      <div className="flex items-center gap-3 mt-2">
        <div className="relative z-10 flex size-7 shrink-0 items-center justify-center">
          <span className="size-3.5 rounded-full bg-sub-gray" />
        </div>
        <span className="truncate text-md font-semibold text-text-primary">
          {toPlace ?? "도착 장소"}
        </span>
      </div>
    </div>
  );
}

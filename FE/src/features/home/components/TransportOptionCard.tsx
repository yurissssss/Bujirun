import { cn } from "@/shared/utils";
import { TransportIcon } from "@/features/home/components/TransportIcons";
import type { TransportOption } from "@/features/home/types/transport";
import { formatTransportMeta } from "@/features/home/utils/formatTransportMeta";

const TRANSPORT_COLORS = {
  버스: "bg-main-blue",
  지하철: "bg-sub-pink",
  도보: "bg-sub-green",
  택시: "bg-sub-violet",
} as const;

interface TransportOptionCardProps {
  option: TransportOption;
  selected?: boolean;
  className?: string;
}

export function TransportOptionCard({
  option,
  selected = false,
  className,
}: TransportOptionCardProps) {
  const metaText = formatTransportMeta(option);

  return (
    <div
      className={cn(
        "rounded-[14px] border border-main-blue px-4 py-3",
        selected ? "bg-system-navbg" : "bg-main-white",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        {option.steps.map((step, index) => (
          <div key={`${step.type}-${index}`} className="flex items-start gap-2 text-sm">
            <div
              className={cn(
                "mt-0.5 flex size-7.5 shrink-0 items-center justify-center rounded-[12px]",
                TRANSPORT_COLORS[step.type],
              )}
            >
              <TransportIcon type={step.type} className="size-4 fill-main-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-md font-semibold text-text-primary">{step.routeName}</p>
                {index === 0 && (
                  <span className="shrink-0 text-sm font-medium text-sub-deepblue">{metaText}</span>
                )}
              </div>
              <p className="mt-1 break-words text-xs text-sub-darkgray">
                {step.from}
                <svg
                  viewBox="0 0 24 24"
                  className="mx-1 inline size-3 shrink-0 fill-sub-darkgray align-middle"
                  aria-hidden="true"
                >
                  <path d="M18,12h0a2,2,0,0,0-.59-1.4l-4.29-4.3a1,1,0,0,0-1.41,0,1,1,0,0,0,0,1.42L15,11H5a1,1,0,0,0,0,2H15l-3.29,3.29a1,1,0,0,0,1.41,1.42l4.29-4.3A2,2,0,0,0,18,12Z" />
                </svg>
                {step.to}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

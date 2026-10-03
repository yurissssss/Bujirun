import MarkerIcon from "@/assets/icons/itinerary/marker.svg?svgr";
import type { PlaceStatus } from "@/components/ui/StatusBadge";
import { cn } from "@/shared/utils";

interface PlaceMarkerProps {
  status?: PlaceStatus;
  size?: number;
}

export function PlaceMarker({ status, size = 13 }: PlaceMarkerProps) {
  return (
    <MarkerIcon
      width={size}
      height={size}
      className={cn("shrink-0", status === "completed" ? "fill-sub-gray" : "fill-sub-pink")}
      aria-hidden
    />
  );
}

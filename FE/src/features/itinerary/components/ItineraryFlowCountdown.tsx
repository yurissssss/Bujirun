import { formatRemainingTime } from "@/features/itinerary/hooks/useItineraryFlowTimer";

interface ItineraryFlowCountdownProps {
  remainingMs: number;
  isHost: boolean;
}

export function ItineraryFlowCountdown({ remainingMs, isHost }: ItineraryFlowCountdownProps) {
  return (
    <p className="text-center font-paperlogy text-sm font-normal text-sub-darkgray">
      {isHost ? (
        <>
          <span className="font-paperlogy text-md font-bold text-sub-deepblue">
            {formatRemainingTime(remainingMs)}
          </span>{" "}
          후 다음 단계로 넘어갈 수 있어요
        </>
      ) : (
        <>
          <span className="font-paperlogy text-md font-bold text-sub-deepblue">
            {formatRemainingTime(remainingMs)}
          </span>{" "}
          후 방장이 다음 단계로 넘어갈 수 있어요
        </>
      )}
    </p>
  );
}

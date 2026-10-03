"use client";

import { formatTransportDuration } from "@/shared/utils/formatTransportDuration";
import Image from "next/image";
import dynamic from "next/dynamic";
import characterImg from "@/assets/character/map.png";
import removeIcon from "@/assets/icons/itinerary/remove.svg?url";
import magicWandIcon from "@/assets/icons/itinerary/magic-wand.svg?url";
import { Modal, TimePicker } from "@/components";
import { openKakaoMapRoute } from "./transportRoute";
import type { TransportGroup, TransportOption } from "@/features/home/types/transport";
import type { RouteOption } from "./transportRoute";
import type { BaseStop } from "../utils/scheduleUtils";
import { buildTransportOptionsFromApi } from "../utils/scheduleUtils";
import type { components } from "@/shared/api/schema";

const ArrivalVerifyModal = dynamic(() =>
  import("./ArrivalVerifyModal").then((module) => module.ArrivalVerifyModal),
);
const AiOptimizeModal = dynamic(() =>
  import("./AiOptimizeModal").then((module) => module.AiOptimizeModal),
);
const AiOptimizeLoadingModal = dynamic(() =>
  import("./AiOptimizeLoadingModal").then((module) => module.AiOptimizeLoadingModal),
);
const TripMembersModal = dynamic(() =>
  import("./TripMembersModal").then((module) => module.TripMembersModal),
);
const TransportDetailModal = dynamic(() =>
  import("@/features/home/components/TransportDetailModal").then(
    (module) => module.TransportDetailModal,
  ),
);

export type ModalType =
  | "optimize"
  | "optimizing"
  | "delete"
  | "time"
  | "transport"
  | "verify"
  | "peerUpdate"
  | "members";

interface ItineraryModalsProps {
  modal: ModalType | null;
  activeStop: BaseStop | undefined;
  activeNextStop?: BaseStop;
  itineraryId: string;
  groupId?: string;
  // GET .../travel-mode/options 조회 결과 — 지하철 전용/버스 전용/버스+지하철 조합/도보/택시
  // 후보와 각각의 실제 요금·소요시간. transport 모달이 열려있을 때만 채워진다.
  travelModeOptions?: components["schemas"]["TransitOption"][];
  timeValue: { hour: number; minute: number };
  selectedRouteOptionId: string;
  peerUpdateMessage?: string;
  onClose: () => void;
  onConfirmDelete: () => void;
  onConfirmTime: () => void;
  onConfirmTransport: (option: RouteOption) => Promise<boolean>;
  onConfirmVerify: () => void;
  onVerifyContinue?: () => void;
  onTimeChange: (value: { hour: number; minute: number }) => void;
  onOptimizeStart: () => void;
  isOptimizeDone?: boolean;
  accommodationName?: string;
}

export function ItineraryModals({
  modal,
  activeStop,
  activeNextStop,
  itineraryId,
  groupId,
  travelModeOptions,
  timeValue,
  selectedRouteOptionId,
  peerUpdateMessage,
  onClose,
  onConfirmDelete,
  onConfirmTime,
  onConfirmTransport,
  onConfirmVerify,
  onVerifyContinue,
  onTimeChange,
  onOptimizeStart,
  isOptimizeDone,
  accommodationName,
}: ItineraryModalsProps) {
  return (
    <>
      {modal === "optimize" && (
        <AiOptimizeModal
          isOpen
          onClose={onClose}
          onConfirm={onOptimizeStart}
          accommodationName={accommodationName}
        />
      )}

      {modal === "optimizing" && (
        <AiOptimizeLoadingModal
          isOpen
          onClose={onClose}
          onComplete={onClose}
          isDone={isOptimizeDone}
        />
      )}

      {modal === "members" && <TripMembersModal isOpen groupId={groupId ?? ""} onClose={onClose} />}

      {/* 다른 참여자가 여행 로그를 불러와 일정이 통째로 바뀌었을 때 알려주는 안내 팝업 —
          짧게 보여주고 자동으로 닫힌다(호출부의 타이머가 onClose를 부름). */}
      <Modal
        isOpen={modal === "peerUpdate"}
        onClose={onClose}
        icon={
          <Image
            src={magicWandIcon}
            alt=""
            width={22}
            height={22}
            className="icon-coral"
            aria-hidden
          />
        }
        title="일정이 업데이트됐어요"
        description={peerUpdateMessage}
        hideActions
        hideCloseButton
      />

      <Modal
        isOpen={modal === "delete"}
        onClose={onClose}
        icon={
          <Image
            src={removeIcon}
            alt=""
            width={25}
            height={25}
            className="icon-coral"
            aria-hidden
          />
        }
        iconClassName="size-[48px]"
        title="일정 삭제"
        description={`'${activeStop?.placeName ?? "관광지"}'을(를)\n일정에서 삭제하시겠어요?`}
        childrenVariant="card"
        confirmText="삭제하기"
        cancelText="취소"
        confirmVariant="warning"
        onConfirm={onConfirmDelete}
        onCancel={onClose}
      >
        <p className="text-center font-medium text-sub-darkgray">
          * 삭제한 일정은 복구할 수 없어요.
        </p>
      </Modal>

      <TimePicker
        isOpen={modal === "time"}
        hour={timeValue.hour}
        minute={timeValue.minute}
        onChange={(h, m) => onTimeChange({ hour: h, minute: m })}
        onConfirm={onConfirmTime}
        onClose={onClose}
      />

      {(() => {
        const fromPlace = activeStop?.transport?.from ?? "출발 장소";
        const toPlace = activeStop?.transport?.to ?? "도착 장소";
        const routeOptions = buildTransportOptionsFromApi(travelModeOptions, fromPlace, toPlace);
        const transportGroup: TransportGroup = {
          fromPlace,
          toPlace,
          selectedOptionId: selectedRouteOptionId,
          options: routeOptions.map((option) => ({
            id: option.id,
            durationText: formatTransportDuration(option.durationMin),
            costText: `${(option.cost ?? 0).toLocaleString()}원`,
            isRecommended: option.isRecommended,
            steps: option.legs.map((leg) => ({
              type: leg.type,
              routeName: leg.routeName,
              from: leg.from,
              to: leg.to,
              // 실시간 도착정보 조회 파라미터 — 여기서 빠뜨리면 모달 안 배지가 파라미터
              // 없이 조회를 시도해 "실시간 정보 없음"만 뜬다.
              arsId: leg.arsId,
              routeNo: leg.routeNo,
              stationId: leg.stationId,
              wayCode: leg.wayCode,
              walkAfterMin: leg.walkAfterMin,
            })),
          })),
        };

        const handleChange = async (option: TransportOption) => {
          const original = routeOptions.find((routeOption) => routeOption.id === option.id);
          if (!original) return false;
          return onConfirmTransport(original);
        };

        return modal === "transport" && routeOptions.length > 0 ? (
          <TransportDetailModal
            // travelModeOptions는 모달이 열린 뒤 비동기로 조회되므로, 응답이 오기 전(첫 렌더에서
            // routeOptions가 빈 배열)에는 아직 열지 않는다 — 빈 옵션으로 열면 TransportDetail이
            // selectedOption을 못 찾아 undefined를 구조분해하다 터진다.
            isOpen
            transportGroup={transportGroup}
            selectedOptionId={selectedRouteOptionId}
            onClose={onClose}
            onChange={handleChange}
            onKakaoMapClick={() =>
              openKakaoMapRoute(
                { name: fromPlace, lat: activeStop?.lat, lng: activeStop?.lng },
                { name: toPlace, lat: activeNextStop?.lat, lng: activeNextStop?.lng },
              )
            }
          />
        ) : null;
      })()}

      {modal === "verify" && activeStop?.spotId && (
        <ArrivalVerifyModal
          isOpen
          spotId={activeStop.spotId}
          itineraryId={itineraryId}
          // 아직 서버에 저장 안 된 임시 항목(temp-*)은 연결할 수 없으니 생략한다.
          itineraryItemId={
            activeStop.id && !activeStop.id.startsWith("temp-") ? activeStop.id : undefined
          }
          placeName={activeStop.placeName}
          placeImageUrl={activeStop.imageUrl}
          characterImageUrl={characterImg.src}
          onClose={onClose}
          onVerify={onConfirmVerify}
          onContinue={onVerifyContinue}
          onLater={onClose}
        />
      )}
    </>
  );
}

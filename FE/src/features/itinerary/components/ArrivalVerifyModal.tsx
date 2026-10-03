"use client";

import type { GpsFailReason } from "./arrival-verify/ArrivalVerifyStages";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import mapCharacter from "@/assets/character/map.png";
import { Button, Modal } from "@/components";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/shared/api/domains/itinerary";
import { useVerifyVisit } from "@/shared/hooks/useVerifyVisit";
import { presignUpload } from "@/shared/api/domains/upload";
import { addVisitPhoto } from "@/shared/api/domains/visit";
import { getCollectionDetail } from "@/shared/api/domains/collection";
import type { VerifyStep } from "./arrival-verify/ArrivalVerifyStages";
import { PermissionButton } from "./arrival-verify/ArrivalVerifyShared";
import {
  ArrivalStage,
  ArrivalStageFooter,
  BasicTwoButtonFooter,
  CameraCaptureStage,
  CameraPermissionStage,
  CompleteStage,
  GpsFailStage,
  GpsLoadingStage,
  GpsPermissionStage,
  GpsSuccessStage,
  PhotoConfirmStage,
} from "./arrival-verify/ArrivalVerifyStages";

interface ArrivalVerifyModalProps {
  spotId: string;
  itineraryId: string;
  // 이 인증이 어느 일정의 어느 방문 항목에 대한 것인지 서버에 연결하기 위한 값.
  // 같은 관광지라도 일정마다 따로 인증해야 하므로, 넘겨야 다른 일정의 인증이 이 항목에
  // "수집완료"로 새어들어오지 않는다. (아직 서버에 저장 안 된 임시 항목이면 생략)
  itineraryItemId?: string;
  isOpen: boolean;
  onClose: () => void;
  placeName: string;
  placeImageUrl?: string;
  userAvatarUrl?: string;
  characterImageUrl?: string;
  onVerify: () => void;
  onContinue?: () => void;
  onLater: () => void;
}

export function ArrivalVerifyModal({
  spotId,
  itineraryId,
  itineraryItemId,
  isOpen,
  onClose,
  placeName,
  placeImageUrl,
  userAvatarUrl,
  characterImageUrl,
  onVerify,
  onContinue,
  onLater,
}: ArrivalVerifyModalProps) {
  const router = useRouter();
  const { mutateAsync: verifyVisit, isPending: isVerifying } = useVerifyVisit();
  const [step, setStep] = useState<VerifyStep>("arrival");
  const [isVerified, setIsVerified] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  // 실패 이유를 화면에 그대로 보여주기 위해 들고 있는다(거리 초과 / 권한 거부 / 기타).
  const [gpsFailReason, setGpsFailReason] = useState<GpsFailReason | undefined>(undefined);
  // 카메라 접근이 막혔을 때 안내를 띄우기 위한 플래그.
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  // 도감(수집) 대상이 아닌 관광지의 spotId로 조회하면 404가 나는 것으로 간주한다 —
  // 별도 "도감 포함 여부" 필드가 없어서, 조회 성공 여부로 판단.
  const [isInCollection, setIsInCollection] = useState<boolean | undefined>(undefined);

  const queryClient = useQueryClient();

  const handleRequestLocation = () => {
    if (isCheckingLocation || isVerifying) return;

    if (!navigator.geolocation) {
      setGpsFailReason({ type: "unsupported" });
      setStep("gps-fail");
      return;
    }

    setIsCheckingLocation(true);
    setStep("gps-loading");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const currentLat = coords.latitude;
        const currentLng = coords.longitude;

        try {
          const response = await verifyVisit({
            tourSpotId: spotId,
            gpsLat: currentLat,
            gpsLng: currentLng,
            ...(itineraryItemId ? { itineraryItemId } : {}),
          });

          if (response.verified && response.visitId) {
            setGpsFailReason(undefined);
            setVisitId(response.visitId);
            setStep("gps-success");
          } else {
            setVisitId(null);
            // 서버가 관광지까지의 거리를 함께 내려준다 — 얼마나 멀어서 실패했는지 보여준다.
            setGpsFailReason(
              typeof response.distanceMeters === "number"
                ? { type: "too-far", distanceMeters: response.distanceMeters }
                : { type: "error" },
            );
            setStep("gps-fail");
          }
        } catch (error) {
          console.error(error);
          setGpsFailReason({ type: "error" });
          setStep("gps-fail");
        } finally {
          setIsCheckingLocation(false);
        }
      },
      (error) => {
        // PERMISSION_DENIED(1)면 권한 안내, 그 외(위치 사용 불가/시간 초과)는 일반 안내.
        setGpsFailReason(
          error.code === error.PERMISSION_DENIED ? { type: "permission" } : { type: "error" },
        );
        setStep("gps-fail");
        setIsCheckingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleCapture = (file: File, previewUrl: string) => {
    if (capturedImageUrl) {
      URL.revokeObjectURL(capturedImageUrl);
    }

    setCapturedFile(file);
    setCapturedImageUrl(previewUrl);
  };

  const handleRetake = () => {
    if (capturedImageUrl) {
      URL.revokeObjectURL(capturedImageUrl);
    }

    setCapturedFile(null);
    setCapturedImageUrl(null);
    setStep("camera-capture");
  };

  const handleRequestCamera = async () => {
    setCameraBlocked(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      stream.getTracks().forEach((track) => track.stop());
      setStep("camera-capture");
    } catch {
      // 예전엔 조용히 이전 화면으로 되돌아가서, 사용자는 "사진 화면이 안 열린다"만 겪고
      // 원인(카메라 권한 거부/카메라 없음)을 알 수 없었다.
      setCameraBlocked(true);
      setStep("gps-success");
    }
  };

  const closeAndReset = () => {
    setStep("arrival");
    setIsVerified(false);
    setIsCheckingLocation(false);
    setVisitId(null);
    // 실패 안내는 "이번 인증 시도"에 대한 것이라 닫을 때 같이 비운다. 남겨두면 다음에 열어서
    // GPS 인증에 성공해도 지난번 거절 안내("카메라를 사용할 수 없어요")가 그대로 뜨고,
    // 지난번 거리 초과 안내가 새 시도의 실패 화면에 섞여 나온다.
    setGpsFailReason(undefined);
    setCameraBlocked(false);

    if (capturedImageUrl) {
      URL.revokeObjectURL(capturedImageUrl);
    }

    setCapturedFile(null);
    setCapturedImageUrl(null);
    setIsInCollection(undefined);
    onClose();
  };

  const finishVerification = async () => {
    if (!capturedFile || !visitId || isVerified || isVerifying) return;

    try {
      const { uploadUrl, publicUrl } = await presignUpload({
        contentType: capturedFile.type,
      });

      if (!uploadUrl || !publicUrl) {
        throw new Error("사진 업로드 정보를 받지 못했습니다.");
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": capturedFile.type,
        },
        body: capturedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("사진 업로드에 실패했습니다.");
      }

      await addVisitPhoto(visitId, {
        photoUrl: publicUrl,
      });

      await queryClient.invalidateQueries({
        queryKey: keys.detail(itineraryId),
      });

      try {
        await getCollectionDetail(spotId);
        setIsInCollection(true);
      } catch {
        setIsInCollection(false);
      }

      setIsVerified(true);
      onVerify();
      setStep("complete");
    } catch (error) {
      console.error(error);
      setStep("photo-confirm");
    }
  };

  const renderBody = () => {
    switch (step) {
      case "arrival":
        return (
          <ArrivalStage
            placeName={placeName}
            characterImageUrl={characterImageUrl ?? mapCharacter}
          />
        );
      case "gps-permission":
        return <GpsPermissionStage />;
      case "gps-loading":
        return <GpsLoadingStage />;
      case "gps-fail":
        return <GpsFailStage placeName={placeName} reason={gpsFailReason} />;
      case "gps-success":
        return <GpsSuccessStage placeName={placeName} isCameraBlocked={cameraBlocked} />;
      case "camera-permission":
        return <CameraPermissionStage placeName={placeName} placeImageUrl={placeImageUrl} />;
      case "camera-capture":
        return (
          <CameraCaptureStage placeName={placeName} setStep={setStep} onCapture={handleCapture} />
        );
      case "photo-confirm":
        return (
          <PhotoConfirmStage
            placeName={placeName}
            capturedImageUrl={capturedImageUrl ?? undefined}
          />
        );
      case "complete":
        return (
          <CompleteStage
            placeName={placeName}
            capturedImageUrl={capturedImageUrl ?? undefined}
            isInCollection={isInCollection}
          />
        );
      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (step) {
      case "arrival":
        return (
          <ArrivalStageFooter
            onLater={() => {
              onLater();
              closeAndReset();
            }}
            onNext={() => setStep("gps-permission")}
          />
        );
      case "gps-permission":
        return (
          <div className="flex w-full flex-col gap-2">
            <PermissionButton onClick={handleRequestLocation}>
              앱을 사용하는 동안 허용
            </PermissionButton>

            <PermissionButton onClick={handleRequestLocation}>항상 허용</PermissionButton>
            <PermissionButton onClick={() => setStep("gps-fail")}>허용 안 함</PermissionButton>
          </div>
        );
      case "gps-fail":
        return (
          <BasicTwoButtonFooter
            left={
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  onLater();
                  closeAndReset();
                }}
              >
                나중에 하기
              </Button>
            }
            right={
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setStep("gps-permission")}
              >
                다시 확인
              </Button>
            }
          />
        );
      case "gps-success":
        return (
          <BasicTwoButtonFooter
            left={
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  onLater();
                  closeAndReset();
                }}
              >
                나중에 하기
              </Button>
            }
            right={
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setStep("camera-permission")}
              >
                사진 찍기
              </Button>
            }
          />
        );
      case "camera-permission":
        return (
          <div className="flex w-full flex-col gap-2">
            <PermissionButton onClick={handleRequestCamera}>
              앱을 사용하는 동안 허용
            </PermissionButton>
            <PermissionButton onClick={handleRequestCamera}>항상 허용</PermissionButton>
            <PermissionButton onClick={() => setStep("gps-success")}>허용 안 함</PermissionButton>
          </div>
        );
      case "photo-confirm":
        return (
          <BasicTwoButtonFooter
            left={
              <Button variant="secondary" className="w-full" onClick={handleRetake}>
                다시 찍기
              </Button>
            }
            right={
              <Button
                variant="primary"
                className="w-full"
                onClick={finishVerification}
                disabled={isVerifying}
              >
                {isVerifying ? "인증 중..." : "인증하기"}
              </Button>
            }
          />
        );
      case "complete":
        return (
          <BasicTwoButtonFooter
            left={
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  onContinue?.();
                  closeAndReset();
                  router.push("/itinerary");
                }}
              >
                계속 여행하기
              </Button>
            }
            right={
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  closeAndReset();
                  router.push("/collection");
                }}
              >
                도감 보러가기
              </Button>
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAndReset}
      hideActions
      childrenVariant="plain"
      className="rounded-[28px]"
      childrenClassName="flex w-full flex-col items-center gap-5"
    >
      <div className="relative flex w-full flex-col items-center">
        {userAvatarUrl && (
          <div className="absolute -top-6 left-1/2 size-[56px] -translate-x-1/2 overflow-hidden rounded-full border-4 border-main-white shadow-[0_2px_8px_0_var(--color-system-scroll)]">
            <Image src={userAvatarUrl} alt="avatar" fill sizes="56px" className="object-cover" />
          </div>
        )}

        {renderBody()}
      </div>

      {renderFooter()}
    </Modal>
  );
}

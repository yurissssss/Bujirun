"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import CheckCircleIcon from "@/assets/icons/itinerary/check-circle.svg?svgr";
import AntennaIcon from "@/assets/icons/itinerary/antenna.svg?svgr";
import cameraCharacter from "@/assets/character/camera.png";
import congsCharacter from "@/assets/character/congs.png";
import failCharacter from "@/assets/character/fail.png";
import mapCharacter from "@/assets/character/map.png";
import seaCharacter from "@/assets/character/sea.png";
import LandLayerLocationIcon from "@/assets/icons/itinerary/land-layer-location.svg?svgr";
import samplePlaceImage from "@/assets/place/place1.png";
import { Button, Card } from "@/components";
import { LoadingProgressBar } from "../LoadingProgressBar";
import { CharacterImage, MapPreview, Notice, PlaceBadge } from "./ArrivalVerifyShared";

export type VerifyStep =
  | "arrival"
  | "gps-permission"
  | "gps-loading"
  | "gps-fail"
  | "gps-success"
  | "camera-permission"
  | "camera-capture"
  | "photo-confirm"
  | "complete";

type CommonProps = {
  placeName: string;
  placeImageUrl?: string;
  setStep: (step: VerifyStep) => void;
  characterImageUrl?: string | StaticImageData;
  capturedImageUrl?: string;
  onCapture?: (file: File, previewUrl: string) => void;
  // 도감(수집) 대상 관광지가 아니면 인증은 되지만 도감에는 추가되지 않는다 — 그 여부.
  isInCollection?: boolean;
};

const MOCK_LOADING_DURATION_MS = 3000;

export function ArrivalStage({
  placeName,
  characterImageUrl,
}: Pick<CommonProps, "placeName" | "characterImageUrl">) {
  return (
    <>
      <CharacterImage
        src={characterImageUrl ?? mapCharacter}
        alt="지도 캐릭터"
        className="-mb-3 h-[200px] w-[200px]"
      />
      <div className="mb-3 flex flex-col items-center gap-2 text-center">
        <PlaceBadge placeName={placeName} />
        <h2 className="font-paperlogy text-md font-semibold text-text-primary">
          이곳에 도착하셨나요?
        </h2>
      </div>
      <div className="w-full">
        <Notice>* GPS 위치 확인 후 관광지를 수집해주세요.</Notice>
      </div>
    </>
  );
}

export function GpsPermissionStage({}: Pick<CommonProps, never>) {
  return (
    <>
      <h2 className="mb-5 whitespace-pre-line text-center text-lg font-ssurround font-bold text-text-heading">
        “BUJIRUN”이 사용자의{"\n"}위치에 접근하려고 합니다.
      </h2>
      <div className="mb-3 w-full">
        <Notice>* 관광지를 수집해서 도감을 채워봐요!</Notice>
      </div>
      <div className="w-full">
        <MapPreview />
      </div>
    </>
  );
}

export function GpsLoadingStage({}: Pick<CommonProps, never>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTimer = window.setTimeout(() => setProgress(100), 50);
    return () => window.clearTimeout(startTimer);
  }, []);

  return (
    <>
      <div className="mb-5 flex size-[48px] items-center justify-center rounded-full bg-system-navbg">
        <LandLayerLocationIcon width={25} height={25} className="fill-sub-deepblue" aria-hidden />
      </div>
      <h2 className="mb-2 text-center text-lg font-ssurround font-bold text-text-heading">
        현재 위치를 확인하고 있어요.
      </h2>
      <div className="mb-6 w-full">
        <Notice
          icon={
            <AntennaIcon
              width={18}
              height={18}
              className="shrink-0 fill-sub-deepblue"
              aria-hidden
            />
          }
        >
          GPS 신호를 확인하는 중...
        </Notice>
      </div>
      <div className="mb-5 w-full">
        <LoadingProgressBar
          progress={progress}
          durationMs={MOCK_LOADING_DURATION_MS}
          className="w-full"
        />
      </div>
      <CharacterImage src={seaCharacter} alt="위치 확인 중" className="h-[187px] w-[250px]" />
    </>
  );
}

// 실패 이유를 화면에 남긴다 — 예전엔 원인을 안 알려줘서, 실제로는 "1.4km 떨어져 있음"인데
// 사용자는 GPS 고장인지 앱 문제인지 알 수 없었다. 서버가 내려주는 거리를 그대로 보여준다.
export type GpsFailReason =
  | { type: "too-far"; distanceMeters: number }
  | { type: "permission" }
  | { type: "unsupported" }
  | { type: "error" };

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
}

export function GpsFailStage({
  placeName,
  reason,
}: Pick<CommonProps, "placeName"> & { reason?: GpsFailReason }) {
  const { title, notice } = (() => {
    switch (reason?.type) {
      case "too-far":
        return {
          title: "아직 조금 멀어요!",
          notice: `* 지금 위치에서 ${formatDistance(reason.distanceMeters)} 떨어져 있어요. 관광지에 도착한 뒤 다시 시도해주세요.`,
        };
      case "permission":
        return {
          title: "위치 권한이 필요해요!",
          notice: "* 브라우저 설정에서 위치 접근을 허용한 뒤 다시 시도해주세요.",
        };
      case "unsupported":
        return {
          title: "위치를 확인할 수 없어요!",
          notice: "* 이 기기에서는 위치 확인을 지원하지 않아요.",
        };
      default:
        return {
          title: "위치를 확인할 수 없어요!",
          notice: "* 잠시 후 관광지 근처에서 다시 시도해주세요.",
        };
    }
  })();

  return (
    <>
      <CharacterImage
        src={failCharacter}
        alt="위치 확인 실패"
        className="mb-5 h-[150px] w-[150px]"
      />
      <div className="mb-5 flex flex-col items-center gap-2 text-center">
        <PlaceBadge placeName={placeName} />
        <h2 className="font-paperlogy text-md font-bold text-text-heading">{title}</h2>
      </div>
      <div className="w-full">
        <Notice>{notice}</Notice>
      </div>
    </>
  );
}

export function GpsSuccessStage({
  placeName,
  isCameraBlocked = false,
}: Pick<CommonProps, "placeName"> & { isCameraBlocked?: boolean }) {
  return (
    <>
      <CharacterImage
        src={cameraCharacter}
        alt="사진 촬영 안내"
        className="-mb-1 h-[200px] w-[200px]"
      />
      <div className="mb-3 flex flex-col items-center gap-2 text-center">
        <PlaceBadge placeName={placeName} />
        <h2 className="font-paperlogy text-md font-semibold text-text-primary">
          관광지 확인이 완료되었어요!
        </h2>
      </div>
      <div className="w-full">
        {/* 카메라를 못 열었을 때 이유를 알려준다 — 예전엔 사진 화면으로 못 넘어간 채
            조용히 이 화면으로 돌아와서 버튼이 안 먹는 것처럼 보였다. */}
        <Notice>
          {isCameraBlocked
            ? "* 카메라를 사용할 수 없어요. 브라우저 설정에서 카메라 접근을 허용한 뒤 다시 시도해주세요."
            : "* 사진을 찍어 기록을 남겨주세요."}
        </Notice>
      </div>
    </>
  );
}

export function CameraPermissionStage({
  placeName,
  placeImageUrl,
}: Pick<CommonProps, "placeName" | "placeImageUrl">) {
  return (
    <>
      <h2 className="mb-5 whitespace-pre-line text-center text-lg font-ssurround font-bold text-text-heading">
        “BUJIRUN”이 사용자의{"\n"}카메라에 접근하려고 합니다.
      </h2>
      <div className="mb-6 w-full">
        <Notice>
          * 여행 기록 공개 시 사진이 함께 공개될 수 있으니 개인정보 및 촬영 내용에 유의해주세요!
        </Notice>
      </div>
      <div className="relative h-[162px] w-full overflow-hidden rounded-[10px]">
        <Image
          src={placeImageUrl ?? samplePlaceImage}
          alt={placeName}
          fill
          sizes="390px"
          unoptimized={Boolean(placeImageUrl)}
          className="object-cover"
        />
      </div>
    </>
  );
}

export function CameraCaptureStage({
  placeName,
  setStep,
  onCapture,
}: Pick<CommonProps, "placeName" | "setStep" | "onCapture">) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureGuideRef = useRef<HTMLDivElement>(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isCancelled = false;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (isCancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        stream = mediaStream;

        if (!videoRef.current) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        videoRef.current.srcObject = mediaStream;
      } catch (error) {
        if (!isCancelled) {
          console.error("카메라 접근 실패:", error);
          setCameraError(true);
        }
      }
    };

    void startCamera();

    const videoElement = videoRef.current;

    return () => {
      isCancelled = true;

      stream?.getTracks().forEach((track) => track.stop());

      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const captureGuide = captureGuideRef.current;

    if (!video || !canvas || !captureGuide || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError(true);
      return;
    }

    const videoRect = video.getBoundingClientRect();
    const guideRect = captureGuide.getBoundingClientRect();

    const videoAspectRatio = video.videoWidth / video.videoHeight;
    const displayAspectRatio = videoRect.width / videoRect.height;

    let renderedWidth = videoRect.width;
    let renderedHeight = videoRect.height;
    let cropOffsetX = 0;
    let cropOffsetY = 0;

    if (videoAspectRatio > displayAspectRatio) {
      renderedHeight = videoRect.height;
      renderedWidth = renderedHeight * videoAspectRatio;
      cropOffsetX = (renderedWidth - videoRect.width) / 2;
    } else {
      renderedWidth = videoRect.width;
      renderedHeight = renderedWidth / videoAspectRatio;
      cropOffsetY = (renderedHeight - videoRect.height) / 2;
    }

    const scaleX = video.videoWidth / renderedWidth;
    const scaleY = video.videoHeight / renderedHeight;

    const sourceX = (guideRect.left - videoRect.left + cropOffsetX) * scaleX;
    const sourceY = (guideRect.top - videoRect.top + cropOffsetY) * scaleY;
    const sourceWidth = guideRect.width * scaleX;
    const sourceHeight = guideRect.height * scaleY;

    canvas.width = Math.round(sourceHeight);
    canvas.height = Math.round(sourceWidth);

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError(true);
      return;
    }

    context.translate(canvas.width, 0);
    context.rotate(Math.PI / 2);

    context.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError(true);
          return;
        }

        const file = new File([blob], `visit-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        const previewUrl = URL.createObjectURL(blob);

        onCapture?.(file, previewUrl);
        setStep("photo-confirm");
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <main className="fixed left-1/2 top-0 z-[9999] h-[844px] w-full max-w-[390px] -translate-x-1/2 overflow-hidden bg-text-heading">
      {cameraError ? (
        <div className="flex h-full items-center justify-center px-5 text-center text-sm text-main-white">
          카메라를 불러오지 못했어요. 카메라 권한을 확인해주세요.
        </div>
      ) : (
        <video
          ref={videoRef}
          aria-label={`${placeName} 촬영 화면`}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
      )}

      <div
        ref={captureGuideRef}
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 aspect-[9/16] h-[60%] max-h-[560px] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-main-white shadow-[0_0_0_9999px_rgb(0_0_0/0.8)]"
        aria-hidden="true"
      />

      <div className="absolute -right-12 top-1/2 z-10 origin-center -translate-y-1/2 rotate-90 whitespace-nowrap text-sm text-main-white">
        관광지를 영역 안에 맞춰주세요!
      </div>

      <button
        type="button"
        aria-label="촬영"
        className="absolute bottom-[calc(env(safe-area-inset-bottom)+30px)] left-1/2 z-10 flex size-[58px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-main-white disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleCapture}
        disabled={cameraError}
      >
        <span className="size-[48px] rounded-full bg-main-white" />
      </button>

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}

export function PhotoConfirmStage({
  placeName,
  capturedImageUrl,
}: Pick<CommonProps, "placeName" | "capturedImageUrl">) {
  return (
    <>
      <h2 className="mb-[25px] text-lg font-ssurround font-bold text-text-heading">
        사진 촬영이 완료되었어요.
      </h2>

      <div className="relative mb-[22px] h-[153px] w-[273px] overflow-hidden rounded-[10px]">
        <Image
          src={capturedImageUrl ?? samplePlaceImage}
          alt={placeName}
          fill
          sizes="273px"
          unoptimized={Boolean(capturedImageUrl)}
          className="object-cover"
        />
      </div>

      <p className="mb-5 flex items-center justify-center gap-1 font-paperlogy text-sm font-medium text-text-primary">
        <CheckCircleIcon width={14} height={14} className="fill-main-blue" aria-hidden />
        관광지가 잘 보이나요?
      </p>

      <div className="w-full">
        <Notice>* 마음에 들지 않는다면 다시 촬영할 수 있어요!</Notice>
      </div>
    </>
  );
}

export function CompleteStage({
  placeName,
  capturedImageUrl,
  isInCollection,
}: Pick<CommonProps, "placeName" | "capturedImageUrl" | "isInCollection">) {
  return (
    <>
      <CharacterImage
        src={congsCharacter}
        alt="인증 완료"
        className="-mb-[14px] h-[160px] w-[180px]"
      />
      <div className="mb-5 flex flex-col items-center gap-2 text-center">
        <PlaceBadge placeName={placeName} />
        <h2 className="text-lg font-paperlogy font-bold text-text-heading">인증이 완료되었어요!</h2>
      </div>
      <div className="relative mb-[14px] h-[153px] w-full overflow-hidden rounded-[10px]">
        <Image
          src={capturedImageUrl ?? samplePlaceImage}
          alt={placeName}
          fill
          sizes="340px"
          unoptimized={Boolean(capturedImageUrl)}
          className="object-cover"
        />
      </div>
      {isInCollection === false ? (
        <Card
          variant="glass-sm"
          className="w-full flex flex-col items-center justify-center gap-[12px] py-[12px] text-center"
        >
          <span className="font-paperlogy text-md font-medium text-text-heading">
            해당 관광지는 도감에는 포함되어있지 않아요
          </span>
        </Card>
      ) : (
        <Card
          variant="glass-sm"
          className="w-full flex flex-col items-center justify-center gap-[12px] py-[12px] text-center"
        >
          <span className="flex items-center gap-[3px] font-paperlogy text-md font-medium text-text-heading">
            <span>📖</span>
            <span>도감 등록 완료!</span>
          </span>
          <span className="font-mona font-normal text-sm text-sub-deepblue">도감 +1</span>
        </Card>
      )}
    </>
  );
}

export function ArrivalStageFooter({
  onLater,
  onNext,
}: {
  onLater: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex w-full gap-6">
      <Button variant="secondary" className="flex-1" onClick={onLater}>
        나중에 하기
      </Button>
      <Button variant="primary" className="flex-1" onClick={onNext}>
        인증하기
      </Button>
    </div>
  );
}

export function BasicTwoButtonFooter({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="flex w-full gap-6">
      <div className="flex-1">{left}</div>
      <div className="flex-1">{right}</div>
    </div>
  );
}

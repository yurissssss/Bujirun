"use client";

import Image from "next/image";
import { Card } from "@/components";
import { PROFILE_IMAGES } from "@/components/profile/profileImages";
import { PARTICIPANT_COLOR_CLASSES } from "@/features/itinerary/collab/participantColor";
import { cn } from "@/shared/utils";

type RecommendationMember = {
  userId?: string;
  profileImageUrl?: string;
};

type RecommendationReasonCardProps = {
  reasonText: string;
  members: RecommendationMember[];
  isFreeEditPlan: boolean;
};

function resolveProfileImage(profileImageUrl: string | null | undefined, fallbackIndex: number) {
  const value = profileImageUrl?.trim();
  const presetId = value ? Number(value) : NaN;

  const presetImage = Number.isInteger(presetId)
    ? PROFILE_IMAGES.find((image) => image.id === presetId)
    : undefined;

  if (presetImage) {
    return {
      src: presetImage.src,
      isPreset: true,
    };
  }

  if (value && /^(https?:\/\/|\/)/.test(value)) {
    return {
      src: value,
      isPreset: false,
    };
  }

  return {
    src: PROFILE_IMAGES[fallbackIndex % PROFILE_IMAGES.length].src,
    isPreset: true,
  };
}

export function RecommendationReasonCard({
  reasonText,
  members,
  isFreeEditPlan,
}: RecommendationReasonCardProps) {
  return (
    <div className="shrink-0 pb-[20px]">
      <Card variant="glass-sm" className="relative overflow-hidden px-[16px] py-[16px]">
        <RecommendationStar />

        <div className="pr-[86px]">
          <p className="font-ssurround text-md text-sub-darkgray">
            {isFreeEditPlan ? "부지런이 알려드려요!" : "부지런이 추천해요!"}
          </p>
        </div>

        <p className="mt-[8px] max-w-[210px] text-sm font-semibold leading-[1.45] text-texp-primary">
          {isFreeEditPlan ? "C안은 직접 일정을 채워가는 자유 편집형 일정이에요!" : reasonText}
        </p>

        <div className="mt-[8px] flex items-center -space-x-[2px]">
          {members.slice(0, 6).map((member, index) => {
            const profileImage = resolveProfileImage(member.profileImageUrl, index);

            return (
              <div
                key={member.userId}
                className={cn(
                  "relative size-[22px] shrink-0 overflow-hidden rounded-full border border-sub-gray",
                  PARTICIPANT_COLOR_CLASSES[index % PARTICIPANT_COLOR_CLASSES.length],
                )}
              >
                <Image
                  src={profileImage.src}
                  alt=""
                  fill
                  sizes="22px"
                  unoptimized={!profileImage.isPreset}
                  className={
                    profileImage.isPreset
                      ? "object-cover scale-[1.27] origin-[center_10%]"
                      : "object-cover"
                  }
                  aria-hidden
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function RecommendationStarShape({
  gradientId,
  withFace = false,
  variant = "main",
  className = "",
}: {
  gradientId: string;
  withFace?: boolean;
  variant?: "main" | "mini";
  className?: string;
}) {
  const starPath =
    "M8.83 5.42 C10.07 1.37 13.93 1.37 15.17 5.42 C19.10 3.86 21.51 6.89 19.12 10.38 C22.79 12.48 21.93 16.25 17.71 16.55 C18.35 20.73 14.87 22.41 12.00 19.30 C9.13 22.41 5.65 20.73 6.29 16.55 C2.07 16.25 1.21 12.48 4.88 10.38 C2.49 6.89 4.90 3.86 8.83 5.42 Z";

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="45%" r="62%">
          <stop offset="0%" stopColor="#8BBAFF" />
          <stop offset="48%" stopColor="#5D9CFF" />
          <stop offset="100%" stopColor="#3478E5" />
        </radialGradient>
      </defs>

      <path
        className={variant === "main" ? "recommendation-main-outline" : undefined}
        d={starPath}
        fill={variant === "mini" ? "var(--color-sub-deepblue)" : `url(#${gradientId})`}
      />

      {withFace && (
        <g className="recommendation-face">
          <g className="recommendation-eyes">
            <circle cx="11.3" cy="10.7" r="0.5" fill="var(--color-system-black)" />
            <circle cx="13.7" cy="10.7" r="0.5" fill="var(--color-system-black)" />
          </g>

          <path
            className="recommendation-mouth"
            d="M11 12.3c0.75 0.8 2.25 0.8 3 0"
            fill="none"
            stroke="var(--color-system-black)"
            strokeWidth="0.5"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}

function RecommendationStar() {
  return (
    <div className="pointer-events-none absolute right-[14px] top-[18px] size-20" aria-hidden>
      <div className="absolute inset-[-2px] animate-[recommendation-first-star-sway_4.2s_ease-in-out_infinite_alternate]">
        <div className="absolute -left-[5px] top-[30px] size-[6px] animate-[recommendation-spin_2.4s_linear_infinite]">
          <RecommendationStarShape
            gradientId="recommendation-mini-star-left"
            variant="mini"
            className="size-full drop-shadow-sm"
          />
        </div>
      </div>

      <div className="absolute inset-0 animate-[recommendation-second-star-sway_5.1s_ease-in-out_infinite_alternate]">
        <div className="absolute right-[2px] top-[17px] size-[7px] animate-[recommendation-spin_3.1s_linear_infinite_reverse]">
          <RecommendationStarShape
            gradientId="recommendation-mini-star-right"
            variant="mini"
            className="size-full drop-shadow-sm"
          />
        </div>
      </div>

      <div className="absolute inset-[-2px] animate-[recommendation-third-star-sway_3.7s_ease-in-out_infinite_alternate]">
        <div className="absolute right-[11px] top-[10px] size-[8px] animate-[recommendation-spin_3s_linear_infinite]">
          <RecommendationStarShape
            gradientId="recommendation-mini-star-bottom-right"
            variant="mini"
            className="size-full drop-shadow-sm"
          />
        </div>
      </div>

      <div className="absolute inset-[5px] animate-[recommendation-float_2s_ease-in-out_infinite]">
        <RecommendationStarShape
          gradientId="recommendation-main-star"
          withFace
          className="size-full drop-shadow-md"
        />
      </div>

      <style jsx>{`
        @keyframes recommendation-float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes recommendation-first-star-sway {
          from {
            transform: rotate(-45deg);
          }

          to {
            transform: rotate(45deg);
          }
        }

        @keyframes recommendation-spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes recommendation-second-star-sway {
          from {
            transform: rotate(20deg);
          }

          to {
            transform: rotate(-70deg);
          }
        }

        @keyframes recommendation-third-star-sway {
          from {
            transform: rotate(150deg);
          }

          to {
            transform: rotate(60deg);
          }
        }

        :global(.recommendation-main-outline) {
          transform-box: fill-box;
          transform-origin: center;
          animation: recommendation-main-outline-spin 7.2s ease-in-out infinite;
        }

        @keyframes recommendation-main-outline-spin {
          0%,
          15% {
            transform: rotate(0deg);
          }

          25%,
          40% {
            transform: rotate(90deg);
          }

          50%,
          65% {
            transform: rotate(0deg);
          }

          75%,
          90% {
            transform: rotate(-90deg);
          }

          100% {
            transform: rotate(0deg);
          }
        }

        :global(.recommendation-eyes) {
          transform-box: fill-box;
          transform-origin: center;
          animation: recommendation-eyes-look 5.4s ease-in-out infinite;
        }

        :global(.recommendation-mouth) {
          transform-box: fill-box;
          transform-origin: center;
          animation: recommendation-mouth-move 5.4s ease-in-out infinite;
        }

        @keyframes recommendation-eyes-look {
          0%,
          18%,
          100% {
            transform: translateX(0);
          }

          28%,
          38% {
            transform: translateX(-0.7px);
          }

          52%,
          62% {
            transform: translateX(0.7px);
          }

          76% {
            transform: translateX(0);
          }
        }

        @keyframes recommendation-mouth-move {
          0%,
          18%,
          100% {
            transform: translateX(0) translateY(0) scaleX(1);
          }

          28%,
          38% {
            transform: translateX(-0.55px) translateY(0.15px) scaleX(0.9);
          }

          52%,
          62% {
            transform: translateX(0.55px) translateY(0.15px) scaleX(0.9);
          }

          76% {
            transform: translateX(0) translateY(0) scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}

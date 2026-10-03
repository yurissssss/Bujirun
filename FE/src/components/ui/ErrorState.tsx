"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import errorCharacter from "@/assets/character/state/error.png";
import { Button } from "./Button";
import { cn } from "@/shared/utils";

// 자주 만나는 HTTP 상태코드별 프리셋. 없는 코드는 500(서버 오류) 프리셋으로 대체된다.
export type ErrorStateCode = 400 | 401 | 403 | 404 | 500 | 503;

interface ErrorPreset {
  title: string;
  description: ReactNode;
}

const PRESETS: Record<ErrorStateCode, ErrorPreset> = {
  400: {
    title: "요청을 처리할 수 없어요",
    description: <>입력한 정보를 다시 확인하고 다시 시도해주세요.</>,
  },
  401: {
    title: "로그인이 필요해요",
    description: <>로그인 정보가 없거나 세션이 만료됐어요.</>,
  },
  403: {
    title: "접근할 수 없어요",
    description: <>이 페이지를 볼 수 있는 권한이 없어요.</>,
  },
  404: {
    title: "페이지를 찾을 수 없어요",
    description: <>주소가 잘못됐거나 존재하지 않는 페이지예요.</>,
  },
  500: {
    title: "앗, 문제가 생겼어요",
    description: (
      <>
        서버에 일시적인 오류가 있어요.
        <br />
        잠시 후 다시 시도해주세요!
      </>
    ),
  },
  503: {
    title: "잠시 이용하기 어려워요",
    description: (
      <>
        현재 서비스가 원활하지 않아요.
        <br />
        잠시 후 다시 이용해주세요!
      </>
    ),
  },
};

interface ErrorStateAction {
  label: string;
  onClick: () => void;
}

// compact은 EmptyState와 같은 기준 — 캐릭터 없이 문구만 보여준다.
// 모달 안처럼 세로 공간이 좁은 곳에서 쓴다.
type ErrorStateVariant = "default" | "compact";

interface ErrorStateProps {
  code?: ErrorStateCode;
  variant?: ErrorStateVariant;
  title?: string;
  description?: ReactNode;
  primaryAction?: ErrorStateAction;
  secondaryAction?: ErrorStateAction;
  className?: string;
}

export function ErrorState({
  code = 500,
  variant = "default",
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: ErrorStateProps) {
  const preset = PRESETS[code];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "flex min-h-full w-full flex-1 flex-col items-center justify-center text-center",
        variant === "default" ? "px-6 py-10" : "px-4 py-6",
        className,
      )}
    >
      {variant === "default" && (
        <div className="relative flex h-[220px] w-[220px] items-center justify-center overflow-visible">
          {/* 캐릭터 뒤 블러 */}
          <div className="absolute size-[160px] rounded-full bg-main-blue/30 blur-3xl" />

          {/* 왼쪽 효과 */}
          <motion.svg
            viewBox="0 0 24 24"
            className="absolute left-11 top-6.5 size-2.5 text-main-blue"
            animate={{
              scale: [0.75, 1, 0.75],
              opacity: [0.35, 1, 0.35],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: 0.35,
              ease: "easeInOut",
            }}
          >
            <path
              d="M1.327,12.4,4.887,15,3.535,19.187A3.178,3.178,0,0,0,4.719,22.8a3.177,3.177,0,0,0,3.8-.019L12,20.219l3.482,2.559a3.227,3.227,0,0,0,4.983-3.591L19.113,15l3.56-2.6a3.227,3.227,0,0,0-1.9-5.832H16.4L15.073,2.432a3.227,3.227,0,0,0-6.146,0L7.6,6.568H3.231a3.227,3.227,0,0,0-1.9,5.832Z"
              fill="currentColor"
            />
          </motion.svg>

          <motion.svg viewBox="0 0 60 60" className="absolute left-5 top-10 size-8">
            <motion.path
              d="
    M48 13
    C35 5, 15 8, 11 19
    C7 30, 19 37, 32 34
    C44 31, 47 22, 38 19
    C29 16, 20 21, 22 27
    C24 33, 34 35, 40 31
  "
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-main-blue"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 1, 0],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.svg>

          <motion.svg
            viewBox="0 0 24 24"
            className="absolute left-3 top-16 size-3 text-main-blue"
            animate={{
              opacity: [0, 0.25, 1, 1, 0.25, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.4,
              ease: "easeInOut",
            }}
          >
            <path
              d="M7 7L17 17M17 7L7 17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </motion.svg>

          <motion.svg
            viewBox="0 0 24 24"
            className="absolute left-5 top-22 size-3 text-main-blue"
            animate={{
              scale: [1, 1, 1, 1, 1],
              opacity: [0.55, 1, 1, 1, 0.55],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <path
              d="M23.836,8.794a3.179,3.179,0,0,0-3.067-2.226H16.4L15.073,2.432a3.227,3.227,0,0,0-6.146,0L7.6,6.568H3.231a3.227,3.227,0,0,0-1.9,5.832L4.887,15,3.535,19.187A3.178,3.178,0,0,0,4.719,22.8a3.177,3.177,0,0,0,3.8-.019L12,20.219l3.482,2.559a3.227,3.227,0,0,0,4.983-3.591L19.113,15l3.56-2.6A3.177,3.177,0,0,0,23.836,8.794Zm-2.343,1.991-4.144,3.029a1,1,0,0,0-.362,1.116L18.562,19.8a1.227,1.227,0,0,1-1.895,1.365l-4.075-3a1,1,0,0,0-1.184,0l-4.075,3a1.227,1.227,0,0,1-1.9-1.365L7.013,14.93a1,1,0,0,0-.362-1.116L2.507,10.785a1.227,1.227,0,0,1,.724-2.217h5.1a1,1,0,0,0,.952-.694l1.55-4.831a1.227,1.227,0,0,1,2.336,0l1.55,4.831a1,1,0,0,0,.952.694h5.1a1.227,1.227,0,0,1,.724,2.217Z"
              fill="currentColor"
            />
          </motion.svg>

          <motion.svg
            viewBox="0 0 24 24"
            className="absolute left-3 top-26 size-2 text-main-blue"
            animate={{
              scale: [1, 1, 1],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.35,
              ease: "easeInOut",
            }}
          >
            <path
              d="M1.327,12.4,4.887,15,3.535,19.187A3.178,3.178,0,0,0,4.719,22.8a3.177,3.177,0,0,0,3.8-.019L12,20.219l3.482,2.559a3.227,3.227,0,0,0,4.983-3.591L19.113,15l3.56-2.6a3.227,3.227,0,0,0-1.9-5.832H16.4L15.073,2.432a3.227,3.227,0,0,0-6.146,0L7.6,6.568H3.231a3.227,3.227,0,0,0-1.9,5.832Z"
              fill="currentColor"
            />
          </motion.svg>

          {/* 오른쪽 효과 */}
          <motion.svg viewBox="0 0 60 60" className="absolute right-6 top-5 size-6 -rotate-18">
            <motion.path
              d="M8 45 C18 30, 22 52, 32 35 S45 20, 52 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-main-blue"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 1, 0],
                opacity: [1, 1, 1, 1],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.svg>

          <motion.svg viewBox="0 0 60 60" className="absolute right-4 top-8 size-8">
            <motion.path
              d="M8 45 C18 30, 22 52, 32 35 S45 20, 52 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="text-main-blue"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 1, 0],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.svg>

          <motion.svg
            viewBox="0 0 24 24"
            className="absolute -right-1 top-15 size-[26px] text-main-blue"
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{
              scale: [0.2, 1, 1.5, 1],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.4,
              delay: 0.4,
              ease: "easeOut",
            }}
          >
            <circle cx="12" cy="12" r="1.5" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </motion.svg>

          <motion.svg
            viewBox="0 0 24 24"
            className="absolute -right-2 top-23.5 size-3 text-main-blue"
            animate={{
              opacity: [0, 0.25, 1, 1, 0.25, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.4,
              ease: "easeInOut",
            }}
          >
            <path
              d="M7 7L17 17M17 7L7 17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </motion.svg>

          <motion.svg
            viewBox="0 0 24 24"
            className="absolute right-0 top-26 size-[28px] text-main-blue"
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{
              scale: [0.2, 1, 1.5, 1],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.7,
              ease: "easeOut",
            }}
          >
            <circle cx="12" cy="12" r="1" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </motion.svg>

          <motion.svg
            viewBox="0 0 24 24"
            className="absolute right-4 top-20 size-[26px] text-main-blue"
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{
              scale: [0.2, 1, 1.2, 1.25],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.4,
              ease: "easeOut",
            }}
          >
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
          </motion.svg>

          {/* 캐릭터 */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src={errorCharacter}
              alt="유령 캐릭터"
              width={200}
              height={200}
              className="relative"
            />
          </motion.div>
        </div>
      )}

      {/* 문구 */}
      <div
        className={cn(
          "flex flex-col items-center gap-3",
          variant === "default" ? "mt-2" : "mt-0 gap-1.5",
        )}
      >
        <p
          className={cn(
            "font-ssurround font-bold text-text-heading",
            variant === "default" ? "text-lg" : "text-md",
          )}
        >
          {title ?? preset.title}
        </p>

        {(description ?? preset.description) && (
          <p
            className={cn(
              "leading-relaxed font-medium text-sub-deepgray",
              variant === "default" ? "text-md" : "text-sm",
            )}
          >
            {description ?? preset.description}
          </p>
        )}
      </div>

      {/* 버튼 */}
      {(primaryAction || secondaryAction) && (
        <div className="pointer-events-auto mt-4 flex w-full gap-2">
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}

          {primaryAction && (
            <Button variant="primary" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

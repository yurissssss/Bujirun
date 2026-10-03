"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "./Button";
import { cn } from "@/shared/utils";
import emptyCharacter from "@/assets/character/state/empty.png";
import emptyPaws from "@/assets/character/state/empty-paws.png";
import emptyBundle from "@/assets/character/state/empty-bundle.png";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

type EmptyStateVariant = "default" | "compact";

interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  variant?: EmptyStateVariant;
  className?: string;
}

export function EmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "default",
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        variant === "default"
          ? "pointer-events-none absolute inset-0 flex h-full w-full flex-col items-center justify-center overflow-hidden px-5 py-10 text-center"
          : "pointer-events-none relative flex w-full flex-col items-center justify-center px-5 py-8 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "relative z-10 flex w-full flex-col items-center gap-3",
          variant === "default" && "mt-0",
        )}
      >
        {variant === "default" && (
          <div className="relative flex h-[200px] w-45 items-end justify-center">
            {/* 캐릭터 뒤 블러 */}
            <div className="absolute size-[160px] rounded-full bg-main-blue/30 blur-3xl" />

            {/* 캐릭터 */}
            <div className="absolute bottom-3 z-20 h-[180px] w-full overflow-hidden">
              {" "}
              <motion.div
                className="absolute inset-x-0 bottom-0 flex justify-center"
                initial={{ y: 180 }}
                animate={{
                  y: [180, 110, 110, 180, 180, 20, 20, 180, 180],
                }}
                transition={{
                  duration: 15,
                  times: [0, 0.08, 0.12, 0.2, 0.25, 0.38, 0.7, 0.77, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="relative w-[105px]">
                  <Image
                    src={emptyCharacter}
                    alt="캐릭터"
                    width={105}
                    priority
                    className="block h-auto w-full"
                  />
                  {/* 왼쪽 눈동자 */}
                  <motion.span
                    className="absolute z-30 left-[37%] top-[48%] w-[5px] h-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-system-black"
                    animate={{
                      x: [0, 0, -2.5, 2.5, -2.5, 2.5, 0, 0],
                    }}
                    transition={{
                      duration: 15,
                      times: [0, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 1],
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  {/* 오른쪽 눈동자 */}
                  <motion.span
                    className="absolute z-30 right-[33%] top-[50%] w-[5px] h-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-system-black"
                    animate={{
                      x: [0, 0, -2.5, 2.5, -2.5, 2.5, 0, 0],
                    }}
                    transition={{
                      duration: 15,
                      times: [0, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 1],
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </motion.div>
            </div>

            {/* 보따리 */}
            <div className="pointer-events-none absolute -right-10 bottom-4 z-0 h-30 w-[140px] overflow-hidden">
              <motion.div
                className="absolute -bottom-[18px] left-[60px] w-20"
                initial={{
                  x: -58,
                  y: 38,
                  opacity: 0,
                  scale: 0.8,
                  rotate: -10,
                }}
                animate={{
                  x: [-58, -58, -25, 0, 0, 0, -12, -35, -58, -58],
                  y: [38, 38, -50, -28, -28, -28, -45, -20, 38, 38],
                  scale: [0.8, 0.8, 1, 1.3, 1.3, 1.3, 1.1, 0.8, 0.7, 0.7],
                  opacity: [0.5, 1, 1, 1, 1, 1, 1, 1, 1, 0.5],
                  rotate: [-10, -10, 18, 0, 0, 0, -8, -16, -10, -10],
                }}
                transition={{
                  duration: 15,
                  times: [0, 0.18, 0.23, 0.25, 0.72, 0.76, 0.8, 0.84, 0.9, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src={emptyBundle}
                  alt="빈 상태 캐릭터 보따리"
                  width={35}
                  className="block h-auto w-full"
                />
              </motion.div>
            </div>

            {/* 홀 */}
            <div className="relative z-10 h-[28px] w-[150px] rounded-[50%] bg-text-primary/30 shadow-[inset_0_8px_12px_rgba(0,0,0,0.1),inset_0_-3px_5px_rgba(255,255,255,0.14)]">
              <div className="absolute inset-x-[10px] top-[5px] h-[14px] rounded-[50%] bg-text-primary/50 blur-[1px]" />
              <div className="absolute inset-x-[18px] bottom-[2px] h-[6px] rounded-[50%] bg-main-whitebg" />
            </div>

            {/* 손 */}
            <motion.div
              className="pointer-events-none absolute -bottom-4 z-30 w-[80px]"
              animate={{
                opacity: [0, 0, 0, 1, 1, 0, 0],
              }}
              transition={{
                duration: 15,
                times: [0, 0.2, 0.29, 0.3, 0.75, 0.76, 1],
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Image
                src={emptyPaws}
                alt="빈 상태 캐릭터 손"
                width={80}
                className="block h-auto w-full"
              />
            </motion.div>

            {/* 멘트 */}
            <motion.p
              className="absolute bottom-20 z-30 font-ssurround text-sm font-bold tracking-[0.08em] text-text-heading"
              animate={{
                opacity: [0, 1, 1, 0, 0],
              }}
              transition={{
                duration: 15,
                times: [0, 0.08, 0.18, 0.19, 1],
                repeat: Infinity,
                ease: "linear",
              }}
            >
              HMM...
            </motion.p>

            <motion.p
              className="absolute bottom-30 z-30 font-ssurround text-sm font-bold tracking-[0.08em] text-text-heading"
              animate={{
                opacity: [0, 0, 1, 1, 0, 0],
              }}
              transition={{
                duration: 15,
                times: [0, 0.39, 0.391, 0.73, 0.74, 1],
                repeat: Infinity,
                ease: "linear",
              }}
            >
              ALL MINE!
            </motion.p>

            <motion.p
              className="absolute bottom-20 z-30 font-ssurround text-sm font-bold tracking-[0.08em] text-text-heading"
              animate={{
                opacity: [0, 0, 1, 1, 0],
              }}
              transition={{
                duration: 15,
                times: [0, 0.76, 0.77, 0.99, 1],
                repeat: Infinity,
                ease: "linear",
              }}
            >
              NOTHING...
            </motion.p>
          </div>
        )}

        {/* 문구 */}
        <div className={cn("flex flex-col items-center gap-3", variant === "default" && "mt-6")}>
          <p
            className={cn(
              "font-ssurround font-bold text-text-heading",
              variant === "default" ? "text-lg" : "text-md",
            )}
          >
            {title}
          </p>

          {description && (
            <p
              className={cn(
                "leading-relaxed font-medium text-sub-deepgray",
                variant === "default" ? "text-md" : "text-sm",
              )}
            >
              {description}
            </p>
          )}
        </div>

        {/* 버튼 */}
        {(primaryAction || secondaryAction) && (
          <div
            className={cn(
              "pointer-events-auto flex w-full gap-2",
              variant === "default" ? "mt-4" : "",
            )}
          >
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
      </div>
    </motion.div>
  );
}

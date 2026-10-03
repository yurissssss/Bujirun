"use client";

import { useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/utils";
import { Button } from "./Button";
import { Card } from "./Card";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  title?: string;
  description?: ReactNode;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "warning";
  confirmDisabled?: boolean;
  scrollBody?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  childrenClassName?: string;
  childrenVariant?: "card" | "plain";
  footer?: React.ReactNode;
  hideActions?: boolean;
  hideCloseButton?: boolean;
  closeButtonClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  icon,
  title,
  description,
  children,
  confirmText = "확인",
  cancelText = "취소",
  confirmVariant = "primary",
  confirmDisabled = false,
  scrollBody = false,
  onConfirm,
  onCancel,
  className,
  iconClassName,
  titleClassName,
  childrenClassName,
  childrenVariant = "card",
  footer,
  hideActions = false,
  hideCloseButton = false,
  closeButtonClassName,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (typeof document === "undefined") return null;

  const appRoot = document.getElementById("app-root");
  if (!appRoot) return null;

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return createPortal(
    <div
      className="absolute inset-0 z-50 flex items-center justify-center px-5 py-6"
      style={{ backgroundColor: "var(--color-system-blackbg)" }}
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full max-w-[320px] max-h-[80dvh] overflow-x-hidden bg-white rounded-3xl px-7 py-7 flex flex-col items-center gap-5",
          scrollBody ? "overflow-hidden" : "overflow-y-auto",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* x 버튼 — hideCloseButton prop으로 숨길 수 있음 */}
        {!hideCloseButton && (
          <button
            type="button"
            aria-label="닫기"
            className={cn(
              "absolute right-5 top-5 z-10 flex h-5 w-5 cursor-pointer items-center justify-center active:opacity-70",
              confirmVariant === "warning" ? "text-sub-coral" : "text-main-blue",
              closeButtonClassName,
            )}
            onClick={onClose}
          >
            <svg
              viewBox="0 0 512.021 512.021"
              className="pointer-events-none h-4 w-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M301.258,256.01L502.645,54.645c12.501-12.501,12.501-32.769,0-45.269c-12.501-12.501-32.769-12.501-45.269,0l0,0L256.01,210.762L54.645,9.376c-12.501-12.501-32.769-12.501-45.269,0s-12.501,32.769,0,45.269L210.762,256.01L9.376,457.376c-12.501,12.501-12.501,32.769,0,45.269s32.769,12.501,45.269,0L256.01,301.258l201.365,201.387c12.501,12.501,32.769,12.501,45.269,0c12.501-12.501,12.501-32.769,0-45.269L301.258,256.01z"
                stroke="currentColor"
                strokeWidth="18"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {icon && (
          <div
            className={cn(
              "w-[48px] h-[48px] rounded-full flex items-center justify-center text-2xl",
              confirmVariant === "warning" ? "bg-system-coralbg" : "bg-system-navbg",
              iconClassName,
            )}
          >
            {icon}
          </div>
        )}

        {(title || description) && (
          <div className="flex flex-col items-center gap-5 text-center">
            {title && (
              <h2
                className={cn("font-ssurround text-lg font-bold text-text-heading", titleClassName)}
              >
                {title}
              </h2>
            )}
            {description && (
              <div className="text-md font-medium text-text-primary leading-relaxed whitespace-pre-line break-keep">
                {description}
              </div>
            )}
          </div>
        )}

        {children &&
          (childrenVariant === "card" ? (
            <Card
              variant="glass-sm"
              className={cn(
                "w-full rounded-lg border px-3 py-2 flex flex-col gap-2 justify-center text-sm",
                confirmVariant === "warning"
                  ? "!border-sub-coral/20 !bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-main-white)_65%,transparent),color-mix(in_srgb,var(--color-system-coralbg)_60%,transparent))]"
                  : "!border-main-blue/20 !bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-main-white)_65%,transparent),color-mix(in_srgb,var(--color-system-navbg)_60%,transparent))]",
                childrenClassName,
              )}
            >
              {children}
            </Card>
          ) : (
            <div
              className={cn(
                "w-full flex flex-col items-center gap-6",
                scrollBody && "min-h-0 flex-1 overflow-y-auto",
                childrenClassName,
              )}
            >
              {children}
            </div>
          ))}

        {footer}

        {!hideActions && (
          <div className="mt-1 flex w-full gap-6">
            <Button
              variant="secondary"
              className={
                confirmVariant === "warning" ? "!border-sub-coral !text-sub-coral" : undefined
              }
              onClick={handleCancel}
            >
              {cancelText}
            </Button>
            {onConfirm && (
              <Button variant={confirmVariant} onClick={onConfirm} disabled={confirmDisabled}>
                {confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>,
    appRoot,
  );
}

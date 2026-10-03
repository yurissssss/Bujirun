"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ReceiptButtons } from "@/features/receipt/components/ReceiptButtons";
import { TripReceipt } from "@/features/receipt/components/TripReceipt";
import { createReceiptFileName, waitForImages } from "@/features/receipt/utils/downloadReceipt";
import type { ReceiptData } from "@/features/receipt/types/receipt";
import { Toast } from "@/components";

type TripReceiptModalProps = {
  isOpen: boolean;
  receipt?: ReceiptData;
  onDetail?: () => void;
  onClose: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: () => void;
};

export function TripReceiptModal({
  isOpen,
  receipt,
  onDetail,
  onClose,
  onDownloadComplete,
  onDownloadError,
}: TripReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const receiptFileName = receipt
    ? createReceiptFileName(receipt.title, receipt.tripId)
    : "[bujirun]receipt-unknown.png";

  // 영수증.png 다운로드
  const handleDownload = useCallback(async () => {
    if (!receiptRef.current || !receipt) return;

    try {
      await document.fonts.ready;
      await waitForImages(receiptRef.current);

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "transparent",
      });

      const link = document.createElement("a");
      link.download = receiptFileName;
      link.href = dataUrl;
      link.click();

      setToast({
        isVisible: true,
        message: "영수증을 저장했어요.",
        variant: "success",
      });

      onDownloadComplete?.();
    } catch (error) {
      console.error("영수증 저장 실패:", error);

      setToast({
        isVisible: true,
        message: "영수증 저장에 실패했어요.",
        variant: "error",
      });

      onDownloadError?.();
    }
  }, [receipt, receiptFileName, onDownloadComplete, onDownloadError]);

  if (!isOpen || !receipt) return null;

  if (typeof document === "undefined") return null;

  const appRoot = document.getElementById("app-root");
  if (!appRoot) return null;

  return createPortal(
    <>
      <div className="absolute inset-0 z-50 overflow-hidden bg-system-blackbg" onClick={onClose}>
        <div className="h-full overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full justify-center px-5 py-13">
            <div className="relative w-full max-w-[320px]" onClick={(e) => e.stopPropagation()}>
              {/* 다운로드되는 영수증 */}
              <div ref={receiptRef}>
                <TripReceipt receipt={receipt} />
              </div>

              <div className="absolute right-3 top-5 z-20">
                <ReceiptButtons onDetail={onDetail} onDownload={handleDownload} onClose={onClose} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          isVisible={toast.isVisible}
          onHide={() => setToast((prev) => (prev ? { ...prev, isVisible: false } : null))}
          message={toast.message}
          variant={toast.variant}
        />
      )}
    </>,
    appRoot,
  );
}

export const waitForImages = async (element: HTMLElement) => {
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
      }

      if (typeof image.decode === "function") {
        await image.decode().catch(() => undefined);
      }
    }),
  );
};

const sanitizeFileName = (fileName: string) => fileName.replace(/[\\/:*?"<>|]/g, "").trim();

export const createReceiptFileName = (title: string, tripId: string | number) => {
  const safeTitle = sanitizeFileName(title);

  return safeTitle ? `[bujirun]${safeTitle}.png` : `[bujirun]receipt-${tripId}.png`;
};

export const downloadReceiptAsPng = async (element: HTMLElement, fileName: string) => {
  await document.fonts.ready;
  await waitForImages(element);

  const { toBlob } = await import("html-to-image");
  const blob = await toBlob(element, {
    pixelRatio: 2,
    backgroundColor: "transparent",
  });

  if (!blob) {
    throw new Error("영수증 이미지를 생성하지 못했습니다.");
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.download = fileName;
  link.href = objectUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
};

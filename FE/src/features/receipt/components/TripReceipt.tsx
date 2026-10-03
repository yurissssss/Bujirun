import Image from "next/image";

import { cn } from "@/shared/utils";

import receiptBackground from "@/assets/receipt/receipt_background.png";
import { ReceiptBarcode } from "@/features/receipt/components/ReceiptBarcode";
import type { ReceiptData } from "@/features/receipt/types/receipt";

import {
  formatDateWithDots,
  createBarcode,
  calculateTotalDays,
} from "@/features/receipt/utils/receipt";

interface TripReceiptProps {
  receipt: ReceiptData;
}

export function TripReceipt({ receipt }: TripReceiptProps) {
  const archiveNumber = receipt.archiveNumber;
  const issuedOn = formatDateWithDots(receipt.period.endDate);
  const barcode = createBarcode(receipt.period.startDate, receipt.period.endDate);
  const totalDays = calculateTotalDays(receipt.period.startDate, receipt.period.endDate);

  const spotsVisited = receipt.days.reduce((count, day) => count + day.places.length, 0);

  const receiptInfo = [
    ["TRAVELER", receipt.traveler],
    ["TITLE", receipt.title],
    [
      "PERIOD",
      `${formatDateWithDots(receipt.period.startDate)} - ${formatDateWithDots(receipt.period.endDate)}`,
    ],
    ["TOTAL DAYS", `${totalDays} days`],
    ["COMPANION", receipt.companion],
    ["MOOD", receipt.mood],
    ["THEME", receipt.theme],
    ["SPOTS VISITED", `${spotsVisited} PLACES`],
    ["COLLECTION", `${receipt.collectedSpots} / ${receipt.collection}`],
  ] satisfies [string, string][];

  return (
    <article
      className="relative w-full overflow-hidden bg-cover bg-center bg-no-repeat px-3 py-13 font-courierprime text-sm text-text-receipt-main"
      style={{ backgroundImage: `url(${receiptBackground.src})` }}
    >
      <header className="text-center">
        <h2 className="text-3xl font-bold tracking-[0.08em]">MEMORY ARCHIVE</h2>
        <p className="mt-2 text-text-receipt-sub tracking-[0.12em]">COLLECTED ALONG THE WAY</p>
        <p className="mb-2 text-text-receipt-sub tracking-[0.12em]">W. BUJIRUN</p>
      </header>

      <div className=" my-3 border-t border-dashed border-sub-darkgray" />

      {/* JOURNEY OVERVIEW */}
      <section className="px-3">
        <h3 className="mb-2 font-bold text-md italic tracking-[0.04em] text-sub-darkgray">
          JOURNEY OVERVIEW
        </h3>

        <div className="grid items-center gap-3">
          <div className="relative size-20 justify-self-center overflow-hidden rounded-full border-2 border-sub-gray">
            {receipt.profileImage ? (
              <Image
                src={receipt.profileImage}
                alt="여행 영수증 프로필 사진"
                fill
                className="object-cover grayscale scale-[1.27] origin-[center_10%]"
              />
            ) : (
              <div className="size-full rounded-full bg-sub-lightgray" />
            )}
          </div>

          <dl className="space-y-1.5 leading-none text-text-receipt-main">
            {receiptInfo.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[110px_minmax(0,1fr)] gap-1">
                <dt className="font-bold tracking-[0.04em]">{label}</dt>
                <dd className="min-w-0 break-keep font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="my-3 border-t border-dashed border-sub-darkgray" />

      {/* JOURNEY ROUTE */}
      <section className="px-3">
        <h3 className="mb-2 font-bold text-md italic tracking-[0.04em] text-sub-darkgray">
          JOURNEY ROUTE
        </h3>

        <div className="space-y-4">
          {receipt.days.map((day) => (
            <div key={day.day}>
              <div className="my-2 flex items-center gap-4 font-bold">
                <span className="text-text-receipt-sub text-lg">DAY {day.day}</span>
                <span className="text-sub-gray">
                  {day.date.split(".").slice(1).join(".")}({day.weekday})
                </span>
              </div>

              <ul>
                {day.places.map((place, placeIndex) => (
                  <li
                    key={place.id}
                    className={cn(
                      "grid grid-cols-[48px_86px_minmax(0,1fr)] items-center gap-3",
                      place.image ? "py-2" : "py-0.5",
                      placeIndex !== day.places.length - 1 && "border-b border-sub-lightgray",
                    )}
                  >
                    <time className="text-center text-text-receipt-sub">{place.time}</time>

                    {place.image ? (
                      <div className="relative h-12 w-22 overflow-hidden rounded-md">
                        <Image
                          src={place.image}
                          alt={`${place.name} 사진`}
                          fill
                          sizes="88px"
                          loading="eager"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate font-bold">{place.name}</p>
                      <p className="text-xs font-bold">
                        <span aria-hidden="true">{place.categoryIcon}</span>{" "}
                        {place.collectionCategory}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="my-3 border-t border-dashed border-sub-darkgray" />

      <section className="px-3">
        <div className="flex items-center justify-between text-lg font-bold">
          <p>TOTAL JOURNEY</p>
          <p className="shrink-0 text-text-receipt-sub text-md">
            {totalDays} DAYS. {spotsVisited} PLACES
          </p>
        </div>
      </section>

      <div className="my-3 border-t border-dashed border-sub-darkgray" />

      <section className="px-3">
        <div className="space-y-0.5 mb-3 text-xs font-bold">
          <div className="flex justify-between">
            <span>ARCHIVE NO.</span>
            <span>{archiveNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>ISSUED ON</span>
            <span>{issuedOn}</span>
          </div>
        </div>

        <ReceiptBarcode value={barcode} />
      </section>

      <div className="my-3 border-t border-dashed border-sub-darkgray" />

      <footer className="text-center px-3 text-2xs">
        <p className="font-bold">this journey is now part of your collection. ♡</p>
        <p className="mt-1 tracking-[0.08em] text-text-receipt-sub">
          HOPE THIS JOURNEY BECAME A PRECIOUS MEMORY
        </p>
      </footer>
    </article>
  );
}

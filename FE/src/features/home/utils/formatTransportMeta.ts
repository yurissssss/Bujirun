import type { TransportOption } from "@/features/home/types/transport";

// 도보는 요금이 없으니 "0원"을 붙이지 않는다(요금 0 전체가 아니라 도보만 — 대중교통 요금 누락이 가려지지 않게).
export function formatTransportMeta({
  durationText,
  costText,
  steps,
}: Pick<TransportOption, "durationText" | "costText" | "steps">) {
  const isWalkOnly = steps.every((step) => step.type === "도보");
  return isWalkOnly ? (durationText ?? "-") : `${durationText ?? "-"} · ${costText ?? "-"}`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export { getErrorMessage } from "./getErrorMessage";
export { formatInviteDate, formatTripPeriod } from "./tripPeriod";
export { getKakaoMapUrl } from "./kakaoMapLink";

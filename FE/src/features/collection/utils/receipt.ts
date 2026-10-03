const formatDateToReceiptCode = (date: string) => date.replaceAll("-", "").slice(2);

export const formatDateWithDots = (date: string) => date.replaceAll("-", ".");

export const createArchiveNumber = (startDate: string, tripOrder: number) =>
  `#BUSAN-${formatDateToReceiptCode(startDate)}-${String(tripOrder).padStart(3, "0")}`;

export const createBarcode = (startDate: string, endDate: string) =>
  `${formatDateToReceiptCode(startDate)}-${formatDateToReceiptCode(endDate)}-BUSAN`;

export const calculateTotalDays = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

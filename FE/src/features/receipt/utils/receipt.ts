export const formatDateWithDots = (date: string) => date.replaceAll("-", ".");

export const calculateTotalDays = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

export const createArchiveNumber = (startDate: string, travelNumber: number) => {
  const [, month, day] = startDate.split("-");

  return `#BUSAN-${month}${day}-${String(travelNumber + 1).padStart(3, "0")}`;
};

export const createBarcode = (startDate: string, endDate: string) => {
  return `${startDate.replaceAll("-", "")}${endDate.replaceAll("-", "")}`;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export const getWeekday = (date: string) => {
  if (!date) return "";

  return WEEKDAYS[new Date(`${date}T00:00:00`).getDay()];
};

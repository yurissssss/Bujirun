import { isAxiosError } from "axios";

// 백엔드 message 끝에는 원인 파악용 값이 붙어 온다
// (예: "종료일이 시작일보다 빠를 수 없습니다. startAt=2026-09-14, endAt=2026-09-13",
//      "항목을 찾을 수 없습니다. id=5201d714-de75-4f11-9791-d009b41301b6").
// 사용자에게는 아무 의미가 없고 토스트만 길어지므로, 사람이 읽는 문장만 남기고 떼어낸다.
// 필드명=값 형태(ASCII 식별자 기준)와 맨 UUID를 지우고, 남은 끝의 구두점도 정리한다.
const FIELD_VALUE_PATTERN = /[,.]?\s*\(?\b[A-Za-z_][A-Za-z0-9_]*\s*[:=]\s*\S+\)?/g;
const BARE_UUID_PATTERN =
  /[,.]?\s*\(?\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b\)?/gi;
const TRAILING_PUNCTUATION_PATTERN = /[\s,.:;(]+$/;

// 백엔드 공통 응답 envelope({ success, message, data })의 message를 최대한 살려서 보여준다.
// 서버가 구체적인 사유(예: "그룹당 일정은 하나만 만들 수 있습니다")를 내려줄 때
// 화면이 고정 문구로 덮어버리지 않도록 공용으로 뽑아 쓴다.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;

  const raw = error.response?.data?.message;
  if (typeof raw !== "string") return fallback;

  const cleaned = raw
    .replace(FIELD_VALUE_PATTERN, "")
    .replace(BARE_UUID_PATTERN, "")
    .replace(TRAILING_PUNCTUATION_PATTERN, "")
    .trim();
  // 서버가 message를 빈 문자열로 내려주거나, 떼고 나니 남는 문장이 없을 때가 있다. 그대로
  // 통과시키면 화면에 아무 글자도 없는 토스트가 떠서 "왜 떴는지 알 수 없는 빨간 줄"만 남는다.
  return cleaned || fallback;
}

import type { AxiosResponse } from "axios";

// 백엔드 공통 응답 envelope: { success, message, data }
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// res.data.data 반복 없이 실제 payload만 꺼낼 때 사용.
// 생성된 스웨거 타입은 success/message/data를 전부 optional로 표기하므로
// (백엔드 스펙에 required 지정이 없음) 느슨한 타입을 받고 성공 케이스를 전제로 단언한다.
export function unwrap<T>(response: AxiosResponse<{ data?: T }>): T {
  return response.data.data as T;
}

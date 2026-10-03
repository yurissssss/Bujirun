import type { operations } from "./schema";

// operations["opId"]에서 요청/응답 타입을 뽑아 쓰기 위한 헬퍼. schema.d.ts는
// `npm run api:types`로 재생성되므로 도메인 모듈에서 타입을 손으로 옮겨 적지 않는다.
export type OpQuery<Op extends keyof operations> = operations[Op]["parameters"]["query"];

export type OpPath<Op extends keyof operations> = operations[Op]["parameters"]["path"];

export type OpBody<Op extends keyof operations> = operations[Op] extends {
  requestBody: { content: { "application/json": infer Body } };
}
  ? Body
  : never;

export type OpResponse<Op extends keyof operations> = operations[Op]["responses"][200] extends {
  content: { "*/*": infer Body };
}
  ? Body
  : void;

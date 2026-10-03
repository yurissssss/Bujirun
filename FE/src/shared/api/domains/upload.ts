import { apiClient } from "@/shared/api/client";
import { unwrap } from "@/shared/api/response";
import type { OpBody, OpResponse } from "@/shared/api/types";

export function presignUpload(body: OpBody<"presign">) {
  return apiClient
    .post<OpResponse<"presign">>("/api/uploads/presign", body)
    .then((res) => unwrap(res));
}

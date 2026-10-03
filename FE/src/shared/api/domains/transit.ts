import { apiClient } from "@/shared/api/client";
import { unwrap } from "@/shared/api/response";
import type { OpQuery, OpResponse } from "@/shared/api/types";

export const keys = {
  all: ["transit"] as const,
  busArrival: (query: OpQuery<"getBusArrival">) => [...keys.all, "bus-arrival", query] as const,
  subwayArrival: (query: OpQuery<"getSubwayArrival">) =>
    [...keys.all, "subway-arrival", query] as const,
};

export function getBusArrival(query: OpQuery<"getBusArrival">) {
  return apiClient
    .get<OpResponse<"getBusArrival">>("/api/transit/arrival/bus", { params: query })
    .then((res) => unwrap(res));
}

export function getSubwayArrival(query: OpQuery<"getSubwayArrival">) {
  return apiClient
    .get<OpResponse<"getSubwayArrival">>("/api/transit/arrival/subway", { params: query })
    .then((res) => unwrap(res));
}

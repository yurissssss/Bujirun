"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifyVisit } from "@/shared/api/domains/visit";

type VerifyVisitBody = Parameters<typeof verifyVisit>[0];

export function useVerifyVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: VerifyVisitBody) => verifyVisit(body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["spots"] }),
        queryClient.invalidateQueries({ queryKey: ["collections"] }),
        queryClient.invalidateQueries({ queryKey: ["itineraries"] }),
      ]);
    },
  });
}

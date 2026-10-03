"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-[320px] rounded-2xl bg-main-white p-[20px]">
        <ErrorState
          code={500}
          primaryAction={{
            label: "다시 시도하기",
            onClick: unstable_retry,
          }}
        />
      </div>
    </div>
  );
}

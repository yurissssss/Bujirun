"use client";

import { useRouter } from "next/navigation";

import { ErrorState } from "@/components";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="absolute inset-0 z-10 bg-main-white">
      <ErrorState
        code={404}
        primaryAction={{
          label: "홈으로 돌아가기",
          onClick: () => router.push("/home"),
        }}
      />
    </div>
  );
}

// src/components/ui/KakaoLoginButton.tsx
"use client";

import Image from "next/image";
import kakaoLoginImg from "@/assets/icons/login-register/kakao_login_large_wide.png";
import { cn } from "@/shared/utils";

interface KakaoLoginButtonProps {
  className?: string;
}

const KAKAO_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize` +
  `?client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}` +
  `&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}` +
  `&response_type=code`;

export function KakaoLoginButton({ className }: KakaoLoginButtonProps) {
  const handleLogin = () => {
    window.location.href = KAKAO_AUTH_URL;
  };

  return (
    <button
      className={cn("w-full transition-opacity active:opacity-80", className)}
      onClick={handleLogin}
    >
      <Image src={kakaoLoginImg} alt="카카오 로그인" className="w-full h-auto" priority />
    </button>
  );
}

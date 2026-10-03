import localFont from "next/font/local";
import { Courier_Prime } from "next/font/google";

// 전부 next/font로 자체 호스팅 — 빌드 타임에 자동으로 preload + font-display 처리되고,
// 외부 CDN(jsdelivr 등) 왕복 없이 우리 도메인에서 바로 서빙된다.
// globals.css의 @theme inline 블록에서 각 --font-* 토큰이 이 변수들을 참조한다.

export const paperlogy = localFont({
  src: [
    { path: "../assets/fonts/Paperlogy-4Regular.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/Paperlogy-5Medium.woff2", weight: "500", style: "normal" },
    { path: "../assets/fonts/Paperlogy-6SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../assets/fonts/Paperlogy-7Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-paperlogy-local",
  display: "swap",
});

export const ssurround = localFont({
  src: "../assets/fonts/Cafe24Ssurround.woff",
  variable: "--font-ssurround-local",
  display: "swap",
  preload: false,
});

export const proup = localFont({
  src: "../assets/fonts/Cafe24PROUP.woff2",
  variable: "--font-proup-local",
  display: "swap",
  preload: false,
});

export const laundryGothic = localFont({
  src: "../assets/fonts/TTLaundryGothicR.woff2",
  variable: "--font-laundrygothic-local",
  display: "swap",
  preload: false,
});

export const giantsInline = localFont({
  src: "../assets/fonts/Giants-Inline.woff2",
  variable: "--font-giants-local",
  display: "swap",
  preload: false,
});

export const mona = localFont({
  src: [
    { path: "../assets/fonts/Mona12.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/Mona12-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mona-local",
  display: "swap",
  preload: false,
});

export const dxSubtitles = localFont({
  src: "../../public/fonts/DXMSubtitlesM-KSCpc-EUC-H.ttf",
  variable: "--font-dxsubtitles-local",
  display: "swap",
  preload: false,
});

export const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courierprime-local",
  display: "swap",
  preload: false,
});

export const fontVariables = [
  paperlogy.variable,
  ssurround.variable,
  proup.variable,
  laundryGothic.variable,
  giantsInline.variable,
  mona.variable,
  dxSubtitles.variable,
  courierPrime.variable,
].join(" ");

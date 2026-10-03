import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AppShell } from "@/components";
import { HostWaitingTimeoutModal } from "@/features/itinerary/components/HostWaitingTimeoutModal";
import "@/styles/globals.css";
import { fontVariables } from "@/styles/fonts";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://bujirun.store"),
  title: "Bujirun",
  description: "Bujirun frontend application",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bujirun",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#97c1ff",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`h-full overflow-hidden overscroll-none antialiased ${fontVariables}`}
    >
      <body className="h-full overflow-hidden overscroll-none bg-background text-foreground">
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
          strategy="afterInteractive"
        />
        <Providers>
          <AppShell>{children}</AppShell>
          {/* 방장이 어느 화면에 있든 취향분석 대기 타임아웃을 알린다 */}
          <HostWaitingTimeoutModal />
        </Providers>
      </body>
    </html>
  );
}

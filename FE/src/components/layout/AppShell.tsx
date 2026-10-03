import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNavigation } from "./BottomNavigation";
import { ScrollToTop } from "./ScrollToTop";
import backgroundImg from "../../assets/background/background.png";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-dvh overflow-hidden overscroll-none bg-main-white">
      <ScrollToTop />
      <div
        id="app-root"
        className="relative mx-auto flex h-dvh w-full max-w-[390px] flex-col overflow-hidden overscroll-none bg-cover bg-center bg-no-repeat sm:h-[844px] sm:max-h-dvh"
        style={{ backgroundImage: `url(${backgroundImg.src})` }}
      >
        <AppHeader />
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-6 px-6">
          {children}
        </div>
        <BottomNavigation />
      </div>
    </div>
  );
}

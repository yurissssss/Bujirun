"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import EmergencyIcon from "@/assets/icons/itinerary/emergency-on.svg?svgr";
import { navigationItems } from "@/shared/constants/navigation";
import { useItineraryGenerationLockStore } from "@/shared/stores";

// 화면에 들어오는 것만으로 잠기는 라우트 — 이 단계부터는 이미 생성이 시작돼 있어서
// 다른 사람들이 내 진행을 기다리는 상태다.
const LOCKED_WORKFLOW_ROUTES = [
  "/itinerary/trips/swipe",
  "/itinerary/trips/waiting",
  "/itinerary/trips/result",
  "/itinerary/trips/vote-waiting",
];

// 들어오는 것만으로는 잠기지 않지만, 그 화면이 직접 lock()을 걸면 그 잠금을 존중하는 라우트.
// personality 화면은 "확인하고 시작"을 누르기 전이라 도착만으로 탭을 막으면 과하지만,
// 누른 뒤 "난 다 좋아"의 서버 왕복 중에는 다른 화면과 같은 이유로 이동을 막아야 한다.
// (여기를 그냥 LOCKED_WORKFLOW_ROUTES에 넣으면 시작 전부터 4개 탭이 잠긴다.)
const LOCK_HONORING_ROUTES = ["/itinerary/trips/personality"];

const ICON_PATHS = {
  "/": {
    off: "M19,24H5c-2.757,0-5-2.243-5-5V9.724c0-1.665,.824-3.215,2.204-4.145L9.203,.855c1.699-1.146,3.895-1.146,5.594,0l7,4.724c1.379,.93,2.203,2.479,2.203,4.145v9.276c0,2.757-2.243,5-5,5ZM12,1.997c-.584,0-1.168,.172-1.678,.517L3.322,7.237c-.828,.558-1.322,1.487-1.322,2.486v9.276c0,1.654,1.346,3,3,3h14c1.654,0,3-1.346,3-3V9.724c0-.999-.494-1.929-1.321-2.486L13.678,2.514c-.51-.345-1.094-.517-1.678-.517Z",
    on: "M22,5.735V1.987c0-.553-.447-1-1-1s-1,.447-1,1v2.379L14.797,.855c-1.699-1.146-3.895-1.146-5.594,0L2.204,5.579c-1.38,.93-2.204,2.479-2.204,4.145v9.276c0,2.757,2.243,5,5,5h14c2.757,0,5-2.243,5-5V9.724c0-1.579-.748-3.047-2-3.989Z",
  },
  "/itinerary": {
    off: "M19,2h-1V1c0-.552-.447-1-1-1s-1,.448-1,1v1H8V1c0-.552-.447-1-1-1s-1,.448-1,1v1h-1C2.243,2,0,4.243,0,7v12c0,2.757,2.243,5,5,5h14c2.757,0,5-2.243,5-5V7c0-2.757-2.243-5-5-5ZM5,4h14c1.654,0,3,1.346,3,3v1H2v-1c0-1.654,1.346-3,3-3Zm14,18H5c-1.654,0-3-1.346-3-3V10H22v9c0,1.654-1.346,3-3,3Zm0-8c0,.552-.447,1-1,1H6c-.553,0-1-.448-1-1s.447-1,1-1h12c.553,0,1,.448,1,1Zm-7,4c0,.552-.447,1-1,1H6c-.553,0-1-.448-1-1s.447-1,1-1h5c.553,0,1,.448,1,1Z",
    on: "M24,8H0v-1C0,4.243,2.243,2,5,2h1V1c0-.552,.447-1,1-1s1,.448,1,1v1h8V1c0-.552,.447-1,1-1s1,.448,1,1v1h1c2.757,0,5,2.243,5,5v1Zm-14,14.545c0-.892,.187-1.753,.535-2.545H6c-.553,0-1-.448-1-1s.447-1,1-1c0,0,4.022,0,5.92,.001l2.001-2.001H6c-.553,0-1-.448-1-1s.447-1,1-1H15.922l2.741-2.741c.812-.812,1.891-1.259,3.039-1.259H0v9c0,2.757,2.243,5,5,5h5v-1.455Zm10.077-9.872c.897-.897,2.353-.897,3.25,0,.897,.897,.897,2.353,0,3.25l-6.807,6.807c-.813,.813-1.915,1.27-3.065,1.27h-1.455v-1.455c0-1.15,.457-2.252,1.27-3.065l6.807-6.807Z",
  },
  "/collection": {
    off: "M17,0H7C4.243,0,2,2.243,2,5v15c0,2.206,1.794,4,4,4h11c2.757,0,5-2.243,5-5V5c0-2.757-2.243-5-5-5Zm3,5v11H8V2h4V10.347c0,.623,.791,.89,1.169,.395l1.331-1.743,1.331,1.743c.378,.495,1.169,.228,1.169-.395V2c1.654,0,3,1.346,3,3ZM6,2.184v13.816c-.732,0-1.409,.212-2,.556V5c0-1.302,.839-2.402,2-2.816Zm11,19.816H6c-2.629-.047-2.627-3.954,0-4h14v1c0,1.654-1.346,3-3,3Z",
    on: "m22.2 2.163a5 5 0 0 0 -4.157-1.069l-1.764.432a4 4 0 0 0 -3.279 3.935v15.467a6.909 6.909 0 0 1 -2 0v-15.467a3.981 3.981 0 0 0 -3.226-3.923l-1.874-.456a5 5 0 0 0 -5.9 4.918v10.793a5 5 0 0 0 4.105 4.919l6.286 1.143a9 9 0 0 0 3.218 0l6.291-1.143a5 5 0 0 0 4.1-4.919v-10.793a4.983 4.983 0 0 0 -1.8-3.837z",
  },
  "/mypage": {
    off: "M10,12a1,1,0,0,1-1-1c0-1.054-.68-2-1-2s-1,.946-1,2a1,1,0,0,1-2,0C5,9.108,6.232,7,8,7s3,2.108,3,4A1,1,0,0,1,10,12Zm9-1c0-1.892-1.232-4-3-4s-3,2.108-3,4a1,1,0,0,0,2,0c0-1.054.68-2,1-2s1,.946,1,2a1,1,0,0,0,2,0Zm5,1A12.013,12.013,0,0,0,12,0C-3.9.6-3.893,23.4,12,24A12.013,12.013,0,0,0,24,12Zm-2,0A10.011,10.011,0,0,1,12,22C-1.249,21.5-1.244,2.5,12,2A10.011,10.011,0,0,1,22,12Zm-4.334,3.746a1,1,0,0,0-1.33-1.493,6.36,6.36,0,0,1-8.67,0,1,1,0,0,0-1.332,1.492A9.454,9.454,0,0,0,12,18,9.454,9.454,0,0,0,17.666,15.746Z",
    on: "M12,0A12.013,12.013,0,0,0,0,12c.6,15.9,23.4,15.893,24,0A12.013,12.013,0,0,0,12,0ZM6,12a1,1,0,0,1-1-1C5,9.108,6.232,7,8,7s3,2.108,3,4a1,1,0,0,1-2,0c0-1.054-.679-2-1-2s-1,.946-1,2A1,1,0,0,1,6,12Zm10.949,3.293a5.178,5.178,0,0,1-9.9.007A.994.994,0,0,1,8.009,14H15.99A.994.994,0,0,1,16.949,15.293ZM18,12a1,1,0,0,1-1-1c0-1.054-.679-2-1-2s-1,.946-1,2a1,1,0,0,1-2,0c0-1.892,1.232-4,3-4s3,2.108,3,4A1,1,0,0,1,18,12Z",
  },
} as const;

type NavHref = keyof typeof ICON_PATHS;

function isNavHref(href: string): href is NavHref {
  return href in ICON_PATHS;
}

function NavIcon({ href, isActive }: { href: string; isActive: boolean }) {
  if (!isNavHref(href)) return null;
  const { off, on } = ICON_PATHS[href];

  return (
    <div className="relative size-5">
      <svg
        viewBox="0 0 24 24"
        className={`absolute inset-0 size-5 text-text-primary transition-all duration-500 ease-out ${
          isActive ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <path d={off} fill="currentColor" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className={`absolute inset-0 size-5 text-sub-deepblue transition-all duration-500 ease-out ${
          isActive ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <path d={on} fill="currentColor" />
      </svg>
    </div>
  );
}

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pathnameAtPrompt, setPathnameAtPrompt] = useState(pathname);
  const isGenerationLocked = useItineraryGenerationLockStore((state) => state.isLocked);
  const lockGeneration = useItineraryGenerationLockStore((state) => state.lock);
  const unlockGeneration = useItineraryGenerationLockStore((state) => state.unlock);

  const isOnWorkflowRoute = LOCKED_WORKFLOW_ROUTES.some((route) => pathname.startsWith(route));
  const isOnLockHonoringRoute =
    isOnWorkflowRoute || LOCK_HONORING_ROUTES.some((route) => pathname.startsWith(route));

  // 잠금은 "지금 생성 플로우 화면에 있을 때"만 의미가 있다. 예전엔 잠금이 sessionStorage에
  // 남고 정상 완료 경로에서만 풀렸기 때문에, 생성 중에 튕겨서 홈으로 떨어지면 4개 탭이
  // 전부 막힌 채로 갇혀서 일정 생성으로 다시 들어갈 방법이 없었다.
  // 플로우 밖으로 나간 순간 무조건 풀어주는 건 그대로 두고, 화면이 스스로 건 잠금
  // (personality의 "확인하고 시작")만 덮어쓰지 않게 한다.
  useEffect(() => {
    if (isOnWorkflowRoute) lockGeneration();
    else if (!isOnLockHonoringRoute) unlockGeneration();
  }, [isOnWorkflowRoute, isOnLockHonoringRoute, lockGeneration, unlockGeneration]);

  const isNavigationBlocked = isGenerationLocked && isOnLockHonoringRoute;

  // 화면이 바뀌면 띄워둔 안내 모달은 버린다. 이 모달은 열림 여부가 pendingHref 하나로만
  // 결정되고 BottomNavigation은 AppShell에 있어 페이지 이동에도 살아남는데, 투표 확정
  // 폴링(vote-waiting/result)은 사용자가 누르지 않아도 /itinerary로 넘겨버린다. 그래서
  // 모달을 띄워둔 채 확정이 나면 완성된 일정 위에 "생성 중" 경고만 남아 있었다.
  // (effect가 아니라 렌더 중에 맞추는 건 React가 권하는 "상태 초기화" 방식이다.)
  if (pathnameAtPrompt !== pathname) {
    setPathnameAtPrompt(pathname);
    setPendingHref(null);
  }

  // 로그인/회원가입 페이지에서는 숨기기
  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <>
      <nav className="z-30 w-full shrink-0 bg-main-white backdrop-blur">
        <div className="grid h-[72px] grid-cols-4 p-2">
          {navigationItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            // 생성 중엔 지금 있는 탭(일정)만 색을 살리고 나머지를 흐리게 해서,
            // "다른 탭으로는 못 간다"가 눌러보기 전에 보이게 한다.
            const isDimmed = isNavigationBlocked && !isActive;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={isNavigationBlocked || undefined}
                onClick={(event) => {
                  if (!isNavigationBlocked) return;
                  event.preventDefault();
                  // 지금 화면이 속한 탭(일정)은 눌러도 갈 곳이 없다. 여기에까지 "생성 중"
                  // 경고를 띄우면 나갈 생각도 없던 사람에게 뜬금없이 뜨는 꼴이라,
                  // 흐려진 다른 탭을 눌렀을 때만 왜 막혔는지 안내한다.
                  if (isActive) return;
                  setPendingHref(item.href);
                }}
                // 생성 중에는 못 넘어간다는 걸 눌러보기 전에 알 수 있게 흐리게 보여준다.
                // 클릭 자체는 살려둬서(pointer-events 유지) 왜 막혔는지 모달로 안내한다.
                className={`relative flex min-w-0 flex-col items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isDimmed ? "opacity-25 grayscale" : ""
                }`}
              >
                <div
                  className={`absolute w-20 h-14 rounded-2xl transition-all duration-500 ease-out ${
                    isActive ? "bg-system-navbg" : "bg-transparent"
                  }`}
                />
                <div className="relative flex translate-y-0.5 flex-col items-center justify-center gap-1.5">
                  <NavIcon href={item.href} isActive={isActive} />
                  <span
                    className={`text-xs font-semibold leading-none transition-all duration-500 ease-out ${
                      isActive ? "text-sub-deepblue" : "text-text-primary"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <Modal
        isOpen={pendingHref !== null}
        onClose={() => setPendingHref(null)}
        hideCloseButton
        hideActions
        confirmVariant="warning"
        icon={<EmergencyIcon width={25} height={25} className="text-sub-coral" aria-hidden />}
        title="일정 생성 중이에요!"
        description={
          '지금 나가면 친구들이 기다릴 수 있어요.\n나가더라도 일정 탭에서 "이어서 만들기"로\n같은 자리로 돌아올 수 있어요.'
        }
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button variant="warning" onClick={() => setPendingHref(null)}>
              계속 진행하기
            </Button>
            {/* 나가는 길을 아예 막으면, 화면이 한 번 꼬였을 때 사용자가 앱 안에서
                탈출할 방법이 없다. 진행 상황은 저장돼 있어서 언제든 이어할 수 있다. */}
            <Button
              variant="secondary"
              // 경고 모달이라 취소 버튼도 코랄로 맞춘다(Modal의 warning 취소 버튼과 동일).
              className="!border-sub-coral !text-sub-coral"
              onClick={() => {
                const href = pendingHref;
                setPendingHref(null);
                unlockGeneration();
                if (href) router.push(href);
              }}
            >
              나가기 (진행 상황 저장됨)
            </Button>
          </div>
        }
      />
    </>
  );
}

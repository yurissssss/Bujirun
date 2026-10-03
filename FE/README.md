# 부지런 (Bujirun)

부산 관광지 도감과 동선 최적화를 기반으로 한 2030 뚜벅이 여행 최적화 서비스

> 새 화면/기능을 시작하기 전엔 [`docs/frontend-rules.md`](./docs/frontend-rules.md)(폴더 구조, 디자인 토큰, 공통 컴포넌트, PR 체크리스트)를 먼저 확인하세요.

## Tech Stack

| Category        | Technology             |
| --------------- | ---------------------- |
| Framework       | Next.js App Router 16  |
| UI Library      | React 19               |
| Language        | TypeScript             |
| Styling         | Tailwind CSS v4        |
| State (Client)  | Zustand                |
| State (Server)  | TanStack Query         |
| HTTP Client     | Axios                  |
| Map             | Kakao Map SDK          |
| Motion / DnD    | Framer Motion, DND Kit |
| Realtime Collab | Yjs, y-websocket       |
| Icon            | lucide-react           |
| API Type Gen    | openapi-typescript     |
| Deploy          | Vercel                 |
| Code Quality    | ESLint, Prettier       |

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+

### Installation

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일 수정
```

### Development

```bash
npm run dev
```

http://localhost:3000 에서 확인합니다.

### Build

```bash
npm run build
npm run start
```

## Scripts

| Script                 | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | 개발 서버 실행                                            |
| `npm run build`        | 프로덕션 빌드                                             |
| `npm run start`        | 프로덕션 서버 실행                                        |
| `npm run lint`         | ESLint 검사                                               |
| `npm run typecheck`    | TypeScript 타입 검사                                      |
| `npm run format`       | Prettier 포맷팅                                           |
| `npm run format:check` | 포맷팅 검사                                               |
| `npm run api:types`    | 백엔드 OpenAPI 스펙으로 `src/shared/api/schema.d.ts` 갱신 |

## Project Structure

```txt
src/
├── app/            # 페이지, 레이아웃 (라우팅) — 아래 Routing 참고
├── components/     # 여러 화면에서 공통으로 쓰는 컴포넌트
├── features/       # 기능별 컴포넌트: auth, home, itinerary, collection, mypage, receipt
├── shared/         # api(Axios 클라이언트·도메인별 API·schema.d.ts), types, stores(Zustand), utils, constants
├── mocks/          # 임시 더미 데이터
├── assets/         # 이미지, 아이콘, 폰트
├── types/          # 전역 타입 선언
└── styles/         # 전역 스타일(globals.css), 디자인 토큰
```

- 한 화면에서만 쓰는 컴포넌트 → `features/{기능명}`
- 여러 화면에서 쓰는 컴포넌트 → `components`
- API, 타입, store, util → `shared`

자세한 폴더/컴포넌트 규칙은 [`docs/frontend-rules.md`](./docs/frontend-rules.md) 참고.

## Routing

| Path                   | Page                                                           | Layout        |
| ---------------------- | -------------------------------------------------------------- | ------------- |
| `/`                    | 홈 탭                                                          | AppShell      |
| `/itinerary`           | 일정 탭 (하위: 그룹 일정 생성/투표/확정, 관광지 상세, 로그 등) | AppShell      |
| `/collection`          | 도감 탭 (하위: `records`)                                      | AppShell      |
| `/mypage`              | 마이페이지 탭 (하위: 북마크, 로그 등)                          | AppShell      |
| `/login`, `/signup`    | 로그인/회원가입                                                | (AppShell 밖) |
| `/auth/kakao/callback` | 카카오 로그인 콜백                                             | (AppShell 밖) |
| `/join/[code]`         | 초대 링크로 그룹 참여                                          | (AppShell 밖) |

각 탭 하위의 실제 라우트는 `src/app` 디렉토리 구조를 참고하세요(자주 바뀌어서 여기 전부 나열하지 않습니다).

## Layout Policy

| Setting      | Value                                           |
| ------------ | ----------------------------------------------- |
| Layout Type  | Mobile Web App                                  |
| App Width    | `max-width: 402px`                              |
| Header       | Fixed Top                                       |
| Header Title | `BUJIRUN`                                       |
| Navigation   | Fixed Bottom Tab                                |
| Main Tabs    | `홈`, `일정`, `도감`, `마이페이지`              |
| Route Scroll | Top on route change                             |
| Scrollbar    | Hidden                                          |
| Safe Area    | `safe-area-inset-top`, `safe-area-inset-bottom` |

## Path Alias

`@/` → `src/`

```ts
import { AppShell } from "@/components";
import { apiClient } from "@/shared/api";
import { useUserPreferenceStore } from "@/shared/stores";
```

## State Management

### Zustand (Client State)

```tsx
import { useUserPreferenceStore } from "@/shared/stores";

function Component() {
  const { selectedRegion, setSelectedRegion } = useUserPreferenceStore();

  return (
    <button type="button" onClick={() => setSelectedRegion("서울")}>
      {selectedRegion ?? "지역 선택"}
    </button>
  );
}
```

### TanStack Query (Server State)

```tsx
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";

const { data, isLoading } = useQuery({
  queryKey: ["travel-spots"],
  queryFn: () => apiClient.get("/travel-spots").then((res) => res.data),
});

const mutation = useMutation({
  mutationFn: (payload: unknown) => apiClient.post("/schedules", payload),
});
```

## API

### Axios Client

```ts
import { apiClient } from "@/shared/api";

const response = await apiClient.get("/endpoint");
const created = await apiClient.post("/endpoint", { data: "value" });
```

공통 Axios 인스턴스는 `src/shared/api/client.ts`에 있습니다.

## Environment Variables

| Variable                         | Description                                                                 | Required |
| -------------------------------- | --------------------------------------------------------------------------- | -------- |
| `NEXT_PUBLIC_API_BASE_URL`       | 백엔드 API 기본 URL (`/api/*` rewrite 대상)                                 | Yes      |
| `NEXT_PUBLIC_YJS_WS_URL`         | 실시간 협업 WebSocket 서버(`Bujirun-node`) 주소                             | Yes      |
| `NEXT_PUBLIC_KAKAO_CLIENT_ID`    | 카카오 로그인 REST API 키                                                   | Yes      |
| `NEXT_PUBLIC_KAKAO_REDIRECT_URI` | 카카오 로그인 콜백 URI (카카오 디벨로퍼스에 등록된 값과 정확히 일치해야 함) | Yes      |
| `NEXT_PUBLIC_KAKAO_MAP_KEY`      | 카카오맵 JavaScript 키 (카카오톡 공유에도 재사용)                           | Yes      |

전체 설명은 `.env.example` 주석 참고. 로컬 카카오 로그인은 카카오 디벨로퍼스에 `http://localhost:3000/auth/kakao/callback`이 Redirect URI로 등록돼 있어야 동작합니다(안 돼 있으면 배포 도메인에서만 로그인 가능).

## Design System

File: `src/styles/globals.css`

### Tokens

색상(`main-*`, `sub-*`, `text-*`, `system-*`, `category-*`, `transport-*`), 텍스트 크기(`text-xs`~`text-2xl`), 스페이싱(4px 그리드), 라운드 값 전부 하드코딩 금지 — 토큰이 없으면 `globals.css`에 추가 후 사용합니다.

토큰 전체 목록과 값, 사용 예시는 [`docs/frontend-rules.md`](./docs/frontend-rules.md)를 참고하세요(자주 바뀌어서 여기 따로 나열하지 않습니다).

## Git Convention

### Branch Strategy

| Branch      | Description                                       |
| ----------- | ------------------------------------------------- |
| `main`      | 배포(프로덕션) 브랜치                             |
| `develop`   | 통합 브랜치 — 작업 브랜치는 보통 여기로 PR을 올림 |
| `feature/*` | 기능 개발                                         |
| `fix/*`     | 버그 수정                                         |
| `docs/*`    | 문서 작업                                         |
| `chore/*`   | 설정, 빌드, 기타 작업                             |

### Commit Convention

Conventional Commits를 사용합니다.

```txt
<type>: <subject>
```

| Type       | Description      |
| ---------- | ---------------- |
| `feat`     | 새로운 기능      |
| `fix`      | 버그 수정        |
| `docs`     | 문서 변경        |
| `style`    | 코드 포맷팅      |
| `refactor` | 코드 리팩토링    |
| `perf`     | 성능 개선        |
| `test`     | 테스트 추가/수정 |
| `chore`    | 빌드, 설정 변경  |
| `design`   | 디자인 토큰 적용 |
| `ci`       | CI 설정 변경     |

### PR Process

1. `develop`에서 `feature/*`, `fix/*` 등 작업 브랜치 생성
2. 작업 후 커밋
3. `develop` 브랜치로 PR 생성 (`.github/pull_request_template.md` 사용)
4. `npm run lint`, `npm run typecheck`, `npm run format:check` 통과 확인
5. 최소 1명 리뷰 후 머지
6. `develop`이 어느 정도 쌓이면 `develop` → `main` 배포 PR을 별도로 올려서 프로덕션에 반영

## Deploy

Vercel

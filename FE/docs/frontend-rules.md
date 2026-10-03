# 프론트엔드 개발 규칙

새 화면이나 PR 만들 때 한 번씩 확인하는 용도로 사용합니다.

---

## 스택

Next.js App Router · React 19 · TypeScript · Tailwind CSS v4 · Zustand · TanStack Query · Axios

---

## 폴더 구조

```
src/
├── app/          # 페이지, 레이아웃 (라우팅)
├── components/   # 여러 화면에서 공통으로 쓰는 컴포넌트
├── features/     # 기능별 컴포넌트 (한 탭/기능에서만 사용)
├── shared/       # api, types, stores, utils, constants
├── mocks/        # 임시 더미 데이터
├── assets/       # 이미지, 아이콘
└── styles/       # 전역 스타일, 디자인 토큰
```

- 한 화면에서만 쓰면 → `features/{기능명}`
- 여러 화면에서 쓰면 → `components`로 올리기
- API, 타입, store, util → `shared`

---

## 디자인 토큰

> 하드코딩 금지. 토큰이 없으면 `globals.css`에 추가 후 사용합니다.

### 색상

| 그룹     | 토큰                                                                                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 메인     | `main-blue`, `main-white`                                                                                                                                                               |
| 서브     | `sub-deepblue`, `sub-lightblue`, `sub-pink`, `sub-green`, `sub-violet`, `sub-coral`, `sub-gray`, `sub-darkgray`, `sub-lightgray`                                                        |
| 텍스트   | `text-primary`, `text-heading`                                                                                                                                                          |
| 시스템   | `system-whitebg`, `system-blackbg`, `system-navbg`, `system-scroll`, `system-searchbg`, `system-selected`, `system-divider`, `system-glassfrom`, `system-glassto`, `system-glassborder` |
| 카테고리 | `category-sea`, `category-nature`, `category-culture`, `category-experience`                                                                                                            |
| 교통     | `transport-taxi`                                                                                                                                                                        |

```tsx
// ❌
<div className="bg-[#97c1ff] text-[#0f172a] border-[rgba(151,193,255,0.2)]" />
// ✅
<div className="bg-main-blue text-text-heading border-system-glassborder" />
```

### 텍스트 크기

| 클래스     | 값   |
| ---------- | ---- |
| `text-xs`  | 11px |
| `text-sm`  | 12px |
| `text-md`  | 14px |
| `text-lg`  | 16px |
| `text-xl`  | 18px |
| `text-2xl` | 20px |

```tsx
// ❌  text-[14px]
// ✅  text-md
```

### 스페이싱 (Tailwind 4단위 그리드)

숫자 1 = 4px. `p-[16px]` 대신 `p-4` 사용합니다.

| suffix | 값   |
| ------ | ---- |
| `1`    | 4px  |
| `2`    | 8px  |
| `3`    | 12px |
| `4`    | 16px |
| `5`    | 20px |
| `6`    | 24px |
| `7`    | 28px |
| `8`    | 32px |

> 아이콘 크기, 고정 너비/높이, 특수 위치값은 `w-[28px]`, `top-[3px]` 임의값 허용합니다.

### 라운드

| 클래스         | 값   | 주요 사용처          |
| -------------- | ---- | -------------------- |
| `rounded-md`   | 6px  | 태그, 뱃지           |
| `rounded-lg`   | 8px  | 버튼, 입력창         |
| `rounded-xl`   | 12px | 중형 카드, 이미지    |
| `rounded-2xl`  | 16px | 일반 카드, 모달 내부 |
| `rounded-3xl`  | 24px | 시트, 큰 카드        |
| `rounded-full` | 50%  | 원형 버튼, 아바타    |

```tsx
// ❌  rounded-[10px]
// ✅  rounded-lg
```

---

## 레이아웃 기준

- 모바일 웹앱, 최대 너비 `390px`
- 기본 좌우 여백 `24px` (`px-screen-x`)
- 카드 내부 여백 `p-4` 또는 `p-5`
- 하단 탭과 콘텐츠가 겹치지 않게 여백 확인

---

## 공통 UI

| 용도           | 컴포넌트                                       |
| -------------- | ---------------------------------------------- |
| 버튼           | `Button` (`primary` / `secondary` / `warning`) |
| 카드           | `Card` (`glass-lg` / `glass-sm` / `white`)     |
| 팝업           | `Modal`                                        |
| 전체 화면 카드 | `PageCard`                                     |
| 검색창         | `SearchBar`                                    |
| 텍스트 입력    | `TextInput`                                    |

---

## 상태 관리

```
API 데이터          → TanStack Query
한 화면 안의 상태    → useState
여러 화면 공유 상태  → Zustand (파일명: use{Name}Store.ts)
```

---

## 컴포넌트 규칙

- 파일명 PascalCase, named export (페이지만 default export)
- `"use client"`는 `useState`, `useEffect`, 이벤트 핸들러가 필요할 때만
- 조건부 클래스는 `cn` 유틸 사용
- import는 `@/` alias 사용

---

## Git

| 브랜치      | 용도       |
| ----------- | ---------- |
| `main`      | 배포 기준  |
| `feature/*` | 기능 개발  |
| `fix/*`     | 버그 수정  |
| `chore/*`   | 설정, 기타 |

```
feat: 일정 타임라인 추가
fix: 하단 네비게이션 수정
design: 디자인 토큰 적용
chore: 설정 업데이트
```

---

## PR 체크리스트

- [ ] 모바일 390px 기준으로 화면이 깨지지 않나요?
- [ ] 디자인 토큰 (색상, 텍스트, 스페이싱, 라운드) 을 사용했나요?
- [ ] 공통 컴포넌트를 우선 활용했나요?
- [ ] `npm run lint` · `typecheck` 통과했나요?
- [ ] 불필요한 console, 임시 주석, 죽은 코드를 지웠나요?

---

## 팀 담당 영역

| 담당자 | 화면/기능                      |
| ------ | ------------------------------ |
| 은진   | 일정 탭                        |
| 유리   | 홈 탭, 도감 탭                 |
| 성빈   | 로그인/회원가입, 마이페이지 탭 |

- `components`, `shared`, `globals.css`, `layout.tsx` 수정 시 팀에 먼저 공유
- PR은 한 화면 또는 한 기능 단위로 작게 올리기
- 최소 1명 리뷰 후 merge

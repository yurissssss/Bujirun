@AGENTS.md
@docs/frontend-rules.md

# 작업 전 체크리스트

- 새 화면/기능 시작 전 `docs/frontend-rules.md`(폴더 구조, 디자인 토큰, 공통 컴포넌트, PR 체크리스트) 확인
- 담당 영역 외(`components`, `shared`, `globals.css`, `layout.tsx`) 수정 시 팀에 먼저 공유 — 은진: 일정 탭 / 유리: 홈·도감 탭 / 성빈: 로그인·회원가입·마이페이지
- PR 올리기 전 `npm run lint`, `npm run typecheck` 통과 확인
- 백엔드 API 스펙(`https://bujirun.store/v3/api-docs`)이 바뀌었으면 `npm run api:types`로 `schema.d.ts` 갱신 후 작업

# 진행 상황 / 알려진 이슈

> 아래는 마지막 확인 시점 기준 스냅샷. 시간이 지나면 낡을 수 있으니, 실제 동작은 코드나 라이브 API로 재검증할 것 — "메모리가 그렇다"는 "지금도 그렇다"와 다름.

## 해결된 과거 이슈 (재발 아니면 다시 의심하지 말 것)

- **로그인 토큰 저장 방식 불일치** (콜백이 `localStorage`에 저장 vs `apiClient`는 `useAuthStore`에서 읽음) — `develop` 머지로 해결 완료 (2026-07-08)
- **refresh 쿠키 `Secure`/`SameSite=None` 누락** (로그인 후 403 / `/api/auth/reissue` 400 원인) — 백엔드 배포로 해결 완료 (2026-07-08)
- 이후 401/403/reissue 400이 다시 나오면 위 두 개 재발이 아니라 다른 원인(토큰 만료, 백엔드 권한, CORS 등)부터 의심할 것

## 진행 중 / 라이브 검증 대기

- **일정 확정 플로우**: 예전 `createItinerary`+`planType` 직접 호출(FK 500 우려)은 더 이상 메인 경로가 아님 — 백엔드가 투표/확정 플로우(`generateGroupItinerary`→`voteSessionId`→`castVote`→`finalizeItinerary`)를 정식으로 추가했고 `result`/`vote-waiting` 페이지가 이미 이걸로 연결되어 있음. `createItinerary`는 이제 `/test` 페이지 전용.
- **API 연결 작업**: 일정 자동생성 / 그룹 일정 자동생성 / 대중교통(버스 도착정보) 3개를 mock에서 실 API 호출로 교체 완료. 로그인→방생성→스와이프→결과→확정까지 전체 플로우 라이브 테스트 전.
- **백엔드 이슈 5건(담당 최유정, 2026-07-19 "다 해결" 보고) 대조 완료**: optimize 응답 포맷 통일 / C안(자유편집) finalize 처리 / 방문 시각 필드(`arrivalTime`) 추가 / swipes `contentId` 처리 — 4건 모두 프론트가 이미 스펙에 맞게 구현돼 있어 코드 수정 불필요(낡은 주석 1건만 정정). **"그룹 일정 자동생성 시 하루 1곳만 추천됨"(AI 필터링 이슈) 1건만 브라우저 라이브 테스트로 재현 여부 확인 필요.**
- **초대 링크 + 카카오 공유**: 구현 완료, 커밋됨. 로컬(`localhost:3000`) 링크는 다른 사람 기기에서 안 열림 (정상, 코드 버그 아님) — 실제 테스트하려면 배포 도메인이나 ngrok 필요.
- **일정 화면 실시간 공동편집**: WebSocket + Yjs로 기술스택 확정(2026-07-05). 백엔드 웹소켓 서버가 아직 없어서 REST 기반 CRUD 마무리 후 착수 예정. UI 설계 시 낙관적 업데이트/편집 충돌 UX 미리 고려할 것.
- **아이콘 리팩토링 PR #29** (`refactor/itinerary-icon-assets`): OPEN, 리뷰 대기 중. 일정탭 아이콘 관련 작업 전 머지 여부 먼저 확인.

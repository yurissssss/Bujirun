## Bujirun 👥🧳 

### 함께 만들고, 함께 움직이는 부산 여행 서비스 &nbsp; <img width="10%" alt="썸네일" src="https://github.com/user-attachments/assets/4116e389-9a81-4396-acba-db6d640ae520" />

Bujirun은 동행자들의 취향을 모아 부산 여행 일정을 생성하고,
여행 전부터 여행 중까지 일정을 함께 조율할 수 있도록 만든 여행 서비스입니다.

관광지 이미지를 스와이프해 각자의 취향을 수집하고, 이를 바탕으로 추천 일정을 생성합니다.
여행 중에는 실시간 일정 편집과 이동수단 비교, GPS 방문 인증을 지원하며
방문한 관광지를 도감과 여행 기록으로 남길 수 있습니다.

<div align="start">
  <img width="15%" alt="bujirun1" src="https://github.com/user-attachments/assets/d7bd8e5c-bd12-484e-872e-be61efa7f116" />&nbsp;&nbsp;
  <img width="15%" alt="bujirun2" src="https://github.com/user-attachments/assets/8d3bc19d-07dc-4b0a-9b86-5bd7e8aadfa7" />&nbsp;&nbsp;
  <img width="15%" alt="bujirun3" src="https://github.com/user-attachments/assets/b959a412-8ff2-4280-a86b-0cba28b44f6a" />&nbsp;&nbsp;
  <img width="15%" alt="bujirun4" src="https://github.com/user-attachments/assets/4880e259-7eb9-4454-983c-05f85de71d9d" />&nbsp;&nbsp;
  <img width="15%" alt="bujirun5" src="https://github.com/user-attachments/assets/63bc5226-467d-40ce-9bae-b9d412b0b702" />&nbsp;&nbsp;
</div>

---

### Features

#### 1. 취향 분석 기반 맞춤 일정 생성

* 관광지 이미지 스와이프를 통한 개인별 선호 수집
* 그룹원의 취향을 반영한 추천 일정 생성
* 추천 일정 비교 및 그룹 투표
* 초대 링크를 통한 여행 그룹 참여
* 투표 결과를 반영한 최종 일정 확정

#### 2. 실시간 공동 일정 편집

* 여러 사용자의 일정 동시 편집
* 장소 추가·삭제 및 일정 시간 변경
* 변경 사항 실시간 동기화
* 일정 자동 저장 및 재접속 시 복원
* Drag & Drop을 활용한 일정 순서 변경

➡️ `Yjs`와 `WebSocket` 기반 동기화 서버를 활용해 여러 사용자의 일정 변경 사항을 실시간으로 공유할 수 있도록 구현했습니다.

#### 3. 일정 최적화 및 이동수단 비교

* 관광지 위치와 운영시간을 고려한 일정 최적화
* 변경된 일정에 따른 도착 예정 시간 계산
* 도보·대중교통·택시 이동수단 비교
* 버스·지하철 복합 경로 표시
* 이동 시간 및 요금 정보 제공
* 구간별 이동수단 선택

#### 4. GPS 방문 인증 및 관광 도감

* 현재 위치를 활용한 관광지 방문 인증
* 방문 인증 후 현장 사진 촬영
* 방문한 관광지의 도감 수집 처리
* 수집·미수집 관광지 구분
* 카테고리별 관광지 탐색
* 도감 수집 현황 확인

#### 5. 여행 기록 및 기록증

* 여행 종료 후 무드·테마 선택
* 방문 장소와 인증 사진을 활용한 여행 기록 생성
* 영수증 형태의 여행 기록증 제공
* 여행 기록증 이미지 저장
* 여행 기록 공개·비공개 관리
* 다른 사용자의 공개 여행 기록 탐색

#### 6. 관광지 탐색 및 여행 코스 활용

* 관광지 상세 정보 제공
* 관광지 북마크
* 해당 관광지가 포함된 여행 기록 탐색
* 다른 사용자의 여행 코스를 내 일정으로 가져오기
* 가져온 일정 수정

---

### Deployment

🚀 [Bujirun Live Service](https://bujirun-frontend.vercel.app)

---

### Tech Stack

#### Frontend

`Next.js 16` `React 19` `TypeScript` `Tailwind CSS`

`TanStack Query` `Zustand` `Axios` `Yjs` `html-to-image` `dnd-kit` `Framer Motion`

#### Backend

`Java 17` `Spring Boot 3` `Spring Data JPA` `QueryDSL`

`PostgreSQL` `Redis` `Flyway` `AWS S3`

#### Realtime Server

`Node.js` `Yjs` `WebSocket` `Redis`

#### Collaboration & Deploy

`Git` `GitHub` `Docker` `Notion` `Figma`

---

### Contribution

#### 다가오는 여행 일정 및 이동수단

* 홈 페이지의 다가오는 여행 일정 및 이동수단 API 연동과 화면 데이터 처리
* 중복 구현되어 있던 교통수단 영역을 공통 컴포넌트로 통합
* 버스·지하철 복합 경로, 택시 요금 등 이동 정보 표시 오류 개선

#### 관광지 추천

* 관광지 추천 목록 조회 및 화면 표시
* 도감 수집 여부를 반영해 미수집 관광지가 우선 노출되도록 처리

#### 방문 인증 및 관광 도감

* GPS 기반 관광지 방문 인증 API 연동 및 인증 결과 처리
* 방문 인증 결과를 관광 도감의 수집 상태와 연동
* 관광지별 도감 스티커 UI 구현
* 전체 및 카테고리별 관광 도감 구현
* 관광지 수집률 표시

#### 여행 기록 및 기록증

* 여행 종료 후 무드·테마 선택 및 영수증형 여행 기록증 구현
* `html-to-image`를 활용한 기록증 이미지 저장 기능 구현
* `Blob` 변환과 이미지·폰트 로딩 대기를 적용해 저장 시 이미지가 누락되는 문제 개선

#### 공통 UI 및 사용자 경험

* `Toast`, `LoadingState`, `ErrorState` 등 공통 UI 컴포넌트 구현 및 활용
* 실제 사용자 흐름을 기준으로 기능을 점검하고 화면과 동작 개선

---

### Troubleshooting

#### 1. 여행 기록 이미지 저장 안정화

**문제**  
여행 기록을 영수증 형태의 이미지로 저장하기 위해 `html-to-image`를 사용했습니다.  
화면에서는 정상적으로 표시되지만 저장 결과에서 이미지가 누락되거나, 폰트와 이미지가 완전히 렌더링되기 전에 캡처되는 문제가 발생했습니다.

**해결**  
`Data URL`을 직접 사용하는 방식에서 `Blob` 기반 처리로 변경하고, 이미지의 로딩 및 디코딩과 `document.fonts.ready`가 완료된 이후 이미지를 생성하도록 처리했습니다.

**결과**  
화면에 표시되는 여행 기록과 저장 결과의 차이를 줄이고 안정적으로 기록증을 저장할 수 있도록 개선했습니다.

<br>

#### 2. 복합 이동수단 정보 표시 개선

**문제**  
버스와 지하철이 함께 포함된 복합 경로에서 일부 이동수단만 표시되거나 택시 요금과 이동 정보가 누락되는 문제가 있었습니다.

**해결**  
응답받은 이동 데이터를 구간별로 처리하고, 각 구간의 이동수단을 기준으로 아이콘과 경로 정보를 표시하도록 수정했습니다.

**결과**  
복합 경로에서도 이동 순서와 요금 등의 정보를 일관되게 확인할 수 있도록 개선했습니다.

---

### Project Structure

```text
Bujirun/
├── FE/
│   └── src/
│       ├── app/              # Next.js App Router
│       ├── components/       # 공통 컴포넌트
│       ├── features/         # 도메인별 기능
│       │   ├── collection/
│       │   ├── home/
│       │   ├── itinerary/
│       │   │   └── collab/   # 실시간 공동 편집
│       │   └── receipt/
│       └── shared/
│           ├── api/
│           ├── hooks/
│           ├── stores/
│           └── utils/
├── BE/
│   └── src/main/
│       ├── java/com/bujirun/bujirun/
│       │   ├── domain/
│       │   └── global/
│       └── resources/
│           └── db/migration/
└── Node/
    ├── server.js
    ├── auth.js
    ├── roomFlushManager.js
    └── springClient.js
```

---

### External API & Data

#### 한국관광공사 TourAPI

* 부산 지역 관광지 데이터
* 관광지 소개 및 운영 정보
* 주소 및 대표 이미지

#### 부산 관광 데이터

* 관광지 상세 정보
* 교통 및 이용 정보

#### ODsay

* 버스·지하철 대중교통 경로
* 이동 시간 및 요금
* 환승 정보

#### BusanBIMS

* 부산 버스 실시간 도착 정보

---

### Getting Started

#### Frontend

```bash
cd FE
npm install
npm run dev
```

#### Backend

```bash
cd BE
./gradlew bootRun
```

#### Realtime Server

```bash
cd Node
npm install
npm start
```

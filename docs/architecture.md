# 청약플러스 아키텍처 설계서

> **작성일**: 2026-03-04
> **상태**: MVP 완료, Phase 2 진행 중
> **대상**: PRD v2.1 기반
> **최종 업데이트**: 2026-03-10 (+가치 분석 엔진 구현 완료)

---

## 1. 기술 스택 및 선택 근거

| 레이어 | 기술 | 버전 | 선택 근거 |
|--------|------|------|-----------|
| **프레임워크** | Next.js (App Router) | 15 | RSC로 초기 로드 최적화, Server Actions로 API 레이어 단순화, 병렬/인터셉팅 라우트로 복잡한 UI 지원 |
| **언어** | TypeScript | 5.x | 판정 엔진의 7개 공급유형 규칙을 타입으로 안전하게 표현, 서버-클라이언트 간 타입 공유 |
| **배포** | Vercel | - | Next.js 네이티브 배포, Edge Functions, 서울 리전(icn1), 프리뷰 배포로 PR별 검증 |
| **BaaS** | Supabase | - | PostgreSQL + Auth + Realtime + Storage 통합, RLS로 행 수준 보안, 무료 티어로 MVP 비용 최소화 |
| **UI** | shadcn/ui + Tailwind CSS | latest / 4.x | 소스 레벨 커스터마이징, Radix UI 기반 접근성(WCAG 2.1 AA), 유틸리티 퍼스트 스타일링 |
| **서버 상태** | TanStack Query | 5.x | 판정 결과 캐싱/무효화, stale-while-revalidate로 UX 최적화, devtools로 디버깅 |
| **폼/검증** | react-hook-form + zod | 7.x / 3.x | 비제어 컴포넌트로 렌더링 최적화, 온보딩 4단계 폼 관리, 서버/클라이언트 스키마 공유 |
| **아이콘** | lucide-react | latest | 트리 셰이킹으로 번들 최적화, shadcn/ui 기본 아이콘 세트 |

---

## 2. 시스템 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│                       Client (Browser)                   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │ React     │ │ TanStack  │ │ react-    │             │
│  │ Components│ │ Query     │ │ hook-form │             │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘             │
│        │              │              │                   │
│        └──────────────┼──────────────┘                   │
│                       │                                  │
└───────────────────────┼──────────────────────────────────┘
                        │ HTTPS
┌───────────────────────┼──────────────────────────────────┐
│                  Vercel Edge Network                      │
│  ┌────────────────────┴────────────────────┐             │
│  │          Next.js 15 (App Router)         │             │
│  │  ┌─────────────┐  ┌──────────────────┐  │             │
│  │  │ Server      │  │ API Routes       │  │             │
│  │  │ Components  │  │ /api/eligibility  │  │             │
│  │  │ (RSC)       │  │ /api/cron        │  │             │
│  │  └──────┬──────┘  └────────┬─────────┘  │             │
│  │         │                  │             │             │
│  │  ┌──────┴──────────────────┴─────────┐   │             │
│  │  │      Server Actions               │   │             │
│  │  │  (프로필 CRUD, 북마크, 알림 등)     │   │             │
│  │  └──────────────┬────────────────────┘   │             │
│  │                 │                        │             │
│  │  ┌──────────────┴────────────────────┐   │             │
│  │  │   서비스 레이어 (lib/services/)    │   │             │
│  │  │  ┌───────────┐ ┌──────────────┐   │   │             │
│  │  │  │ 판정 엔진 │ │ 추천 서비스  │   │   │             │
│  │  │  │ (engine)  │ │ (recommend)  │   │   │             │
│  │  │  └─────┬─────┘ └──────┬───────┘   │   │             │
│  │  │        │              │            │   │             │
│  │  └────────┼──────────────┼────────────┘   │             │
│  │           │              │                │             │
│  │  ┌────────┴──────────────┴────────────┐   │             │
│  │  │ 리포지토리 레이어 (lib/repos/)      │   │             │
│  │  │  Supabase Client 직접 호출          │   │             │
│  │  └──────────────┬─────────────────────┘   │             │
│  └─────────────────┼─────────────────────────┘             │
└────────────────────┼─────────────────────────────────────┘
                     │ PostgreSQL Wire Protocol
┌────────────────────┼─────────────────────────────────────┐
│               Supabase (서울 리전)                         │
│  ┌─────────────────┴─────────────────┐                    │
│  │          PostgreSQL                │                    │
│  │  ┌─────────┐ ┌──────────────────┐ │                    │
│  │  │   RLS   │ │  eligibility_    │ │                    │
│  │  │ Policies│ │  rules (JSONB)   │ │                    │
│  │  └─────────┘ └──────────────────┘ │                    │
│  └───────────────────────────────────┘                    │
│  ┌───────────────┐ ┌─────────────────┐                    │
│  │  Supabase     │ │  Supabase       │                    │
│  │  Auth (JWT)   │ │  Realtime [P1]  │                    │
│  └───────────────┘ └─────────────────┘                    │
└───────────────────────────────────────────────────────────┘
```

---

## 3. 레이어 아키텍처

CLAUDE.md 3절의 원칙에 따라 **컴포넌트 → 서비스 → 리포지토리** 단방향 의존을 엄격히 적용한다.

### 3.1 레이어 정의

| 레이어 | 디렉토리 | 책임 | 의존 가능 대상 |
|--------|----------|------|---------------|
| **프레젠테이션** | `app/`, `components/` | 라우팅, UI 렌더링, 사용자 입력 처리 | 훅(hooks/), 서비스(간접 - Server Actions 경유) |
| **훅** | `hooks/` | TanStack Query 래퍼, 클라이언트 상태 관리 | 서비스(Server Actions 경유) |
| **서비스** | `lib/services/` | 비즈니스 로직, 판정 엔진, 추천 로직 | 리포지토리, 유틸리티 |
| **리포지토리** | `lib/repositories/` | Supabase 쿼리 캡슐화, 데이터 접근 | Supabase 클라이언트만 |
| **도메인** | `lib/eligibility/` | 판정 규칙, 가점 계산 (순수 함수) | 유틸리티, 타입만 |
| **유틸리티** | `lib/utils/` | 포매팅, 상수, 공통 헬퍼 | 없음 (최하위) |
| **타입** | `types/` | 전역 타입 정의, 도메인 용어 매핑 | 없음 |

### 3.2 레이어 규칙

```
[금지] 컴포넌트 → Supabase 직접 호출
[금지] 서비스 → Supabase 직접 호출 (리포지토리 경유 필수)
[금지] 리포지토리 → 서비스 (역방향 의존)
[금지] 유틸리티 → 서비스 또는 리포지토리

[허용] 컴포넌트 → hooks → Server Actions → 서비스 → 리포지토리
[허용] API Route → 서비스 → 리포지토리
[허용] 서비스 → 도메인 (판정 엔진, 가점 계산)
[허용] 모든 레이어 → 유틸리티, 타입
```

---

## 4. 디렉토리 구조

```
chungyakmate/
├── .env.local                          # 환경변수 (Git 미추적)
├── .env.example                        # 환경변수 템플릿
├── .eslintrc.json                      # ESLint 설정
├── .prettierrc                         # Prettier 설정
├── .gitignore                          # Git 무시 파일
├── next.config.ts                      # Next.js 설정
├── tailwind.config.ts                  # Tailwind CSS + 디자인 토큰
├── tsconfig.json                       # TypeScript 설정 (경로 별칭 @/)
├── package.json                        # 의존성 및 스크립트
├── middleware.ts                       # 인증 미들웨어 (세션 검증, 리다이렉트)
│
├── app/                                # App Router — 라우팅과 페이지만 담당
│   ├── layout.tsx                      # 루트 레이아웃 (Providers 래핑)
│   ├── page.tsx                        # / — 랜딩 페이지 (공개, SSG)
│   ├── globals.css                     # 글로벌 스타일 + CSS 변수
│   ├── not-found.tsx                   # 404 페이지
│   ├── error.tsx                       # 전역 에러 바운더리
│   ├── loading.tsx                     # 전역 로딩 UI
│   │
│   ├── (auth)/                         # 인증 라우트 그룹 (최소 UI)
│   │   ├── layout.tsx                  # 인증 레이아웃 (로고 중앙 정렬)
│   │   ├── login/
│   │   │   └── page.tsx                # /login
│   │   └── signup/
│   │       └── page.tsx                # /signup
│   │
│   ├── (main)/                         # 메인 라우트 그룹 (인증 보호)
│   │   ├── layout.tsx                  # 메인 레이아웃 (헤더+사이드바/탭바)
│   │   ├── onboarding/
│   │   │   └── page.tsx                # /onboarding — 4단계 위자드
│   │   ├── profile/
│   │   │   └── page.tsx                # /profile — 프로필 관리
│   │   ├── complexes/
│   │   │   ├── page.tsx                # /complexes — 단지 목록
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # /complexes/:id — 단지 상세
│   │   │       └── eligibility/
│   │   │           └── page.tsx        # /complexes/:id/eligibility — 판정 결과
│   │   ├── recommend/
│   │   │   └── page.tsx                # /recommend — 맞춤 추천
│   │   ├── calendar/
│   │   │   └── page.tsx                # /calendar — [PROD-TODO] 청약 캘린더
│   │   └── notifications/
│   │       └── page.tsx                # /notifications — 알림 센터
│   │
│   └── api/                            # API Route Handlers
│       ├── eligibility/
│       │   └── evaluate/
│       │       └── route.ts            # POST /api/eligibility/evaluate
│       ├── complexes/
│       │   ├── route.ts                # GET /api/complexes
│       │   └── [id]/
│       │       └── route.ts            # GET /api/complexes/:id
│       ├── recommend/
│       │   └── route.ts                # GET /api/recommend
│       ├── notifications/
│       │   ├── route.ts                # GET /api/notifications
│       │   └── [id]/
│       │       └── read/
│       │           └── route.ts        # PATCH /api/notifications/:id/read
│       ├── cron/
│       │   └── sync-complexes/
│       │       └── route.ts            # POST /api/cron/sync-complexes
│       └── health/
│           └── route.ts                # GET /api/health
│
├── components/                         # 공유 UI 컴포넌트
│   ├── ui/                             # shadcn/ui 기본 컴포넌트
│   │   └── (button, card, input 등 shadcn CLI로 추가)
│   ├── forms/                          # 폼 관련 컴포넌트
│   │   ├── profile-form.tsx            # 프로필 편집 폼
│   │   └── onboarding-wizard.tsx       # 온보딩 4단계 위자드
│   ├── layout/                         # 레이아웃 컴포넌트
│   │   ├── header.tsx                  # 상단 헤더
│   │   ├── sidebar.tsx                 # 데스크톱 사이드바
│   │   ├── mobile-nav.tsx              # 모바일 하단 탭바
│   │   └── providers.tsx               # 전역 Provider 래퍼
│   └── features/                       # 도메인별 컴포넌트
│       ├── eligibility/                # 판정 관련 UI
│       │   ├── eligibility-badge.tsx   # 적격/부적격/조건부 배지
│       │   ├── eligibility-card.tsx    # 유형별 판정 결과 카드
│       │   └── score-card.tsx          # 가점 점수 카드
│       ├── complexes/                  # 단지 관련 UI
│       │   ├── complex-card.tsx        # 단지 요약 카드
│       │   ├── complex-filter.tsx      # 지역/상태 필터
│       │   └── complex-list.tsx        # 단지 목록
│       ├── recommendation/             # 추천 관련 UI
│       │   └── recommend-card.tsx      # 추천 단지 카드
│       └── profile/                    # 프로필 관련 UI
│           ├── profile-card.tsx        # 프로필 요약 카드
│           └── completion-badge.tsx    # 프로필 완성도 배지
│
├── lib/                                # 핵심 비즈니스 로직
│   ├── supabase/                       # Supabase 클라이언트 설정
│   │   ├── client.ts                   # 브라우저용 클라이언트
│   │   ├── server.ts                   # 서버용 클라이언트 (Server Actions)
│   │   ├── middleware.ts               # 미들웨어용 클라이언트
│   │   └── types.ts                    # Database 타입 (supabase gen types)
│   │
│   ├── services/                       # 서비스 레이어 — 비즈니스 로직
│   │   ├── auth-service.ts             # 인증 관련 로직
│   │   ├── profile-service.ts          # 프로필 CRUD + 완성도 계산
│   │   ├── eligibility-service.ts      # 판정 엔진 호출 오케스트레이션
│   │   ├── complex-service.ts          # 단지 조회/필터링
│   │   ├── recommend-service.ts        # 맞춤 추천 로직
│   │   └── notification-service.ts     # 알림 생성/조회
│   │
│   ├── repositories/                   # 리포지토리 레이어 — 데이터 접근
│   │   ├── profile-repository.ts       # profiles 테이블 쿼리
│   │   ├── complex-repository.ts       # complexes + supply_types 쿼리
│   │   ├── eligibility-repository.ts   # eligibility_results + rules 쿼리
│   │   ├── bookmark-repository.ts      # bookmarks 테이블 쿼리
│   │   └── notification-repository.ts  # notifications 테이블 쿼리
│   │
│   ├── eligibility/                    # 판정 엔진 (순수 도메인 로직)
│   │   ├── engine.ts                   # 판정 코어 엔진 (7개 유형 오케스트레이션)
│   │   ├── scoring.ts                  # 84점 가점 계산 (순수 함수, 서버/클라이언트 공유)
│   │   ├── types.ts                    # 판정 관련 타입 정의
│   │   └── rules/                      # 공급유형별 독립 규칙 모듈
│   │       ├── index.ts                # 규칙 모듈 레지스트리
│   │       ├── general.ts              # 일반공급 (주택공급규칙 제25조)
│   │       ├── newlywed.ts             # 신혼부부 (제35조)
│   │       ├── first-life.ts           # 생애최초 (제36조)
│   │       ├── multi-child.ts          # 다자녀 (제37조)
│   │       ├── elderly-parent.ts       # 노부모부양 (제38조)
│   │       ├── institutional.ts        # 기관추천 (제39조)
│   │       └── relocation.ts           # 이전기관 (제40조)
│   │
│   ├── validations/                    # zod 스키마 (서버/클라이언트 공유)
│   │   ├── profile.ts                  # 프로필 입력 검증
│   │   ├── eligibility.ts              # 판정 요청 검증
│   │   └── common.ts                   # 공통 검증 (날짜, 금액 등)
│   │
│   ├── actions/                        # Server Actions
│   │   ├── profile-actions.ts          # 프로필 CRUD 액션
│   │   ├── eligibility-actions.ts      # 판정 실행 액션
│   │   ├── bookmark-actions.ts         # 북마크 토글 액션
│   │   └── notification-actions.ts     # 알림 읽음 처리 액션
│   │
│   └── utils/                          # 순수 유틸리티
│       ├── format.ts                   # 날짜, 금액, 면적 포매팅
│       ├── logger.ts                   # 환경별 로깅 래퍼
│       └── api-response.ts             # 통일 API 응답 헬퍼
│
├── hooks/                              # 커스텀 React 훅
│   ├── use-profile.ts                  # 프로필 조회/수정 (TanStack Query)
│   ├── use-eligibility.ts              # 판정 실행/결과 조회
│   ├── use-complexes.ts                # 단지 목록/상세 조회
│   ├── use-notifications.ts            # 알림 목록/읽음 처리
│   └── use-auth.ts                     # 인증 상태 훅
│
├── stores/                             # 클라이언트 전용 상태
│   └── onboarding-store.ts             # 온보딩 임시 상태 (zustand + sessionStorage)
│
├── types/                              # 전역 타입 정의
│   ├── index.ts                        # 통합 타입 export
│   ├── database.ts                     # Supabase Database 타입
│   └── glossary.ts                     # 도메인 한영 용어 매핑
│
├── constants/                          # 상수 및 설정값
│   ├── regions.ts                      # 시도/시군구 목록
│   ├── supply-types.ts                 # 7개 공급유형 정의
│   └── scoring-tables.ts              # 가점 산출표 (무주택/부양/통장)
│
└── supabase/                           # Supabase 로컬 개발
    ├── migrations/                     # SQL 마이그레이션 (타임스탬프 기반)
    ├── seed.sql                        # 시드 데이터 (수도권 단지 15~20건)
    └── config.toml                     # Supabase CLI 설정
```

---

## 5. 데이터 모델

### 5.1 엔티티 관계도

```
users (Supabase Auth)
  │
  ├─ 1:1 ── profiles
  │            │
  │            ├─ 1:N ── eligibility_results
  │            │            │
  │            │            └─ N:1 ── complexes
  │            │
  │            └─ 1:N ── bookmarks
  │                         │
  │                         └─ N:1 ── complexes
  │
  └─ 1:N ── notifications

complexes
  │
  ├─ 1:N ── supply_types
  │
  └─ 1:N ── eligibility_rules
```

### 5.2 테이블 스키마

PRD 6절의 Supabase 스키마를 그대로 사용한다. 각 테이블의 핵심 설계 의도:

| 테이블 | 설계 의도 | 비고 |
|--------|-----------|------|
| `profiles` | 사용자 청약 프로필. `auth.users`와 1:1. 판정 입력 데이터의 단일 소스. | `profile_completion` 0~100으로 완성도 추적 |
| `complexes` | 모집공고 단지 정보. MVP는 수동 시드, `raw_data` JSONB로 원본 보존. | `status` enum으로 접수 상태 관리 |
| `supply_types` | 단지별 공급유형 세부 정보 (세대수, 면적, 분양가). | `complexes`와 1:N |
| `eligibility_rules` | 판정 규칙 파라미터 저장. 코드 배포 없이 임계값 조정 가능. | `condition` JSONB, `priority`로 평가 순서 |
| `eligibility_results` | 판정 실행 결과 저장. UNIQUE(profile, complex, supply_type). | `reasons` JSONB 배열로 근거 저장 |
| `bookmarks` | 사용자 관심 단지 저장. | UNIQUE(profile, complex) |
| `notifications` | 인앱 알림. 추천/마감/결과/시스템 4개 타입. | `data` JSONB로 확장 데이터 |

### 5.3 RLS 정책

| 테이블 | 정책 | 접근 규칙 |
|--------|------|-----------|
| `profiles` | `profiles_owner` | 본인만 CRUD (`auth.uid() = id`) |
| `eligibility_results` | `results_owner` | 본인 결과만 조회/생성 (`profile_id = auth.uid()`) |
| `bookmarks` | `bookmarks_owner` | 본인만 CRUD (`profile_id = auth.uid()`) |
| `notifications` | `notifications_owner` | 본인만 조회 (`user_id = auth.uid()`) |
| `complexes` | `complexes_read` | 인증 사용자 읽기 전용 |
| `supply_types` | `supply_types_read` | 인증 사용자 읽기 전용 |
| `eligibility_rules` | `rules_read` | 인증 사용자 읽기 전용 |

[PROD-TODO] `complexes`, `supply_types`, `eligibility_rules` 테이블에 관리자 전용 쓰기 정책 추가 필요.

---

## 6. API 설계

### 6.1 통일 응답 포맷

```typescript
// 성공
{ "data": T, "error": null }

// 실패
{ "data": null, "error": { "code": string, "message": string } }
```

### 6.2 엔드포인트 목록

| 메서드 | 경로 | 설명 | 인증 | 구현 방식 |
|--------|------|------|------|-----------|
| POST | `/api/eligibility/evaluate` | 자격 판정 실행 | JWT 필수 | API Route |
| GET | `/api/complexes` | 단지 목록 (필터/페이지네이션) | JWT 필수 | API Route |
| GET | `/api/complexes/:id` | 단지 상세 | JWT 필수 | API Route |
| GET | `/api/recommend` | 맞춤 추천 단지 | JWT 필수 | API Route |
| GET | `/api/notifications` | 알림 목록 | JWT 필수 | API Route |
| PATCH | `/api/notifications/:id/read` | 알림 읽음 처리 | JWT 필수 | API Route |
| POST | `/api/cron/sync-complexes` | 모집공고 동기화 | Cron Secret | API Route |
| GET | `/api/health` | 헬스 체크 | 없음 | API Route |

### 6.3 주요 API 상세

#### POST /api/eligibility/evaluate

```typescript
// 요청
{
  "complex_id": "uuid",
  "supply_types"?: ["general", "newlywed", ...] // 미지정 시 전체 7개
}

// 응답
{
  "data": {
    "results": EligibilityResult[], // 유형별 판정 결과 배열
    "score": {                      // 가점 (일반공급 시)
      "total": 52,
      "breakdown": {
        "homeless_period": { "score": 18, "max": 32, "detail": "8년 3개월" },
        "dependents": { "score": 25, "max": 35, "detail": "4명" },
        "subscription_period": { "score": 9, "max": 17, "detail": "5년 2개월" }
      }
    },
    "evaluated_at": "ISO-8601"
  },
  "error": null
}
```

#### GET /api/complexes

```typescript
// 쿼리 파라미터
?region=서울&status=open&page=1&limit=20

// 응답
{
  "data": {
    "items": Complex[],
    "total": 45,
    "page": 1,
    "limit": 20
  },
  "error": null
}
```

### 6.4 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| `AUTH_REQUIRED` | 401 | 인증 필요 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `PROFILE_INCOMPLETE` | 422 | 프로필 미완성 (판정 불가) |
| `COMPLEX_NOT_FOUND` | 404 | 단지 없음 |
| `EVALUATION_TIMEOUT` | 504 | 판정 타임아웃 |
| `VALIDATION_ERROR` | 400 | 입력값 검증 실패 |
| `RATE_LIMIT` | 429 | 요청 횟수 초과 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

### 6.5 Server Actions

REST API 외에 프로필 CRUD, 북마크 토글 등 단순 데이터 조작은 Server Actions로 구현한다.

| 액션 | 파일 | 설명 |
|------|------|------|
| `createProfile` | `lib/actions/profile-actions.ts` | 온보딩 프로필 생성 |
| `updateProfile` | `lib/actions/profile-actions.ts` | 프로필 수정 |
| `toggleBookmark` | `lib/actions/bookmark-actions.ts` | 북마크 추가/제거 |
| `markNotificationRead` | `lib/actions/notification-actions.ts` | 알림 읽음 처리 |

---

## 7. 프론트엔드 아키텍처

### 7.1 라우트 구조

```
RootLayout (Providers: Supabase, TanStack Query, Theme)
├── / — 랜딩 (공개, SSG)
├── (auth) Layout — 최소 UI, 중앙 정렬
│   ├── /login
│   └── /signup
└── (main) Layout — 헤더 + 사이드바(데스크톱) / 하단탭(모바일)
    ├── /onboarding — 4단계 위자드
    ├── /profile — 프로필 관리
    ├── /complexes — 단지 목록
    │   └── /complexes/:id — 단지 상세
    │       └── /complexes/:id/eligibility — 판정 결과
    ├── /recommend — 맞춤 추천
    ├── /calendar — [PROD-TODO]
    └── /notifications — 알림 센터
```

### 7.2 라우트 보호 정책

| 라우트 | 접근 | 비고 |
|--------|------|------|
| `/` | 공개 | SSG 랜딩 |
| `/login`, `/signup` | 공개 | 인증 사용자 → `/complexes` 리다이렉트 |
| `/onboarding` | 인증 | 프로필 미생성 시만 접근 |
| `/profile`, `/complexes/**`, `/recommend`, `/notifications` | 인증 + 프로필 | 프로필 미생성 → `/onboarding` |
| `/calendar` | 인증 + 프로필 | [PROD-TODO] |
| `/admin/**` | 인증 + 관리자 | [PROD-TODO] |

### 7.3 미들웨어 전략

**middleware.ts**에서 JWT 유효성 검증 + 기본 리다이렉트, **(main)/layout.tsx**에서 프로필 존재 여부 확인 + 온보딩 리다이렉트.

```
요청 → middleware.ts
  ├── 공개 라우트 (/, /login, /signup, /api/health) → 통과
  ├── 미인증 + 보호 라우트 → /login?redirect={원래경로}
  ├── 인증 + /login or /signup → /complexes
  └── 인증 + 보호 라우트 → 통과 (프로필 확인은 layout에서)

(main)/layout.tsx
  ├── 프로필 존재 → 정상 렌더링
  └── 프로필 미존재 → /onboarding 리다이렉트
```

### 7.4 상태 관리 전략

| 상태 종류 | 도구 | 용도 |
|-----------|------|------|
| 서버 상태 | TanStack Query | 프로필, 단지, 판정 결과, 알림 |
| 온보딩 임시 상태 | zustand + sessionStorage | 위자드 단계별 입력 데이터 보존 |
| 인증 상태 | Supabase Auth + Context | 로그인 유저 정보 |
| UI 상태 | React 로컬 상태 | 사이드바 토글, 필터 선택 등 |

---

## 8. 판정 엔진 아키텍처 (핵심)

### 8.1 설계 원칙

- **하이브리드 엔진**: 복잡한 판정 로직은 TypeScript 모듈, 변경 가능한 파라미터(소득 기준, 기간 임계값)는 DB JSONB에 저장
- **독립 모듈**: 7개 공급유형은 각각 독립된 규칙 파일로 분리. 하나의 유형 판정 실패가 다른 유형에 영향을 주지 않음
- **순수 함수**: 판정 함수와 가점 계산 함수는 외부 의존 없는 순수 함수로 작성. 테스트 용이성 확보
- **멱등성**: 동일 입력에 대해 동일 결과 보장

### 8.2 판정 흐름

```
사용자 판정 요청
  │
  ▼
eligibility-service.ts (오케스트레이션)
  │
  ├── 1. 프로필 완성도 검증 (미완성 → PROFILE_INCOMPLETE)
  │
  ├── 2. 프로필 + 단지 데이터 로드 (리포지토리 경유)
  │
  ├── 3. 규칙 파라미터 로드 (eligibility_rules 테이블)
  │
  ├── 4. engine.ts 호출 (7개 유형 순차 판정)
  │   ├── general.ts → EligibilityResult
  │   ├── newlywed.ts → EligibilityResult
  │   ├── first-life.ts → EligibilityResult
  │   ├── multi-child.ts → EligibilityResult
  │   ├── elderly-parent.ts → EligibilityResult
  │   ├── institutional.ts → EligibilityResult
  │   └── relocation.ts → EligibilityResult
  │
  ├── 5. 가점 계산 (scoring.ts, 일반공급 시)
  │
  ├── 6. 결과 저장 (eligibility_results 테이블, upsert)
  │
  └── 7. 응답 반환
```

### 8.3 규칙 모듈 인터페이스

```typescript
/** 모든 공급유형 규칙 모듈이 구현해야 하는 인터페이스 */
interface SupplyTypeRule {
  /** 공급유형 식별자 */
  type: SupplyType;

  /**
   * 자격 판정 실행
   * @param profile - 사용자 프로필
   * @param complex - 대상 단지
   * @param params - DB에서 로드한 규칙 파라미터
   * @returns 판정 결과 (적격/부적격/조건부 + 근거)
   */
  evaluate(
    profile: Profile,
    complex: Complex,
    params: RuleParams
  ): EligibilityResult;
}
```

### 8.4 가점 계산 (scoring.ts)

```typescript
/** 84점 만점 가점 계산 — 서버/클라이언트 공유 순수 함수 */
interface ScoreBreakdown {
  homeless_period: { score: number; max: 32; detail: string };
  dependents: { score: number; max: 35; detail: string };
  subscription_period: { score: number; max: 17; detail: string };
  total: number; // max 84
}
```

가점 산출표는 `constants/scoring-tables.ts`에 상수로 관리하여 변경 용이.

### 8.5 3단계 규칙 발전 경로

| 단계 | 시점 | 내용 | 구현 방식 |
|------|------|------|-----------|
| 1차 법령 기반 | MVP | 주택공급규칙 등 법령 기반 규칙 | TypeScript 모듈 + DB 파라미터 |
| 2차 감수 반영 | MVP 후 | 시행사 피드백으로 규칙 보정 | DB 파라미터 변경 + 코드 보정 |
| 3차 운영 축적 | 정식 출시 후 | 실제 판정 결과 수집, 정확도 모니터링 | [PROD-TODO] 모니터링 대시보드 |

---

## 9. 인증 아키텍처

### 9.1 인증 흐름

```
이메일 가입: 이메일/PW 입력 → Supabase signUp → JWT 발급 → 쿠키 저장
카카오 가입: OAuth 시작 → 카카오 인증 → 콜백 → JWT 발급 → 쿠키 저장
로그인:     이메일/PW 또는 카카오 → Supabase signIn → JWT 갱신
로그아웃:   Supabase signOut → 쿠키 삭제 → / 리다이렉트
```

### 9.2 Supabase 클라이언트 구성

| 클라이언트 | 파일 | 용도 | 키 사용 |
|-----------|------|------|---------|
| 브라우저 | `lib/supabase/client.ts` | 클라이언트 컴포넌트 | `ANON_KEY` |
| 서버 | `lib/supabase/server.ts` | Server Actions, API Routes | `ANON_KEY` (사용자 컨텍스트) |
| 미들웨어 | `lib/supabase/middleware.ts` | 세션 갱신 | `ANON_KEY` |
| 서비스 | 서비스 레이어 내 직접 생성 | Cron, 배치 작업 | `SERVICE_ROLE_KEY` |

[PROD-TODO] `SERVICE_ROLE_KEY`는 Cron 엔드포인트와 배치 작업에서만 사용. 환경변수에서 서버 전용으로 관리.

---

## 10. 개발 환경

### 10.1 환경변수

```bash
# Supabase 연결 (필수)
NEXT_PUBLIC_SUPABASE_URL=       # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # 공개 anon 키 (RLS 적용)
SUPABASE_SERVICE_ROLE_KEY=      # 서버 전용 서비스 키 (RLS 우회)

# 인증 (필수)
NEXT_PUBLIC_SITE_URL=           # 사이트 URL (OAuth 콜백용)

# Cron (필수 - 동기화 엔드포인트)
CRON_SECRET=                    # Cron 엔드포인트 인증 시크릿

# 공공데이터 API (필수 - 청약홈 연동)
APPLYHOME_API_KEY=              # 공공데이터포털 청약홈 API 인증키

# 개발 (선택)
NEXT_PUBLIC_ENV=                # development | staging | production
```

### 10.2 스크립트

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "lint:fix": "next lint --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "type-check": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:generate": "supabase gen types typescript --local > types/database.ts",
  "db:migrate": "supabase db push",
  "db:seed": "supabase db seed"
}
```

### 10.3 코드 컨벤션

CLAUDE.md 2절에 따라:

- **린트**: `no-any`, `no-console`, `prefer-const`, `no-unused-vars`
- **네이밍**: 컴포넌트(PascalCase), 유틸/훅(camelCase), 상수(UPPER_SNAKE_CASE), 타입(PascalCase)
- **파일**: 300줄 초과 시 분리 검토
- **함수**: 50줄 초과 시 분리 검토
- **주석**: "왜"만 기술, "무엇"은 네이밍으로 해결
- **콘솔**: `console.log` 금지, `lib/utils/logger.ts` 사용

---

## 11. 성능 목표

| 지표 | 목표 | 최적화 전략 |
|------|------|------------|
| LCP | < 2.5초 | RSC로 초기 렌더링 최적화, Pretendard 폰트 CDN |
| FID | < 100ms | 클라이언트 번들 최소화, 코드 스플리팅 |
| CLS | < 0.1 | 스켈레톤 UI, 이미지 크기 예약 |
| 판정 API (p95) | < 3초 | 규칙 평가 순서 최적화, early return, 캐싱 |
| 단지 목록 로드 | < 1초 | TanStack Query 캐싱, ISR |

---

## 12. 보안 체크리스트

| 항목 | 구현 | 상태 |
|------|------|------|
| RLS 정책 | 모든 테이블에 행 수준 접근 제어 적용 | MVP |
| 서버사이드 인증 | Server Actions + API Routes에서 `auth.uid()` 검증 | MVP |
| 환경변수 | `SERVICE_ROLE_KEY`는 서버 전용, `ANON_KEY`만 공개 | MVP |
| CSRF | Next.js Server Actions 기본 보호 | MVP |
| XSS | React 기본 이스케이프 + 보안 헤더(next.config.ts) | MVP |
| Rate Limiting | [PROD-TODO] Vercel Edge Middleware | 정식 |
| 입력 검증 | zod 스키마로 서버/클라이언트 양쪽 검증 | MVP |

---

## 13. [PROD-TODO] 프로덕션 전환 시 필요 사항

| 영역 | 항목 | 우선순위 |
|------|------|----------|
| **인프라** | Rate Limiting (Vercel Edge Middleware 또는 pg_rate_limiter) | 높음 |
| **인프라** | 에러 모니터링 (Sentry 등) | 높음 |
| **인프라** | 로깅/APM (Vercel Analytics + 커스텀) | 중간 |
| **데이터** | ~~공공데이터 API 자동 연동 (Cron)~~ → ✅ 구현 완료 (`docs/public-api-integration.md` 참조) | 높음 |
| **데이터** | 판정 규칙 버전 히스토리 테이블 | 중간 |
| **보안** | 이메일 인증 필수화 | 높음 |
| **보안** | CSP 헤더 강화 | 중간 |
| **기능** | 관리자 대시보드 (규칙 관리, 판정 통계) | 높음 |
| **기능** | AI 당첨 확률 분석 (F-007) | 중간 |
| **기능** | 구독 결제 시스템 (F-008) | 중간 |
| **기능** | 청약 캘린더 (F-010) | 낮음 |
| **알림** | 이메일/SMS 외부 알림 채널 | 중간 |
| **알림** | Supabase Realtime 실시간 알림 | 낮음 |
| **테스트** | 판정 정확도 모니터링 대시보드 | 높음 |
| **테스트** | E2E 테스트 확대 (Playwright) | 중간 |

---

## 14. 구현 완료 현황

### 14.1 파일 통계

| 카테고리 | 파일 수 | 비고 |
|----------|---------|------|
| 전체 프로젝트 파일 | 134 | config, 소스, 테스트 포함 |
| TypeScript/TSX | 115 | 비즈니스 로직 + UI + 테스트 |
| 테스트 파일 | 3 | 100개 테스트 케이스 |
| API 라우트 | 8 | health, eligibility, complexes, recommend, notifications, cron |
| 페이지 | 11 | 랜딩, 로그인, 회원가입, 온보딩, 프로필, 단지 목록/상세, 판정, 추천, 알림 |
| 컴포넌트 | 27 | ui(16) + features(8) + forms(2) + layout(4) |
| 서비스 | 6 | auth, profile, eligibility, complex, recommend, notification |
| 리포지토리 | 5 | profile, complex, eligibility, bookmark, notification |
| 커스텀 훅 | 5 | auth, profile, eligibility, complexes, notifications |
| 판정 규칙 모듈 | 7 | general, newlywed, first-life, multi-child, elderly-parent, institutional, relocation |

### 14.2 테스트 커버리지

| 테스트 파일 | 테스트 수 | 대상 모듈 |
|------------|-----------|-----------|
| `lib/eligibility/__tests__/scoring.test.ts` | 41 | 84점 가점 계산 (무주택기간/부양가족/통장가입기간) |
| `lib/utils/__tests__/format.test.ts` | 48 | 포매팅 유틸리티 (금액/면적/날짜/전화번호/나이/개월) |
| `lib/eligibility/__tests__/engine.test.ts` | 11 | 판정 엔진 + 일반공급 규칙 |
| **합계** | **100** | 핵심 순수 로직 100% 커버 |

### 14.3 보안 강화 항목 (코드 리뷰 반영)

| 항목 | 파일 | 조치 |
|------|------|------|
| 오픈 리다이렉트 방지 | `app/(auth)/login/page.tsx` | redirect 파라미터 상대경로 검증 |
| 타이밍 공격 방지 | `app/api/cron/sync-complexes/route.ts` | `crypto.timingSafeEqual()` 기반 비교 |
| 추천 결과 제한 | `lib/services/recommend-service.ts` | MAX_RECOMMENDATIONS=20 상한 적용 |
| 프로필 완성도 임계값 정합 | `lib/services/profile-service.ts` | eligibility-service와 80% 기준 통일 |
| 환경변수 검증 | `lib/supabase/client.ts`, `server.ts` | `!` 단언 제거, 명시적 null 체크 |

### 14.4 빌드 검증

```
✅ TypeScript 타입 체크: 통과
✅ ESLint: 에러 0건
✅ Next.js 빌드: 성공 (19 라우트, 6.6초)
✅ Vitest 테스트: 100/100 통과 (1.26초)
```

---

## 15. 배포 및 인프라 설계

### 15.1 배포 아키텍처

```
[개발자] → git push → [Vercel]
                         ├── 빌드: next build
                         ├── 정적 페이지 → Edge CDN (서울 icn1)
                         ├── 동적 라우트 → Serverless Functions
                         └── Middleware → Edge Runtime

[Supabase]
  ├── PostgreSQL → 데이터 저장 + RLS 정책
  ├── Auth → JWT 토큰 발급/검증
  ├── Storage → 이미지 호스팅
  └── Migrations → 스키마 버전 관리
```

### 15.2 Vercel 배포 설정

| 항목 | 설정 | 비고 |
|------|------|------|
| Framework | Next.js (자동 감지) | vercel.json으로 오버라이드 |
| 빌드 명령 | `next build` | 기본값 사용 |
| 출력 디렉토리 | `.next` | 기본값 |
| Node 버전 | 20.x | Vercel 기본 |
| 리전 | `icn1` (서울) | 한국 서비스 최적화 |
| Cron | `/api/cron/sync-complexes` → 매일 09:00 KST | CRON_SECRET 인증 |

### 15.3 보안 헤더

| 헤더 | 값 | 목적 |
|------|-----|------|
| X-Frame-Options | DENY | 클릭재킹 방지 |
| X-Content-Type-Options | nosniff | MIME 타입 스니핑 방지 |
| Referrer-Policy | origin-when-cross-origin | 리퍼러 정보 제한 |
| X-DNS-Prefetch-Control | on | DNS 프리페치 허용 |
| Strict-Transport-Security | max-age=63072000 | HTTPS 강제 (2년) |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | 불필요 API 차단 |

### 15.4 환경변수 구성

| 변수 | 공개 여부 | 필수 | 용도 |
|------|----------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 | ✅ | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 | ✅ | Supabase 공개 API 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | ✅ | RLS 우회 관리자 키 |
| `NEXT_PUBLIC_SITE_URL` | 클라이언트 | ✅ | OAuth 콜백 URL |
| `CRON_SECRET` | 서버 전용 | ✅ | Cron 엔드포인트 인증 |
| `APPLYHOME_API_KEY` | 서버 전용 | ✅ | 공공데이터포털 청약홈 API 인증키 |
| `NEXT_PUBLIC_ENV` | 클라이언트 | ❌ | 환경 식별 (기본: development) |

### 15.5 Supabase 인프라

```
supabase/
├── config.toml         ← 로컬 개발 설정
├── migrations/
│   ├── 20260304000000_init.sql          ← 초기 스키마 (7 테이블, RLS, 인덱스)
│   └── 20260305000000_add_sync_fields.sql ← 공공 API 동기화 필드 (external_id, sync_logs)
└── seed.sql            ← 시드 데이터 (15 단지, 공급유형, 자격규칙)
```

**마이그레이션 적용 순서**:
1. `supabase init` → 로컬 프로젝트 초기화
2. `supabase db push` → 원격 DB에 마이그레이션 적용
3. `supabase db seed` → 시드 데이터 삽입
4. `supabase gen types typescript` → TypeScript 타입 생성

---

## 17. +가치 분석 엔진 아키텍처

> **상태**: ✅ 구현 완료 (2026-03-10 프로덕션 배포)
> **관련 PRD**: 4.1절 "+가치 — 물건 미래 가치 분석"
> **플랜 제한**: Plus 이상 (Free 비활성)

---

### 17.1 설계 개요

단지의 분양가 적정성, 입지 환경, 미래 시세를 복합 분석하여 A~F 6단계 등급을 산출한다. 감정평가사들이 실무에서 활용하는 DCF(현금흐름할인법) 원리를 채용하되, 시장 수요와 대중 기대감을 보정 계수로 반영하여 현실적인 가치를 산정한다.

**등급 매핑**:

| 등급 | 점수 범위 | 의미 |
|------|-----------|------|
| A | 85 이상 | 적극 권장 |
| B | 70 ~ 84 | 권장 |
| C | 55 ~ 69 | 보통 |
| D | 40 ~ 54 | 주의 |
| E | 25 ~ 39 | 비권장 |
| F | 0 ~ 24 | 기회 소진 경고 |

**가중치 구성**:

```
총점(100) = 분양가 적정성(35%) + 입지 환경(35%) + 미래 시세(30%)
```

---

### 17.2 3대 카테고리 및 세부 팩터

#### 카테고리 1: 분양가 적정성 (35점 만점)

DCF 원리를 단순화하여 현재 분양가의 수익성 여부를 판단한다. 미래 예상 시세에서 현재 분양가를 역산하여 가격 갭을 점수로 변환한다.

| 팩터 ID | 팩터명 | 배점 | 산정 기준 | MVP 데이터 소스 |
|---------|--------|------|-----------|----------------|
| `price_gap_ratio` | 주변 시세 대비 분양가 비율 | 15점 | 동일 district 최근 거래가 대비 분양가 비율 (낮을수록 고점) | `supply_types.price_krw` + district 기본 시세 테이블 |
| `price_per_sqm` | 평당 분양가 경쟁력 | 10점 | region 내 동급 면적대 평균 대비 분양가 (낮을수록 고점) | `supply_types.price_krw` / `supply_types.area_sqm` |
| `dcf_premium` | DCF 기반 적정가 대비 프리미엄 | 10점 | 5년 보유 후 추정 매도가 현가 vs 분양가 차이 (양수일수록 고점) | 지역 연평균 상승률 상수 + `price_krw` |

**DCF 단순화 공식**:

```
estimatedFuturePrice = currentMarketPrice × (1 + annualGrowthRate)^holdingYears
presentValue = estimatedFuturePrice / (1 + discountRate)^holdingYears
dcfGap = (presentValue - sellingPrice) / sellingPrice × 100
```

MVP 단계에서는 `annualGrowthRate`와 `discountRate`를 지역별 상수 테이블(`constants/value-analysis-constants.ts`)에서 참조한다.

#### 카테고리 2: 입지 환경 (35점 만점)

교통, 학군, 생활 인프라, 자연환경, 개발 호재 5개 세부 팩터로 구성한다.

| 팩터 ID | 팩터명 | 배점 | 산정 기준 | MVP 데이터 소스 |
|---------|--------|------|-----------|----------------|
| `transport_score` | 교통 접근성 | 10점 | 지하철역 도보 거리, 주요 버스 노선 수 | district 기반 교통 등급 상수 테이블 |
| `school_score` | 학군 | 8점 | 학군 등급 (강남권/비강남, 학원가 밀집도) | district 기반 학군 등급 상수 테이블 |
| `infra_score` | 생활 인프라 | 7점 | 대형마트, 병원, 공원 등 편의시설 밀집도 | district 기반 인프라 등급 상수 테이블 |
| `nature_score` | 자연환경 | 5점 | 강변, 산세권, 공원 조망 유무 | `complexes.raw_data` JSONB 파싱 또는 기본값 |
| `development_score` | 개발 호재 | 5점 | 인근 GTX, 재개발, 신규 산업단지 등 | `complexes.raw_data` JSONB 파싱 또는 기본값 |

#### 카테고리 3: 미래 시세 (30점 만점)

과거 유사 단지 패턴과 지역 트렌드, 시장 심리를 복합 분석한다.

| 팩터 ID | 팩터명 | 배점 | 산정 기준 | MVP 데이터 소스 |
|---------|--------|------|-----------|----------------|
| `historical_trend` | 지역 시세 트렌드 | 12점 | 최근 3년 동일 region 실거래가 연평균 상승률 | region 기반 시세 트렌드 상수 테이블 (Phase 2: 국토부 API) |
| `supply_demand` | 공급/수요 지수 | 10점 | 해당 지역 입주 예정 물량 대비 인구 증가율 | region 기반 공급 지수 상수 테이블 |
| `market_sentiment` | 시장 심리/수요 지수 | 8점 | 유사 단지 경쟁률, 청약 미달 여부, 청약홈 검색량 | `historical_competition` 테이블 (Phase 2: 실시간 크롤링) |

---

### 17.3 점수 산정 엔진 설계

**파일 구조** (`lib/value-analysis/`):

```
lib/value-analysis/
├── index.ts                    # 공개 API — analyzeValueScore() 단일 진입점
├── types.ts                    # 엔진 내부 타입 정의
├── grade-mapper.ts             # 총점 → ValueGrade 매핑 순수 함수
├── normalizer.ts               # 원시 지표 → 0~100 정규화 순수 함수
├── factors/
│   ├── pricing.ts              # 분양가 적정성 3개 팩터 계산
│   ├── location.ts             # 입지 환경 5개 팩터 계산
│   └── future-price.ts         # 미래 시세 3개 팩터 계산
└── constants/
    └── regional-defaults.ts    # 지역별 기본값 (MVP 단계 상수)
```

**핵심 인터페이스** (`lib/value-analysis/types.ts`):

```typescript
/** 엔진에 주입되는 단지 원시 데이터 */
export interface ComplexRawData {
  complexId: string;
  region: string;
  district: string;
  pricePerSqm: number;          // 평당 분양가 (원)
  areaSqm: number;              // 전용면적 (㎡)
  totalPriceKrw: number;        // 분양가 (원)
  rawData: Record<string, unknown>; // complexes.raw_data JSONB
}

/** 팩터 계산 함수 시그니처 (순수 함수 계약) */
export type FactorCalculator = (
  data: ComplexRawData,
  defaults: RegionalDefaults
) => FactorResult;

/** 팩터 계산 결과 */
export interface FactorResult {
  factorId: string;
  rawScore: number;           // 0 ~ maxScore
  maxScore: number;
  normalizedScore: number;    // 0 ~ 100 (가중치 적용 전)
  dataAvailable: boolean;     // 외부 데이터 확보 여부
  description: string;        // 사용자 표시용 한국어 설명
}

/** 카테고리별 집계 */
export interface CategoryResult {
  categoryId: 'pricing' | 'location' | 'future_price';
  label: string;
  weightedScore: number;      // 가중치 적용 후 점수 (0~35 또는 0~30)
  maxWeightedScore: number;
  factors: FactorResult[];
}
```

**점수 산출 흐름**:

```
analyzeValueScore(complexRawData)
  │
  ├── 1. 지역별 기본값 로드 (regional-defaults.ts)
  │
  ├── 2. 팩터별 원시 점수 계산 (factors/)
  │   ├── pricing.ts → FactorResult × 3
  │   ├── location.ts → FactorResult × 5
  │   └── future-price.ts → FactorResult × 3
  │
  ├── 3. 카테고리 가중 합산
  │   ├── 분양가 적정성: sum(rawScore) / sum(maxScore) × 35
  │   ├── 입지 환경:     sum(rawScore) / sum(maxScore) × 35
  │   └── 미래 시세:     sum(rawScore) / sum(maxScore) × 30
  │
  ├── 4. 총점 산출 (0 ~ 100)
  │
  └── 5. gradeMapper로 ValueGrade 결정
```

**등급 매핑 함수** (`lib/value-analysis/grade-mapper.ts`):

```typescript
/** 총점을 ValueGrade로 변환하는 순수 함수 */
export function mapScoreToGrade(totalScore: number): ValueGrade {
  if (totalScore >= 85) return 'A';
  if (totalScore >= 70) return 'B';
  if (totalScore >= 55) return 'C';
  if (totalScore >= 40) return 'D';
  if (totalScore >= 25) return 'E';
  return 'F';
}
```

**정규화 원칙** (`lib/value-analysis/normalizer.ts`):

```typescript
/**
 * 원시 수치를 0~100 점수로 정규화한다.
 * @param value     - 원시 값
 * @param minValue  - 최솟값 (0점 기준)
 * @param maxValue  - 최댓값 (100점 기준)
 * @param inverse   - true이면 값이 낮을수록 높은 점수 (예: 평당 분양가)
 */
export function normalize(
  value: number,
  minValue: number,
  maxValue: number,
  inverse = false
): number {
  const clamped = Math.max(minValue, Math.min(maxValue, value));
  const ratio = (clamped - minValue) / (maxValue - minValue);
  return Math.round((inverse ? 1 - ratio : ratio) * 100);
}
```

---

### 17.4 MVP 단계 데이터 전략

외부 API 미연동 단계에서 합리적인 점수를 산출하기 위해 지역별 상수 테이블을 활용한다.

**데이터 확보 수준별 처리 방침**:

| 데이터 상태 | 처리 방법 | 사용자 표시 |
|------------|-----------|-------------|
| complexes 테이블 기반 (확보) | 실제 값으로 계산 | 점수 정상 표시 |
| district 기반 상수 테이블 (추정) | 지역 평균값으로 대체 | "지역 평균 기준" 표시 |
| 외부 API 미연동 (미확보) | 카테고리 중간값 배정 (50점) | "데이터 미확보" 표시 |

**지역별 기본값 상수** (`lib/value-analysis/constants/regional-defaults.ts`):

```typescript
export interface RegionalDefaults {
  region: string;
  /** 연평균 시세 상승률 (소수점, 예: 0.035 = 3.5%) */
  annualGrowthRate: number;
  /** DCF 할인율 */
  discountRate: number;
  /** 교통 등급 (1~5, 높을수록 우수) */
  transportGrade: number;
  /** 학군 등급 (1~5) */
  schoolGrade: number;
  /** 인프라 등급 (1~5) */
  infraGrade: number;
  /** 공급 지수 (1~5, 낮을수록 공급 과잉) */
  supplyDemandIndex: number;
}

/** region 코드 → 기본값 매핑 (MVP 초기값) */
export const REGIONAL_DEFAULTS: Record<string, RegionalDefaults> = {
  '서울': {
    region: '서울',
    annualGrowthRate: 0.045,
    discountRate: 0.05,
    transportGrade: 4,
    schoolGrade: 4,
    infraGrade: 4,
    supplyDemandIndex: 4,
  },
  '경기': {
    region: '경기',
    annualGrowthRate: 0.030,
    discountRate: 0.05,
    transportGrade: 3,
    schoolGrade: 3,
    infraGrade: 3,
    supplyDemandIndex: 3,
  },
  // ... 나머지 광역시/도
};

/** 매핑 미존재 시 사용하는 전국 평균 기본값 */
export const NATIONAL_DEFAULT: RegionalDefaults = {
  region: '전국',
  annualGrowthRate: 0.025,
  discountRate: 0.05,
  transportGrade: 3,
  schoolGrade: 3,
  infraGrade: 3,
  supplyDemandIndex: 3,
};
```

**[PROD-TODO] Phase 2 외부 데이터 연동 계획**:

| 단계 | 데이터 | API | 대체 대상 |
|------|--------|-----|-----------|
| Phase 2-A | 실거래가/시세 | 국토부 실거래 공개시스템 | `price_gap_ratio`, `historical_trend` 상수 대체 |
| Phase 2-B | 교통 접근성 | 카카오맵 API 또는 공공 교통 DB | `transport_score` 상수 대체 |
| Phase 2-C | 시장 심리 | 청약홈 경쟁률 API (기존 연동) | `market_sentiment` 점수 고도화 |

---

### 17.5 서비스 레이어 설계

**파일**: `lib/services/value-analysis-service.ts`

기존 스텁을 다음 인터페이스로 교체한다.

```typescript
import type { ValueAnalysis, ValueFactor } from '@/types/plus-features';
import type { SupabaseDb } from '@/types/supabase';
import { analyzeValueScore } from '@/lib/value-analysis';
import type { ComplexRawData } from '@/lib/value-analysis/types';

/**
 * 단지 가치 분석을 실행하고 ValueAnalysis 결과를 반환한다.
 *
 * @param supabase  - 서버용 Supabase 클라이언트
 * @param complexId - 분석 대상 단지 UUID
 * @returns 가치 분석 결과. 단지 데이터 미존재 시 null.
 */
export async function analyzeValue(
  supabase: SupabaseDb,
  complexId: string
): Promise<ValueAnalysis | null> {
  // 1. 단지 + 공급유형 데이터 로드 (complex-repository 경유)
  const { data: complex, error } = await supabase
    .from('complexes')
    .select('*, supply_types(*)')
    .eq('id', complexId)
    .single();

  if (error || !complex) return null;

  // 2. 대표 공급유형(최소 면적 타입)에서 평당 분양가 추출
  const representativeType = selectRepresentativeSupplyType(complex.supply_types);
  if (!representativeType) return null;

  // 3. 엔진 입력 데이터 조립
  const rawData: ComplexRawData = {
    complexId,
    region: complex.region,
    district: complex.district,
    pricePerSqm: representativeType.price_krw / representativeType.area_sqm,
    areaSqm: representativeType.area_sqm,
    totalPriceKrw: representativeType.price_krw,
    rawData: (complex.raw_data as Record<string, unknown>) ?? {},
  };

  // 4. 순수 함수 엔진 호출
  const engineResult = analyzeValueScore(rawData);

  // 5. ValueFactor[] 형태로 변환 (types/plus-features.ts 인터페이스 준수)
  const factors: ValueFactor[] = engineResult.categories.flatMap((cat) =>
    cat.factors.map((f) => ({
      factor: f.factorId,
      score: f.rawScore,
      maxScore: f.maxScore,
      description: f.description,
    }))
  );

  return {
    complexId,
    grade: engineResult.grade,
    totalScore: engineResult.totalScore,
    maxScore: 100,
    factors,
    analyzedAt: new Date().toISOString(),
  };
}

/** 공급유형 배열에서 대표 타입(전용면적 최솟값)을 선택한다 */
function selectRepresentativeSupplyType(
  supplyTypes: Array<{ price_krw: number; area_sqm: number }>
) {
  if (!supplyTypes || supplyTypes.length === 0) return null;
  return supplyTypes.reduce((prev, curr) =>
    curr.area_sqm < prev.area_sqm ? curr : prev
  );
}
```

**레이어 의존 관계** (CLAUDE.md 3절 원칙 준수):

```
API Route (app/api/complexes/[id]/value/route.ts)
  └── value-analysis-service.ts (서비스)
        ├── complex-repository.ts (리포지토리) → Supabase
        └── lib/value-analysis/ (순수 도메인 엔진)
              └── regional-defaults.ts (상수)
```

---

### 17.6 API 라우트 설계

**파일**: `app/api/complexes/[id]/value/route.ts`

**엔드포인트**: `GET /api/complexes/:id/value`

```typescript
// 응답 형태 (성공)
{
  "data": {
    "complexId": "uuid",
    "grade": "B",
    "totalScore": 74,
    "maxScore": 100,
    "factors": [
      {
        "factor": "price_gap_ratio",
        "score": 12,
        "maxScore": 15,
        "description": "주변 시세 대비 분양가 비율 우수"
      },
      {
        "factor": "transport_score",
        "score": 7,
        "maxScore": 10,
        "description": "지역 평균 기준 (데이터 미확보)"
      }
      // ...
    ],
    "analyzedAt": "2026-03-09T10:00:00.000Z"
  },
  "error": null
}
```

**인증 및 플랜 검증 흐름**:

```
GET /api/complexes/:id/value
  │
  ├── 1. JWT 검증 (인증 필수)
  │       실패 → 401 AUTH_REQUIRED
  │
  ├── 2. 플랜 확인 — profiles.plan_type 조회
  │       Free → 403 PLAN_UPGRADE_REQUIRED
  │
  ├── 3. 단지 존재 확인
  │       미존재 → 404 COMPLEX_NOT_FOUND
  │
  ├── 4. value-analysis-service.analyzeValue() 호출
  │       엔진 오류 → 500 INTERNAL_ERROR
  │
  └── 5. ValueAnalysis 반환 → 200 OK
```

**추가 에러 코드** (기존 6.4절 확장):

| 코드 | HTTP | 설명 |
|------|------|------|
| `PLAN_UPGRADE_REQUIRED` | 403 | Plus 이상 플랜 필요 |
| `VALUE_ANALYSIS_UNAVAILABLE` | 503 | 분석 데이터 부족 (단지 정보 미확보) |

---

### 17.7 프론트엔드 컴포넌트 설계

**라우트**: `/complexes/[id]/value` (기존 디렉토리 구조 확장)

```
app/(main)/complexes/[id]/
├── page.tsx               # 단지 상세 (기존)
├── eligibility/
│   └── page.tsx           # 판정 결과 (기존)
└── value/
    └── page.tsx           # +가치 분석 결과 (신규)
```

**컴포넌트 계층** (`components/features/value-analysis/`):

```
components/features/value-analysis/
├── value-grade-badge.tsx       # A~F 등급 배지 (색상 코딩)
├── value-score-card.tsx        # 총점 + 등급 요약 카드
├── category-breakdown.tsx      # 3대 카테고리 점수 막대 차트
├── factor-list.tsx             # 세부 팩터 목록 (dataAvailable 표시 포함)
└── data-unavailable-notice.tsx # "데이터 미확보" 안내 컴포넌트
```

**TanStack Query 훅** (`hooks/use-value-analysis.ts`):

```typescript
/** +가치 분석 결과 조회 훅 */
export function useValueAnalysis(complexId: string) {
  return useQuery({
    queryKey: ['value-analysis', complexId],
    queryFn: () =>
      fetch(`/api/complexes/${complexId}/value`).then((res) => res.json()),
    staleTime: 1000 * 60 * 60, // 1시간 캐시 (분석 결과는 실시간 불필요)
  });
}
```

**등급별 색상 코딩** (`constants/value-analysis.ts`):

```typescript
export const VALUE_GRADE_COLORS: Record<ValueGrade, string> = {
  A: 'text-emerald-600 bg-emerald-50',
  B: 'text-blue-600 bg-blue-50',
  C: 'text-yellow-600 bg-yellow-50',
  D: 'text-orange-600 bg-orange-50',
  E: 'text-red-500 bg-red-50',
  F: 'text-red-700 bg-red-100',
};
```

---

### 17.8 DB 스키마 확장

가치 분석 결과를 캐싱하기 위해 `complexes` 테이블에 컬럼을 추가하거나 별도 테이블을 생성한다.

**Option A: complexes 테이블 컬럼 추가** (MVP 권장 — 단순성 우선):

```sql
-- 마이그레이션: 20260309000001_add_value_analysis.sql
-- +가치 분석 결과 캐싱 필드 추가

ALTER TABLE complexes
  ADD COLUMN value_grade      TEXT CHECK (value_grade IN ('A','B','C','D','E','F')),
  ADD COLUMN value_score      SMALLINT CHECK (value_score BETWEEN 0 AND 100),
  ADD COLUMN value_factors    JSONB,
  ADD COLUMN value_analyzed_at TIMESTAMPTZ;

COMMENT ON COLUMN complexes.value_grade IS '+가치 분석 등급 (A~F)';
COMMENT ON COLUMN complexes.value_score IS '+가치 분석 총점 (0~100)';
COMMENT ON COLUMN complexes.value_factors IS '팩터별 점수 상세 (ValueFactor[])';
COMMENT ON COLUMN complexes.value_analyzed_at IS '마지막 가치 분석 실행 시각';
```

**[PROD-TODO] Option B: 별도 테이블** (Phase 2 고려):

```sql
-- 분석 이력 관리, 사용자별 커스텀 입력 지원 시 사용
CREATE TABLE value_analysis_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id    UUID NOT NULL REFERENCES complexes(id),
  grade         TEXT NOT NULL CHECK (grade IN ('A','B','C','D','E','F')),
  total_score   SMALLINT NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  factors       JSONB NOT NULL DEFAULT '[]',
  analyzed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  engine_version TEXT NOT NULL DEFAULT '1.0'
);

-- 단지당 최신 분석 1건 조회 최적화
CREATE INDEX idx_value_analysis_complex_latest
  ON value_analysis_results (complex_id, analyzed_at DESC);
```

**RLS 정책**:

```sql
-- complexes.value_* 컬럼: 기존 complexes_read 정책 그대로 상속
-- (인증 사용자 읽기 전용, 관리자/Cron 쓰기)

-- [PROD-TODO] value_analysis_results 테이블 추가 시:
-- CREATE POLICY "value_analysis_read" ON value_analysis_results
--   FOR SELECT TO authenticated USING (true);
```

---

### 17.9 파일 300줄 분리 기준

+가치 분석 엔진은 다음 기준으로 파일을 분리한다.

| 파일 | 예상 줄 수 | 분리 기준 |
|------|------------|-----------|
| `lib/value-analysis/index.ts` | ~50줄 | 진입점, 오케스트레이션만 |
| `lib/value-analysis/factors/pricing.ts` | ~80줄 | 분양가 팩터 3개 |
| `lib/value-analysis/factors/location.ts` | ~100줄 | 입지 팩터 5개 |
| `lib/value-analysis/factors/future-price.ts` | ~80줄 | 미래 시세 팩터 3개 |
| `lib/value-analysis/constants/regional-defaults.ts` | ~100줄 | 17개 광역시도 기본값 |
| `lib/services/value-analysis-service.ts` | ~80줄 | 서비스 레이어만 |
| `app/api/complexes/[id]/value/route.ts` | ~60줄 | 요청/응답 포맷만 |

---

### 17.10 구현 체크리스트

2026-03-10 구현 완료. DB 마이그레이션(#11)과 테스트(#16)는 별도 진행 예정.

```
[x] 1. constants/value-analysis-constants.ts — 등급 색상, 팩터 레이블 상수
[x] 2. lib/value-analysis/constants/regional-defaults.ts — 17개 광역시도 기본값
[x] 3. lib/value-analysis/types.ts — 엔진 내부 타입
[x] 4. lib/value-analysis/normalizer.ts — 정규화 순수 함수
[x] 5. lib/value-analysis/grade-mapper.ts — 등급 매핑 순수 함수
[x] 6. lib/value-analysis/factors/pricing.ts — 분양가 팩터
[x] 7. lib/value-analysis/factors/location.ts — 입지 팩터
[x] 8. lib/value-analysis/factors/future-price.ts — 미래 시세 팩터
[x] 9. lib/value-analysis/index.ts — analyzeValueScore() 진입점
[x] 10. lib/services/value-analysis-service.ts — 스텁 → 실제 구현 교체
[ ] 11. supabase/migrations — DB 컬럼 추가 (별도 진행)
[x] 12. app/api/complexes/[id]/value/route.ts — API 라우트
[x] 13. hooks/use-value-analysis.ts — TanStack Query 훅
[x] 14. components/features/value-analysis/ — UI 컴포넌트 4개
[x] 15. app/(main)/complexes/[id]/value/page.tsx — 페이지
[ ] 16. vitest 테스트 — normalizer, grade-mapper, 각 팩터 계산 함수 (별도 진행)
```

---

## 18. 프로젝트 리네이밍 — chungyak-mate → chungyakplus

### 18.1 변경 사유

초기 개발 단계에서 임시로 사용한 `chungyak-mate`가 서비스 정체성(청약플러스, ChungYak Plus)과 맞지 않아 저장소명·Vercel 프로젝트명을 서비스명과 일치시킨다.

### 18.2 변경 범위 및 순서

| 순서 | 대상 | 변경 내용 |
|------|------|-----------|
| 1 | `docs/PROGRESS.md` | 프로덕션 URL `chungyak-mate.vercel.app` → `chungyakplus.vercel.app` (2곳), GitHub URL `yonghot/chungyak-mate` → `yonghot/chungyakplus` (1곳) |
| 2 | `.vercel/project.json` | `"projectName": "chungyak-mate"` → `"chungyakplus"` |
| 3 | Git remote origin | `https://github.com/yonghot/chungyak-mate.git` → `https://github.com/yonghot/chungyakplus.git` |

소스 코드, 환경변수, `package.json`(`"name": "chungyakplus"` 기확인)에는 `chungyak-mate` 참조가 없으므로 변경 불필요.

### 18.3 주의사항

- Vercel 대시보드의 프로젝트 표시명 변경은 수동 작업 필요 (`.vercel/project.json` 수정만으로는 Vercel 서버 측 설정이 바뀌지 않음)
- 기존 `chungyak-mate.vercel.app` 도메인은 Vercel 프로젝트 삭제 전까지 유지되나, 공식 URL은 `chungyakplus.vercel.app`으로 안내한다

### 18.4 롤백 계획

- 문서 변경: `git revert`로 복원
- Git remote: `git remote set-url origin https://github.com/yonghot/chungyak-mate.git`으로 복원
- `.vercel/project.json`: `git revert` 또는 수동 복원

---

## 16. 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-04 | 초기 아키텍처 설계서 작성 |
| 2026-03-04 | MVP 구현 완료 반영 — 파일 통계, 테스트 커버리지, 보안 강화, 빌드 검증 추가 |
| 2026-03-09 | PRD v2.1 리얼라인먼트 — 청약플러스 리브랜딩, Section 17 "+가치 분석 엔진 아키텍처" 설계 추가 |
| 2026-03-10 | Section 17 구현 완료 — 엔진(8파일), 서비스, API, UI(4컴포넌트) 프로덕션 배포 |
| 2026-03-05 | 배포 인프라 설계 추가 — Vercel 설정, 보안 헤더, Supabase 구성 |
| 2026-03-10 | Section 18 추가 — chungyak-mate → chungyakplus 리네이밍 설계 |
| 2026-03-05 | 공공데이터 API 연동 구현 — 청약홈 API 클라이언트, 동기화 서비스, Cron 엔드포인트, DB 마이그레이션 (`docs/public-api-integration.md` 참조) |

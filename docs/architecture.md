# 청약메이트 아키텍처 설계서

> **작성일**: 2026-03-04
> **상태**: MVP 구현 완료
> **대상**: PRD v1.0 기반
> **최종 업데이트**: 2026-03-04 (Phase 8 - 최종 검증 완료)

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

## 16. 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-04 | 초기 아키텍처 설계서 작성 |
| 2026-03-04 | MVP 구현 완료 반영 — 파일 통계, 테스트 커버리지, 보안 강화, 빌드 검증 추가 |
| 2026-03-05 | 배포 인프라 설계 추가 — Vercel 설정, 보안 헤더, Supabase 구성 |
| 2026-03-05 | 공공데이터 API 연동 구현 — 청약홈 API 클라이언트, 동기화 서비스, Cron 엔드포인트, DB 마이그레이션 (`docs/public-api-integration.md` 참조) |

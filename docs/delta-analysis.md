# Delta Analysis: 청약메이트 → 청약플러스 PRD 재정렬

> 기존 프로토타입(청약메이트 MVP)과 새 PRD v2.1(청약플러스) 간 차이 분석
> 작성일: 2026-03-09

---

## 1. 브랜딩 변경

| 항목 | 기존 (청약메이트) | 새 PRD (청약플러스) | 변경 유형 |
|------|-------------------|---------------------|-----------|
| 서비스명 (한글) | 청약메이트 | 청약플러스 | RENAME |
| 서비스명 (영문) | ChungYakMate | ChungYak Plus | RENAME |
| 태그라인 | 시행사 도메인 지식 기반 청약 자격 진단 및 당첨 확률 분석 웹서비스 | 내 청약 경쟁력에 +를 더하다 | REPLACE |
| 요금제 중간 | 스탠다드 (9,900원) | Plus (9,900원) | RENAME |
| 요금제 상위 | 프리미엄 (29,900원) | Plus Pro (29,900원) | RENAME |
| 핵심 컨셉 | 자격 진단 + 당첨 확률 분석 | +가치 × +예측 × +보호 통합 플랫폼 | EXPAND |

### 영향 파일 (코드 내 브랜딩 참조)

- `package.json` (name 필드)
- `components/layout/header.tsx` (로고, 서비스명)
- `app/page.tsx` (랜딩 페이지 전역 — 최소 5곳)
- `.env.example` (파일 헤더)
- `supabase/config.toml` (project_id)
- `PRD.md`, `DESIGN.md`, `CLAUDE.md` (문서)
- `docs/PROGRESS.md`, `docs/architecture.md` (문서)

---

## 2. 기능 변경

### 2.1 유지되는 기능 (기존 → 새 PRD 매핑)

| 기존 기능 | 새 PRD 위치 | 변경 사항 |
|-----------|-------------|-----------|
| F-001: 사용자 인증 (이메일/카카오) | STEP 0: S0-2 | 네이버 소셜 로그인 추가 필요 |
| F-002: 프로필 시스템 (4단계 온보딩) | STEP 0: S0-3 | 단계 구성 변경 (기본정보→청약통장→자격정보→소득/자산) |
| F-003: 자격 판정 엔진 (7유형) | STEP 4: +자격 | 플랜 제한 추가 (Free 월 3회) |
| F-004: 가점 계산 (84점) | STEP 0: S0-4 | 변경 없음 |
| F-005: 모집공고 데이터 | STEP 1: S1-1 | 단지 카드에 +가치/+예측 뱃지 추가 |
| F-006: 맞춤 추천 | 5.2 맞춤 분양 추천 | +가치 등급 기반 정렬 추가 |
| 분양 캘린더 (TODO) | 5.1 캘린더 & 알림 | 기존 TODO 유지 |

### 2.2 새로 추가되는 기능

| 기능 | PRD 섹션 | 우선순위 | 플랜 제한 | 스텁 필요 여부 |
|------|----------|----------|-----------|----------------|
| +가치: 물건 미래 가치 분석 (A~F 등급) | 4.1 STEP 1 | P1 (Phase 1) | Plus 이상 | YES — lib/analysis/ |
| +예측: 경쟁률 예측 엔진 (3계층) | 4.2 STEP 2 | P0 (Phase 2) | Plus Pro | YES — lib/prediction/ |
| +보호: GO/WAIT/SKIP 판정 | 4.3 STEP 3 | P0 (Phase 2) | Plus Pro | YES — lib/protection/ |
| +리포트: PDF 의사결정 보고서 | 4.5 STEP 5 | P1 (Phase 2) | Plus Pro | YES — lib/report/ |
| 시뮬레이션 | 5.3 | P2 (Phase 2) | Plus Pro | YES — 라우트 스텁 |
| 단지 비교 (최대 3개) | +비교 | P1 (Phase 2) | Plus Pro | YES — 라우트 스텁 |
| 대시보드 | 6. /dashboard | P0 (Phase 1) | 전체 | YES — 라우트 스텁 |
| 구독/결제 시스템 | 1.4, 7.6 | P0 (Phase 2) | - | YES — 라우트 스텁 |
| 설정 페이지 | 6. /settings | - | 전체 | YES — 라우트 스텁 |

### 2.3 기존에만 있는 기능 (새 PRD 미언급)

| 기능 | 처리 방침 |
|------|-----------|
| F-009: 관리자 대시보드 | 유지 (PROD-TODO) |
| F-012: 커뮤니티 | 유지 (PROD-TODO) |
| /signup 페이지 (이메일 회원가입) | 유지 — 기존 동작 보존 |
| /notifications 페이지 | 유지 — subscription_alerts와 병행 |
| sync_logs 테이블/동기화 서비스 | 유지 — 운영 필수 |

---

## 3. 데이터 모델 변경

### 3.1 테이블 매핑

| 기존 테이블 | 새 PRD 테이블 | 변경 유형 | 영향도 |
|-------------|---------------|-----------|--------|
| `profiles` | `user_profiles` | 이름 변경 + 필드 대폭 변경 | **HIGH** |
| `complexes` | `complexes` | 필드 추가 (가치/예측 캐싱) | MEDIUM |
| `supply_types` | complexes.supply_types (JSONB) | 별도 테이블 → JSONB 통합 | **HIGH** |
| `eligibility_rules` | (미언급 — 코드 기반 유지) | 변경 없음 | LOW |
| `eligibility_results` | `user_interests` (통합) | 통합 + 필드 추가 | **HIGH** |
| `bookmarks` | `user_interests.is_bookmarked` | 통합 | MEDIUM |
| `notifications` | `subscription_alerts` | 이름/구조 변경 | MEDIUM |
| `sync_logs` | (미언급 — 유지) | 변경 없음 | LOW |
| (없음) | `historical_competition` | **NEW** | MEDIUM |

### 3.2 profiles → user_profiles 필드 변경 상세

**기존 profiles 필드:**
```
id, name, birth_date, phone, is_household_head, marital_status,
marriage_date, dependents_count, homeless_start_date, total_assets_krw,
monthly_income_krw, car_value_krw, subscription_type, subscription_start_date,
deposit_count, has_won_before, won_date, profile_completion
```

**새 PRD user_profiles 필드:**
```
id, user_id, birth_year, household_type, household_member_count,
region_code, subscription_account_type, subscription_months,
subscription_balance, is_homeless, homeless_period_months,
dependent_count, income_bracket, asset_bracket, total_points (computed),
plan_type
```

**주요 차이:**
- PK 구조: `profiles.id = auth.users.id` → `user_profiles.id = UUID + user_id FK`
- 이름/연락처 제거 (name, phone)
- 자산 정보: 정확한 금액 → 구간값 (income_bracket, asset_bracket)
- 무주택기간: 시작일(Date) → 개월수(Int)
- 세대정보: marital_status → household_type
- 청약통장: subscription_type/start_date/deposit_count → account_type/months/balance
- 새 필드: region_code, plan_type, total_points (computed)
- 제거 필드: is_household_head, marriage_date, has_won_before, won_date, car_value_krw

### 3.3 접근 방침 (P1 최소 변경 원칙)

> **중요**: 기존 테이블명과 필드를 즉시 변경하면 서비스/리포지토리/컴포넌트/API/테스트 전체가 깨진다.
> 따라서 **기존 테이블 구조를 유지하면서 새 필드만 추가**하는 증분 방식을 택한다.

- `profiles` 테이블명 유지 (코드 전체 참조 유지)
- 새 필드만 추가: `plan_type`, `region_code`, `income_bracket`, `asset_bracket`
- `complexes`에 새 필드 추가: `latitude`, `longitude`, `value_grade`, `value_analysis`, `predicted_competition_rate`, `prediction_confidence`, `prediction_factors`
- `historical_competition` 테이블 신규 생성
- `user_interests` 테이블 신규 생성 (기존 bookmarks와 병행)
- `subscription_alerts` 테이블 신규 생성 (기존 notifications와 병행)

---

## 4. 라우트 변경

### 4.1 기존 라우트 → 새 PRD 매핑

| 기존 라우트 | 새 PRD 라우트 | 상태 |
|-------------|---------------|------|
| `/` (랜딩) | `/` | 유지 — 브랜딩 변경 |
| `/(auth)/login` | `/login` | 유지 |
| `/(auth)/signup` | (미언급) | 유지 |
| `/(onboarding)/onboarding` | `/onboarding` | 유지 |
| `/(main)/complexes` | `/complexes` | 유지 |
| `/(main)/complexes/[id]` | `/complexes/[id]` | 유지 |
| `/(main)/complexes/[id]/eligibility` | `/complexes/[id]/eligibility` | 유지 |
| `/(main)/recommend` | `/complexes/recommended` or `/dashboard` | 유지 |
| `/(main)/profile` | `/settings` | 유지 — 별칭 추가 가능 |
| `/(main)/notifications` | (alerts 기반) | 유지 |

### 4.2 새로 추가할 라우트 (스텁)

| 라우트 | 설명 | 스텁 내용 |
|--------|------|-----------|
| `/(main)/dashboard` | 메인 대시보드 | 프로필 카드 + 추천 피드 |
| `/(main)/complexes/[id]/value` | +가치 분석 탭 | "Plus 플랜 필요" 안내 |
| `/(main)/complexes/[id]/prediction` | +예측 탭 | "Plus Pro 플랜 필요" 안내 |
| `/(main)/complexes/[id]/protection` | +보호 탭 | "Plus Pro 플랜 필요" 안내 |
| `/(main)/complexes/[id]/report` | +리포트 | "Plus Pro 플랜 필요" 안내 |
| `/(main)/compare` | 단지 비교 | "Plus Pro 플랜 필요" 안내 |
| `/(main)/simulation` | 시뮬레이션 | "Plus Pro 플랜 필요" 안내 |
| `/(main)/settings` | 설정 | 프로필 수정 + 구독 관리 |
| `/(main)/settings/subscription` | 구독 관리 | 플랜 비교 카드 |

---

## 5. API 엔드포인트 변경

### 5.1 기존 API → 유지

| 엔드포인트 | 변경 |
|-----------|------|
| `GET /api/health` | 유지 |
| `POST /api/eligibility/evaluate` | 유지 |
| `GET /api/complexes` | 유지 |
| `GET /api/complexes/[id]` | 유지 |
| `GET /api/recommend` | 유지 |
| `GET /api/notifications` | 유지 |
| `POST /api/notifications/[id]/read` | 유지 |
| `POST /api/cron/sync-complexes` | 유지 |

### 5.2 새로 추가할 API (스텁)

| 엔드포인트 | 설명 | 스텁 응답 |
|-----------|------|-----------|
| `GET /api/complexes/[id]/value` | +가치 분석 | `{ data: null, error: { code: 'NOT_IMPLEMENTED' } }` |
| `GET /api/complexes/[id]/prediction` | +예측 | `{ data: null, error: { code: 'NOT_IMPLEMENTED' } }` |
| `GET /api/complexes/[id]/protection` | +보호 | `{ data: null, error: { code: 'NOT_IMPLEMENTED' } }` |
| `GET /api/complexes/[id]/report` | +리포트 | `{ data: null, error: { code: 'NOT_IMPLEMENTED' } }` |
| `POST /api/interests` | 관심단지 추가 | `{ data: null, error: { code: 'NOT_IMPLEMENTED' } }` |
| `GET /api/interests` | 관심단지 목록 | `{ data: null, error: { code: 'NOT_IMPLEMENTED' } }` |
| `POST /api/compare` | 단지 비교 | `{ data: null, error: { code: 'NOT_IMPLEMENTED' } }` |
| `GET /api/subscription` | 구독 상태 | `{ data: { plan: 'free' } }` |
| `POST /api/simulation/points` | 가점 시뮬레이션 | `{ data: null, error: { code: 'NOT_IMPLEMENTED' } }` |

---

## 6. 서비스/리포지토리 레이어 변경

### 6.1 기존 유지

| 서비스 | 변경 |
|--------|------|
| `lib/services/auth-service.ts` | 변경 없음 |
| `lib/services/profile-service.ts` | 변경 없음 (plan_type 필드 추가 시 소규모 수정) |
| `lib/services/complex-service.ts` | 변경 없음 |
| `lib/services/eligibility-service.ts` | 변경 없음 |
| `lib/services/recommend-service.ts` | 변경 없음 |
| `lib/services/notification-service.ts` | 변경 없음 |
| `lib/services/sync-service.ts` | 변경 없음 |

### 6.2 새로 추가할 모듈 (스텁)

| 경로 | 설명 | 내용 |
|------|------|------|
| `lib/services/value-analysis-service.ts` | +가치 분석 서비스 | 인터페이스 + TODO 구현 |
| `lib/services/prediction-service.ts` | +예측 서비스 | 인터페이스 + TODO 구현 |
| `lib/services/protection-service.ts` | +보호 서비스 | 인터페이스 + TODO 구현 |
| `lib/services/report-service.ts` | +리포트 서비스 | 인터페이스 + TODO 구현 |
| `lib/services/subscription-service.ts` | 구독 관리 서비스 | 인터페이스 + TODO 구현 |

---

## 7. 기술 스택 차이

### 7.1 새 PRD에서 언급하지만 **채택하지 않는** 기술

| 기술 | 새 PRD 언급 | 대체 (기존 유지) | 사유 |
|------|-------------|------------------|------|
| NextAuth.js | 인증 | Supabase Auth | 기존 인증 체계 동작 중 |
| Drizzle ORM | ORM | Supabase 직접 쿼리 + 리포지토리 패턴 | 기존 아키텍처 유지 |
| Redis (Upstash) | 캐싱 | Supabase + TanStack Query 캐싱 | MVP에 불필요 |
| Python FastAPI | ML 예측 | Next.js API Routes (스텁) | Phase 2 이후 검토 |
| Cheerio/Puppeteer | 크롤링 | 기존 공공데이터 API 연동 유지 | 기존 동작 보존 |

### 7.2 추가 검토 가능한 기술

| 기술 | 용도 | 시점 |
|------|------|------|
| Recharts | 등급 게이지, 경쟁률 차트 | +가치/+예측 구현 시 |
| next-pwa | PWA 지원 | Phase 2 |

### 7.3 유지하는 기술 (새 PRD 미언급이지만 유지)

- TanStack Query 5 (서버 상태 캐싱)
- framer-motion (UI 애니메이션)
- sonner (토스트 알림)

---

## 8. 디렉토리 구조 차이

### 8.1 새 PRD의 `src/` 접두사 → 채택하지 않음

새 PRD는 `src/app/`, `src/components/` 구조를 제안하나,
기존 프로젝트는 `app/`, `components/` 플랫 구조로 운영 중.
**기존 구조 유지** (P6 기존 코드 존중).

### 8.2 새로 추가할 디렉토리

```
lib/
  services/
    value-analysis-service.ts    (NEW — +가치)
    prediction-service.ts        (NEW — +예측)
    protection-service.ts        (NEW — +보호)
    report-service.ts            (NEW — +리포트)
    subscription-service.ts      (NEW — 구독)

app/(main)/
    dashboard/page.tsx           (NEW — 대시보드)
    complexes/[id]/
        value/page.tsx           (NEW — +가치 탭)
        prediction/page.tsx      (NEW — +예측 탭)
        protection/page.tsx      (NEW — +보호 탭)
        report/page.tsx          (NEW — +리포트)
    compare/page.tsx             (NEW — 단지 비교)
    simulation/page.tsx          (NEW — 시뮬레이션)
    settings/
        page.tsx                 (NEW — 설정)
        subscription/page.tsx    (NEW — 구독 관리)

app/api/
    complexes/[id]/
        value/route.ts           (NEW)
        prediction/route.ts      (NEW)
        protection/route.ts      (NEW)
        report/route.ts          (NEW)
    interests/route.ts           (NEW)
    compare/route.ts             (NEW)
    subscription/route.ts        (NEW)
    simulation/
        points/route.ts          (NEW)
```

---

## 9. 변경하지 않는 항목 (명시적 보존)

| 항목 | 사유 |
|------|------|
| 7개 공급유형 자격 판정 엔진 (lib/eligibility/) | 핵심 비즈니스 로직, 완전 동작 중 |
| 84점 가점 계산 로직 (lib/eligibility/scoring.ts) | 법령 기반, 변경 없음 |
| Supabase Auth 인증 체계 | 동작 중, NextAuth 전환 불필요 |
| 4-Layer 아키텍처 (Page → Hook → Service → Repository) | P2 원칙 |
| TanStack Query 서버 상태 관리 | 기존 커스텀 훅 전체 의존 |
| 기존 테스트 515개 | 회귀 방지 |
| 공공데이터 API 동기화 (sync-service) | 운영 필수 |
| Vercel 배포 설정 | 배포 파이프라인 유지 |
| RLS 정책 | 보안 필수 |

---

## 10. 작업 순서 (의존성 기반)

### Phase 2 실행 순서

```
1. 브랜딩 변경 (의존성 없음)
   → 청약메이트 → 청약플러스, 태그라인, 요금제명

2. 타입 정의 추가 (의존성 없음)
   → types/에 새 인터페이스 추가 (ValueAnalysis, PredictionResult, Signal 등)
   → 기존 타입 수정 최소화

3. DB 마이그레이션 (타입 정의 후)
   → profiles에 plan_type, region_code 등 새 필드 추가
   → complexes에 가치/예측 필드 추가
   → historical_competition 신규 테이블
   → user_interests 신규 테이블
   → subscription_alerts 신규 테이블

4. 서비스 스텁 생성 (타입 정의 후)
   → value-analysis-service, prediction-service 등

5. API 스텁 생성 (서비스 스텁 후)
   → 새 엔드포인트 라우트 파일

6. 라우트/페이지 스텁 생성 (API 스텁 후)
   → 새 페이지 컴포넌트

7. 기존 UI 브랜딩 업데이트 (브랜딩 변경과 병행 가능)
   → 랜딩 페이지, 헤더, 메타데이터
```

---

## 11. 리스크

| 리스크 | 심각도 | 완화 방안 |
|--------|--------|-----------|
| profiles 테이블 이름 변경 시 전체 코드 파괴 | HIGH | 테이블명 유지, 필드만 추가 |
| supply_types 테이블 → JSONB 전환 시 기존 쿼리 파괴 | HIGH | supply_types 테이블 유지, JSONB 병행 |
| 브랜딩 변경 누락 (일부 파일에서 옛 이름 잔존) | MEDIUM | Grep으로 전수 검색 후 변경 |
| 새 스텁 API/페이지가 기존 라우팅과 충돌 | LOW | (main) 그룹 내 배치로 레이아웃 일관성 유지 |
| 테스트 파일 내 브랜딩 참조 | LOW | 테스트도 브랜딩 문자열 업데이트 |

---

## 12. 게이트 체크 항목

- [x] 기존 프로젝트 파일 구조 파악 완료
- [x] 새 PRD v2.1 전문 분석 완료
- [x] 브랜딩 변경 범위 특정 완료
- [x] 데이터 모델 차이 분석 완료
- [x] 라우트/API 차이 분석 완료
- [x] 기술 스택 차이 분석 및 결정 완료
- [x] 변경하지 않을 항목 명시 완료
- [x] 작업 순서(의존성 기반) 수립 완료
- [x] 리스크 식별 완료

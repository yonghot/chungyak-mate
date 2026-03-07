# 테스트 리포트

> 작성일: 2026-03-06
> 프레임워크: Vitest 2.1.9 + @vitest/coverage-v8

---

## 요약

| 지표 | 값 |
|------|-----|
| 테스트 파일 | 22개 |
| 테스트 케이스 | 515개 |
| 통과 | 515 (100%) |
| 실패 | 0 |
| 실행 시간 | ~10초 |
| **Statements 커버리지** | **28.65%** |
| Branch 커버리지 | 75.24% |
| Functions 커버리지 | 58.20% |
| Lines 커버리지 | 28.65% |
| 기준선 (작업 전) | 14.21% |
| **커버리지 증가** | **+14.44%p** |

---

## 기능 우선순위 분류

### P0 (핵심 기능) — 테스트 완료
- 자격 판정 엔진 (engine, scoring, rules)
- 프로필 관리 (서비스, 리포지토리)
- 단지 조회 (서비스)
- 추천 서비스
- 인증 서비스
- API 라우트 (evaluate, complexes, recommend)
- 공공 API 동기화 (sync-service, mapper, cron route)

### P1 (중요 기능) — 부분 테스트
- 프로필 유효성 검증 스키마
- 상수 데이터 (regions, supply-types, scoring-tables)
- 유틸리티 (format, logger, api-response)

### P2 (보조 기능) — 미테스트
- 프론트엔드 페이지 컴포넌트
- 커스텀 훅 (use-auth, use-complexes 등)
- 서버 액션 (bookmark, eligibility, profile actions)
- UI 컴포넌트 라이브러리 (shadcn/ui)

---

## 테스트 파일 상세

### 백엔드 서비스 단위 테스트

| 파일 | 테스트 수 | 대상 | 커버리지 |
|------|-----------|------|----------|
| `lib/services/__tests__/eligibility-service.test.ts` | 19 | 자격 판정 오케스트레이션 | 86.34% |
| `lib/services/__tests__/profile-service.test.ts` | 21 | 프로필 CRUD + 완성도 | 100% |
| `lib/services/__tests__/complex-service.test.ts` | 16 | 단지 조회/필터 | 100% |
| `lib/services/__tests__/recommend-service.test.ts` | 10 | 추천 알고리즘 | 100% |
| `lib/services/__tests__/auth-service.test.ts` | 8 | 인증 유틸리티 | 100% |
| `lib/services/__tests__/sync-service.test.ts` | 18 | 공공API 동기화 | 94.21% |

### 도메인 로직 테스트

| 파일 | 테스트 수 | 대상 | 커버리지 |
|------|-----------|------|----------|
| `lib/eligibility/__tests__/scoring.test.ts` | 41 | 84점 가점 산출 | 100% |
| `lib/eligibility/__tests__/engine.test.ts` | 11 | 판정 엔진 (evaluateAll/Selected) | 58.73% |
| `lib/eligibility/rules/__tests__/newlywed.test.ts` | 18 | 신혼부부 특별공급 규칙 | 100% |
| `lib/external/applyhome/__tests__/mapper.test.ts` | 91 | API 응답 → DB 매핑 | 99.33% |
| `lib/repositories/__tests__/profile-repository.test.ts` | 20 | 프로필 완성도 계산 | 31.18% |

### API 통합 테스트

| 파일 | 테스트 수 | 대상 | 커버리지 |
|------|-----------|------|----------|
| `app/api/eligibility/evaluate/__tests__/route.test.ts` | 16 | POST /api/eligibility/evaluate | 100% |
| `app/api/complexes/__tests__/route.test.ts` | 12 | GET /api/complexes | 100% |
| `app/api/recommend/__tests__/route.test.ts` | 11 | GET /api/recommend | 100% |
| `app/api/cron/sync-complexes/__tests__/route.test.ts` | 29 | POST /api/cron/sync-complexes | 96.61% |

### 프론트엔드 컴포넌트 테스트

| 파일 | 테스트 수 | 대상 | 커버리지 |
|------|-----------|------|----------|
| `components/features/recommendation/__tests__/recommend-card.test.tsx` | 10 | 추천 카드 컴포넌트 | 100% |

### 유효성 검증 / 상수 / 유틸리티 테스트

| 파일 | 테스트 수 | 대상 | 커버리지 |
|------|-----------|------|----------|
| `lib/validations/__tests__/profile.test.ts` | 37 | 프로필 폼 스키마 | 100% |
| `constants/__tests__/regions.test.ts` | 29 | 지역 상수 + 헬퍼 | 100% |
| `constants/__tests__/supply-types.test.ts` | 23 | 공급유형 상수 + 헬퍼 | 100% |
| `lib/utils/__tests__/format.test.ts` | 48 | 날짜/숫자/면적 포맷터 | 93.84% |
| `lib/utils/__tests__/logger.test.ts` | 15 | 로거 환경별 동작 | 96.42% |
| `lib/utils/__tests__/api-response-paginated.test.ts` | 12 | 페이지네이션 응답 | 100% |

---

## 레이어별 커버리지

| 레이어 | Statements | Branch | Functions |
|--------|-----------|--------|-----------|
| `lib/services/` | 82.61% | 87.90% | 95.23% |
| `lib/eligibility/` | 82.19% | 90.47% | 100% |
| `lib/eligibility/rules/` | 93.49% | 82.66% | 100% |
| `lib/utils/` | 96.95% | 85.45% | 100% |
| `lib/validations/` | 100% | 100% | 100% |
| `constants/` | 97.99% | 91.66% | 100% |
| `lib/external/applyhome/` | 45.01% | 84% | 90% |
| `lib/repositories/` | 4.76% | 54.54% | 11.11% |
| `components/` | 7.16% (ui) | — | — |
| `app/` (페이지) | 0% | — | — |

---

## 커버리지 개선 권장 사항 (다음 단계)

### 35% 목표 시 우선 대상
1. **`lib/repositories/`** (현재 4.76%) — Supabase 쿼리 함수 모킹 테스트
2. **`lib/external/applyhome/client.ts`** (현재 0%) — HTTP 클라이언트 모킹
3. **`lib/eligibility/engine.ts`** (현재 58.73%) — 미커버 브랜치 추가

### 50% 목표 시 추가 대상
4. **`hooks/`** (현재 0%) — React 훅 테스트 (@testing-library/react-hooks)
5. **`lib/actions/`** (현재 0%) — 서버 액션 테스트
6. **주요 페이지 컴포넌트** — complexes, recommend, profile 페이지

---

## 실행 방법

```bash
# 전체 테스트 실행
npx vitest run

# 커버리지 포함 실행
npx vitest run --coverage

# 특정 파일만 실행
npx vitest run lib/services/__tests__/eligibility-service.test.ts

# 워치 모드
npx vitest
```

# 청약메이트 공공데이터 API 연동 아키텍처

> **작성일**: 2026-03-05
> **대상**: 청약홈 분양정보 공공 API 실시간 연동
> **상태**: 설계 완료 / 구현 준비

---

## 1. 공공데이터 API 조사 결과

### 1.1 직접 검증된 API 목록

API 엔드포인트를 실제 HTTP 호출로 검증하였다. `code: -4` (인증키 필요) 응답이 오는 경우 서비스가 실제로 존재함을 의미하며, `code: -3` (등록되지 않은 서비스)과 구분된다.

#### [확인됨] API 1 — 한국부동산원 청약홈 APT 분양공고 상세

| 항목 | 내용 |
|------|------|
| **서비스명** | 한국부동산원_청약홈 분양정보 (ApplyhomeInfoDetailSvc) |
| **오퍼레이션** | getAPTLttotPblancDetail |
| **Base URL** | `https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/` |
| **전체 URL** | `https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail` |
| **공공데이터포털 등록번호** | 15006405 |
| **등록기관** | 한국부동산원 |
| **인증 방식** | Query Parameter `serviceKey` (발급된 인증키) |
| **데이터 형식** | JSON |
| **갱신 주기** | 일 1회 이상 (모집공고 등록 즉시 반영) |
| **검증 결과** | `{"code":-4,"msg":"등록되지 않은 인증키 입니다."}` → 서비스 존재 확인됨 |

#### [확인됨] API 2 — 한국부동산원 청약홈 잔여세대 분양공고 상세

| 항목 | 내용 |
|------|------|
| **서비스명** | 한국부동산원_청약홈 분양정보 (ApplyhomeInfoDetailSvc) |
| **오퍼레이션** | getRemndrLttotPblancDetail |
| **전체 URL** | `https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getRemndrLttotPblancDetail` |
| **설명** | 1순위/2순위 청약 후 잔여세대 분양공고 데이터 |
| **검증 결과** | `{"code":-4,"msg":"등록되지 않은 인증키 입니다."}` → 서비스 존재 확인됨 |

#### [참고] API 3 — 국토교통부 APT 매매 실거래가

| 항목 | 내용 |
|------|------|
| **오퍼레이션** | getRTMSDataSvcAptTradeDev |
| **Base URL** | `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/` |
| **용도** | 향후 분양가 대비 시세 비교 기능 (F-007 AI 분석) |
| **MVP 포함 여부** | 제외 (PROD-TODO) |

### 1.2 검증에서 제외된 방법론

| 방법 | 제외 사유 |
|------|-----------|
| 청약홈(applyhome.co.kr) 직접 크롤링 | 공식 차단됨. 내부 API URL 404 반환 |
| 청약홈 내부 FE API 역공학 | 약관 위반 소지, 구조 변경 시 즉시 중단 |
| 기타 민간 부동산 API | 유료, 데이터 정확성 미보장 |

---

## 2. API 요청/응답 명세

### 2.1 공통 요청 파라미터

```
GET https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/{operation}
```

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `serviceKey` | string | 필수 | 공공데이터포털 인증키 (URL-encoded) | `abc%2Bxyz...` |
| `page` | integer | 선택 | 페이지 번호 (기본값: 1) | `1` |
| `perPage` | integer | 선택 | 페이지당 결과 수 (기본값: 10, 최대: 100) | `50` |
| `returnType` | string | 선택 | 응답 형식 (기본값: JSON) | `JSON` |
| `cond[HOUSE_MANAGE_NO::EQ]` | string | 선택 | 주택관리번호 필터 | `2025000001` |
| `cond[SUBSCRPT_RCEPT_BGNDE::GTE]` | string | 선택 | 청약접수시작일 이후 필터 | `20260301` |
| `cond[SUBSCRPT_RCEPT_ENDDE::LTE]` | string | 선택 | 청약접수종료일 이전 필터 | `20260331` |

### 2.2 응답 필드 명세 — getAPTLttotPblancDetail

공공데이터포털 공식 API 명세서(서비스ID: 15006405) 기준.

```typescript
// 청약홈 API 원본 응답 타입 (snake_case 필드명 그대로)
interface ApplyhomeApiResponse {
  currentCount: number;    // 현재 페이지 결과 수
  data: ApplyhomeApiItem[];
  matchCount: number;      // 전체 매칭 건수
  page: number;
  perPage: number;
  totalCount: number;
}

interface ApplyhomeApiItem {
  // 공고 기본 정보
  HOUSE_MANAGE_NO: string;        // 주택관리번호 (식별키) - 예: "2025000001"
  PBLANC_NO: string;              // 공고번호 - 예: "2025-0001"
  HOUSE_NM: string;               // 주택명 (단지명) - 예: "래미안 원펜타스"
  HOUSE_SECD: string;             // 주택구분 코드 - "01": APT
  HOUSE_SECD_NM: string;          // 주택구분명 - "아파트"
  BSNP_APRVL_NO: string;          // 사업승인번호

  // 위치 정보
  HSSPLY_ADRES: string;           // 공급위치 (도로명주소) - 예: "서울특별시 서초구 반포동"
  SUBSCRPT_AREA_CODE: string;     // 청약지역코드 - 예: "11" (서울)
  SUBSCRPT_AREA_CODE_NM: string;  // 청약지역명 - 예: "서울특별시"

  // 공급 규모
  TOT_SUPLY_HSHLDCO: string;      // 총 공급세대수 - 예: "641"
  SPSPLY_HSHLDCO: string;         // 특별공급세대수
  GNRL_HSHLDCO: string;           // 일반공급세대수

  // 날짜 정보 (YYYYMMDD 형식)
  RCRIT_PBLANC_DE: string;        // 모집공고일 - 예: "20260215"
  SPSPLY_RCEPT_BGNDE: string;     // 특별공급 접수 시작일
  SPSPLY_RCEPT_ENDDE: string;     // 특별공급 접수 종료일
  GNRL_RNK1_CRSPAREA_RCEPT_BGNDE: string; // 1순위(해당지역) 접수 시작일
  GNRL_RNK1_CRSPAREA_RCEPT_ENDDE: string; // 1순위(해당지역) 접수 종료일
  GNRL_RNK1_ETC_AREA_RCEPT_BGNDE: string; // 1순위(기타지역) 접수 시작일
  GNRL_RNK1_ETC_AREA_RCEPT_ENDDE: string; // 1순위(기타지역) 접수 종료일
  GNRL_RNK2_CRSPAREA_RCEPT_BGNDE: string; // 2순위(해당지역) 접수 시작일
  GNRL_RNK2_CRSPAREA_RCEPT_ENDDE: string; // 2순위(해당지역) 접수 종료일
  PRZWNER_PRESNATN_DE: string;    // 당첨자발표일 - 예: "20260320"
  CNTRCT_CNCLS_BGNDE: string;     // 계약시작일
  CNTRCT_CNCLS_ENDDE: string;     // 계약종료일
  MVN_PREARNGE_YM: string;        // 입주예정연월 - 예: "202812"

  // 업체 정보
  BSNS_MBY_NM: string;            // 사업주체명 (시행사)
  CNSTRCT_ENTRPS_NM: string;      // 건설업체명 (시공사)
  MDHS_TELNO: string;             // 모델하우스 전화번호
  HMPG_ADRES: string;             // 홈페이지 주소

  // 공급가격 (공급유형별 - 배열 또는 별도 필드)
  LTTOT_TOP_AMOUNT: string;       // 최고분양가 (만원 단위) - 예: "125000"

  // 공고 URL
  PBLANC_URL: string;             // 청약홈 분양공고 URL
}
```

### 2.3 공급유형 세부 정보 필드

`getAPTLttotPblancDetail`의 `data` 배열 각 항목에 포함된 주택형별 정보:

```typescript
// 주택형(면적/공급유형) 세부 정보 - API 응답 중 주택형 관련 필드
interface ApplyhomeHousingType {
  HOUSE_MANAGE_NO: string;        // 주택관리번호 (부모 참조)
  SUPLY_HOUSTY_NM: string;        // 주택형명 - 예: "059.9900A", "084.9500B"
  EXCLUSE_AR: string;             // 전용면적 - 예: "59.99"
  SUPLY_AM: string;               // 공급금액 (만원) - 예: "89000"

  // 특별공급 세대수
  SPSPLY_AGE_60_ABOVE_HSHLDCO: string; // 노부모부양
  MULTI_CHLD_HSHLDCO: string;     // 다자녀가구
  NWLY_MRD_HSHLDCO: string;       // 신혼부부
  FRST_HSHLDCO: string;           // 생애최초
  INSTT_RECOMM_HSHLDCO: string;   // 기관추천
  TRANSR_INSTT_ENFSN_HSHLDCO: string; // 이전기관

  // 일반공급 세대수
  GNRL_HSHLDCO_CO: string;        // 일반공급 (1순위 포함 전체)

  // 청약 접수 통계 (잔여세대 API에서 제공)
  SUPLY_HSHLDCO: string;          // 공급세대수
}
```

### 2.4 지역코드 (SUBSCRPT_AREA_CODE) 매핑

| 코드 | 지역명 |
|------|--------|
| `11` | 서울특별시 |
| `26` | 부산광역시 |
| `27` | 대구광역시 |
| `28` | 인천광역시 |
| `29` | 광주광역시 |
| `30` | 대전광역시 |
| `31` | 울산광역시 |
| `36` | 세종특별자치시 |
| `41` | 경기도 |
| `43` | 충청북도 |
| `44` | 충청남도 |
| `45` | 전라북도 |
| `46` | 전라남도 |
| `47` | 경상북도 |
| `48` | 경상남도 |
| `50` | 제주특별자치도 |

---

## 3. DB 스키마 ↔ API 응답 필드 매핑

### 3.1 complexes 테이블 매핑

| DB 컬럼 | API 필드 | 변환 방식 | 비고 |
|---------|---------|----------|------|
| `name` | `HOUSE_NM` | 직접 복사 | 단지명 |
| `region` | `SUBSCRPT_AREA_CODE_NM` | 직접 복사 | "서울특별시" 형식 |
| `district` | `HSSPLY_ADRES` | 정규식 파싱: 2번째 토큰 | "서초구" 추출 |
| `address` | `HSSPLY_ADRES` | 직접 복사 | 전체 도로명주소 |
| `developer` | `BSNS_MBY_NM` | 직접 복사 | 시행사 |
| `constructor` | `CNSTRCT_ENTRPS_NM` | 직접 복사 | 시공사 |
| `total_units` | `TOT_SUPLY_HSHLDCO` | `parseInt()` 변환 | |
| `announcement_date` | `RCRIT_PBLANC_DE` | `YYYYMMDD → YYYY-MM-DD` | |
| `subscription_start` | `GNRL_RNK1_CRSPAREA_RCEPT_BGNDE` | `YYYYMMDD → YYYY-MM-DD` | 1순위 해당지역 기준 |
| `subscription_end` | `GNRL_RNK1_CRSPAREA_RCEPT_ENDDE` | `YYYYMMDD → YYYY-MM-DD` | |
| `winner_date` | `PRZWNER_PRESNATN_DE` | `YYYYMMDD → YYYY-MM-DD` | |
| `status` | 날짜 계산 | `deriveStatus()` 함수 | 아래 2.2절 참조 |
| `source_url` | `PBLANC_URL` | 직접 복사 | 없으면 기본 청약홈 URL |
| `raw_data` | (API 원본 객체) | `JSON.stringify()` | 전체 원본 보존 |
| `external_id` | `HOUSE_MANAGE_NO` | 직접 복사 | upsert 키 (신규 컬럼 추가 필요) |

### 3.2 supply_types 테이블 매핑

공급유형 매핑은 API의 세대수 필드값이 `"0"` 또는 빈 문자열인 경우를 제외하고 레코드를 생성한다.

| DB `type` 값 | API 필드 | 조건 |
|-------------|---------|------|
| `newlywed` | `NWLY_MRD_HSHLDCO` | `> 0` |
| `first_life` | `FRST_HSHLDCO` | `> 0` |
| `multi_child` | `MULTI_CHLD_HSHLDCO` | `> 0` |
| `elderly_parent` | `SPSPLY_AGE_60_ABOVE_HSHLDCO` | `> 0` |
| `institutional` | `INSTT_RECOMM_HSHLDCO` | `> 0` |
| `relocation` | `TRANSR_INSTT_ENFSN_HSHLDCO` | `> 0` |
| `general` | `GNRL_HSHLDCO_CO` | `> 0` |

### 3.3 status 도출 로직

API는 `status` 필드를 직접 제공하지 않으므로 날짜 비교로 계산한다.

```typescript
function deriveComplexStatus(item: ApplyhomeApiItem): ComplexStatus {
  const today = new Date();
  const announcementDate = parseApiDate(item.RCRIT_PBLANC_DE);
  const subscriptionStart = parseApiDate(item.GNRL_RNK1_CRSPAREA_RCEPT_BGNDE)
    ?? parseApiDate(item.SPSPLY_RCEPT_BGNDE);
  const subscriptionEnd = parseApiDate(item.GNRL_RNK1_CRSPAREA_RCEPT_ENDDE)
    ?? parseApiDate(item.SPSPLY_RCEPT_ENDDE);
  const winnerDate = parseApiDate(item.PRZWNER_PRESNATN_DE);

  if (winnerDate && today > winnerDate) return 'completed';
  if (subscriptionEnd && today > subscriptionEnd) return 'closed';
  if (subscriptionStart && today >= subscriptionStart) return 'open';
  return 'upcoming';
}
```

---

## 4. Vercel Cron 기반 동기화 아키텍처

### 4.1 전체 아키텍처 흐름

```
[Vercel Cron] 매일 09:00 KST (00:00 UTC)
     │
     │ POST /api/cron/sync-complexes
     │ Authorization: Bearer {CRON_SECRET}
     ▼
[API Route] 인증 검증 (timingSafeEqual)
     │
     ▼
[SyncService.run()]
     │
     ├─ 1. 청약홈 API 호출 (ApplyhomeApiClient)
     │      - 당월 + 익월 공고 조회 (perPage: 100)
     │      - 페이지네이션으로 전체 수집
     │      - 재시도 로직: 최대 3회, 지수 백오프
     │
     ├─ 2. 데이터 변환 (ComplexMapper)
     │      - API 응답 → complexes 스키마 매핑
     │      - API 응답 → supply_types 스키마 매핑
     │      - HOUSE_MANAGE_NO를 external_id로 사용
     │
     ├─ 3. DB Upsert (SyncRepository)
     │      - complexes: ON CONFLICT (external_id) DO UPDATE
     │      - supply_types: 기존 삭제 후 재삽입 (complex_id 기준)
     │      - SERVICE_ROLE_KEY로 RLS 우회
     │
     ├─ 4. 알림 트리거 (NotificationService)
     │      - 신규 단지 등록 시: 적격 사용자 대상 알림 생성
     │      - D-7, D-1, D-Day 알림은 별도 cron에서 처리
     │
     └─ 5. 동기화 결과 로깅
            - 신규: X건, 업데이트: Y건, 실패: Z건
            - sync_logs 테이블 (신규 추가 필요)
```

### 4.2 Vercel Cron 설정

`vercel.json`의 기존 cron 설정을 09:00 KST로 변경한다. KST는 UTC+9이므로 `00:00 UTC = 09:00 KST`이다.

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-complexes",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/send-notifications",
      "schedule": "0 1 * * *"
    }
  ]
}
```

> 참고: `"0 0 * * *"` = 매일 00:00 UTC = 09:00 KST. 현재 `vercel.json`에 이미 동일하게 설정되어 있다.

### 4.3 에러 핸들링 전략

| 에러 유형 | 처리 방식 | 재시도 |
|---------|---------|------|
| API 호출 실패 (5xx) | 지수 백오프 재시도 (1초, 2초, 4초) | 최대 3회 |
| API 인증 실패 (401/403) | 즉시 실패, Vercel 알림 | 없음 |
| API Rate Limit (429) | `Retry-After` 헤더 준수, 대기 후 재시도 | 1회 |
| 데이터 파싱 실패 | 해당 레코드 건너뜀, 에러 로그 기록 | 없음 |
| DB Upsert 실패 | 트랜잭션 롤백, 에러 로그 기록 | 없음 |
| Cron 전체 실패 | sync_logs에 실패 기록, Vercel 로그로 확인 | 다음 실행 시 재시도 |

### 4.4 중복 방지 (Upsert) 전략

`HOUSE_MANAGE_NO` (주택관리번호)를 `external_id`로 사용하여 중복 삽입을 방지한다.

```sql
-- complexes 테이블에 external_id 컬럼 추가 (마이그레이션 필요)
ALTER TABLE complexes ADD COLUMN external_id TEXT UNIQUE;
CREATE INDEX idx_complexes_external_id ON complexes(external_id);

-- Upsert 패턴
INSERT INTO complexes (external_id, name, region, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (external_id)
DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  raw_data = EXCLUDED.raw_data,
  updated_at = now()
WHERE complexes.updated_at < EXCLUDED.updated_at
  OR complexes.status != EXCLUDED.status;
```

`WHERE` 조건으로 실제 변경이 있는 경우에만 업데이트하여 불필요한 `updated_at` 갱신을 방지한다.

### 4.5 데이터 정합성 전략

| 항목 | 전략 |
|------|------|
| **날짜 형식** | API의 `YYYYMMDD` 문자열을 `YYYY-MM-DD` ISO 형식으로 변환. 빈 문자열이나 `"00000000"` 은 `null`로 처리 |
| **숫자 변환** | `parseInt()` 실패 시 `null` 반환. `NaN` 검사 필수 |
| **지역명 파싱** | `HSSPLY_ADRES`에서 `district` 추출: 공백 분리 후 2번째 토큰. 실패 시 `"기타"` |
| **공급가 단위** | API 응답 `SUPLY_AM`은 **만원** 단위이므로 DB 저장 시 × 10,000 변환 필수 |
| **status 동기화** | 매 cron 실행 시 전체 단지의 status를 현재 날짜 기준으로 재계산 |
| **raw_data 보존** | API 원본 응답을 `raw_data JSONB`에 항상 저장하여 재파싱 가능성 확보 |

---

## 5. DB 스키마 변경사항 (신규 마이그레이션)

### 5.1 complexes 테이블 변경

```sql
-- 공공 API 식별자 컬럼 추가 (upsert 키)
ALTER TABLE complexes
  ADD COLUMN external_id TEXT,
  ADD COLUMN move_in_date TEXT,       -- 입주예정연월 (YYYYMM)
  ADD COLUMN special_supply_start DATE,  -- 특별공급 접수 시작일
  ADD COLUMN special_supply_end DATE,    -- 특별공급 접수 종료일
  ADD COLUMN contract_start DATE,        -- 계약 시작일
  ADD COLUMN contract_end DATE;          -- 계약 종료일

ALTER TABLE complexes
  ADD CONSTRAINT complexes_external_id_unique UNIQUE (external_id);

CREATE INDEX idx_complexes_external_id ON complexes(external_id)
  WHERE external_id IS NOT NULL;

COMMENT ON COLUMN complexes.external_id IS '청약홈 API 주택관리번호 (HOUSE_MANAGE_NO)';
```

### 5.2 sync_logs 테이블 추가

```sql
-- 동기화 실행 이력 기록
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'partial', 'failed')),
  total_fetched INTEGER DEFAULT 0,
  inserted INTEGER DEFAULT 0,
  updated INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  error_detail JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sync_logs IS '청약홈 API 동기화 실행 이력';
```

---

## 6. 구현 파일 목록

설계 기반으로 생성되는 파일 목록이다.

```
lib/
├── external/
│   └── applyhome/
│       ├── client.ts           # ApplyhomeApiClient (HTTP 호출)
│       ├── types.ts            # API 응답 타입 정의
│       └── mapper.ts           # API 응답 → DB 스키마 변환
├── services/
│   └── sync-service.ts         # 동기화 오케스트레이션
├── repositories/
│   └── sync-repository.ts      # Upsert, sync_logs CRUD
app/
└── api/
    └── cron/
        └── sync-complexes/
            └── route.ts        # (기존 파일 업데이트)
supabase/
└── migrations/
    └── 20260305000000_add_sync_fields.sql  # 스키마 변경
.env.example                    # APPLYHOME_API_KEY 추가
```

---

## 7. 환경변수 추가 목록

| 변수명 | 설명 | 비고 |
|--------|------|------|
| `APPLYHOME_API_KEY` | 공공데이터포털 발급 인증키 | 서버 전용, 클라이언트 노출 금지 |
| `CRON_SECRET` | Cron 엔드포인트 인증 시크릿 | 기존 변수 (유지) |

인증키 발급 절차:
1. `https://www.data.go.kr` 회원가입
2. "한국부동산원_청약홈 분양정보" 검색
3. 활용신청 → 서비스 인증키 발급 (즉시 발급, 무료)

---

## 8. 단계별 구현 로드맵

| 단계 | 작업 | 우선순위 |
|------|------|---------|
| Phase 1 | DB 마이그레이션 (`external_id`, `sync_logs` 추가) | 필수 선행 |
| Phase 2 | `lib/external/applyhome/` 클라이언트 및 타입 구현 | |
| Phase 3 | `lib/external/applyhome/mapper.ts` 필드 매핑 구현 | |
| Phase 4 | `lib/services/sync-service.ts` 오케스트레이션 구현 | |
| Phase 5 | `lib/repositories/sync-repository.ts` Upsert 구현 | |
| Phase 6 | `app/api/cron/sync-complexes/route.ts` 실제 연동 | |
| Phase 7 | 통합 테스트 (실제 API 키로 소량 데이터 검증) | |
| Phase 8 | Vercel 환경변수 설정 및 Cron 활성화 | |

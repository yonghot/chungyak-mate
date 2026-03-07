-- ============================================================================
-- ChungYakMate (청약메이트) - 공공데이터 API 동기화 필드 추가 마이그레이션
-- Created: 2026-03-05
-- Description: 청약홈 API 연동을 위한 complexes 테이블 확장 및 sync_logs 테이블 추가
-- ============================================================================

-- ----------------------------------------------------------------------------
-- complexes 테이블: 공공 API 연동 필드 추가
-- ----------------------------------------------------------------------------

-- 공공데이터포털 청약홈 API의 HOUSE_MANAGE_NO를 external_id로 저장
-- upsert 기준 식별자이므로 UNIQUE 제약 조건 필수
ALTER TABLE complexes
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS move_in_date TEXT,
  ADD COLUMN IF NOT EXISTS special_supply_start DATE,
  ADD COLUMN IF NOT EXISTS special_supply_end DATE,
  ADD COLUMN IF NOT EXISTS contract_start DATE,
  ADD COLUMN IF NOT EXISTS contract_end DATE;

-- UNIQUE 제약 추가 (이미 존재하는 경우 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'complexes_external_id_unique'
  ) THEN
    ALTER TABLE complexes
      ADD CONSTRAINT complexes_external_id_unique UNIQUE (external_id);
  END IF;
END $$;

-- external_id 인덱스 (Upsert 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_complexes_external_id
  ON complexes(external_id)
  WHERE external_id IS NOT NULL;

-- 날짜 범위 인덱스 (status 갱신 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_complexes_subscription_end
  ON complexes(subscription_end)
  WHERE subscription_end IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_complexes_winner_date
  ON complexes(winner_date)
  WHERE winner_date IS NOT NULL;

COMMENT ON COLUMN complexes.external_id IS '청약홈 API 주택관리번호 (HOUSE_MANAGE_NO) — upsert 기준 키';
COMMENT ON COLUMN complexes.move_in_date IS '입주예정연월 (YYYYMM 형식)';
COMMENT ON COLUMN complexes.special_supply_start IS '특별공급 접수 시작일';
COMMENT ON COLUMN complexes.special_supply_end IS '특별공급 접수 종료일';
COMMENT ON COLUMN complexes.contract_start IS '계약 시작일';
COMMENT ON COLUMN complexes.contract_end IS '계약 종료일';

-- ----------------------------------------------------------------------------
-- sync_logs 테이블: API 동기화 실행 이력
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'partial', 'failed')),
  total_fetched INTEGER NOT NULL DEFAULT 0,
  inserted INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  error_detail JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sync_logs IS '청약홈 API 동기화 실행 이력';
COMMENT ON COLUMN sync_logs.status IS 'running: 진행중, success: 전체 성공, partial: 일부 실패, failed: 전체 실패';
COMMENT ON COLUMN sync_logs.total_fetched IS 'API에서 조회한 총 공고 수 (중복 제거 후)';
COMMENT ON COLUMN sync_logs.error_detail IS '실패한 항목 목록 [{external_id, message}]';

-- 동기화 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);

-- ----------------------------------------------------------------------------
-- sync_logs RLS 정책: 관리자만 조회 가능
-- [PROD-TODO] 관리자 대시보드(F-009) 구현 시 admin role 기반으로 정책 세분화
-- ----------------------------------------------------------------------------
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- 현재는 서버사이드(SERVICE_ROLE_KEY)에서만 접근하므로 사용자 접근 차단
-- [PROD-TODO] 관리자 역할 추가 시 아래 정책 교체 필요
CREATE POLICY "sync_logs_service_role_only" ON sync_logs
  USING (false);

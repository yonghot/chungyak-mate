/**
 * 동기화 관련 DB 작업 리포지토리
 *
 * SERVICE_ROLE_KEY 기반 Supabase 클라이언트를 사용한다.
 * RLS를 우회하여 서버사이드에서 complexes/supply_types를 직접 쓴다.
 * 외부에서 이 리포지토리를 사용할 때는 반드시 서버 컨텍스트임을 확인해야 한다.
 */
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import type { ComplexInsertData, SupplyTypeInsertData } from '@/lib/external/applyhome/mapper';

/** 동기화 실행 결과 */
export interface SyncResult {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ external_id: string; message: string }>;
}

/** sync_logs 레코드 */
export interface SyncLogRecord {
  id?: string;
  started_at: string;
  finished_at?: string | null;
  status: 'running' | 'success' | 'partial' | 'failed';
  total_fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  error_detail: Array<{ external_id: string; message: string }>;
}

/**
 * SERVICE_ROLE_KEY 기반 Supabase Admin 클라이언트 생성
 * RLS를 우회하므로 Cron/서버 작업에서만 사용
 */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
  }
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * 단지 Upsert (external_id 기준 중복 방지)
 *
 * HOUSE_MANAGE_NO (external_id)가 이미 존재하면 변경된 필드만 업데이트한다.
 * status, raw_data, updated_at은 항상 최신 값으로 갱신한다.
 *
 * @returns upsert된 단지의 UUID
 */
export async function upsertComplex(
  data: ComplexInsertData,
): Promise<{ id: string; isNew: boolean } | null> {
  const supabase = createAdminClient();

  // price_krw는 bigint라 JSON 직렬화 시 문자열 변환 필요
  const insertPayload = {
    ...data,
    raw_data: data.raw_data,
  };

  const { data: result, error } = await supabase
    .from('complexes')
    .upsert(insertPayload, {
      onConflict: 'external_id',
      ignoreDuplicates: false,
    })
    .select('id, created_at, updated_at')
    .single();

  if (error) {
    logger.error('sync-repository.upsertComplex 실패', {
      external_id: data.external_id,
      name: data.name,
      error: error.message,
    });
    return null;
  }

  // created_at === updated_at이면 신규 삽입, 아니면 업데이트
  const isNew = result.created_at === result.updated_at;

  return { id: result.id, isNew };
}

/**
 * 공급유형 업데이트
 *
 * 기존 supply_types를 모두 삭제하고 새로 삽입하는 방식.
 * API 응답 기준으로 항상 최신 데이터를 유지한다.
 */
export async function replaceSupplyTypes(
  complexId: string,
  supplyTypes: SupplyTypeInsertData[],
): Promise<boolean> {
  if (supplyTypes.length === 0) {
    return true;
  }

  const supabase = createAdminClient();

  // 기존 공급유형 삭제
  const { error: deleteError } = await supabase
    .from('supply_types')
    .delete()
    .eq('complex_id', complexId);

  if (deleteError) {
    logger.error('sync-repository.replaceSupplyTypes 삭제 실패', {
      complexId,
      error: deleteError.message,
    });
    return false;
  }

  // 새 공급유형 삽입
  const insertData = supplyTypes.map((st) => ({
    ...st,
    complex_id: complexId,
    // price_krw bigint → string으로 변환 (Supabase JS 클라이언트 호환)
    price_krw: st.price_krw !== null ? st.price_krw.toString() : null,
  }));

  const { error: insertError } = await supabase
    .from('supply_types')
    .insert(insertData);

  if (insertError) {
    logger.error('sync-repository.replaceSupplyTypes 삽입 실패', {
      complexId,
      error: insertError.message,
    });
    return false;
  }

  return true;
}

/**
 * 만료된 단지의 status 일괄 업데이트
 * 날짜 기반으로 status를 재계산하여 최신화한다.
 * [PROD-TODO] 데이터가 많아지면 DB 함수로 이전
 */
export async function refreshComplexStatuses(): Promise<number> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  let updatedCount = 0;

  // open → closed: 접수 종료일이 오늘 이전
  const { data: closedRows } = await supabase
    .from('complexes')
    .update({ status: 'closed' })
    .eq('status', 'open')
    .lt('subscription_end', today)
    .select('id');

  updatedCount += closedRows?.length ?? 0;

  // closed → completed: 당첨자발표일이 오늘 이전
  const { data: completedRows } = await supabase
    .from('complexes')
    .update({ status: 'completed' })
    .eq('status', 'closed')
    .lt('winner_date', today)
    .not('winner_date', 'is', null)
    .select('id');

  updatedCount += completedRows?.length ?? 0;

  // upcoming → open: 접수 시작일이 오늘 이하
  const { data: openRows } = await supabase
    .from('complexes')
    .update({ status: 'open' })
    .eq('status', 'upcoming')
    .lte('subscription_start', today)
    .not('subscription_start', 'is', null)
    .select('id');

  updatedCount += openRows?.length ?? 0;

  logger.error('sync-repository.refreshComplexStatuses 완료', { updatedCount });
  return updatedCount;
}

/** 동기화 로그 생성 */
export async function createSyncLog(
  data: Omit<SyncLogRecord, 'id'>,
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: result, error } = await supabase
    .from('sync_logs')
    .insert(data)
    .select('id')
    .single();

  if (error) {
    logger.error('sync-repository.createSyncLog 실패', { error: error.message });
    return null;
  }

  return result.id;
}

/** 동기화 로그 업데이트 */
export async function updateSyncLog(
  id: string,
  data: Partial<SyncLogRecord>,
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('sync_logs')
    .update(data)
    .eq('id', id);

  if (error) {
    logger.error('sync-repository.updateSyncLog 실패', { id, error: error.message });
  }
}

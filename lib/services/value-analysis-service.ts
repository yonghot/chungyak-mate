/**
 * +가치: 물건 가치 분석 서비스
 *
 * 단지의 입지, 시세, 인프라 등을 종합 분석하여 A~F 등급으로 평가한다.
 * Phase 2 구현 예정 — 현재는 스텁.
 */
import type { ValueAnalysis } from '@/types/plus-features';
import type { SupabaseDb } from '@/types/supabase';
import { logger } from '@/lib/utils/logger';

/** 단지 가치 분석 실행 (스텁) */
export async function analyzeValue(
  _supabase: SupabaseDb,
  _complexId: string,
): Promise<ValueAnalysis | null> {
  logger.info('value-analysis-service.analyzeValue: not implemented yet');
  return null;
}

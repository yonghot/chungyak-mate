/**
 * +예측: 경쟁률 예측 서비스
 *
 * 과거 경쟁률 데이터, 단지 속성, 시장 지표를 기반으로
 * 경쟁률을 예측한다. Phase 2 구현 예정 — 현재는 스텁.
 */
import type { PredictionResult } from '@/types/plus-features';
import type { SupabaseDb } from '@/types/supabase';
import { logger } from '@/lib/utils/logger';

/** 경쟁률 예측 실행 (스텁) */
export async function predictCompetitionRate(
  _supabase: SupabaseDb,
  _complexId: string,
  _supplyType: string,
): Promise<PredictionResult | null> {
  logger.info('prediction-service.predictCompetitionRate: not implemented yet');
  return null;
}

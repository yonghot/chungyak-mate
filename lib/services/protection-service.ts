/**
 * +보호: 청약 기회 보호 서비스
 *
 * 사용자의 청약 이력, 가점, 경쟁률 예측을 종합하여
 * GO / WAIT / SKIP 시그널을 제공한다. Phase 2 구현 예정 — 현재는 스텁.
 */
import type { ProtectionResult } from '@/types/plus-features';
import type { SupabaseDb } from '@/types/supabase';
import { logger } from '@/lib/utils/logger';

/** 보호 시그널 산출 (스텁) */
export async function evaluateSignal(
  _supabase: SupabaseDb,
  _complexId: string,
  _profileId: string,
): Promise<ProtectionResult | null> {
  logger.info('protection-service.evaluateSignal: not implemented yet');
  return null;
}

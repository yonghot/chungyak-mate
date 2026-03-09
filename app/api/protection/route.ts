/**
 * GET /api/protection?complexId=xxx
 * 청약 기회 보호 시그널 조회
 *
 * Phase 2 구현 예정 — 현재는 501 반환.
 */
import { errorResponse } from '@/lib/utils/api-response';

export async function GET() {
  return errorResponse('INTERNAL_ERROR', '청약 기회 보호 기능은 준비 중입니다.', 501);
}

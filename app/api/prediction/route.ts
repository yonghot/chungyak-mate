/**
 * GET /api/prediction?complexId=xxx&supplyType=general
 * 경쟁률 예측 결과 조회
 *
 * Phase 2 구현 예정 — 현재는 501 반환.
 */
import { errorResponse } from '@/lib/utils/api-response';

export async function GET() {
  return errorResponse('INTERNAL_ERROR', '경쟁률 예측 기능은 준비 중입니다.', 501);
}

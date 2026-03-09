/**
 * GET /api/value-analysis?complexId=xxx
 * 단지 가치 분석 결과 조회
 *
 * Phase 2 구현 예정 — 현재는 501 반환.
 */
import { errorResponse } from '@/lib/utils/api-response';

export async function GET() {
  return errorResponse('INTERNAL_ERROR', '가치 분석 기능은 준비 중입니다.', 501);
}

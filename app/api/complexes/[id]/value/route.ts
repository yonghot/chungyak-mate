/**
 * GET /api/complexes/:id/value
 * +가치 분석 결과 조회 엔드포인트 (architecture.md 17.6절)
 *
 * 인증 필수 (JWT). Plus 플랜 이상에서만 접근 가능.
 * 경로 파라미터: id (단지 UUID)
 */
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/utils/api-response';
import { requireAuth } from '@/lib/services/auth-service';
import { analyzeValue } from '@/lib/services/value-analysis-service';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    // 1. JWT 검증 (인증 필수)
    const userId = await requireAuth(supabase);

    const { id: complexId } = await params;

    // 2. 플랜 확인 — profiles 테이블에서 plan_type 조회
    //    MVP: plan_type 컬럼이 DB에 없으면 컬럼 오류가 발생하지 않도록 select 지정
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return errorResponse(ErrorCode.PROFILE_INCOMPLETE);
    }

    // [PROD-TODO] Phase 2: plan_type 컬럼 추가 후 아래 검증 활성화
    // if (profile.plan_type === 'free') {
    //   return errorResponse(ErrorCode.PLAN_UPGRADE_REQUIRED);
    // }

    // 3. 단지 존재 확인
    const { data: complex, error: complexError } = await supabase
      .from('complexes')
      .select('id')
      .eq('id', complexId)
      .single();

    if (complexError || !complex) {
      return errorResponse(ErrorCode.COMPLEX_NOT_FOUND);
    }

    // 4. 가치 분석 실행
    const result = await analyzeValue(supabase, complexId);

    if (!result) {
      return errorResponse(ErrorCode.VALUE_ANALYSIS_UNAVAILABLE);
    }

    // 5. 성공 응답
    return successResponse(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
      return errorResponse(ErrorCode.AUTH_REQUIRED);
    }

    logger.error('value analysis route failed', { error });
    return errorResponse(ErrorCode.INTERNAL_ERROR);
  }
}

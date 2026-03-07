/**
 * POST /api/cron/sync-complexes
 * 청약홈 분양공고 데이터 동기화 Cron 엔드포인트
 *
 * 실행 일정: 매일 09:00 KST (00:00 UTC) — vercel.json crons 설정
 * 인증: Authorization: Bearer {CRON_SECRET}
 * 데이터 소스: 공공데이터포털 한국부동산원_청약홈 분양정보 API (15006405)
 *
 * 처리 흐름:
 * 1. 청약홈 API에서 당월/익월 분양공고 수집
 * 2. external_id(HOUSE_MANAGE_NO) 기준 Upsert
 * 3. supply_types 교체
 * 4. 날짜 기반 status 일괄 갱신
 * 5. sync_logs에 실행 결과 기록
 */
import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';
import {
  successResponse,
  errorResponse,
  ErrorCode,
} from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { runSync } from '@/lib/services/sync-service';

/** 타이밍 공격을 방지하는 문자열 비교 (CLAUDE.md 9.2절) */
function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      const padded = Buffer.alloc(bufA.length);
      bufB.copy(padded, 0, 0, Math.min(bufB.length, bufA.length));
      timingSafeEqual(bufA, padded);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // CRON_SECRET 인증 검증
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error('CRON_SECRET 환경변수가 설정되지 않았습니다.');
      return errorResponse(ErrorCode.INTERNAL_ERROR);
    }

    if (!authHeader || !safeCompare(authHeader, `Bearer ${cronSecret}`)) {
      logger.error('cron/sync-complexes: 인증 실패', {
        hasHeader: Boolean(authHeader),
      });
      return errorResponse(ErrorCode.AUTH_REQUIRED, '유효하지 않은 크론 인증입니다.');
    }

    // APPLYHOME_API_KEY 환경변수 사전 확인
    if (!process.env.APPLYHOME_API_KEY) {
      logger.error('APPLYHOME_API_KEY 환경변수가 설정되지 않았습니다.');
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        'APPLYHOME_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인하세요.',
      );
    }

    logger.error('cron/sync-complexes: 동기화 시작');

    // 동기화 실행 (Vercel Cron은 최대 5분 타임아웃)
    const result = await runSync({
      includeRemndr: true,
      verbose: false,
    });

    logger.error('cron/sync-complexes: 동기화 완료', result);

    return successResponse({
      success: result.success,
      totalFetched: result.totalFetched,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      failed: result.failed,
      statusRefreshed: result.statusRefreshed,
      durationMs: result.durationMs,
      // 에러가 있으면 첫 10건만 응답에 포함 (로그에는 전체 기록됨)
      errors: result.errors.slice(0, 10),
    });
  } catch (error) {
    logger.error('cron/sync-complexes: 예기치 않은 오류', { error });
    return errorResponse(ErrorCode.INTERNAL_ERROR);
  }
}

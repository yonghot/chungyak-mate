/**
 * POST /api/cron/sync-complexes 라우트 통합 테스트
 *
 * 검증 범위:
 * - CRON_SECRET 환경변수 유무에 따른 500 응답
 * - Authorization 헤더 유무·값에 따른 401 응답
 * - APPLYHOME_API_KEY 환경변수 유무에 따른 500 응답
 * - runSync 성공/실패/예외 시나리오별 응답
 * - errors 배열 최대 10건 슬라이스 동작
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// sync-service 목 — runSync만 사용
vi.mock('@/lib/services/sync-service', () => ({
  runSync: vi.fn(),
}));

// logger 목 — 로그 출력 억제
vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { POST } from '@/app/api/cron/sync-complexes/route';
import { runSync } from '@/lib/services/sync-service';

// ─── 팩토리 함수 ────────────────────────────────────────────

/** 기본 성공 결과 객체 생성 */
function createSyncResult(overrides?: Partial<Awaited<ReturnType<typeof runSync>>>) {
  return {
    success: true,
    totalFetched: 10,
    inserted: 3,
    updated: 7,
    skipped: 0,
    failed: 0,
    statusRefreshed: 10,
    durationMs: 1234,
    errors: [],
    ...overrides,
  };
}

/** NextRequest 생성 — secret이 없으면 Authorization 헤더를 포함하지 않는다 */
function createCronRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret !== undefined) {
    headers['authorization'] = `Bearer ${secret}`;
  }
  return new NextRequest('http://localhost/api/cron/sync-complexes', {
    method: 'POST',
    headers,
  });
}

// ─── 테스트 ─────────────────────────────────────────────────

describe('POST /api/cron/sync-complexes', () => {
  /** 매 테스트 전: 환경변수 설정 및 목 초기화 */
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret';
    process.env.APPLYHOME_API_KEY = 'test-api-key';
    vi.mocked(runSync).mockReset();
  });

  /** 매 테스트 후: 환경변수 복원 */
  afterEach(() => {
    delete process.env.CRON_SECRET;
    delete process.env.APPLYHOME_API_KEY;
  });

  // ── 시나리오 1: 인증 성공 + 동기화 성공 ──────────────────

  describe('인증 성공 + runSync 성공', () => {
    it('200 상태 코드를 반환한다', async () => {
      vi.mocked(runSync).mockResolvedValue(createSyncResult());

      const response = await POST(createCronRequest('test-cron-secret'));

      expect(response.status).toBe(200);
    });

    it('응답 바디가 { data: { success: true, ... }, error: null } 구조이다', async () => {
      vi.mocked(runSync).mockResolvedValue(createSyncResult());

      const response = await POST(createCronRequest('test-cron-secret'));
      const body = await response.json();

      expect(body.error).toBeNull();
      expect(body.data.success).toBe(true);
    });

    it('runSync에 includeRemndr: true, verbose: false를 전달한다', async () => {
      vi.mocked(runSync).mockResolvedValue(createSyncResult());

      await POST(createCronRequest('test-cron-secret'));

      expect(vi.mocked(runSync)).toHaveBeenCalledWith({
        includeRemndr: true,
        verbose: false,
      });
    });

    it('응답 바디에 totalFetched, inserted, updated, skipped, failed, statusRefreshed, durationMs가 포함된다', async () => {
      vi.mocked(runSync).mockResolvedValue(
        createSyncResult({
          totalFetched: 20,
          inserted: 5,
          updated: 15,
          skipped: 2,
          failed: 0,
          statusRefreshed: 18,
          durationMs: 999,
        }),
      );

      const response = await POST(createCronRequest('test-cron-secret'));
      const body = await response.json();

      expect(body.data.totalFetched).toBe(20);
      expect(body.data.inserted).toBe(5);
      expect(body.data.updated).toBe(15);
      expect(body.data.skipped).toBe(2);
      expect(body.data.failed).toBe(0);
      expect(body.data.statusRefreshed).toBe(18);
      expect(body.data.durationMs).toBe(999);
    });
  });

  // ── 시나리오 2: CRON_SECRET 미설정 ───────────────────────

  describe('CRON_SECRET 환경변수 미설정', () => {
    it('500 상태 코드를 반환한다', async () => {
      delete process.env.CRON_SECRET;

      const response = await POST(createCronRequest('test-cron-secret'));

      expect(response.status).toBe(500);
    });

    it('응답 바디의 error.code가 INTERNAL_ERROR이다', async () => {
      delete process.env.CRON_SECRET;

      const response = await POST(createCronRequest('test-cron-secret'));
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('runSync를 호출하지 않는다', async () => {
      delete process.env.CRON_SECRET;

      await POST(createCronRequest('test-cron-secret'));

      expect(vi.mocked(runSync)).not.toHaveBeenCalled();
    });
  });

  // ── 시나리오 3: Authorization 헤더 없음 ──────────────────

  describe('Authorization 헤더 없음', () => {
    it('401 상태 코드를 반환한다', async () => {
      // secret 인자를 넘기지 않아 헤더 없는 요청 생성
      const response = await POST(createCronRequest());

      expect(response.status).toBe(401);
    });

    it('응답 바디의 error.code가 AUTH_REQUIRED이다', async () => {
      const response = await POST(createCronRequest());
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('AUTH_REQUIRED');
    });

    it('응답 바디의 error.message가 "유효하지 않은 크론 인증입니다."이다', async () => {
      const response = await POST(createCronRequest());
      const body = await response.json();

      expect(body.error.message).toBe('유효하지 않은 크론 인증입니다.');
    });

    it('runSync를 호출하지 않는다', async () => {
      await POST(createCronRequest());

      expect(vi.mocked(runSync)).not.toHaveBeenCalled();
    });
  });

  // ── 시나리오 4: 잘못된 CRON_SECRET ───────────────────────

  describe('잘못된 CRON_SECRET으로 요청', () => {
    it('401 상태 코드를 반환한다', async () => {
      const response = await POST(createCronRequest('wrong-secret'));

      expect(response.status).toBe(401);
    });

    it('응답 바디의 error.code가 AUTH_REQUIRED이다', async () => {
      const response = await POST(createCronRequest('wrong-secret'));
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('AUTH_REQUIRED');
    });

    it('응답 바디의 error.message가 "유효하지 않은 크론 인증입니다."이다', async () => {
      const response = await POST(createCronRequest('wrong-secret'));
      const body = await response.json();

      expect(body.error.message).toBe('유효하지 않은 크론 인증입니다.');
    });

    it('runSync를 호출하지 않는다', async () => {
      await POST(createCronRequest('wrong-secret'));

      expect(vi.mocked(runSync)).not.toHaveBeenCalled();
    });
  });

  // ── 시나리오 5: APPLYHOME_API_KEY 미설정 ─────────────────

  describe('APPLYHOME_API_KEY 환경변수 미설정', () => {
    it('500 상태 코드를 반환한다', async () => {
      delete process.env.APPLYHOME_API_KEY;

      const response = await POST(createCronRequest('test-cron-secret'));

      expect(response.status).toBe(500);
    });

    it('응답 바디의 error.code가 INTERNAL_ERROR이다', async () => {
      delete process.env.APPLYHOME_API_KEY;

      const response = await POST(createCronRequest('test-cron-secret'));
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('응답 바디의 error.message에 "APPLYHOME_API_KEY가 설정되지 않았습니다"가 포함된다', async () => {
      delete process.env.APPLYHOME_API_KEY;

      const response = await POST(createCronRequest('test-cron-secret'));
      const body = await response.json();

      expect(body.error.message).toContain('APPLYHOME_API_KEY가 설정되지 않았습니다');
    });

    it('runSync를 호출하지 않는다', async () => {
      delete process.env.APPLYHOME_API_KEY;

      await POST(createCronRequest('test-cron-secret'));

      expect(vi.mocked(runSync)).not.toHaveBeenCalled();
    });
  });

  // ── 시나리오 6: runSync 실패 결과 (success: false) ────────

  describe('runSync가 success: false를 반환하는 경우', () => {
    it('200 상태 코드를 반환한다', async () => {
      vi.mocked(runSync).mockResolvedValue(
        createSyncResult({
          success: false,
          failed: 10,
          errors: [{ external_id: 'ITEM_001', message: '파싱 오류' }],
        }),
      );

      const response = await POST(createCronRequest('test-cron-secret'));

      expect(response.status).toBe(200);
    });

    it('응답 바디의 data.success가 false이고 error는 null이다', async () => {
      vi.mocked(runSync).mockResolvedValue(
        createSyncResult({
          success: false,
          failed: 10,
          errors: [{ external_id: 'ITEM_001', message: '파싱 오류' }],
        }),
      );

      const response = await POST(createCronRequest('test-cron-secret'));
      const body = await response.json();

      expect(body.error).toBeNull();
      expect(body.data.success).toBe(false);
    });

    it('응답 바디에 failed 수가 포함된다', async () => {
      vi.mocked(runSync).mockResolvedValue(
        createSyncResult({ success: false, failed: 5 }),
      );

      const response = await POST(createCronRequest('test-cron-secret'));
      const body = await response.json();

      expect(body.data.failed).toBe(5);
    });
  });

  // ── 시나리오 7: runSync가 예외를 throw하는 경우 ──────────

  describe('runSync가 예기치 않은 예외를 throw하는 경우', () => {
    it('500 상태 코드를 반환한다', async () => {
      vi.mocked(runSync).mockRejectedValue(new Error('DB 연결 실패'));

      const response = await POST(createCronRequest('test-cron-secret'));

      expect(response.status).toBe(500);
    });

    it('응답 바디의 error.code가 INTERNAL_ERROR이다', async () => {
      vi.mocked(runSync).mockRejectedValue(new Error('DB 연결 실패'));

      const response = await POST(createCronRequest('test-cron-secret'));
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('Error 인스턴스가 아닌 값을 throw해도 500을 반환한다', async () => {
      vi.mocked(runSync).mockRejectedValue('문자열 예외');

      const response = await POST(createCronRequest('test-cron-secret'));

      expect(response.status).toBe(500);
    });
  });

  // ── 시나리오 8: errors 배열 최대 10건 슬라이스 ────────────

  describe('errors 배열 슬라이스 동작', () => {
    it('errors가 10건 이하이면 그대로 반환한다', async () => {
      const errors = Array.from({ length: 5 }, (_, i) => ({
        external_id: `ITEM_${i + 1}`,
        message: `오류 ${i + 1}`,
      }));
      vi.mocked(runSync).mockResolvedValue(createSyncResult({ errors }));

      const response = await POST(createCronRequest('test-cron-secret'));
      const body = await response.json();

      expect(body.data.errors).toHaveLength(5);
    });

    it('errors가 10건을 초과하면 첫 10건만 응답에 포함한다', async () => {
      const errors = Array.from({ length: 15 }, (_, i) => ({
        external_id: `ITEM_${i + 1}`,
        message: `오류 ${i + 1}`,
      }));
      vi.mocked(runSync).mockResolvedValue(createSyncResult({ errors }));

      const response = await POST(createCronRequest('test-cron-secret'));
      const body = await response.json();

      expect(body.data.errors).toHaveLength(10);
    });

    it('errors 슬라이스는 앞에서부터 순서대로 포함한다', async () => {
      const errors = Array.from({ length: 12 }, (_, i) => ({
        external_id: `ITEM_${i + 1}`,
        message: `오류 ${i + 1}`,
      }));
      vi.mocked(runSync).mockResolvedValue(createSyncResult({ errors }));

      const response = await POST(createCronRequest('test-cron-secret'));
      const body = await response.json();

      // 첫 번째와 열 번째 항목을 확인 (열한 번째 이후는 포함되지 않아야 함)
      expect(body.data.errors[0].external_id).toBe('ITEM_1');
      expect(body.data.errors[9].external_id).toBe('ITEM_10');
    });

    it('errors가 빈 배열이면 빈 배열을 반환한다', async () => {
      vi.mocked(runSync).mockResolvedValue(createSyncResult({ errors: [] }));

      const response = await POST(createCronRequest('test-cron-secret'));
      const body = await response.json();

      expect(body.data.errors).toEqual([]);
    });
  });
});

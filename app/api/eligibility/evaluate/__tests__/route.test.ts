/**
 * POST /api/eligibility/evaluate 라우트 통합 테스트
 *
 * 검증 범위:
 * - 정상 판정 요청 → 200
 * - 인증 실패 → 401
 * - 요청 바디 유효성 검증 실패 → 400 (complexId 누락 등)
 * - ProfileIncompleteError → 422
 * - DataLoadError → 404
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/auth-service', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/services/eligibility-service', () => ({
  evaluateEligibility: vi.fn(),
  ProfileIncompleteError: class ProfileIncompleteError extends Error {
    constructor(completion: number) {
      super(`프로필 완성도가 부족합니다 (현재 ${completion}%, 최소 80% 필요)`);
      this.name = 'ProfileIncompleteError';
    }
  },
  DataLoadError: class DataLoadError extends Error {
    constructor(entity: string, detail?: string) {
      super(`${entity} 데이터를 불러올 수 없습니다${detail ? `: ${detail}` : ''}`);
      this.name = 'DataLoadError';
    }
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { POST } from '@/app/api/eligibility/evaluate/route';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/services/auth-service';
import {
  evaluateEligibility,
  ProfileIncompleteError,
  DataLoadError,
} from '@/lib/services/eligibility-service';

// ─── 팩토리 함수 ────────────────────────────────────────────

/** 판정 결과 응답 더미 데이터 생성 */
function createEvaluateResult() {
  return {
    results: [
      {
        id: 'result-uuid-001',
        profile_id: 'user-uuid-001',
        complex_id: '550e8400-e29b-41d4-a716-446655440001',
        supply_type: 'general',
        result: 'eligible',
        score: 42,
        reasons: [],
        evaluated_at: '2026-03-06T00:00:00.000Z',
      },
    ],
    score: null,
    evaluatedAt: '2026-03-06T00:00:00.000Z',
  };
}

/** POST 요청용 NextRequest 생성 */
function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/eligibility/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** 유효한 UUID 형식의 complexId */
const VALID_COMPLEX_ID = '550e8400-e29b-41d4-a716-446655440001';

// ─── 테스트 ─────────────────────────────────────────────────

describe('POST /api/eligibility/evaluate', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);
    vi.mocked(requireAuth).mockReset();
    vi.mocked(evaluateEligibility).mockReset();
  });

  // ── 시나리오 1: 정상 판정 요청 ───────────────────────────

  describe('정상 판정 요청', () => {
    it('200 상태 코드를 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(evaluateEligibility).mockResolvedValue(createEvaluateResult() as Awaited<ReturnType<typeof evaluateEligibility>>);

      const response = await POST(createPostRequest({ complex_id: VALID_COMPLEX_ID }));

      expect(response.status).toBe(200);
    });

    it('응답 바디가 { data: { results, evaluatedAt }, error: null } 구조이다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(evaluateEligibility).mockResolvedValue(createEvaluateResult() as Awaited<ReturnType<typeof evaluateEligibility>>);

      const response = await POST(createPostRequest({ complex_id: VALID_COMPLEX_ID }));
      const body = await response.json();

      expect(body.error).toBeNull();
      expect(body.data).toBeDefined();
      expect(body.data.results).toBeDefined();
    });

    it('supply_types를 포함한 요청도 정상 처리한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(evaluateEligibility).mockResolvedValue(createEvaluateResult() as Awaited<ReturnType<typeof evaluateEligibility>>);

      const response = await POST(
        createPostRequest({ complex_id: VALID_COMPLEX_ID, supply_types: ['general', 'newlywed'] }),
      );

      expect(response.status).toBe(200);
    });

    it('evaluateEligibility에 userId와 complexId가 전달된다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(evaluateEligibility).mockResolvedValue(createEvaluateResult() as Awaited<ReturnType<typeof evaluateEligibility>>);

      await POST(createPostRequest({ complex_id: VALID_COMPLEX_ID }));

      expect(vi.mocked(evaluateEligibility)).toHaveBeenCalledWith(
        expect.anything(),
        'user-uuid-001',
        VALID_COMPLEX_ID,
        undefined,
      );
    });
  });

  // ── 시나리오 2: 인증 실패 ────────────────────────────────

  describe('인증 실패', () => {
    it('requireAuth가 AUTH_REQUIRED를 throw하면 401을 반환한다', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('AUTH_REQUIRED'));

      const response = await POST(createPostRequest({ complex_id: VALID_COMPLEX_ID }));

      expect(response.status).toBe(401);
    });

    it('응답 바디의 error.code가 AUTH_REQUIRED이다', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('AUTH_REQUIRED'));

      const response = await POST(createPostRequest({ complex_id: VALID_COMPLEX_ID }));
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('AUTH_REQUIRED');
    });
  });

  // ── 시나리오 3: 요청 바디 유효성 검증 실패 ──────────────

  describe('요청 바디 유효성 검증 실패', () => {
    it('complex_id 누락 시 400을 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');

      const response = await POST(createPostRequest({}));

      expect(response.status).toBe(400);
    });

    it('complex_id가 UUID 형식이 아니면 400을 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');

      const response = await POST(createPostRequest({ complex_id: 'not-a-uuid' }));

      expect(response.status).toBe(400);
    });

    it('응답 바디의 error.code가 VALIDATION_ERROR이다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');

      const response = await POST(createPostRequest({}));
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('supply_types에 유효하지 않은 값이 있으면 400을 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');

      const response = await POST(
        createPostRequest({ complex_id: VALID_COMPLEX_ID, supply_types: ['invalid_type'] }),
      );

      expect(response.status).toBe(400);
    });
  });

  // ── 시나리오 4: ProfileIncompleteError → 422 ─────────────

  describe('ProfileIncompleteError 발생', () => {
    it('422 상태 코드를 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(evaluateEligibility).mockRejectedValue(new ProfileIncompleteError(60));

      const response = await POST(createPostRequest({ complex_id: VALID_COMPLEX_ID }));

      expect(response.status).toBe(422);
    });

    it('응답 바디의 error.code가 PROFILE_INCOMPLETE이다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(evaluateEligibility).mockRejectedValue(new ProfileIncompleteError(60));

      const response = await POST(createPostRequest({ complex_id: VALID_COMPLEX_ID }));
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('PROFILE_INCOMPLETE');
    });
  });

  // ── 시나리오 5: DataLoadError → 404 ──────────────────────

  describe('DataLoadError 발생', () => {
    it('404 상태 코드를 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(evaluateEligibility).mockRejectedValue(new DataLoadError('단지'));

      const response = await POST(createPostRequest({ complex_id: VALID_COMPLEX_ID }));

      expect(response.status).toBe(404);
    });

    it('응답 바디의 error.code가 COMPLEX_NOT_FOUND이다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(evaluateEligibility).mockRejectedValue(new DataLoadError('단지'));

      const response = await POST(createPostRequest({ complex_id: VALID_COMPLEX_ID }));
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('COMPLEX_NOT_FOUND');
    });
  });

  // ── 시나리오 6: 예기치 않은 에러 ─────────────────────────

  describe('예기치 않은 에러', () => {
    it('500 상태 코드를 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(evaluateEligibility).mockRejectedValue(new Error('DB 연결 실패'));

      const response = await POST(createPostRequest({ complex_id: VALID_COMPLEX_ID }));

      expect(response.status).toBe(500);
    });

    it('응답 바디의 error.code가 INTERNAL_ERROR이다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(evaluateEligibility).mockRejectedValue(new Error('DB 연결 실패'));

      const response = await POST(createPostRequest({ complex_id: VALID_COMPLEX_ID }));
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});

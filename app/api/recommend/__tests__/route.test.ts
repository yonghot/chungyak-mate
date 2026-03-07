/**
 * GET /api/recommend 라우트 통합 테스트
 *
 * 검증 범위:
 * - 정상 추천 목록 → 200
 * - 인증 실패 → 401
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/auth-service', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/services/recommend-service', () => ({
  getRecommendations: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { GET } from '@/app/api/recommend/route';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/services/auth-service';
import { getRecommendations } from '@/lib/services/recommend-service';

// ─── 팩토리 함수 ────────────────────────────────────────────

/** 추천 단지 더미 데이터 생성 */
function createRecommendedComplex(overrides?: Record<string, unknown>) {
  return {
    complex: {
      id: 'complex-uuid-001',
      name: '테스트아파트 1단지',
      region: '서울특별시',
      district: '강남구',
      address: '서울특별시 강남구 테헤란로 1',
      developer: '테스트시행사',
      constructor: '테스트건설',
      total_units: 100,
      announcement_date: '2026-03-01',
      subscription_start: '2026-03-20',
      subscription_end: '2026-03-25',
      winner_date: '2026-04-01',
      status: 'open',
      source_url: null,
      raw_data: null,
      external_id: null,
      move_in_date: null,
      special_supply_start: null,
      special_supply_end: null,
      contract_start: null,
      contract_end: null,
      created_at: '2026-03-01T00:00:00.000Z',
      updated_at: '2026-03-01T00:00:00.000Z',
    },
    eligibleCount: 3,
    ...overrides,
  };
}

/** GET 요청용 NextRequest 생성 */
function createGetRequest(): NextRequest {
  return new NextRequest('http://localhost/api/recommend', { method: 'GET' });
}

// ─── 테스트 ─────────────────────────────────────────────────

describe('GET /api/recommend', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);
    vi.mocked(requireAuth).mockReset();
    vi.mocked(getRecommendations).mockReset();
  });

  // ── 시나리오 1: 정상 추천 목록 조회 ─────────────────────

  describe('정상 추천 목록 조회', () => {
    it('200 상태 코드를 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(getRecommendations).mockResolvedValue([createRecommendedComplex()]);

      const response = await GET(createGetRequest());

      expect(response.status).toBe(200);
    });

    it('응답 바디가 { data: [...], error: null } 구조이다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(getRecommendations).mockResolvedValue([createRecommendedComplex()]);

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(body.error).toBeNull();
      expect(body.data).toBeInstanceOf(Array);
    });

    it('추천 결과에 complex와 eligibleCount가 포함된다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(getRecommendations).mockResolvedValue([createRecommendedComplex()]);

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(body.data[0].complex).toBeDefined();
      expect(body.data[0].eligibleCount).toBe(3);
    });

    it('추천 결과가 없으면 빈 배열을 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(getRecommendations).mockResolvedValue([]);

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it('여러 추천 결과를 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(getRecommendations).mockResolvedValue([
        createRecommendedComplex({ eligibleCount: 5 }),
        createRecommendedComplex({ eligibleCount: 3 }),
        createRecommendedComplex({ eligibleCount: 1 }),
      ]);

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(body.data).toHaveLength(3);
    });

    it('getRecommendations에 userId가 전달된다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(getRecommendations).mockResolvedValue([]);

      await GET(createGetRequest());

      expect(vi.mocked(getRecommendations)).toHaveBeenCalledWith(
        expect.anything(),
        'user-uuid-001',
      );
    });
  });

  // ── 시나리오 2: 인증 실패 ────────────────────────────────

  describe('인증 실패', () => {
    it('requireAuth가 AUTH_REQUIRED를 throw하면 401을 반환한다', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('AUTH_REQUIRED'));

      const response = await GET(createGetRequest());

      expect(response.status).toBe(401);
    });

    it('응답 바디의 error.code가 AUTH_REQUIRED이다', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('AUTH_REQUIRED'));

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('AUTH_REQUIRED');
    });

    it('인증 실패 시 getRecommendations를 호출하지 않는다', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('AUTH_REQUIRED'));

      await GET(createGetRequest());

      expect(vi.mocked(getRecommendations)).not.toHaveBeenCalled();
    });
  });

  // ── 시나리오 3: 예기치 않은 에러 ─────────────────────────

  describe('예기치 않은 에러', () => {
    it('getRecommendations가 throw하면 500을 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(getRecommendations).mockRejectedValue(new Error('DB 연결 실패'));

      const response = await GET(createGetRequest());

      expect(response.status).toBe(500);
    });

    it('응답 바디의 error.code가 INTERNAL_ERROR이다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(getRecommendations).mockRejectedValue(new Error('DB 연결 실패'));

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});

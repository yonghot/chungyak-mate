/**
 * GET /api/complexes 라우트 통합 테스트
 *
 * 검증 범위:
 * - 정상 조회 → 200
 * - 인증 실패 → 401
 * - 필터 파라미터 전달 확인
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/auth-service', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/services/complex-service', () => ({
  listComplexes: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { GET } from '@/app/api/complexes/route';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/services/auth-service';
import { listComplexes } from '@/lib/services/complex-service';

// ─── 팩토리 함수 ────────────────────────────────────────────

/** 페이지네이션 응답 더미 데이터 생성 */
function createPaginatedResult(overrides?: Record<string, unknown>) {
  return {
    items: [
      {
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
    ],
    total: 1,
    page: 1,
    limit: 20,
    ...overrides,
  };
}

/** GET 요청용 NextRequest 생성 */
function createGetRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/complexes');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url.toString(), { method: 'GET' });
}

// ─── 테스트 ─────────────────────────────────────────────────

describe('GET /api/complexes', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);
    vi.mocked(requireAuth).mockReset();
    vi.mocked(listComplexes).mockReset();
  });

  // ── 시나리오 1: 정상 조회 ────────────────────────────────

  describe('정상 조회', () => {
    it('200 상태 코드를 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(listComplexes).mockResolvedValue(createPaginatedResult() as Awaited<ReturnType<typeof listComplexes>>);

      const response = await GET(createGetRequest());

      expect(response.status).toBe(200);
    });

    it('응답 바디가 { data: { items, total, page, limit }, error: null } 구조이다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(listComplexes).mockResolvedValue(createPaginatedResult() as Awaited<ReturnType<typeof listComplexes>>);

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(body.error).toBeNull();
      expect(body.data.items).toBeInstanceOf(Array);
      expect(body.data.total).toBe(1);
      expect(body.data.page).toBe(1);
      expect(body.data.limit).toBe(20);
    });

    it('단지 목록이 빈 배열이어도 200을 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(listComplexes).mockResolvedValue(
        createPaginatedResult({ items: [], total: 0 }) as Awaited<ReturnType<typeof listComplexes>>,
      );

      const response = await GET(createGetRequest());

      expect(response.status).toBe(200);
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
  });

  // ── 시나리오 3: 필터 파라미터 전달 확인 ─────────────────

  describe('필터 파라미터 전달', () => {
    it('region 파라미터를 listComplexes에 전달한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(listComplexes).mockResolvedValue(createPaginatedResult() as Awaited<ReturnType<typeof listComplexes>>);

      await GET(createGetRequest({ region: '서울특별시' }));

      expect(vi.mocked(listComplexes)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ region: '서울특별시' }),
      );
    });

    it('status 파라미터를 listComplexes에 전달한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(listComplexes).mockResolvedValue(createPaginatedResult() as Awaited<ReturnType<typeof listComplexes>>);

      await GET(createGetRequest({ status: 'open' }));

      expect(vi.mocked(listComplexes)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'open' }),
      );
    });

    it('page, limit 파라미터를 숫자로 변환하여 listComplexes에 전달한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(listComplexes).mockResolvedValue(createPaginatedResult() as Awaited<ReturnType<typeof listComplexes>>);

      await GET(createGetRequest({ page: '2', limit: '10' }));

      expect(vi.mocked(listComplexes)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ page: 2, limit: 10 }),
      );
    });

    it('파라미터 없이 요청해도 listComplexes를 호출한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(listComplexes).mockResolvedValue(createPaginatedResult() as Awaited<ReturnType<typeof listComplexes>>);

      await GET(createGetRequest());

      expect(vi.mocked(listComplexes)).toHaveBeenCalledTimes(1);
    });

    it('유효하지 않은 status 파라미터는 400을 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');

      const response = await GET(createGetRequest({ status: 'invalid_status' }));

      expect(response.status).toBe(400);
    });
  });

  // ── 시나리오 4: 예기치 않은 에러 ─────────────────────────

  describe('예기치 않은 에러', () => {
    it('listComplexes가 throw하면 500을 반환한다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(listComplexes).mockRejectedValue(new Error('DB 연결 실패'));

      const response = await GET(createGetRequest());

      expect(response.status).toBe(500);
    });

    it('응답 바디의 error.code가 INTERNAL_ERROR이다', async () => {
      vi.mocked(requireAuth).mockResolvedValue('user-uuid-001');
      vi.mocked(listComplexes).mockRejectedValue(new Error('DB 연결 실패'));

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(body.data).toBeNull();
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});

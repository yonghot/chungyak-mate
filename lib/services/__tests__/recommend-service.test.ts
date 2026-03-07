/**
 * recommend-service 단위 테스트
 *
 * 테스트 대상: lib/services/recommend-service.ts
 * 전략: eligibilityRepo, complexRepo, logger를 vi.mock()으로 격리
 *
 * 핵심 동작 요약:
 * - 'eligible' 판정 결과가 있는 'open' 상태 단지를 eligibleCount 내림차순으로 반환
 * - eligible 결과 없음 → 빈 배열 즉시 반환
 * - 'open' 이외 상태 단지는 결과에서 제외
 * - MAX_RECOMMENDATIONS (20개) 초과분은 제거
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Complex, EligibilityResult } from '@/types/database';

// ─── 외부 의존성 모킹 ─────────────────────────────────────────────────────

vi.mock('@/lib/repositories/eligibility-repository', () => ({
  getResultsForProfile: vi.fn(),
}));

vi.mock('@/lib/repositories/complex-repository', () => ({
  getById: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ─── 모킹된 모듈 import ───────────────────────────────────────────────────

import * as eligibilityRepo from '@/lib/repositories/eligibility-repository';
import * as complexRepo from '@/lib/repositories/complex-repository';

import { getRecommendations } from '@/lib/services/recommend-service';

// ─── 테스트 데이터 팩토리 ─────────────────────────────────────────────────

/** 최소 유효한 EligibilityResult를 생성한다 */
function createEligibilityResult(
  overrides: Partial<EligibilityResult> & {
    complex_id: string;
    result: EligibilityResult['result'];
  },
): EligibilityResult {
  return {
    id: `result-${overrides.complex_id}-${overrides.supply_type ?? 'general'}`,
    profile_id: 'profile-001',
    complex_id: overrides.complex_id,
    supply_type: overrides.supply_type ?? 'general',
    result: overrides.result,
    score: null,
    reasons: [],
    evaluated_at: '2026-03-06T00:00:00.000Z',
    ...overrides,
  };
}

/** 최소 유효한 Complex를 생성한다 */
function createComplex(
  id: string,
  overrides: Partial<Complex> = {},
): Complex {
  return {
    id,
    name: `테스트단지 ${id}`,
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
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ─── 타입 단언 헬퍼 ──────────────────────────────────────────────────────

const mockGetResultsForProfile = eligibilityRepo.getResultsForProfile as ReturnType<typeof vi.fn>;
const mockGetById = complexRepo.getById as ReturnType<typeof vi.fn>;

// ─── 더미 Supabase 클라이언트 ────────────────────────────────────────────

const mockSupabase = {} as Parameters<typeof getRecommendations>[0];

// ─── 테스트 ──────────────────────────────────────────────────────────────

describe('getRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 시나리오 1: 정상 추천 목록 반환 ─────────────────────────────────

  describe('정상 추천 목록 반환', () => {
    it('eligible 판정을 받은 open 상태 단지를 반환한다', async () => {
      // given: 단지 A001에서 general eligible 판정
      mockGetResultsForProfile.mockResolvedValue({
        data: [
          createEligibilityResult({ complex_id: 'A001', result: 'eligible', supply_type: 'general' }),
        ],
        error: null,
      });

      mockGetById.mockResolvedValue({
        data: { complex: createComplex('A001'), supplyTypes: [] },
        error: null,
      });

      // when
      const result = await getRecommendations(mockSupabase, 'profile-001');

      // then
      expect(result).toHaveLength(1);
      expect(result[0].complex.id).toBe('A001');
      expect(result[0].eligibleCount).toBe(1);
    });

    it('여러 공급유형에서 eligible인 단지의 eligibleCount를 올바르게 집계한다', async () => {
      // given: 단지 B001에서 general, newlywed 두 가지 eligible 판정
      mockGetResultsForProfile.mockResolvedValue({
        data: [
          createEligibilityResult({ complex_id: 'B001', result: 'eligible', supply_type: 'general' }),
          createEligibilityResult({ complex_id: 'B001', result: 'eligible', supply_type: 'newlywed' }),
          createEligibilityResult({ complex_id: 'B001', result: 'ineligible', supply_type: 'first_life' }),
        ],
        error: null,
      });

      mockGetById.mockResolvedValue({
        data: { complex: createComplex('B001'), supplyTypes: [] },
        error: null,
      });

      // when
      const result = await getRecommendations(mockSupabase, 'profile-001');

      // then: ineligible 제외, eligible 2개 집계
      expect(result[0].eligibleCount).toBe(2);
    });
  });

  // ── 시나리오 2: eligible 결과 없음 → 빈 배열 ─────────────────────

  describe('eligible 결과 없음', () => {
    it('판정 결과가 전혀 없으면 빈 배열을 반환한다', async () => {
      // given
      mockGetResultsForProfile.mockResolvedValue({
        data: [],
        error: null,
      });

      // when
      const result = await getRecommendations(mockSupabase, 'profile-001');

      // then
      expect(result).toEqual([]);
    });

    it('판정 결과가 모두 ineligible이면 빈 배열을 반환한다', async () => {
      // given: 모든 결과가 ineligible
      mockGetResultsForProfile.mockResolvedValue({
        data: [
          createEligibilityResult({ complex_id: 'C001', result: 'ineligible', supply_type: 'general' }),
          createEligibilityResult({ complex_id: 'C001', result: 'ineligible', supply_type: 'newlywed' }),
        ],
        error: null,
      });

      // when
      const result = await getRecommendations(mockSupabase, 'profile-001');

      // then
      expect(result).toEqual([]);
    });

    it('getResultsForProfile에서 에러가 반환되면 빈 배열을 반환한다', async () => {
      // given
      mockGetResultsForProfile.mockResolvedValue({
        data: null,
        error: 'DB 조회 실패',
      });

      // when
      const result = await getRecommendations(mockSupabase, 'profile-001');

      // then
      expect(result).toEqual([]);
    });
  });

  // ── 시나리오 3: open 상태가 아닌 단지 필터링 ──────────────────────

  describe('open 상태가 아닌 단지 필터링', () => {
    it('status가 closed인 단지는 결과에 포함하지 않는다', async () => {
      // given: D001 eligible 판정이 있지만 단지 상태가 closed
      mockGetResultsForProfile.mockResolvedValue({
        data: [
          createEligibilityResult({ complex_id: 'D001', result: 'eligible', supply_type: 'general' }),
        ],
        error: null,
      });

      mockGetById.mockResolvedValue({
        data: { complex: createComplex('D001', { status: 'closed' }), supplyTypes: [] },
        error: null,
      });

      // when
      const result = await getRecommendations(mockSupabase, 'profile-001');

      // then
      expect(result).toEqual([]);
    });

    it('status가 upcoming인 단지는 결과에 포함하지 않는다', async () => {
      // given
      mockGetResultsForProfile.mockResolvedValue({
        data: [
          createEligibilityResult({ complex_id: 'E001', result: 'eligible', supply_type: 'general' }),
        ],
        error: null,
      });

      mockGetById.mockResolvedValue({
        data: { complex: createComplex('E001', { status: 'upcoming' }), supplyTypes: [] },
        error: null,
      });

      // when
      const result = await getRecommendations(mockSupabase, 'profile-001');

      // then
      expect(result).toEqual([]);
    });

    it('getById에서 에러가 반환된 단지는 결과에 포함하지 않는다', async () => {
      // given
      mockGetResultsForProfile.mockResolvedValue({
        data: [
          createEligibilityResult({ complex_id: 'F001', result: 'eligible', supply_type: 'general' }),
        ],
        error: null,
      });

      mockGetById.mockResolvedValue({
        data: null,
        error: '단지 조회 실패',
      });

      // when
      const result = await getRecommendations(mockSupabase, 'profile-001');

      // then
      expect(result).toEqual([]);
    });
  });

  // ── 시나리오 4: eligibleCount 기준 내림차순 정렬 ────────────────

  describe('eligibleCount 기준 정렬', () => {
    it('eligibleCount가 높은 단지가 앞에 위치한다', async () => {
      // given: G001(eligible 1개), G002(eligible 3개), G003(eligible 2개)
      mockGetResultsForProfile.mockResolvedValue({
        data: [
          createEligibilityResult({ complex_id: 'G001', result: 'eligible', supply_type: 'general' }),
          createEligibilityResult({ complex_id: 'G002', result: 'eligible', supply_type: 'general' }),
          createEligibilityResult({ complex_id: 'G002', result: 'eligible', supply_type: 'newlywed' }),
          createEligibilityResult({ complex_id: 'G002', result: 'eligible', supply_type: 'first_life' }),
          createEligibilityResult({ complex_id: 'G003', result: 'eligible', supply_type: 'general' }),
          createEligibilityResult({ complex_id: 'G003', result: 'eligible', supply_type: 'newlywed' }),
        ],
        error: null,
      });

      mockGetById.mockImplementation((_supabase: unknown, id: string) => {
        return Promise.resolve({
          data: { complex: createComplex(id), supplyTypes: [] },
          error: null,
        });
      });

      // when
      const result = await getRecommendations(mockSupabase, 'profile-001');

      // then: G002(3), G003(2), G001(1) 순서
      expect(result[0].complex.id).toBe('G002');
      expect(result[0].eligibleCount).toBe(3);
      expect(result[1].complex.id).toBe('G003');
      expect(result[1].eligibleCount).toBe(2);
      expect(result[2].complex.id).toBe('G001');
      expect(result[2].eligibleCount).toBe(1);
    });
  });

  // ── 시나리오 5: MAX_RECOMMENDATIONS (20개) 제한 ───────────────────

  describe('MAX_RECOMMENDATIONS 제한', () => {
    it('eligible 단지가 20개를 초과하면 최대 20개만 처리한다', async () => {
      // given: 25개 단지에서 각각 eligible 판정
      const results: EligibilityResult[] = Array.from({ length: 25 }, (_, i) => {
        const id = `COMPLEX-${String(i + 1).padStart(3, '0')}`;
        return createEligibilityResult({ complex_id: id, result: 'eligible', supply_type: 'general' });
      });

      mockGetResultsForProfile.mockResolvedValue({
        data: results,
        error: null,
      });

      mockGetById.mockImplementation((_supabase: unknown, id: string) => {
        return Promise.resolve({
          data: { complex: createComplex(id), supplyTypes: [] },
          error: null,
        });
      });

      // when
      const result = await getRecommendations(mockSupabase, 'profile-001');

      // then: MAX_RECOMMENDATIONS = 20이므로 최대 20개
      expect(result.length).toBeLessThanOrEqual(20);
      // getById는 20번만 호출되어야 한다
      expect(mockGetById).toHaveBeenCalledTimes(20);
    });
  });
});

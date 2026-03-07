/**
 * eligibility-service 단위 테스트
 *
 * 테스트 대상: lib/services/eligibility-service.ts
 * 전략: Supabase 클라이언트, engine, scoring을 vi.mock()으로 격리
 *
 * 핵심 동작 요약:
 * - 프로필 완성도 80% 미만 → ProfileIncompleteError
 * - 프로필/단지 데이터 조회 실패 → DataLoadError
 * - 전체 공급유형 판정: evaluateAll 호출
 * - 선택 공급유형 판정: evaluateSelected 호출
 * - 일반공급 포함 시 calculateTotalScore로 가점 산출
 * - 결과를 eligibility_results 테이블에 upsert 저장
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupplyType } from '@/types/database';
import type { EligibilityResult, ProfileInput } from '@/lib/eligibility/types';
import type { ScoreBreakdown } from '@/types';

// ─── 외부 의존성 모킹 ─────────────────────────────────────────────────────

vi.mock('@/lib/eligibility/engine', () => ({
  evaluateAll: vi.fn(),
  evaluateSelected: vi.fn(),
}));

vi.mock('@/lib/eligibility/scoring', () => ({
  calculateTotalScore: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ─── 모킹된 모듈 import ───────────────────────────────────────────────────

import { evaluateAll, evaluateSelected } from '@/lib/eligibility/engine';
import { calculateTotalScore } from '@/lib/eligibility/scoring';

import {
  evaluateEligibility,
  ProfileIncompleteError,
  DataLoadError,
} from '@/lib/services/eligibility-service';

// ─── 타입 단언 헬퍼 ──────────────────────────────────────────────────────

const mockEvaluateAll = evaluateAll as ReturnType<typeof vi.fn>;
const mockEvaluateSelected = evaluateSelected as ReturnType<typeof vi.fn>;
const mockCalculateTotalScore = calculateTotalScore as ReturnType<typeof vi.fn>;

// ─── 테스트 데이터 팩토리 ─────────────────────────────────────────────────

/** 최소 유효한 ProfileInput을 생성한다 */
function createProfileInput(overrides: Partial<ProfileInput> = {}): ProfileInput {
  return {
    birth_date: '1990-01-15',
    is_household_head: true,
    marital_status: 'married',
    marriage_date: '2020-06-01',
    dependents_count: 2,
    homeless_start_date: '2018-03-01',
    total_assets_krw: 300_000_000,
    monthly_income_krw: 5_000_000,
    car_value_krw: 15_000_000,
    subscription_type: 'housing',
    subscription_start_date: '2020-01-01',
    deposit_count: 24,
    has_won_before: false,
    won_date: null,
    ...overrides,
  };
}

/** 단일 공급유형에 대한 EligibilityResult를 생성한다 */
function createEligibilityResult(
  supplyType: SupplyType,
  result: 'eligible' | 'ineligible' | 'conditional' = 'eligible',
): EligibilityResult {
  return {
    supply_type: supplyType,
    result,
    reasons: [
      {
        rule_key: `${supplyType}_test_rule`,
        rule_name: '테스트 규칙',
        passed: result === 'eligible',
        detail: result === 'eligible' ? '요건 충족' : '요건 미충족',
        law_reference: '주택공급에 관한 규칙 제1조',
      },
    ],
  };
}

/** ScoreBreakdown 더미 데이터를 생성한다 */
function createScoreBreakdown(total = 45): ScoreBreakdown {
  return {
    homelessPeriod: { score: 18, max: 32, detail: '무주택기간 7년' },
    dependents: { score: 20, max: 35, detail: '부양가족 2명' },
    subscriptionPeriod: { score: total - 38, max: 17, detail: '청약통장 5년' },
    total,
  };
}

// ─── Supabase 모킹 헬퍼 ──────────────────────────────────────────────────

/**
 * Supabase 클라이언트를 동작 기반으로 모킹한다.
 *
 * 이 서비스는 from().select().eq().returns().single()처럼
 * 메서드 체이닝으로 쿼리를 구성하므로, 각 호출마다
 * 적절한 결과를 반환하도록 mockImplementation을 사용한다.
 */
function createMockSupabase(options: {
  profileCompletion?: number;
  profileCompletionError?: string;
  profileData?: Record<string, unknown> | null;
  profileError?: string;
  complexData?: { region: string; district: string } | null;
  complexError?: string;
  supplyTypeData?: { type: string }[];
  supplyTypeError?: string;
  upsertError?: string | null;
}) {
  const {
    profileCompletion = 90,
    profileCompletionError,
    profileData,
    profileError,
    complexData = { region: '서울특별시', district: '강남구' },
    complexError,
    supplyTypeData = [{ type: 'general' }, { type: 'newlywed' }],
    supplyTypeError,
    upsertError = null,
  } = options;

  // profiles 테이블의 profile_completion 조회 결과
  const profileCompletionResult = profileCompletionError
    ? { data: null, error: { message: profileCompletionError } }
    : { data: { profile_completion: profileCompletion }, error: null };

  // profiles 테이블의 전체 데이터 조회 결과
  const fullProfileData = profileData !== undefined
    ? profileData
    : createProfileInput();

  const profileDataResult = profileError
    ? { data: null, error: { message: profileError } }
    : { data: fullProfileData, error: null };

  // complexes 테이블 조회 결과
  const complexResult = complexError
    ? { data: null, error: { message: complexError } }
    : { data: complexData, error: null };

  // supply_types 테이블 조회 결과
  const supplyTypesResult = supplyTypeError
    ? { data: null, error: { message: supplyTypeError } }
    : { data: supplyTypeData, error: null };

  // eligibility_rules 테이블 조회 결과 (빈 배열로 기본 처리)
  const rulesResult = { data: [], error: null };

  // 각 from() 호출이 어느 테이블인지 추적하는 카운터
  let fromCallCount = 0;

  const mockSupabase = {
    from: vi.fn().mockImplementation((table: string) => {
      fromCallCount++;

      if (table === 'eligibility_results') {
        // upsert 호출 (saveResults 내부)
        return {
          upsert: vi.fn().mockResolvedValue({
            error: upsertError ? { message: upsertError } : null,
          }),
        };
      }

      if (table === 'eligibility_rules') {
        // loadRuleParams 내부 체인
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          returns: vi.fn().mockResolvedValue(rulesResult),
        };
      }

      if (table === 'supply_types') {
        // loadComplex 내부 supply_types 체인
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          returns: vi.fn().mockResolvedValue(supplyTypesResult),
        };
      }

      if (table === 'complexes') {
        // loadComplex 내부 complexes 체인
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          returns: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(complexResult),
        };
      }

      if (table === 'profiles') {
        // checkProfileCompletion 또는 loadProfile 체인
        // fromCallCount 기준으로 첫 번째 호출 = checkProfileCompletion
        // 두 번째 호출 = loadProfile
        const isCompletionCheck = fromCallCount <= 1;
        const resolvedData = isCompletionCheck ? profileCompletionResult : profileDataResult;

        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          returns: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(resolvedData),
        };
      }

      // 알 수 없는 테이블
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        returns: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
    }),
  };

  return mockSupabase as unknown as Parameters<typeof evaluateEligibility>[0];
}

// ─── 테스트 ──────────────────────────────────────────────────────────────

describe('evaluateEligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 시나리오 1: ProfileIncompleteError ─────────────────────────────

  describe('ProfileIncompleteError', () => {
    it('프로필 완성도가 80% 미만이면 ProfileIncompleteError를 던진다', async () => {
      // given: 완성도 60%
      const supabase = createMockSupabase({ profileCompletion: 60 });

      // when & then
      await expect(
        evaluateEligibility(supabase, 'profile-001', 'complex-001'),
      ).rejects.toThrow(ProfileIncompleteError);
    });

    it('ProfileIncompleteError 메시지에 현재 완성도가 포함된다', async () => {
      // given: 완성도 55%
      const supabase = createMockSupabase({ profileCompletion: 55 });

      // when & then
      await expect(
        evaluateEligibility(supabase, 'profile-001', 'complex-001'),
      ).rejects.toThrow('55%');
    });

    it('프로필 완성도가 정확히 80%이면 에러 없이 진행한다', async () => {
      // given: 완성도 80% (경계값)
      mockEvaluateAll.mockReturnValue([createEligibilityResult('general')]);
      mockCalculateTotalScore.mockReturnValue(createScoreBreakdown());

      const supabase = createMockSupabase({ profileCompletion: 80 });

      // when & then: 에러 없이 완료
      await expect(
        evaluateEligibility(supabase, 'profile-001', 'complex-001'),
      ).resolves.toBeDefined();
    });
  });

  // ── 시나리오 2: DataLoadError ────────────────────────────────────

  describe('DataLoadError', () => {
    it('프로필 완성도 조회 실패 시 DataLoadError를 던진다', async () => {
      // given: DB 에러
      const supabase = createMockSupabase({
        profileCompletionError: 'DB 연결 실패',
      });

      // when & then
      await expect(
        evaluateEligibility(supabase, 'profile-001', 'complex-001'),
      ).rejects.toThrow(DataLoadError);
    });

    it('DataLoadError는 name 속성이 "DataLoadError"이다', async () => {
      // given
      const supabase = createMockSupabase({
        profileCompletionError: 'connection timeout',
      });

      // when & then
      const error = await evaluateEligibility(
        supabase,
        'profile-001',
        'complex-001',
      ).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(DataLoadError);
      expect((error as DataLoadError).name).toBe('DataLoadError');
    });

    it('ProfileIncompleteError는 name 속성이 "ProfileIncompleteError"이다', async () => {
      // given
      const supabase = createMockSupabase({ profileCompletion: 30 });

      // when & then
      const error = await evaluateEligibility(
        supabase,
        'profile-001',
        'complex-001',
      ).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ProfileIncompleteError);
      expect((error as ProfileIncompleteError).name).toBe('ProfileIncompleteError');
    });
  });

  // ── 시나리오 3: 정상 판정 플로우 (전체 공급유형) ─────────────────

  describe('정상 판정 플로우 - 전체 공급유형', () => {
    it('supplyTypes를 지정하지 않으면 evaluateAll을 호출한다', async () => {
      // given
      const eligibilityResults = [
        createEligibilityResult('general'),
        createEligibilityResult('newlywed'),
      ];
      mockEvaluateAll.mockReturnValue(eligibilityResults);
      mockCalculateTotalScore.mockReturnValue(createScoreBreakdown());

      const supabase = createMockSupabase({ profileCompletion: 90 });

      // when
      await evaluateEligibility(supabase, 'profile-001', 'complex-001');

      // then
      expect(mockEvaluateAll).toHaveBeenCalledOnce();
      expect(mockEvaluateSelected).not.toHaveBeenCalled();
    });

    it('반환값에 results 배열이 포함된다', async () => {
      // given
      const eligibilityResults = [createEligibilityResult('general')];
      mockEvaluateAll.mockReturnValue(eligibilityResults);
      mockCalculateTotalScore.mockReturnValue(createScoreBreakdown(45));

      const supabase = createMockSupabase({ profileCompletion: 90 });

      // when
      const response = await evaluateEligibility(supabase, 'profile-001', 'complex-001');

      // then
      expect(response.results).toHaveLength(1);
      expect(response.results[0].supply_type).toBe('general');
    });

    it('반환값에 evaluatedAt 타임스탬프가 포함된다', async () => {
      // given
      mockEvaluateAll.mockReturnValue([createEligibilityResult('newlywed')]);

      const supabase = createMockSupabase({ profileCompletion: 90 });

      // when
      const response = await evaluateEligibility(supabase, 'profile-001', 'complex-001');

      // then
      expect(response.evaluatedAt).toBeDefined();
      expect(typeof response.evaluatedAt).toBe('string');
    });
  });

  // ── 시나리오 4: 선택 공급유형 판정 ──────────────────────────────

  describe('선택 공급유형 판정', () => {
    it('supplyTypes를 지정하면 evaluateSelected를 호출한다', async () => {
      // given
      const selectedTypes: SupplyType[] = ['newlywed', 'first_life'];
      const eligibilityResults = [
        createEligibilityResult('newlywed'),
        createEligibilityResult('first_life'),
      ];
      mockEvaluateSelected.mockReturnValue(eligibilityResults);

      const supabase = createMockSupabase({ profileCompletion: 90 });

      // when
      await evaluateEligibility(
        supabase,
        'profile-001',
        'complex-001',
        selectedTypes,
      );

      // then
      expect(mockEvaluateSelected).toHaveBeenCalledOnce();
      expect(mockEvaluateAll).not.toHaveBeenCalled();
    });

    it('evaluateSelected 호출 시 지정한 supplyTypes가 전달된다', async () => {
      // given
      const selectedTypes: SupplyType[] = ['multi_child'];
      mockEvaluateSelected.mockReturnValue([createEligibilityResult('multi_child')]);

      const supabase = createMockSupabase({ profileCompletion: 90 });

      // when
      await evaluateEligibility(
        supabase,
        'profile-001',
        'complex-001',
        selectedTypes,
      );

      // then: 네 번째 인자로 선택 공급유형이 전달된다
      expect(mockEvaluateSelected).toHaveBeenCalledWith(
        expect.anything(), // profile
        expect.anything(), // complex
        expect.anything(), // ruleParams
        selectedTypes,
      );
    });

    it('빈 배열을 전달하면 evaluateAll을 호출한다', async () => {
      // given: 빈 배열 = 전체 판정
      mockEvaluateAll.mockReturnValue([createEligibilityResult('general')]);
      mockCalculateTotalScore.mockReturnValue(createScoreBreakdown());

      const supabase = createMockSupabase({ profileCompletion: 90 });

      // when
      await evaluateEligibility(supabase, 'profile-001', 'complex-001', []);

      // then
      expect(mockEvaluateAll).toHaveBeenCalledOnce();
      expect(mockEvaluateSelected).not.toHaveBeenCalled();
    });
  });

  // ── 시나리오 5: 일반공급 포함 시 가점 산출 ──────────────────────

  describe('일반공급 가점 산출', () => {
    it('results에 general이 포함되면 calculateTotalScore를 호출한다', async () => {
      // given: general eligible 결과 포함
      const eligibilityResults = [
        createEligibilityResult('general'),
        createEligibilityResult('newlywed'),
      ];
      mockEvaluateAll.mockReturnValue(eligibilityResults);
      mockCalculateTotalScore.mockReturnValue(createScoreBreakdown(45));

      const supabase = createMockSupabase({ profileCompletion: 90 });

      // when
      await evaluateEligibility(supabase, 'profile-001', 'complex-001');

      // then
      expect(mockCalculateTotalScore).toHaveBeenCalledOnce();
    });

    it('results에 general이 없으면 calculateTotalScore를 호출하지 않는다', async () => {
      // given: newlywed만 포함, general 없음
      mockEvaluateSelected.mockReturnValue([
        createEligibilityResult('newlywed'),
        createEligibilityResult('first_life'),
      ]);

      const supabase = createMockSupabase({ profileCompletion: 90 });

      // when
      await evaluateEligibility(
        supabase,
        'profile-001',
        'complex-001',
        ['newlywed', 'first_life'],
      );

      // then
      expect(mockCalculateTotalScore).not.toHaveBeenCalled();
    });

    it('general 포함 시 반환값의 score에 ScoreBreakdown이 포함된다', async () => {
      // given
      const scoreBreakdown = createScoreBreakdown(52);
      mockEvaluateAll.mockReturnValue([createEligibilityResult('general')]);
      mockCalculateTotalScore.mockReturnValue(scoreBreakdown);

      const supabase = createMockSupabase({ profileCompletion: 90 });

      // when
      const response = await evaluateEligibility(supabase, 'profile-001', 'complex-001');

      // then
      expect(response.score).not.toBeNull();
      expect(response.score?.total).toBe(52);
    });

    it('general 미포함 시 반환값의 score는 null이다', async () => {
      // given: newlywed만 있음
      mockEvaluateSelected.mockReturnValue([createEligibilityResult('newlywed')]);

      const supabase = createMockSupabase({ profileCompletion: 90 });

      // when
      const response = await evaluateEligibility(
        supabase,
        'profile-001',
        'complex-001',
        ['newlywed'],
      );

      // then
      expect(response.score).toBeNull();
    });

    it('general 결과의 score 필드에 총 가점이 설정된다', async () => {
      // given
      const scoreBreakdown = createScoreBreakdown(60);
      mockEvaluateAll.mockReturnValue([
        createEligibilityResult('general'),
        createEligibilityResult('newlywed'),
      ]);
      mockCalculateTotalScore.mockReturnValue(scoreBreakdown);

      const supabase = createMockSupabase({ profileCompletion: 90 });

      // when
      const response = await evaluateEligibility(supabase, 'profile-001', 'complex-001');

      // then: general 결과의 score = total 가점
      const generalResult = response.results.find((r) => r.supply_type === 'general');
      expect(generalResult?.score).toBe(60);

      // newlywed의 score는 null
      const newlywedResult = response.results.find((r) => r.supply_type === 'newlywed');
      expect(newlywedResult?.score).toBeNull();
    });
  });

  // ── 시나리오 6: 결과 저장 (upsert) 호출 확인 ────────────────────

  describe('결과 저장 (upsert)', () => {
    it('판정 결과를 eligibility_results 테이블에 upsert한다', async () => {
      // given
      const eligibilityResults = [
        createEligibilityResult('general'),
        createEligibilityResult('newlywed'),
      ];
      mockEvaluateAll.mockReturnValue(eligibilityResults);
      mockCalculateTotalScore.mockReturnValue(createScoreBreakdown());

      const upsertMock = vi.fn().mockResolvedValue({ error: null });

      // from()이 eligibility_results인 경우 upsert mock 주입
      const supabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'eligibility_results') {
            return { upsert: upsertMock };
          }

          if (table === 'eligibility_rules') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              returns: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }

          if (table === 'supply_types') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              returns: vi.fn().mockResolvedValue({
                data: [{ type: 'general' }],
                error: null,
              }),
            };
          }

          if (table === 'complexes') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              returns: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { region: '서울특별시', district: '강남구' },
                error: null,
              }),
            };
          }

          // profiles: 첫 번째 = completion check, 이후 = full profile
          let profileCallCount = 0;
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            returns: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              profileCallCount++;
              if (profileCallCount === 1) {
                return Promise.resolve({
                  data: { profile_completion: 90 },
                  error: null,
                });
              }
              return Promise.resolve({
                data: createProfileInput(),
                error: null,
              });
            }),
          };
        }),
      } as unknown as Parameters<typeof evaluateEligibility>[0];

      // when
      await evaluateEligibility(supabase, 'profile-001', 'complex-001');

      // then: general, newlywed 각각 upsert 호출 = 2회
      expect(upsertMock).toHaveBeenCalledTimes(2);
    });

    it('upsert 호출 시 profile_id, complex_id, supply_type이 올바르게 전달된다', async () => {
      // given
      mockEvaluateAll.mockReturnValue([createEligibilityResult('general')]);
      mockCalculateTotalScore.mockReturnValue(createScoreBreakdown());

      const upsertMock = vi.fn().mockResolvedValue({ error: null });

      const supabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'eligibility_results') {
            return { upsert: upsertMock };
          }

          if (table === 'eligibility_rules') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              returns: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }

          if (table === 'supply_types') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              returns: vi.fn().mockResolvedValue({
                data: [{ type: 'general' }],
                error: null,
              }),
            };
          }

          if (table === 'complexes') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              returns: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { region: '서울특별시', district: '강남구' },
                error: null,
              }),
            };
          }

          let profileCallCount = 0;
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            returns: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              profileCallCount++;
              if (profileCallCount === 1) {
                return Promise.resolve({
                  data: { profile_completion: 90 },
                  error: null,
                });
              }
              return Promise.resolve({
                data: createProfileInput(),
                error: null,
              });
            }),
          };
        }),
      } as unknown as Parameters<typeof evaluateEligibility>[0];

      // when
      await evaluateEligibility(supabase, 'profile-001', 'complex-001');

      // then: upsert 첫 번째 호출의 첫 번째 인자 확인
      const upsertArg = upsertMock.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(upsertArg).toMatchObject({
        profile_id: 'profile-001',
        complex_id: 'complex-001',
        supply_type: 'general',
      });
    });
  });
});

/**
 * 신혼부부 특별공급 자격 판정 규칙 테스트
 *
 * 미커버 브랜치:
 * - checkMarriagePeriod: 미혼/혼인일 미입력, 7년 초과 케이스
 * - checkHomelessStatus: 무주택 시작일 null 케이스
 * - checkIncomeLimit: 소득 미입력, 소득 초과 케이스
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { newlywedRule } from '@/lib/eligibility/rules/newlywed';
import type { ProfileInput, ComplexInput } from '@/lib/eligibility/types';

// ─── 테스트 헬퍼 ───────────────────────────────────────────

/** 신혼부부 조건을 모두 충족하는 기본 프로필 */
function createEligibleProfile(overrides?: Partial<ProfileInput>): ProfileInput {
  return {
    birth_date: '1995-01-01',
    is_household_head: true,
    marital_status: 'married',
    marriage_date: '2023-01-01',
    dependents_count: 0,
    homeless_start_date: '2020-01-01',
    total_assets_krw: 200_000_000,
    monthly_income_krw: 5_000_000,
    car_value_krw: 10_000_000,
    subscription_type: 'savings',
    subscription_start_date: '2019-01-01',
    deposit_count: 48,
    has_won_before: false,
    won_date: null,
    ...overrides,
  };
}

/** 기본 단지 정보 */
function createMockComplex(): ComplexInput {
  return {
    region: '서울',
    district: '송파구',
    available_supply_types: ['newlywed'],
  };
}

// ─── 전체 자격 판정 ────────────────────────────────────────

describe('newlywedRule.evaluate - 전체 자격 충족', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('모든 조건을 충족하면 eligible을 반환한다', () => {
    const profile = createEligibleProfile();
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    expect(result.result).toBe('eligible');
    expect(result.supply_type).toBe('newlywed');
  });

  it('결과에 3개의 판정 근거가 포함된다', () => {
    const profile = createEligibleProfile();
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    expect(result.reasons.length).toBe(3);
  });
});

// ─── checkMarriagePeriod: 미혼/혼인일 미입력 ──────────────

describe('신혼부부 혼인기간 판정 - 미혼/혼인일 미입력', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('미혼이면 혼인기간 조건에서 불합격이다', () => {
    const profile = createEligibleProfile({ marital_status: 'single', marriage_date: null });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    const marriageReason = result.reasons.find((r) => r.rule_key === 'newlywed_marriage_period');
    expect(marriageReason?.passed).toBe(false);
    expect(marriageReason?.detail).toContain('기혼 상태가 아님');
  });

  it('이혼 상태이면 혼인기간 조건에서 불합격이다', () => {
    const profile = createEligibleProfile({ marital_status: 'divorced', marriage_date: null });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    const marriageReason = result.reasons.find((r) => r.rule_key === 'newlywed_marriage_period');
    expect(marriageReason?.passed).toBe(false);
  });

  it('기혼이지만 혼인일 미입력이면 혼인기간 조건에서 불합격이다', () => {
    const profile = createEligibleProfile({ marital_status: 'married', marriage_date: null });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    const marriageReason = result.reasons.find((r) => r.rule_key === 'newlywed_marriage_period');
    expect(marriageReason?.passed).toBe(false);
    expect(marriageReason?.detail).toContain('혼인 신고일 미입력');
  });
});

// ─── checkMarriagePeriod: 7년 초과 ────────────────────────

describe('신혼부부 혼인기간 판정 - 7년 초과', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('혼인기간이 7년(84개월) 초과이면 불합격이다', () => {
    // 2026-03-06 기준 2018-01-01 혼인 → 약 98개월 경과 (7년 초과)
    const profile = createEligibleProfile({ marriage_date: '2018-01-01' });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    const marriageReason = result.reasons.find((r) => r.rule_key === 'newlywed_marriage_period');
    expect(marriageReason?.passed).toBe(false);
    expect(marriageReason?.detail).toContain('7년 초과');
  });

  it('혼인기간 7년 초과 시 전체 결과는 ineligible이다', () => {
    const profile = createEligibleProfile({ marriage_date: '2018-01-01' });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    expect(result.result).toBe('ineligible');
  });

  it('혼인기간이 7년 이내이면 합격이다', () => {
    // 2026-03-06 기준 2023-01-01 혼인 → 약 26개월 경과 (7년 이내)
    const profile = createEligibleProfile({ marriage_date: '2023-01-01' });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    const marriageReason = result.reasons.find((r) => r.rule_key === 'newlywed_marriage_period');
    expect(marriageReason?.passed).toBe(true);
    expect(marriageReason?.detail).toContain('7년 이내 충족');
  });
});

// ─── checkHomelessStatus ──────────────────────────────────

describe('신혼부부 무주택 판정', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('무주택 시작일이 null이면 무주택 조건에서 불합격이다', () => {
    const profile = createEligibleProfile({ homeless_start_date: null });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    const homelessReason = result.reasons.find((r) => r.rule_key === 'newlywed_homeless_status');
    expect(homelessReason?.passed).toBe(false);
    expect(homelessReason?.detail).toContain('무주택 확인 불가');
  });

  it('무주택 시작일이 있으면 무주택 조건에서 합격이다', () => {
    const profile = createEligibleProfile({ homeless_start_date: '2020-01-01' });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    const homelessReason = result.reasons.find((r) => r.rule_key === 'newlywed_homeless_status');
    expect(homelessReason?.passed).toBe(true);
    expect(homelessReason?.detail).toContain('무주택 세대구성원 요건 충족');
  });

  it('무주택 시작일이 null이면 전체 결과는 ineligible이다', () => {
    const profile = createEligibleProfile({ homeless_start_date: null });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    expect(result.result).toBe('ineligible');
  });
});

// ─── checkIncomeLimit ─────────────────────────────────────

describe('신혼부부 소득기준 판정', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('소득이 null이면 소득 조건에서 불합격이다', () => {
    const profile = createEligibleProfile({ monthly_income_krw: null });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    const incomeReason = result.reasons.find((r) => r.rule_key === 'newlywed_income');
    expect(incomeReason?.passed).toBe(false);
    expect(incomeReason?.detail).toContain('월평균 소득 미입력');
  });

  it('소득이 기준(7,094,205원) 초과이면 불합격이다', () => {
    const profile = createEligibleProfile({ monthly_income_krw: 8_000_000 });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    const incomeReason = result.reasons.find((r) => r.rule_key === 'newlywed_income');
    expect(incomeReason?.passed).toBe(false);
    expect(incomeReason?.detail).toContain('초과');
  });

  it('소득이 기준 이하이면 합격이다', () => {
    const profile = createEligibleProfile({ monthly_income_krw: 5_000_000 });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    const incomeReason = result.reasons.find((r) => r.rule_key === 'newlywed_income');
    expect(incomeReason?.passed).toBe(true);
    expect(incomeReason?.detail).toContain('이하 충족');
  });

  it('소득이 기준과 정확히 동일하면 합격이다', () => {
    const profile = createEligibleProfile({ monthly_income_krw: 7_094_205 });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    const incomeReason = result.reasons.find((r) => r.rule_key === 'newlywed_income');
    expect(incomeReason?.passed).toBe(true);
  });

  it('소득 null이면 전체 결과는 ineligible이다', () => {
    const profile = createEligibleProfile({ monthly_income_krw: null });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    expect(result.result).toBe('ineligible');
  });
});

// ─── 복합 불합격 케이스 ────────────────────────────────────

describe('신혼부부 복합 불합격 케이스', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('혼인기간 초과 + 소득 초과이면 ineligible이다', () => {
    const profile = createEligibleProfile({
      marriage_date: '2018-01-01',
      monthly_income_krw: 9_000_000,
    });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    expect(result.result).toBe('ineligible');
    const failedReasons = result.reasons.filter((r) => !r.passed);
    expect(failedReasons.length).toBeGreaterThanOrEqual(2);
  });

  it('모든 조건 불충족이면 판정 근거 3개 모두 passed가 false이다', () => {
    const profile = createEligibleProfile({
      marital_status: 'single',
      marriage_date: null,
      homeless_start_date: null,
      monthly_income_krw: null,
    });
    const result = newlywedRule.evaluate(profile, createMockComplex(), []);
    expect(result.result).toBe('ineligible');
    result.reasons.forEach((reason) => {
      expect(reason.passed).toBe(false);
    });
  });
});

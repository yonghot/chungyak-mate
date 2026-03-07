import { describe, it, expect } from 'vitest';
import {
  profileStep1Schema,
  profileStep2Schema,
  profileStep3Schema,
  profileStep4Schema,
  fullProfileSchema,
  profileUpdateSchema,
} from '@/lib/validations/profile';

// ─── profileStep1Schema ────────────────────────────────────

describe('profileStep1Schema', () => {
  it('유효한 이름과 생년월일을 검증한다', () => {
    const result = profileStep1Schema.safeParse({
      name: '홍길동',
      birth_date: '1990-06-15',
    });
    expect(result.success).toBe(true);
  });

  it('이름이 2자 미만이면 실패한다', () => {
    const result = profileStep1Schema.safeParse({
      name: '홍',
      birth_date: '1990-06-15',
    });
    expect(result.success).toBe(false);
  });

  it('이름이 50자 초과이면 실패한다', () => {
    const result = profileStep1Schema.safeParse({
      name: '가'.repeat(51),
      birth_date: '1990-06-15',
    });
    expect(result.success).toBe(false);
  });

  it('이름이 정확히 50자이면 성공한다', () => {
    const result = profileStep1Schema.safeParse({
      name: '가'.repeat(50),
      birth_date: '1990-06-15',
    });
    expect(result.success).toBe(true);
  });

  it('날짜 형식이 잘못되면 실패한다', () => {
    const result = profileStep1Schema.safeParse({
      name: '홍길동',
      birth_date: '1990/06/15',
    });
    expect(result.success).toBe(false);
  });

  it('유효한 전화번호를 포함한 입력을 검증한다', () => {
    const result = profileStep1Schema.safeParse({
      name: '홍길동',
      birth_date: '1990-06-15',
      phone: '010-1234-5678',
    });
    expect(result.success).toBe(true);
  });

  it('잘못된 전화번호 형식이면 실패한다', () => {
    const result = profileStep1Schema.safeParse({
      name: '홍길동',
      birth_date: '1990-06-15',
      phone: '01012345678',
    });
    expect(result.success).toBe(false);
  });

  it('전화번호가 null이면 성공한다', () => {
    const result = profileStep1Schema.safeParse({
      name: '홍길동',
      birth_date: '1990-06-15',
      phone: null,
    });
    expect(result.success).toBe(true);
  });
});

// ─── profileStep2Schema ────────────────────────────────────

describe('profileStep2Schema', () => {
  it('미혼 상태의 유효한 입력을 검증한다', () => {
    const result = profileStep2Schema.safeParse({
      is_household_head: true,
      marital_status: 'single',
      dependents_count: 0,
    });
    expect(result.success).toBe(true);
  });

  it('기혼 상태에 혼인 날짜를 포함한 입력을 검증한다', () => {
    const result = profileStep2Schema.safeParse({
      is_household_head: true,
      marital_status: 'married',
      marriage_date: '2020-03-01',
      dependents_count: 1,
    });
    expect(result.success).toBe(true);
  });

  it('기혼 상태에 혼인 날짜가 없으면 실패한다', () => {
    const result = profileStep2Schema.safeParse({
      is_household_head: true,
      marital_status: 'married',
      marriage_date: null,
      dependents_count: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const marriageDateError = result.error.issues.find(
        (issue) => issue.path.includes('marriage_date'),
      );
      expect(marriageDateError).toBeDefined();
    }
  });

  it('부양가족 수가 음수이면 실패한다', () => {
    const result = profileStep2Schema.safeParse({
      is_household_head: false,
      marital_status: 'single',
      dependents_count: -1,
    });
    expect(result.success).toBe(false);
  });

  it('부양가족 수가 20을 초과하면 실패한다', () => {
    const result = profileStep2Schema.safeParse({
      is_household_head: false,
      marital_status: 'single',
      dependents_count: 21,
    });
    expect(result.success).toBe(false);
  });

  it('부양가족 수가 정확히 20이면 성공한다', () => {
    const result = profileStep2Schema.safeParse({
      is_household_head: false,
      marital_status: 'single',
      dependents_count: 20,
    });
    expect(result.success).toBe(true);
  });

  it('잘못된 혼인 상태 값이면 실패한다', () => {
    const result = profileStep2Schema.safeParse({
      is_household_head: true,
      marital_status: 'unknown',
      dependents_count: 0,
    });
    expect(result.success).toBe(false);
  });

  it('이혼 상태를 검증한다', () => {
    const result = profileStep2Schema.safeParse({
      is_household_head: true,
      marital_status: 'divorced',
      dependents_count: 0,
    });
    expect(result.success).toBe(true);
  });

  it('사별 상태를 검증한다', () => {
    const result = profileStep2Schema.safeParse({
      is_household_head: false,
      marital_status: 'widowed',
      dependents_count: 2,
    });
    expect(result.success).toBe(true);
  });
});

// ─── profileStep3Schema ────────────────────────────────────

describe('profileStep3Schema', () => {
  it('자산 정보가 모두 null인 입력을 검증한다', () => {
    const result = profileStep3Schema.safeParse({
      total_assets_krw: null,
      monthly_income_krw: null,
      car_value_krw: null,
    });
    expect(result.success).toBe(true);
  });

  it('유효한 자산 정보를 검증한다', () => {
    const result = profileStep3Schema.safeParse({
      total_assets_krw: 300_000_000,
      monthly_income_krw: 5_000_000,
      car_value_krw: 15_000_000,
    });
    expect(result.success).toBe(true);
  });

  it('음수 자산이면 실패한다', () => {
    const result = profileStep3Schema.safeParse({
      total_assets_krw: -1,
      monthly_income_krw: null,
      car_value_krw: null,
    });
    expect(result.success).toBe(false);
  });

  it('소수 금액이면 실패한다', () => {
    const result = profileStep3Schema.safeParse({
      total_assets_krw: 1000.5,
      monthly_income_krw: null,
      car_value_krw: null,
    });
    expect(result.success).toBe(false);
  });

  it('빈 객체를 검증하면 모두 undefined로 성공한다', () => {
    const result = profileStep3Schema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ─── profileStep4Schema ────────────────────────────────────

describe('profileStep4Schema', () => {
  it('당첨 이력 없는 기본 입력을 검증한다', () => {
    const result = profileStep4Schema.safeParse({
      has_won_before: false,
    });
    expect(result.success).toBe(true);
  });

  it('당첨 이력이 있고 날짜가 있으면 성공한다', () => {
    const result = profileStep4Schema.safeParse({
      has_won_before: true,
      won_date: '2022-05-10',
    });
    expect(result.success).toBe(true);
  });

  it('당첨 이력이 있는데 날짜가 null이면 실패한다', () => {
    const result = profileStep4Schema.safeParse({
      has_won_before: true,
      won_date: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const wonDateError = result.error.issues.find(
        (issue) => issue.path.includes('won_date'),
      );
      expect(wonDateError).toBeDefined();
    }
  });

  it('유효한 청약통장 유형을 검증한다', () => {
    const result = profileStep4Schema.safeParse({
      subscription_type: 'savings',
      subscription_start_date: '2018-01-01',
      deposit_count: 60,
      has_won_before: false,
    });
    expect(result.success).toBe(true);
  });

  it('잘못된 청약통장 유형이면 실패한다', () => {
    const result = profileStep4Schema.safeParse({
      subscription_type: 'invalid_type',
      has_won_before: false,
    });
    expect(result.success).toBe(false);
  });

  it('납입 횟수가 음수이면 실패한다', () => {
    const result = profileStep4Schema.safeParse({
      deposit_count: -1,
      has_won_before: false,
    });
    expect(result.success).toBe(false);
  });
});

// ─── fullProfileSchema ─────────────────────────────────────

describe('fullProfileSchema', () => {
  function createValidFullProfile() {
    return {
      name: '홍길동',
      birth_date: '1990-06-15',
      is_household_head: true,
      marital_status: 'single' as const,
      dependents_count: 0,
      has_won_before: false,
    };
  }

  it('최소 유효 필드로 전체 프로필을 검증한다', () => {
    const result = fullProfileSchema.safeParse(createValidFullProfile());
    expect(result.success).toBe(true);
  });

  it('기혼 상태에 혼인 날짜가 없으면 실패한다', () => {
    const result = fullProfileSchema.safeParse({
      ...createValidFullProfile(),
      marital_status: 'married',
      marriage_date: null,
    });
    expect(result.success).toBe(false);
  });

  it('기혼 상태에 혼인 날짜가 있으면 성공한다', () => {
    const result = fullProfileSchema.safeParse({
      ...createValidFullProfile(),
      marital_status: 'married',
      marriage_date: '2020-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('당첨 이력이 있는데 날짜가 없으면 실패한다', () => {
    const result = fullProfileSchema.safeParse({
      ...createValidFullProfile(),
      has_won_before: true,
      won_date: null,
    });
    expect(result.success).toBe(false);
  });

  it('당첨 이력이 있고 날짜가 있으면 성공한다', () => {
    const result = fullProfileSchema.safeParse({
      ...createValidFullProfile(),
      has_won_before: true,
      won_date: '2021-07-20',
    });
    expect(result.success).toBe(true);
  });
});

// ─── profileUpdateSchema ──────────────────────────────────

describe('profileUpdateSchema', () => {
  it('빈 객체를 부분 업데이트로 검증한다', () => {
    const result = profileUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('이름만 포함한 부분 업데이트를 검증한다', () => {
    const result = profileUpdateSchema.safeParse({ name: '김철수' });
    expect(result.success).toBe(true);
  });

  it('유효하지 않은 이름으로 부분 업데이트하면 실패한다', () => {
    const result = profileUpdateSchema.safeParse({ name: '김' });
    expect(result.success).toBe(false);
  });

  it('월소득만 포함한 부분 업데이트를 검증한다', () => {
    const result = profileUpdateSchema.safeParse({ monthly_income_krw: 4_000_000 });
    expect(result.success).toBe(true);
  });
});

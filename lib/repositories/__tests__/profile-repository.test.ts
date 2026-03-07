/**
 * profile-repository 단위 테스트 — calculateCompletion 순수 함수
 *
 * 테스트 대상: lib/repositories/profile-repository.ts
 * 전략: calculateCompletion은 외부 의존성 없는 순수 함수이므로 모킹 불필요
 *
 * COMPLETION_WEIGHTS (총합 100):
 *   name: 10, birth_date: 10, marital_status: 10,
 *   is_household_head: 5, dependents_count: 5,
 *   homeless_start_date: 10, total_assets_krw: 10,
 *   monthly_income_krw: 10, car_value_krw: 5,
 *   subscription_type: 10, subscription_start_date: 5,
 *   deposit_count: 5, has_won_before: 5
 */

import { describe, it, expect } from 'vitest';
import { calculateCompletion } from '@/lib/repositories/profile-repository';
import type { ProfileInsert } from '@/types/database';

// ─── 테스트 데이터 팩토리 ─────────────────────────────────────────────────

/**
 * 모든 가중치 필드가 채워진 완전한 프로필을 생성한다.
 * ProfileInsert 기준: id, name, birth_date, marital_status는 필수이다.
 */
function createFullProfile(override: Partial<ProfileInsert> = {}): ProfileInsert {
  return {
    id: 'user-uuid-001',
    name: '홍길동',
    birth_date: '1990-01-01',
    marital_status: 'single',
    is_household_head: true,
    dependents_count: 2,
    homeless_start_date: '2020-01-01',
    total_assets_krw: 100_000_000,
    monthly_income_krw: 3_000_000,
    car_value_krw: 15_000_000,
    subscription_type: 'savings',
    subscription_start_date: '2015-01-01',
    deposit_count: 10,
    has_won_before: false,
    ...override,
  };
}

/**
 * 필수 필드(name, birth_date, marital_status)만 채운 최소 프로필을 생성한다.
 * 나머지 선택 필드는 undefined로 두어 가중치를 얻지 못한다.
 */
function createMinimalProfile(override: Partial<ProfileInsert> = {}): ProfileInsert {
  return {
    id: 'user-uuid-002',
    name: '홍길동',
    birth_date: '1990-01-01',
    marital_status: 'single',
    ...override,
  };
}

// ─── 테스트 ──────────────────────────────────────────────────────────────

describe('calculateCompletion', () => {
  // ── 기본 완성도 케이스 ──────────────────────────────────────────────

  describe('전체 완성도', () => {
    it('모든 가중치 필드가 채워진 경우 100을 반환한다', () => {
      const profile = createFullProfile();

      expect(calculateCompletion(profile)).toBe(100);
    });

    it('가중치 필드가 하나도 없는 빈 객체는 0을 반환한다', () => {
      expect(calculateCompletion({})).toBe(0);
    });
  });

  // ── 필수 필드만 채운 경우 ───────────────────────────────────────────

  describe('필수 필드만 채운 경우', () => {
    it('name(10) + birth_date(10) + marital_status(10) = 30을 반환한다', () => {
      const profile = createMinimalProfile();

      expect(calculateCompletion(profile)).toBe(30);
    });
  });

  // ── null 값 처리 ────────────────────────────────────────────────────

  describe('null 값 처리', () => {
    it('null 필드는 가중치를 얻지 못한다', () => {
      // total_assets_krw를 null로 설정 → 100에서 10점 차감 → 90
      const profile = createFullProfile({ total_assets_krw: null });

      expect(calculateCompletion(profile)).toBe(90);
    });

    it('nullable 필드가 모두 null인 경우 필수 필드 점수만 반환한다', () => {
      // nullable 필드: homeless_start_date, total_assets_krw, monthly_income_krw,
      //   car_value_krw, subscription_type, subscription_start_date, deposit_count
      // null이 되면 차감되는 가중치: 10+10+10+5+10+5+5 = 55
      // 남는 점수: 100 - 55 = 45
      const profile = createFullProfile({
        homeless_start_date: null,
        total_assets_krw: null,
        monthly_income_krw: null,
        car_value_krw: null,
        subscription_type: null,
        subscription_start_date: null,
        deposit_count: null,
      });

      expect(calculateCompletion(profile)).toBe(45);
    });
  });

  // ── 빈 문자열 처리 ──────────────────────────────────────────────────

  describe('빈 문자열 처리', () => {
    it('빈 문자열 필드는 가중치를 얻지 못한다', () => {
      // name을 빈 문자열로 설정 → 100에서 10점 차감 → 90
      const profile = createFullProfile({ name: '' });

      expect(calculateCompletion(profile)).toBe(90);
    });
  });

  // ── 각 가중치 필드별 개별 테스트 ────────────────────────────────────

  describe('개별 필드 가중치', () => {
    it('name 필드만 채우면 10을 반환한다', () => {
      expect(calculateCompletion({ name: '홍길동' })).toBe(10);
    });

    it('birth_date 필드만 채우면 10을 반환한다', () => {
      expect(calculateCompletion({ birth_date: '1990-01-01' })).toBe(10);
    });

    it('marital_status 필드만 채우면 10을 반환한다', () => {
      expect(calculateCompletion({ marital_status: 'single' })).toBe(10);
    });

    it('is_household_head 필드만 채우면 5를 반환한다', () => {
      // false도 값이 있으므로 가중치 부여 (null/undefined/'' 이 아님)
      expect(calculateCompletion({ is_household_head: false })).toBe(5);
    });

    it('dependents_count 필드만 채우면 5를 반환한다', () => {
      // 0도 값이 있으므로 가중치 부여
      expect(calculateCompletion({ dependents_count: 0 })).toBe(5);
    });

    it('homeless_start_date 필드만 채우면 10을 반환한다', () => {
      expect(calculateCompletion({ homeless_start_date: '2020-01-01' })).toBe(10);
    });

    it('total_assets_krw 필드만 채우면 10을 반환한다', () => {
      expect(calculateCompletion({ total_assets_krw: 50_000_000 })).toBe(10);
    });

    it('monthly_income_krw 필드만 채우면 10을 반환한다', () => {
      expect(calculateCompletion({ monthly_income_krw: 2_500_000 })).toBe(10);
    });

    it('car_value_krw 필드만 채우면 5를 반환한다', () => {
      expect(calculateCompletion({ car_value_krw: 10_000_000 })).toBe(5);
    });

    it('subscription_type 필드만 채우면 10을 반환한다', () => {
      expect(calculateCompletion({ subscription_type: 'savings' })).toBe(10);
    });

    it('subscription_start_date 필드만 채우면 5를 반환한다', () => {
      expect(calculateCompletion({ subscription_start_date: '2015-06-01' })).toBe(5);
    });

    it('deposit_count 필드만 채우면 5를 반환한다', () => {
      expect(calculateCompletion({ deposit_count: 24 })).toBe(5);
    });

    it('has_won_before 필드만 채우면 5를 반환한다', () => {
      expect(calculateCompletion({ has_won_before: false })).toBe(5);
    });
  });

  // ── 반올림 동작 ─────────────────────────────────────────────────────

  describe('반올림 동작', () => {
    it('가중치 합계가 총합의 정수 배분에 맞게 Math.round를 적용한다', () => {
      // TOTAL_WEIGHT = 100이므로 earned/100*100 = earned 그대로 → 반올림 불필요 케이스
      // name(10) + birth_date(10) = 20점 → 20% → 20
      const profile = createMinimalProfile({ marital_status: undefined as unknown as 'single' });
      // marital_status를 undefined로 강제하여 name+birth_date만 남기면 20점
      expect(calculateCompletion({ name: '홍길동', birth_date: '1990-01-01' })).toBe(20);
    });
  });
});

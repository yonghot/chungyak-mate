/**
 * profile-service 단위 테스트
 *
 * 테스트 대상: lib/services/profile-service.ts
 * 전략: profile-repository를 vi.mock()으로 격리하여 서비스 로직만 검증
 *
 * 완성도 기준: 80% 이상이면 isComplete: true
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Profile } from '@/types/database';

// ─── 외부 의존성 모킹 ─────────────────────────────────────────────────────

vi.mock('@/lib/repositories/profile-repository', () => ({
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ─── 모킹된 모듈 import ───────────────────────────────────────────────────

import * as profileRepo from '@/lib/repositories/profile-repository';
import {
  getProfile,
  createProfile,
  updateProfile,
  isProfileComplete,
} from '@/lib/services/profile-service';

// ─── 테스트 데이터 팩토리 ─────────────────────────────────────────────────

/**
 * 기본 Profile Row를 생성한다.
 * profile_completion을 외부에서 지정하여 완성도 시나리오를 제어한다.
 */
function createProfile_fixture(override: Partial<Profile> = {}): Profile {
  return {
    id: 'user-001',
    name: '홍길동',
    birth_date: '1990-01-01',
    phone: '010-1234-5678',
    is_household_head: true,
    marital_status: 'single',
    marriage_date: null,
    dependents_count: 0,
    homeless_start_date: '2020-01-01',
    total_assets_krw: 50_000_000,
    monthly_income_krw: 3_000_000,
    car_value_krw: null,
    subscription_type: 'savings',
    subscription_start_date: '2018-01-01',
    deposit_count: 24,
    has_won_before: false,
    won_date: null,
    profile_completion: 85,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...override,
  };
}

// ─── 타입 단언 헬퍼 ──────────────────────────────────────────────────────

const mockGetById = profileRepo.getById as ReturnType<typeof vi.fn>;
const mockCreate = profileRepo.create as ReturnType<typeof vi.fn>;
const mockUpdate = profileRepo.update as ReturnType<typeof vi.fn>;

/** SupabaseDb 자리표시자 (서비스 내에서 레포지토리로 그대로 전달됨) */
const fakeSupabase = {} as Parameters<typeof getProfile>[0];

// ─── 테스트 ──────────────────────────────────────────────────────────────

describe('getProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('프로필이 존재하면 profile, completion, isComplete를 포함한 객체를 반환한다', async () => {
    const profile = createProfile_fixture({ profile_completion: 85 });
    mockGetById.mockResolvedValue({ data: profile, error: null });

    const result = await getProfile(fakeSupabase, 'user-001');

    expect(result).not.toBeNull();
    expect(result?.profile).toEqual(profile);
    expect(result?.completion).toBe(85);
    expect(result?.isComplete).toBe(true);
  });

  it('profile_completion이 80이면 isComplete가 true이다', async () => {
    const profile = createProfile_fixture({ profile_completion: 80 });
    mockGetById.mockResolvedValue({ data: profile, error: null });

    const result = await getProfile(fakeSupabase, 'user-001');

    expect(result?.isComplete).toBe(true);
  });

  it('profile_completion이 79이면 isComplete가 false이다', async () => {
    const profile = createProfile_fixture({ profile_completion: 79 });
    mockGetById.mockResolvedValue({ data: profile, error: null });

    const result = await getProfile(fakeSupabase, 'user-001');

    expect(result?.isComplete).toBe(false);
  });

  it('리포지토리가 data: null을 반환하면 null을 반환한다', async () => {
    mockGetById.mockResolvedValue({ data: null, error: null });

    const result = await getProfile(fakeSupabase, 'user-001');

    expect(result).toBeNull();
  });

  it('리포지토리가 error를 반환하면 null을 반환한다', async () => {
    mockGetById.mockResolvedValue({ data: null, error: 'DB 조회 실패' });

    const result = await getProfile(fakeSupabase, 'user-001');

    expect(result).toBeNull();
  });
});

describe('createProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('생성 성공 시 profile, completion, isComplete를 포함한 객체를 반환한다', async () => {
    const profile = createProfile_fixture({ profile_completion: 90 });
    mockCreate.mockResolvedValue({ data: profile, error: null });

    const insertData = {
      name: '홍길동',
      birth_date: '1990-01-01',
      marital_status: 'single' as const,
    };

    const result = await createProfile(fakeSupabase, 'user-001', insertData);

    expect(result).not.toBeNull();
    expect(result?.profile).toEqual(profile);
    expect(result?.completion).toBe(90);
    expect(result?.isComplete).toBe(true);
  });

  it('생성된 프로필의 completion이 80 미만이면 isComplete가 false이다', async () => {
    const profile = createProfile_fixture({ profile_completion: 50 });
    mockCreate.mockResolvedValue({ data: profile, error: null });

    const result = await createProfile(fakeSupabase, 'user-001', {
      name: '홍길동',
      birth_date: '1990-01-01',
      marital_status: 'single' as const,
    });

    expect(result?.isComplete).toBe(false);
  });

  it('리포지토리가 error를 반환하면 null을 반환한다', async () => {
    mockCreate.mockResolvedValue({ data: null, error: 'INSERT 실패' });

    const result = await createProfile(fakeSupabase, 'user-001', {
      name: '홍길동',
      birth_date: '1990-01-01',
      marital_status: 'single' as const,
    });

    expect(result).toBeNull();
  });

  it('리포지토리가 data: null을 반환하면 null을 반환한다', async () => {
    mockCreate.mockResolvedValue({ data: null, error: null });

    const result = await createProfile(fakeSupabase, 'user-001', {
      name: '홍길동',
      birth_date: '1990-01-01',
      marital_status: 'single' as const,
    });

    expect(result).toBeNull();
  });

  it('userId를 id 필드로 포함하여 리포지토리를 호출한다', async () => {
    const profile = createProfile_fixture({ id: 'user-999', profile_completion: 85 });
    mockCreate.mockResolvedValue({ data: profile, error: null });

    await createProfile(fakeSupabase, 'user-999', {
      name: '테스트',
      birth_date: '1995-06-01',
      marital_status: 'married' as const,
    });

    expect(mockCreate).toHaveBeenCalledWith(
      fakeSupabase,
      expect.objectContaining({ id: 'user-999' }),
    );
  });
});

describe('updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('업데이트 성공 시 profile, completion, isComplete를 포함한 객체를 반환한다', async () => {
    const profile = createProfile_fixture({ profile_completion: 95 });
    mockUpdate.mockResolvedValue({ data: profile, error: null });

    const result = await updateProfile(fakeSupabase, 'user-001', {
      monthly_income_krw: 5_000_000,
    });

    expect(result).not.toBeNull();
    expect(result?.profile).toEqual(profile);
    expect(result?.completion).toBe(95);
    expect(result?.isComplete).toBe(true);
  });

  it('업데이트 후 completion이 80 미만이면 isComplete가 false이다', async () => {
    const profile = createProfile_fixture({ profile_completion: 60 });
    mockUpdate.mockResolvedValue({ data: profile, error: null });

    const result = await updateProfile(fakeSupabase, 'user-001', {
      name: '김철수',
    });

    expect(result?.isComplete).toBe(false);
  });

  it('리포지토리가 error를 반환하면 null을 반환한다', async () => {
    mockUpdate.mockResolvedValue({ data: null, error: 'UPDATE 실패' });

    const result = await updateProfile(fakeSupabase, 'user-001', {
      name: '김철수',
    });

    expect(result).toBeNull();
  });

  it('리포지토리가 data: null을 반환하면 null을 반환한다', async () => {
    mockUpdate.mockResolvedValue({ data: null, error: null });

    const result = await updateProfile(fakeSupabase, 'user-001', {
      name: '김철수',
    });

    expect(result).toBeNull();
  });

  it('올바른 userId와 업데이트 데이터를 리포지토리에 전달한다', async () => {
    const profile = createProfile_fixture({ profile_completion: 85 });
    mockUpdate.mockResolvedValue({ data: profile, error: null });

    await updateProfile(fakeSupabase, 'user-001', {
      monthly_income_krw: 4_000_000,
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      fakeSupabase,
      'user-001',
      expect.objectContaining({ monthly_income_krw: 4_000_000 }),
    );
  });
});

describe('isProfileComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completion이 80 이상이면 true를 반환한다', async () => {
    const profile = createProfile_fixture({ profile_completion: 80 });
    mockGetById.mockResolvedValue({ data: profile, error: null });

    const result = await isProfileComplete(fakeSupabase, 'user-001');

    expect(result).toBe(true);
  });

  it('completion이 100이면 true를 반환한다', async () => {
    const profile = createProfile_fixture({ profile_completion: 100 });
    mockGetById.mockResolvedValue({ data: profile, error: null });

    const result = await isProfileComplete(fakeSupabase, 'user-001');

    expect(result).toBe(true);
  });

  it('completion이 79이면 false를 반환한다', async () => {
    const profile = createProfile_fixture({ profile_completion: 79 });
    mockGetById.mockResolvedValue({ data: profile, error: null });

    const result = await isProfileComplete(fakeSupabase, 'user-001');

    expect(result).toBe(false);
  });

  it('completion이 0이면 false를 반환한다', async () => {
    const profile = createProfile_fixture({ profile_completion: 0 });
    mockGetById.mockResolvedValue({ data: profile, error: null });

    const result = await isProfileComplete(fakeSupabase, 'user-001');

    expect(result).toBe(false);
  });

  it('프로필이 존재하지 않으면 false를 반환한다', async () => {
    mockGetById.mockResolvedValue({ data: null, error: null });

    const result = await isProfileComplete(fakeSupabase, 'user-001');

    expect(result).toBe(false);
  });

  it('리포지토리가 error를 반환하면 false를 반환한다', async () => {
    mockGetById.mockResolvedValue({ data: null, error: '조회 오류' });

    const result = await isProfileComplete(fakeSupabase, 'user-001');

    expect(result).toBe(false);
  });
});

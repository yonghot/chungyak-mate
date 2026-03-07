/**
 * auth-service 단위 테스트
 *
 * 테스트 대상: lib/services/auth-service.ts
 * 전략: supabase.auth.getUser()를 인라인 모킹으로 격리
 *       logger는 vi.mock()으로 무음 처리
 *
 * 함수별 동작 요약:
 * - getCurrentUser: 인증 성공 → User 반환, 미인증 또는 에러 → null 반환
 * - requireAuth: 인증 성공 → user.id 반환, 미인증 → Error('AUTH_REQUIRED') throw
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '@supabase/supabase-js';

// ─── 외부 의존성 모킹 ─────────────────────────────────────────────────────

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ─── 테스트 대상 import ───────────────────────────────────────────────────

import { getCurrentUser, requireAuth } from '@/lib/services/auth-service';

// ─── 테스트 데이터 팩토리 ─────────────────────────────────────────────────

/**
 * 최소 유효한 Supabase User 객체를 생성한다.
 */
function createUser(override: Partial<User> = {}): User {
  return {
    id: 'user-uuid-001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    phone: '',
    confirmed_at: '2026-01-01T00:00:00.000Z',
    last_sign_in_at: '2026-03-01T00:00:00.000Z',
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
    ...override,
  };
}

/**
 * supabase 클라이언트 mock 객체를 생성한다.
 * auth.getUser()의 반환값을 테스트별로 주입한다.
 */
function createSupabaseMock(getUserResult: {
  data: { user: User | null };
  error: { message: string } | null;
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(getUserResult),
    },
  };
}

// ─── 테스트 ──────────────────────────────────────────────────────────────

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증된 사용자가 있으면 User 객체를 반환한다', async () => {
    const user = createUser();
    const supabase = createSupabaseMock({ data: { user }, error: null });

    const result = await getCurrentUser(supabase as never);

    expect(result).toEqual(user);
  });

  it('supabase.auth.getUser가 user: null을 반환하면 null을 반환한다', async () => {
    const supabase = createSupabaseMock({ data: { user: null }, error: null });

    const result = await getCurrentUser(supabase as never);

    expect(result).toBeNull();
  });

  it('supabase.auth.getUser에서 에러가 발생하면 null을 반환한다', async () => {
    const supabase = createSupabaseMock({
      data: { user: null },
      error: { message: 'JWT expired' },
    });

    const result = await getCurrentUser(supabase as never);

    expect(result).toBeNull();
  });

  it('에러 발생 시 logger.error를 호출한다', async () => {
    const { logger } = await import('@/lib/utils/logger');
    const supabase = createSupabaseMock({
      data: { user: null },
      error: { message: 'session not found' },
    });

    await getCurrentUser(supabase as never);

    expect(logger.error).toHaveBeenCalledWith(
      'auth-service.getCurrentUser failed',
      expect.objectContaining({ error: 'session not found' }),
    );
  });
});

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증된 사용자가 있으면 user.id 문자열을 반환한다', async () => {
    const user = createUser({ id: 'user-uuid-abc' });
    const supabase = createSupabaseMock({ data: { user }, error: null });

    const userId = await requireAuth(supabase as never);

    expect(userId).toBe('user-uuid-abc');
  });

  it('user가 null이면 Error("AUTH_REQUIRED")를 throw한다', async () => {
    const supabase = createSupabaseMock({ data: { user: null }, error: null });

    await expect(requireAuth(supabase as never)).rejects.toThrow('AUTH_REQUIRED');
  });

  it('getUser에서 에러가 발생하면 Error("AUTH_REQUIRED")를 throw한다', async () => {
    // getCurrentUser가 에러 시 null을 반환하고, requireAuth가 null이면 throw한다
    const supabase = createSupabaseMock({
      data: { user: null },
      error: { message: 'invalid token' },
    });

    await expect(requireAuth(supabase as never)).rejects.toThrow('AUTH_REQUIRED');
  });

  it('throw된 에러 메시지가 정확히 "AUTH_REQUIRED"이다', async () => {
    const supabase = createSupabaseMock({ data: { user: null }, error: null });

    const promise = requireAuth(supabase as never);

    await expect(promise).rejects.toMatchObject({ message: 'AUTH_REQUIRED' });
  });
});

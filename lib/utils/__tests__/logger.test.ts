import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/utils/logger';

// ─── logger 메서드 호출 테스트 ─────────────────────────────

describe('logger.warn', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warn은 모든 환경에서 console.warn을 호출한다', () => {
    logger.warn('경고 메시지');
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('warn에 data를 전달하면 console.warn에 포함된다', () => {
    const data = { userId: 'abc' };
    logger.warn('경고 메시지', data);
    expect(console.warn).toHaveBeenCalledTimes(1);
    const call = vi.mocked(console.warn).mock.calls[0];
    expect(call[1]).toBe(data);
  });

  it('warn의 메시지에 [WARN] 접두사가 포함된다', () => {
    logger.warn('테스트 경고');
    const call = vi.mocked(console.warn).mock.calls[0];
    expect(call[0]).toContain('[WARN]');
    expect(call[0]).toContain('테스트 경고');
  });

  it('data 없이 warn을 호출하면 두 번째 인자는 빈 문자열이다', () => {
    logger.warn('경고만');
    const call = vi.mocked(console.warn).mock.calls[0];
    expect(call[1]).toBe('');
  });
});

describe('logger.error', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('error는 모든 환경에서 console.error를 호출한다', () => {
    logger.error('에러 메시지');
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('error에 Error 객체를 전달한다', () => {
    const err = new Error('테스트 에러');
    logger.error('에러 발생', err);
    expect(console.error).toHaveBeenCalledTimes(1);
    const call = vi.mocked(console.error).mock.calls[0];
    expect(call[1]).toBe(err);
  });

  it('error의 메시지에 [ERROR] 접두사가 포함된다', () => {
    logger.error('치명적 오류');
    const call = vi.mocked(console.error).mock.calls[0];
    expect(call[0]).toContain('[ERROR]');
    expect(call[0]).toContain('치명적 오류');
  });

  it('data 없이 error를 호출하면 두 번째 인자는 빈 문자열이다', () => {
    logger.error('에러만');
    const call = vi.mocked(console.error).mock.calls[0];
    expect(call[1]).toBe('');
  });
});

describe('logger.info (development 환경)', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ENV', 'development');
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('development 환경에서 info는 console.info를 호출한다', () => {
    logger.info('정보 메시지');
    expect(console.info).toHaveBeenCalledTimes(1);
  });

  it('info의 메시지에 [INFO] 접두사가 포함된다', () => {
    logger.info('프로필 로드');
    const call = vi.mocked(console.info).mock.calls[0];
    expect(call[0]).toContain('[INFO]');
    expect(call[0]).toContain('프로필 로드');
  });

  it('info에 data를 전달하면 console.info에 포함된다', () => {
    const data = { profileId: 'test-123' };
    logger.info('프로필 로드', data);
    const call = vi.mocked(console.info).mock.calls[0];
    expect(call[1]).toBe(data);
  });
});

describe('logger.debug (development 환경)', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ENV', 'development');
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('development 환경에서 debug는 console.debug를 호출한다', () => {
    logger.debug('디버그 메시지');
    expect(console.debug).toHaveBeenCalledTimes(1);
  });

  it('debug의 메시지에 [DEBUG] 접두사가 포함된다', () => {
    logger.debug('변수 확인');
    const call = vi.mocked(console.debug).mock.calls[0];
    expect(call[0]).toContain('[DEBUG]');
    expect(call[0]).toContain('변수 확인');
  });
});

describe('logger.info (production 환경)', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ENV', 'production');
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('production 환경에서 info는 console.info를 호출하지 않는다', () => {
    logger.info('정보 메시지');
    expect(console.info).not.toHaveBeenCalled();
  });
});

describe('logger.debug (production 환경)', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_ENV', 'production');
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('production 환경에서 debug는 console.debug를 호출하지 않는다', () => {
    logger.debug('디버그 메시지');
    expect(console.debug).not.toHaveBeenCalled();
  });
});

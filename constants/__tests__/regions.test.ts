import { describe, it, expect } from 'vitest';
import {
  REGIONS,
  REGION_NAMES,
  CAPITAL_REGION_CODES,
  findRegionByName,
  findRegionByCode,
  isCapitalRegion,
} from '@/constants/regions';
import type { Region, District } from '@/constants/regions';

// ─── REGIONS 상수 구조 검증 ────────────────────────────────

describe('REGIONS', () => {
  it('REGIONS 배열이 비어 있지 않다', () => {
    expect(REGIONS.length).toBeGreaterThan(0);
  });

  it('각 region은 name, code, districts 필드를 가진다', () => {
    REGIONS.forEach((region: Region) => {
      expect(region).toHaveProperty('name');
      expect(region).toHaveProperty('code');
      expect(region).toHaveProperty('districts');
    });
  });

  it('각 region의 districts는 비어 있지 않다', () => {
    REGIONS.forEach((region: Region) => {
      expect(region.districts.length).toBeGreaterThan(0);
    });
  });

  it('각 district는 name, code 필드를 가진다', () => {
    REGIONS.forEach((region: Region) => {
      region.districts.forEach((district: District) => {
        expect(district).toHaveProperty('name');
        expect(district).toHaveProperty('code');
      });
    });
  });

  it('서울특별시가 포함되어 있다', () => {
    const seoul = REGIONS.find((r) => r.name === '서울특별시');
    expect(seoul).toBeDefined();
  });

  it('서울특별시 코드는 11이다', () => {
    const seoul = REGIONS.find((r) => r.name === '서울특별시');
    expect(seoul?.code).toBe('11');
  });

  it('서울특별시에 강남구가 포함되어 있다', () => {
    const seoul = REGIONS.find((r) => r.name === '서울특별시');
    const gangnam = seoul?.districts.find((d) => d.name === '강남구');
    expect(gangnam).toBeDefined();
  });

  it('경기도가 포함되어 있다', () => {
    const gyeonggi = REGIONS.find((r) => r.name === '경기도');
    expect(gyeonggi).toBeDefined();
    expect(gyeonggi?.code).toBe('41');
  });

  it('인천광역시가 포함되어 있다', () => {
    const incheon = REGIONS.find((r) => r.name === '인천광역시');
    expect(incheon).toBeDefined();
    expect(incheon?.code).toBe('28');
  });
});

// ─── REGION_NAMES ─────────────────────────────────────────

describe('REGION_NAMES', () => {
  it('REGION_NAMES는 REGIONS의 name 목록이다', () => {
    expect(REGION_NAMES.length).toBe(REGIONS.length);
  });

  it('서울특별시가 REGION_NAMES에 포함된다', () => {
    expect(REGION_NAMES).toContain('서울특별시');
  });

  it('경기도가 REGION_NAMES에 포함된다', () => {
    expect(REGION_NAMES).toContain('경기도');
  });

  it('세종특별자치시가 REGION_NAMES에 포함된다', () => {
    expect(REGION_NAMES).toContain('세종특별자치시');
  });
});

// ─── CAPITAL_REGION_CODES ─────────────────────────────────

describe('CAPITAL_REGION_CODES', () => {
  it('수도권 코드 배열이 3개이다', () => {
    expect(CAPITAL_REGION_CODES.length).toBe(3);
  });

  it('서울(11), 경기(41), 인천(28) 코드를 포함한다', () => {
    expect(CAPITAL_REGION_CODES).toContain('11');
    expect(CAPITAL_REGION_CODES).toContain('41');
    expect(CAPITAL_REGION_CODES).toContain('28');
  });
});

// ─── findRegionByName ─────────────────────────────────────

describe('findRegionByName', () => {
  it('존재하는 시도 이름으로 Region을 반환한다', () => {
    const result = findRegionByName('서울특별시');
    expect(result).toBeDefined();
    expect(result?.name).toBe('서울특별시');
    expect(result?.code).toBe('11');
  });

  it('존재하지 않는 시도 이름이면 undefined를 반환한다', () => {
    const result = findRegionByName('존재하지않는시도');
    expect(result).toBeUndefined();
  });

  it('빈 문자열이면 undefined를 반환한다', () => {
    const result = findRegionByName('');
    expect(result).toBeUndefined();
  });

  it('부산광역시를 조회한다', () => {
    const result = findRegionByName('부산광역시');
    expect(result).toBeDefined();
    expect(result?.code).toBe('26');
  });
});

// ─── findRegionByCode ─────────────────────────────────────

describe('findRegionByCode', () => {
  it('서울 코드(11)로 Region을 반환한다', () => {
    const result = findRegionByCode('11');
    expect(result).toBeDefined();
    expect(result?.name).toBe('서울특별시');
  });

  it('경기 코드(41)로 Region을 반환한다', () => {
    const result = findRegionByCode('41');
    expect(result).toBeDefined();
    expect(result?.name).toBe('경기도');
  });

  it('존재하지 않는 코드이면 undefined를 반환한다', () => {
    const result = findRegionByCode('99');
    expect(result).toBeUndefined();
  });

  it('빈 코드이면 undefined를 반환한다', () => {
    const result = findRegionByCode('');
    expect(result).toBeUndefined();
  });
});

// ─── isCapitalRegion ──────────────────────────────────────

describe('isCapitalRegion', () => {
  it('서울(11)은 수도권이다', () => {
    expect(isCapitalRegion('11')).toBe(true);
  });

  it('경기(41)는 수도권이다', () => {
    expect(isCapitalRegion('41')).toBe(true);
  });

  it('인천(28)은 수도권이다', () => {
    expect(isCapitalRegion('28')).toBe(true);
  });

  it('부산(26)은 수도권이 아니다', () => {
    expect(isCapitalRegion('26')).toBe(false);
  });

  it('존재하지 않는 코드는 수도권이 아니다', () => {
    expect(isCapitalRegion('99')).toBe(false);
  });

  it('빈 코드는 수도권이 아니다', () => {
    expect(isCapitalRegion('')).toBe(false);
  });
});

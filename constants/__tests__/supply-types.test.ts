import { describe, it, expect } from 'vitest';
import {
  SUPPLY_TYPE_INFO,
  SUPPLY_TYPE_LIST,
  getSupplyTypeLabel,
} from '@/constants/supply-types';
import type { SupplyTypeInfo } from '@/constants/supply-types';
import type { SupplyType } from '@/types';

// ─── SUPPLY_TYPE_INFO 구조 검증 ────────────────────────────

describe('SUPPLY_TYPE_INFO', () => {
  it('7개의 공급유형 정보를 가진다', () => {
    expect(Object.keys(SUPPLY_TYPE_INFO).length).toBe(7);
  });

  it('각 항목은 type, label, description, lawReference, articleNumber를 가진다', () => {
    const types: SupplyType[] = [
      'general',
      'newlywed',
      'first_life',
      'multi_child',
      'elderly_parent',
      'institutional',
      'relocation',
    ];
    types.forEach((type) => {
      const info: SupplyTypeInfo = SUPPLY_TYPE_INFO[type];
      expect(info).toHaveProperty('type', type);
      expect(info).toHaveProperty('label');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('lawReference');
      expect(info).toHaveProperty('articleNumber');
    });
  });

  it('일반공급의 label은 일반공급이다', () => {
    expect(SUPPLY_TYPE_INFO['general'].label).toBe('일반공급');
  });

  it('신혼부부의 label은 신혼부부이다', () => {
    expect(SUPPLY_TYPE_INFO['newlywed'].label).toBe('신혼부부');
  });

  it('생애최초의 법령 조항 번호는 36이다', () => {
    expect(SUPPLY_TYPE_INFO['first_life'].articleNumber).toBe(36);
  });

  it('다자녀의 법령 조항 번호는 37이다', () => {
    expect(SUPPLY_TYPE_INFO['multi_child'].articleNumber).toBe(37);
  });

  it('노부모부양의 법령 조항 번호는 38이다', () => {
    expect(SUPPLY_TYPE_INFO['elderly_parent'].articleNumber).toBe(38);
  });

  it('기관추천의 법령 조항 번호는 39이다', () => {
    expect(SUPPLY_TYPE_INFO['institutional'].articleNumber).toBe(39);
  });

  it('이전기관의 법령 조항 번호는 40이다', () => {
    expect(SUPPLY_TYPE_INFO['relocation'].articleNumber).toBe(40);
  });

  it('각 항목의 lawReference는 주택공급에 관한 규칙을 포함한다', () => {
    Object.values(SUPPLY_TYPE_INFO).forEach((info) => {
      expect(info.lawReference).toContain('주택공급에 관한 규칙');
    });
  });

  it('각 항목의 description이 빈 문자열이 아니다', () => {
    Object.values(SUPPLY_TYPE_INFO).forEach((info) => {
      expect(info.description.length).toBeGreaterThan(0);
    });
  });
});

// ─── SUPPLY_TYPE_LIST ──────────────────────────────────────

describe('SUPPLY_TYPE_LIST', () => {
  it('7개의 공급유형을 가진다', () => {
    expect(SUPPLY_TYPE_LIST.length).toBe(7);
  });

  it('general이 첫 번째 항목이다', () => {
    expect(SUPPLY_TYPE_LIST[0]).toBe('general');
  });

  it('모든 SUPPLY_TYPE_INFO 키가 SUPPLY_TYPE_LIST에 포함된다', () => {
    const infoKeys = Object.keys(SUPPLY_TYPE_INFO) as SupplyType[];
    infoKeys.forEach((key) => {
      expect(SUPPLY_TYPE_LIST).toContain(key);
    });
  });

  it('newlywed가 포함된다', () => {
    expect(SUPPLY_TYPE_LIST).toContain('newlywed');
  });

  it('relocation이 마지막 항목이다', () => {
    expect(SUPPLY_TYPE_LIST[SUPPLY_TYPE_LIST.length - 1]).toBe('relocation');
  });
});

// ─── getSupplyTypeLabel ────────────────────────────────────

describe('getSupplyTypeLabel', () => {
  it('일반공급 라벨을 반환한다', () => {
    expect(getSupplyTypeLabel('general')).toBe('일반공급');
  });

  it('신혼부부 라벨을 반환한다', () => {
    expect(getSupplyTypeLabel('newlywed')).toBe('신혼부부');
  });

  it('생애최초 라벨을 반환한다', () => {
    expect(getSupplyTypeLabel('first_life')).toBe('생애최초');
  });

  it('다자녀 라벨을 반환한다', () => {
    expect(getSupplyTypeLabel('multi_child')).toBe('다자녀');
  });

  it('노부모부양 라벨을 반환한다', () => {
    expect(getSupplyTypeLabel('elderly_parent')).toBe('노부모부양');
  });

  it('기관추천 라벨을 반환한다', () => {
    expect(getSupplyTypeLabel('institutional')).toBe('기관추천');
  });

  it('이전기관 라벨을 반환한다', () => {
    expect(getSupplyTypeLabel('relocation')).toBe('이전기관');
  });
});

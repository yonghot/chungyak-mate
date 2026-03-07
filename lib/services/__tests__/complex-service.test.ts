/**
 * complex-service 단위 테스트
 *
 * 테스트 대상: lib/services/complex-service.ts
 * 전략: complex-repository를 vi.mock()으로 격리하여 서비스 로직만 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Complex, SupplyTypeRow } from '@/types/database';
import type { ComplexListFilters, ComplexWithSupplyTypes } from '@/lib/repositories/complex-repository';

// ─── 외부 의존성 모킹 ─────────────────────────────────────────────────────

vi.mock('@/lib/repositories/complex-repository', () => ({
  list: vi.fn(),
  getById: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ─── 모킹된 모듈 import ───────────────────────────────────────────────────

import * as complexRepo from '@/lib/repositories/complex-repository';
import { listComplexes, getComplexDetail } from '@/lib/services/complex-service';

// ─── 테스트 데이터 팩토리 ─────────────────────────────────────────────────

/**
 * 기본 Complex Row를 생성한다.
 */
function createComplex(override: Partial<Complex> = {}): Complex {
  return {
    id: 'complex-001',
    name: '강남 푸르지오',
    region: '서울특별시',
    district: '강남구',
    address: '서울특별시 강남구 테헤란로 1',
    developer: '대우건설',
    constructor: '대우건설',
    total_units: 500,
    announcement_date: '2026-03-01',
    subscription_start: '2026-03-20',
    subscription_end: '2026-03-25',
    winner_date: '2026-04-01',
    status: 'open',
    source_url: 'https://applyhome.co.kr/test',
    raw_data: null,
    external_id: 'EXT-001',
    move_in_date: '202901',
    special_supply_start: '2026-03-10',
    special_supply_end: '2026-03-15',
    contract_start: '2026-04-10',
    contract_end: '2026-04-20',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...override,
  };
}

/**
 * 기본 SupplyTypeRow를 생성한다.
 */
function createSupplyType(override: Partial<SupplyTypeRow> = {}): SupplyTypeRow {
  return {
    id: 'supply-001',
    complex_id: 'complex-001',
    type: 'general',
    unit_count: 300,
    area_sqm: 84.99,
    price_krw: 800_000_000,
    created_at: '2026-01-01T00:00:00Z',
    ...override,
  };
}

/**
 * 페이지네이션된 단지 목록 결과를 생성한다.
 */
function createPaginatedResult(
  items: Complex[],
  options: { total?: number; page?: number; limit?: number } = {},
) {
  return {
    items,
    total: options.total ?? items.length,
    page: options.page ?? 1,
    limit: options.limit ?? 20,
  };
}

// ─── 타입 단언 헬퍼 ──────────────────────────────────────────────────────

const mockList = complexRepo.list as ReturnType<typeof vi.fn>;
const mockGetById = complexRepo.getById as ReturnType<typeof vi.fn>;

/** SupabaseDb 자리표시자 */
const fakeSupabase = {} as Parameters<typeof listComplexes>[0];

// ─── 테스트 ──────────────────────────────────────────────────────────────

describe('listComplexes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('단지 목록을 성공적으로 조회하면 PaginatedResponse를 반환한다', async () => {
    const complexes = [createComplex({ id: 'complex-001' }), createComplex({ id: 'complex-002' })];
    const paginatedData = createPaginatedResult(complexes, { total: 2 });
    mockList.mockResolvedValue({ data: paginatedData, error: null });

    const result = await listComplexes(fakeSupabase);

    expect(result).not.toBeNull();
    expect(result?.items).toHaveLength(2);
    expect(result?.total).toBe(2);
    expect(result?.page).toBe(1);
    expect(result?.limit).toBe(20);
  });

  it('items, total, page, limit 필드가 리포지토리 결과와 동일하게 매핑된다', async () => {
    const complexes = [createComplex()];
    const paginatedData = createPaginatedResult(complexes, { total: 50, page: 2, limit: 10 });
    mockList.mockResolvedValue({ data: paginatedData, error: null });

    const result = await listComplexes(fakeSupabase, { page: 2, limit: 10 });

    expect(result?.total).toBe(50);
    expect(result?.page).toBe(2);
    expect(result?.limit).toBe(10);
  });

  it('region 필터를 리포지토리에 전달한다', async () => {
    const complexes = [createComplex({ region: '경기도' })];
    mockList.mockResolvedValue({ data: createPaginatedResult(complexes), error: null });

    const filters: ComplexListFilters = { region: '경기도' };
    await listComplexes(fakeSupabase, filters);

    expect(mockList).toHaveBeenCalledWith(fakeSupabase, filters);
  });

  it('district 필터를 리포지토리에 전달한다', async () => {
    const complexes = [createComplex({ district: '성남시' })];
    mockList.mockResolvedValue({ data: createPaginatedResult(complexes), error: null });

    const filters: ComplexListFilters = { district: '성남시' };
    await listComplexes(fakeSupabase, filters);

    expect(mockList).toHaveBeenCalledWith(fakeSupabase, filters);
  });

  it('status 필터를 리포지토리에 전달한다', async () => {
    const complexes = [createComplex({ status: 'upcoming' })];
    mockList.mockResolvedValue({ data: createPaginatedResult(complexes), error: null });

    const filters: ComplexListFilters = { status: 'upcoming' };
    await listComplexes(fakeSupabase, filters);

    expect(mockList).toHaveBeenCalledWith(fakeSupabase, filters);
  });

  it('여러 필터를 동시에 적용하여 리포지토리에 전달한다', async () => {
    mockList.mockResolvedValue({ data: createPaginatedResult([]), error: null });

    const filters: ComplexListFilters = {
      region: '서울특별시',
      status: 'open',
      page: 3,
      limit: 5,
    };
    await listComplexes(fakeSupabase, filters);

    expect(mockList).toHaveBeenCalledWith(fakeSupabase, filters);
  });

  it('빈 목록도 정상적으로 반환한다', async () => {
    mockList.mockResolvedValue({ data: createPaginatedResult([], { total: 0 }), error: null });

    const result = await listComplexes(fakeSupabase);

    expect(result?.items).toHaveLength(0);
    expect(result?.total).toBe(0);
  });

  it('리포지토리가 error를 반환하면 null을 반환한다', async () => {
    mockList.mockResolvedValue({ data: null, error: '단지 목록 조회 실패' });

    const result = await listComplexes(fakeSupabase);

    expect(result).toBeNull();
  });

  it('리포지토리가 data: null을 반환하면 null을 반환한다', async () => {
    mockList.mockResolvedValue({ data: null, error: null });

    const result = await listComplexes(fakeSupabase);

    expect(result).toBeNull();
  });

  it('필터 없이 호출하면 빈 필터 객체로 리포지토리를 호출한다', async () => {
    mockList.mockResolvedValue({ data: createPaginatedResult([]), error: null });

    await listComplexes(fakeSupabase);

    expect(mockList).toHaveBeenCalledWith(fakeSupabase, {});
  });
});

describe('getComplexDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('단지와 공급유형을 포함한 ComplexWithSupplyTypes를 반환한다', async () => {
    const complex = createComplex({ id: 'complex-001' });
    const supplyTypes = [
      createSupplyType({ type: 'general' }),
      createSupplyType({ id: 'supply-002', type: 'newlywed' }),
    ];
    const complexWithSupplyTypes: ComplexWithSupplyTypes = { complex, supplyTypes };
    mockGetById.mockResolvedValue({ data: complexWithSupplyTypes, error: null });

    const result = await getComplexDetail(fakeSupabase, 'complex-001');

    expect(result).not.toBeNull();
    expect(result?.complex).toEqual(complex);
    expect(result?.supplyTypes).toHaveLength(2);
  });

  it('공급유형이 없는 단지도 정상적으로 반환한다', async () => {
    const complex = createComplex();
    const complexWithSupplyTypes: ComplexWithSupplyTypes = { complex, supplyTypes: [] };
    mockGetById.mockResolvedValue({ data: complexWithSupplyTypes, error: null });

    const result = await getComplexDetail(fakeSupabase, 'complex-001');

    expect(result?.supplyTypes).toHaveLength(0);
  });

  it('올바른 id를 리포지토리에 전달한다', async () => {
    const complex = createComplex({ id: 'complex-999' });
    mockGetById.mockResolvedValue({
      data: { complex, supplyTypes: [] },
      error: null,
    });

    await getComplexDetail(fakeSupabase, 'complex-999');

    expect(mockGetById).toHaveBeenCalledWith(fakeSupabase, 'complex-999');
  });

  it('리포지토리가 error를 반환하면 null을 반환한다', async () => {
    mockGetById.mockResolvedValue({ data: null, error: '단지 조회 실패' });

    const result = await getComplexDetail(fakeSupabase, 'complex-001');

    expect(result).toBeNull();
  });

  it('리포지토리가 data: null을 반환하면 null을 반환한다', async () => {
    mockGetById.mockResolvedValue({ data: null, error: null });

    const result = await getComplexDetail(fakeSupabase, 'complex-001');

    expect(result).toBeNull();
  });

  it('존재하지 않는 단지 id 조회 시 null을 반환한다', async () => {
    mockGetById.mockResolvedValue({ data: null, error: 'Row not found' });

    const result = await getComplexDetail(fakeSupabase, 'non-existent-id');

    expect(result).toBeNull();
  });
});

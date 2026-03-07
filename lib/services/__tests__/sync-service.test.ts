/**
 * sync-service 단위 테스트
 *
 * 테스트 대상: lib/services/sync-service.ts
 * 전략: 외부 의존성(API 클라이언트, 매퍼, 리포지토리, 로거)을 모두 vi.mock()으로 격리
 *
 * 핵심 동작 요약:
 * - finalStatus 판정: failed===0 → 'success', 0<failed<total → 'partial', failed===total → 'failed'
 * - success 반환값: finalStatus !== 'failed' (partial도 success: true)
 * - 예외 catch 블록: failed+1 처리, errors는 UNEXPECTED 하나만 반환
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApplyhomeAptItem } from '@/lib/external/applyhome/types';

// ─── 외부 의존성 모킹 ─────────────────────────────────────────────────────

vi.mock('@/lib/external/applyhome/client', () => ({
  fetchCurrentMonthAptListings: vi.fn(),
  fetchRemndrListings: vi.fn(),
  ApplyhomeApiClientError: class extends Error {
    code: string;
    attempt: number;
    constructor(msg: string, code: string, attempt: number) {
      super(msg);
      this.code = code;
      this.attempt = attempt;
    }
  },
}));

vi.mock('@/lib/external/applyhome/mapper', () => ({
  mapApiItemToComplex: vi.fn(),
  extractSupplyTypes: vi.fn(),
}));

vi.mock('@/lib/repositories/sync-repository', () => ({
  upsertComplex: vi.fn(),
  replaceSupplyTypes: vi.fn(),
  refreshComplexStatuses: vi.fn(),
  createSyncLog: vi.fn(),
  updateSyncLog: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ─── 모킹된 모듈 import ───────────────────────────────────────────────────

import {
  fetchCurrentMonthAptListings,
  fetchRemndrListings,
  ApplyhomeApiClientError,
} from '@/lib/external/applyhome/client';
import { mapApiItemToComplex, extractSupplyTypes } from '@/lib/external/applyhome/mapper';
import {
  upsertComplex,
  replaceSupplyTypes,
  refreshComplexStatuses,
  createSyncLog,
  updateSyncLog,
} from '@/lib/repositories/sync-repository';

import { runSync } from '@/lib/services/sync-service';

// ─── 테스트 데이터 팩토리 ─────────────────────────────────────────────────

/**
 * 최소 유효한 ApplyhomeAptItem을 생성한다.
 * HOUSE_MANAGE_NO는 중복 제거 기준 식별자로 필수이다.
 */
function createAptItem(houseManageNo: string, override: Partial<ApplyhomeAptItem> = {}): ApplyhomeAptItem {
  return {
    HOUSE_MANAGE_NO: houseManageNo,
    PBLANC_NO: `PB-${houseManageNo}`,
    HOUSE_NM: `테스트단지 ${houseManageNo}`,
    HOUSE_SECD: '01',
    HOUSE_SECD_NM: '아파트',
    BSNP_APRVL_NO: '',
    HSSPLY_ADRES: '서울특별시 강남구 테헤란로 1',
    SUBSCRPT_AREA_CODE: '11',
    SUBSCRPT_AREA_CODE_NM: '서울특별시',
    TOT_SUPLY_HSHLDCO: '100',
    SPSPLY_HSHLDCO: '30',
    GNRL_HSHLDCO: '70',
    RCRIT_PBLANC_DE: '20260301',
    SPSPLY_RCEPT_BGNDE: '20260310',
    SPSPLY_RCEPT_ENDDE: '20260315',
    GNRL_RNK1_CRSPAREA_RCEPT_BGNDE: '20260320',
    GNRL_RNK1_CRSPAREA_RCEPT_ENDDE: '20260325',
    GNRL_RNK1_ETC_AREA_RCEPT_BGNDE: '20260326',
    GNRL_RNK1_ETC_AREA_RCEPT_ENDDE: '20260327',
    GNRL_RNK2_CRSPAREA_RCEPT_BGNDE: '20260328',
    GNRL_RNK2_CRSPAREA_RCEPT_ENDDE: '20260329',
    PRZWNER_PRESNATN_DE: '20260401',
    CNTRCT_CNCLS_BGNDE: '20260410',
    CNTRCT_CNCLS_ENDDE: '20260420',
    MVN_PREARNGE_YM: '202901',
    BSNS_MBY_NM: '테스트시행사',
    CNSTRCT_ENTRPS_NM: '테스트건설',
    MDHS_TELNO: '02-1234-5678',
    HMPG_ADRES: 'https://example.com',
    LTTOT_TOP_AMOUNT: '50000',
    SPSPLY_AGE_60_ABOVE_HSHLDCO: '5',
    MULTI_CHLD_HSHLDCO: '10',
    NWLY_MRD_HSHLDCO: '20',
    FRST_HSHLDCO: '15',
    INSTT_RECOMM_HSHLDCO: '5',
    TRANSR_INSTT_ENFSN_HSHLDCO: '0',
    GNRL_HSHLDCO_CO: '70',
    SUPLY_HOUSTY_NM: '059.9900A',
    EXCLUSE_AR: '59.99',
    SUPLY_AM: '50000',
    PBLANC_URL: 'https://www.applyhome.co.kr',
    ...override,
  };
}

/** mapApiItemToComplex의 반환값 역할을 하는 더미 ComplexInsertData */
function createComplexData(externalId: string) {
  return {
    external_id: externalId,
    name: `테스트단지 ${externalId}`,
    region: '서울특별시',
    district: '강남구',
    address: '서울특별시 강남구 테헤란로 1',
    developer: '테스트시행사',
    constructor: '테스트건설',
    total_units: 100,
    announcement_date: '2026-03-01',
    subscription_start: '2026-03-20',
    subscription_end: '2026-03-25',
    winner_date: '2026-04-01',
    status: 'upcoming' as const,
    source_url: 'https://www.applyhome.co.kr',
    move_in_date: '202901',
    special_supply_start: '2026-03-10',
    special_supply_end: '2026-03-15',
    contract_start: '2026-04-10',
    contract_end: '2026-04-20',
    raw_data: createAptItem(externalId),
  };
}

// ─── 타입 단언 헬퍼 ──────────────────────────────────────────────────────

const mockFetchApt = fetchCurrentMonthAptListings as ReturnType<typeof vi.fn>;
const mockFetchRemndr = fetchRemndrListings as ReturnType<typeof vi.fn>;
const mockMapApiItem = mapApiItemToComplex as ReturnType<typeof vi.fn>;
const mockExtractSupplyTypes = extractSupplyTypes as ReturnType<typeof vi.fn>;
const mockUpsertComplex = upsertComplex as ReturnType<typeof vi.fn>;
const mockReplaceSupplyTypes = replaceSupplyTypes as ReturnType<typeof vi.fn>;
const mockRefreshStatuses = refreshComplexStatuses as ReturnType<typeof vi.fn>;
const mockCreateSyncLog = createSyncLog as ReturnType<typeof vi.fn>;
const mockUpdateSyncLog = updateSyncLog as ReturnType<typeof vi.fn>;

// ─── 테스트 ──────────────────────────────────────────────────────────────

describe('runSync', () => {
  // 각 테스트 전에 mock 초기화 및 공통 기본값 설정
  beforeEach(() => {
    vi.clearAllMocks();

    // 동기화 로그 기본 동작: logId 반환
    mockCreateSyncLog.mockResolvedValue('log-uuid-001');
    mockUpdateSyncLog.mockResolvedValue(undefined);

    // refreshComplexStatuses: 기본적으로 0건 갱신
    mockRefreshStatuses.mockResolvedValue(0);

    // supply_types 기본값: 빈 배열 (replaceSupplyTypes 미호출)
    mockExtractSupplyTypes.mockReturnValue([]);
    mockReplaceSupplyTypes.mockResolvedValue(true);
  });

  // ── 시나리오 1: 정상 동기화 ─────────────────────────────────────────

  describe('정상 동기화', () => {
    it('APT 2건 + 잔여세대 1건 조회 후 중복 제거하여 2건 처리하고 success를 반환한다', async () => {
      // given: APT 2건, 잔여세대는 APT와 동일한 ID 1건 (중복)
      const item1 = createAptItem('A001');
      const item2 = createAptItem('A002');
      const remndrItemDuplicate = createAptItem('A001'); // A001 중복

      mockFetchApt.mockResolvedValue([item1, item2]);
      mockFetchRemndr.mockResolvedValue([remndrItemDuplicate]);

      mockMapApiItem
        .mockReturnValueOnce(createComplexData('A001'))
        .mockReturnValueOnce(createComplexData('A002'));

      // upsertComplex: 두 건 모두 신규 삽입
      mockUpsertComplex
        .mockResolvedValueOnce({ id: 'uuid-A001', isNew: true })
        .mockResolvedValueOnce({ id: 'uuid-A002', isNew: true });

      // when
      const result = await runSync({ includeRemndr: true });

      // then: 중복 제거 후 2건만 처리
      expect(result.totalFetched).toBe(2);
      expect(result.inserted).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.success).toBe(true);
    });

    it('upsertComplex가 모두 성공하면 updateSyncLog를 status: success로 호출한다', async () => {
      // given
      mockFetchApt.mockResolvedValue([createAptItem('A001')]);
      mockFetchRemndr.mockResolvedValue([]);
      mockMapApiItem.mockReturnValue(createComplexData('A001'));
      mockUpsertComplex.mockResolvedValue({ id: 'uuid-A001', isNew: true });

      // when
      await runSync();

      // then: createSyncLog → updateSyncLog(status: 'success') 순서로 호출
      expect(mockCreateSyncLog).toHaveBeenCalledOnce();
      expect(mockUpdateSyncLog).toHaveBeenCalledWith(
        'log-uuid-001',
        expect.objectContaining({ status: 'success' }),
      );
    });

    it('refreshComplexStatuses를 호출하고 결과를 statusRefreshed에 반영한다', async () => {
      // given
      mockFetchApt.mockResolvedValue([createAptItem('A001')]);
      mockFetchRemndr.mockResolvedValue([]);
      mockMapApiItem.mockReturnValue(createComplexData('A001'));
      mockUpsertComplex.mockResolvedValue({ id: 'uuid-A001', isNew: true });
      mockRefreshStatuses.mockResolvedValue(3); // 3건 상태 갱신

      // when
      const result = await runSync();

      // then
      expect(mockRefreshStatuses).toHaveBeenCalledOnce();
      expect(result.statusRefreshed).toBe(3);
    });
  });

  // ── 시나리오 2: 부분 실패 (partial) ────────────────────────────────

  describe('부분 실패 처리', () => {
    it('3건 중 1건 upsertComplex null 반환 시 failed:1이고 status:partial로 로그를 업데이트한다', async () => {
      // given
      const items = [createAptItem('B001'), createAptItem('B002'), createAptItem('B003')];
      mockFetchApt.mockResolvedValue(items);
      mockFetchRemndr.mockResolvedValue([]);
      mockMapApiItem
        .mockReturnValueOnce(createComplexData('B001'))
        .mockReturnValueOnce(createComplexData('B002'))
        .mockReturnValueOnce(createComplexData('B003'));

      // B002만 upsert 실패 (null 반환)
      mockUpsertComplex
        .mockResolvedValueOnce({ id: 'uuid-B001', isNew: true })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'uuid-B003', isNew: true });

      // when
      const result = await runSync();

      // then
      expect(result.failed).toBe(1);
      expect(result.success).toBe(true); // partial도 success: true
      expect(mockUpdateSyncLog).toHaveBeenCalledWith(
        'log-uuid-001',
        expect.objectContaining({ status: 'partial' }),
      );
    });
  });

  // ── 시나리오 3: 전체 실패 ───────────────────────────────────────────

  describe('전체 실패 처리', () => {
    it('모든 항목의 upsertComplex가 null을 반환하면 success:false이고 status:failed로 로그를 업데이트한다', async () => {
      // given
      const items = [createAptItem('C001'), createAptItem('C002')];
      mockFetchApt.mockResolvedValue(items);
      mockFetchRemndr.mockResolvedValue([]);
      mockMapApiItem
        .mockReturnValueOnce(createComplexData('C001'))
        .mockReturnValueOnce(createComplexData('C002'));

      // 모든 upsert 실패
      mockUpsertComplex.mockResolvedValue(null);

      // when
      const result = await runSync();

      // then
      expect(result.success).toBe(false);
      expect(result.failed).toBe(2);
      expect(mockUpdateSyncLog).toHaveBeenCalledWith(
        'log-uuid-001',
        expect.objectContaining({ status: 'failed' }),
      );
    });
  });

  // ── 시나리오 4: APT API 조회 실패 ──────────────────────────────────

  describe('APT API 조회 실패', () => {
    it('fetchCurrentMonthAptListings에서 ApplyhomeApiClientError 발생 시 errors에 APT_FETCH를 기록하고 계속 진행한다', async () => {
      // given: APT 조회 실패, 잔여세대는 성공
      const remndrItem = createAptItem('D001');
      // ApplyhomeApiClientError 인스턴스를 모킹된 클래스로 생성
      mockFetchApt.mockRejectedValue(new ApplyhomeApiClientError('API 호출 한도 초과', 'RATE_LIMIT', 3));
      mockFetchRemndr.mockResolvedValue([remndrItem]);
      mockMapApiItem.mockReturnValue(createComplexData('D001'));
      mockUpsertComplex.mockResolvedValue({ id: 'uuid-D001', isNew: true });

      // when
      const result = await runSync({ includeRemndr: true });

      // then: APT_FETCH 에러가 errors에 포함되어야 하고 잔여세대 1건은 정상 처리
      expect(result.errors).toContainEqual(
        expect.objectContaining({ external_id: 'APT_FETCH' }),
      );
      expect(result.totalFetched).toBe(1);
      expect(result.inserted).toBe(1);
    });

    it('ApplyhomeApiClientError가 아닌 에러도 APT_FETCH 메시지로 errors에 기록한다', async () => {
      // given: 알 수 없는 에러
      mockFetchApt.mockRejectedValue(new Error('Network timeout'));
      mockFetchRemndr.mockResolvedValue([]);

      // when
      const result = await runSync({ includeRemndr: true });

      // then: '알 수 없는 API 오류' 메시지로 기록
      expect(result.errors).toContainEqual({
        external_id: 'APT_FETCH',
        message: '알 수 없는 API 오류',
      });
    });
  });

  // ── 시나리오 5: 잔여세대 조회 실패 ────────────────────────────────

  describe('잔여세대 조회 실패', () => {
    it('fetchRemndrListings 에러 발생 시 경고만 기록하고 APT 데이터는 정상 처리한다', async () => {
      // given: APT 성공, 잔여세대 실패
      const aptItem = createAptItem('E001');
      mockFetchApt.mockResolvedValue([aptItem]);
      mockFetchRemndr.mockRejectedValue(new Error('잔여세대 API 서버 오류'));
      mockMapApiItem.mockReturnValue(createComplexData('E001'));
      mockUpsertComplex.mockResolvedValue({ id: 'uuid-E001', isNew: true });

      // when
      const result = await runSync({ includeRemndr: true });

      // then: APT 1건은 정상 처리, errors에 잔여세대 관련 항목 없음
      expect(result.inserted).toBe(1);
      expect(result.totalFetched).toBe(1);
      expect(result.errors.some((e) => e.external_id === 'REMNDR_FETCH')).toBe(false);
    });
  });

  // ── 시나리오 6: includeRemndr: false ────────────────────────────────

  describe('includeRemndr 옵션', () => {
    it('includeRemndr가 false이면 fetchRemndrListings를 호출하지 않는다', async () => {
      // given
      mockFetchApt.mockResolvedValue([createAptItem('F001')]);
      mockMapApiItem.mockReturnValue(createComplexData('F001'));
      mockUpsertComplex.mockResolvedValue({ id: 'uuid-F001', isNew: true });

      // when
      await runSync({ includeRemndr: false });

      // then
      expect(mockFetchRemndr).not.toHaveBeenCalled();
    });
  });

  // ── 시나리오 7: supply_types 저장 실패 ─────────────────────────────

  describe('supply_types 저장 실패', () => {
    it('replaceSupplyTypes가 false를 반환해도 단지는 inserted 카운트에 포함된다', async () => {
      // given: upsert 성공, supply_types 저장 실패
      const item = createAptItem('G001');
      mockFetchApt.mockResolvedValue([item]);
      mockFetchRemndr.mockResolvedValue([]);
      mockMapApiItem.mockReturnValue(createComplexData('G001'));
      mockUpsertComplex.mockResolvedValue({ id: 'uuid-G001', isNew: true });

      // supply_types가 있는 경우에만 replaceSupplyTypes 호출되므로 더미 배열 반환
      mockExtractSupplyTypes.mockReturnValue([
        { type: 'general', unit_count: 70, area_sqm: 59.99, price_krw: BigInt(500_000_000) },
      ]);
      mockReplaceSupplyTypes.mockResolvedValue(false); // 저장 실패

      // when
      const result = await runSync();

      // then: supply_types 실패는 경고만, 단지 자체는 inserted 카운트에 포함
      expect(result.inserted).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  // ── 시나리오 8: isNew: false (업데이트) ────────────────────────────

  describe('기존 단지 업데이트', () => {
    it('upsertComplex가 isNew: false를 반환하면 updated 카운트가 증가한다', async () => {
      // given
      mockFetchApt.mockResolvedValue([createAptItem('H001')]);
      mockFetchRemndr.mockResolvedValue([]);
      mockMapApiItem.mockReturnValue(createComplexData('H001'));
      // 기존 단지 업데이트
      mockUpsertComplex.mockResolvedValue({ id: 'uuid-H001', isNew: false });

      // when
      const result = await runSync();

      // then
      expect(result.updated).toBe(1);
      expect(result.inserted).toBe(0);
    });
  });

  // ── 시나리오 9: 예기치 않은 에러 ────────────────────────────────────

  describe('예기치 않은 에러', () => {
    it('createSyncLog가 throw하면 runSync 자체가 예외를 전파한다', async () => {
      /**
       * 구현체 분석:
       * createSyncLog는 외부 try 블록 바깥(라인 147)에서 await된다.
       * 따라서 createSyncLog가 throw하면 catch 블록으로 잡히지 않고
       * runSync 자체가 reject된다. success:false 반환이 아닌 throw가 발생한다.
       */
      mockCreateSyncLog.mockRejectedValue(new Error('DB 연결 불가'));

      // when & then: runSync 자체가 throw
      await expect(runSync()).rejects.toThrow('DB 연결 불가');
    });

    it('예기치 않은 에러 발생 시 updateSyncLog가 status:failed로 호출된다', async () => {
      // given: refreshComplexStatuses에서 예기치 않은 에러
      mockFetchApt.mockResolvedValue([createAptItem('I001')]);
      mockFetchRemndr.mockResolvedValue([]);
      mockMapApiItem.mockReturnValue(createComplexData('I001'));
      mockUpsertComplex.mockResolvedValue({ id: 'uuid-I001', isNew: true });
      mockRefreshStatuses.mockRejectedValue(new Error('DB 잠금 타임아웃'));

      // when
      const result = await runSync();

      // then: 예외 catch 블록에서 UNEXPECTED 에러로 처리
      expect(result.success).toBe(false);
      expect(mockUpdateSyncLog).toHaveBeenCalledWith(
        'log-uuid-001',
        expect.objectContaining({ status: 'failed' }),
      );
      expect(result.errors[0].external_id).toBe('UNEXPECTED');
    });

    it('예기치 않은 에러 발생 시 failed 카운트가 기존 값에 1을 더한다', async () => {
      // given: 항목 처리 후 refreshComplexStatuses에서 에러 (failed=0인 상태에서 예외)
      mockFetchApt.mockResolvedValue([]);
      mockFetchRemndr.mockResolvedValue([]);
      mockRefreshStatuses.mockRejectedValue(new Error('예기치 않은 오류'));

      // when
      const result = await runSync();

      // then: syncResult.failed(0) + 1 = 1
      expect(result.failed).toBe(1);
    });
  });

  // ── 시나리오 10: 중복 제거 ───────────────────────────────────────────

  describe('중복 제거 (deduplicateByHouseManageNo)', () => {
    it('동일한 HOUSE_MANAGE_NO를 가진 항목이 여러 개이면 첫 번째만 처리한다', async () => {
      // given: 같은 ID로 APT 3건 (주택형별 중복)
      const item1 = createAptItem('J001', { SUPLY_HOUSTY_NM: '059A' });
      const item2 = createAptItem('J001', { SUPLY_HOUSTY_NM: '084B' }); // 중복
      const item3 = createAptItem('J001', { SUPLY_HOUSTY_NM: '101C' }); // 중복

      mockFetchApt.mockResolvedValue([item1, item2, item3]);
      mockFetchRemndr.mockResolvedValue([]);
      mockMapApiItem.mockReturnValue(createComplexData('J001'));
      mockUpsertComplex.mockResolvedValue({ id: 'uuid-J001', isNew: true });

      // when
      const result = await runSync();

      // then: 중복 제거 후 1건만 처리
      expect(result.totalFetched).toBe(1);
      expect(mockUpsertComplex).toHaveBeenCalledTimes(1);
    });

    it('APT와 잔여세대에 동일 HOUSE_MANAGE_NO가 있으면 APT(첫 번째) 항목만 유지한다', async () => {
      // given
      const aptItem = createAptItem('K001');
      const remndrItem = createAptItem('K001'); // 잔여세대에도 동일 ID

      mockFetchApt.mockResolvedValue([aptItem]);
      mockFetchRemndr.mockResolvedValue([remndrItem]);
      mockMapApiItem.mockReturnValue(createComplexData('K001'));
      mockUpsertComplex.mockResolvedValue({ id: 'uuid-K001', isNew: true });

      // when
      const result = await runSync({ includeRemndr: true });

      // then: 1건만 처리
      expect(result.totalFetched).toBe(1);
      expect(mockUpsertComplex).toHaveBeenCalledTimes(1);
    });
  });

  // ── 공통 동작: createSyncLog + updateSyncLog 호출 순서 ──────────────

  describe('동기화 로그 생성 및 업데이트', () => {
    it('runSync 호출마다 createSyncLog를 한 번, updateSyncLog를 한 번 호출한다', async () => {
      // given
      mockFetchApt.mockResolvedValue([]);
      mockFetchRemndr.mockResolvedValue([]);

      // when
      await runSync();

      // then
      expect(mockCreateSyncLog).toHaveBeenCalledTimes(1);
      expect(mockUpdateSyncLog).toHaveBeenCalledTimes(1);
    });

    it('createSyncLog가 null을 반환해도 updateSyncLog를 호출하지 않고 정상 완료한다', async () => {
      // given: logId를 얻지 못한 경우 (DB 실패 등)
      mockCreateSyncLog.mockResolvedValue(null);
      mockFetchApt.mockResolvedValue([createAptItem('L001')]);
      mockFetchRemndr.mockResolvedValue([]);
      mockMapApiItem.mockReturnValue(createComplexData('L001'));
      mockUpsertComplex.mockResolvedValue({ id: 'uuid-L001', isNew: true });

      // when
      const result = await runSync();

      // then: updateSyncLog 미호출, 동기화 자체는 성공
      expect(mockUpdateSyncLog).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });
});

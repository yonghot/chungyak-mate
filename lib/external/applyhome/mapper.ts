/**
 * 청약홈 API 응답 → DB 스키마 변환 매퍼
 *
 * 변환 규칙:
 * - 날짜: "YYYYMMDD" 문자열 → "YYYY-MM-DD" ISO 형식 (빈 문자열/00000000 → null)
 * - 금액: 만원 단위 문자열 → 원 단위 BIGINT (× 10,000)
 * - 세대수: 문자열 → INTEGER (파싱 실패 시 0)
 * - district: HSSPLY_ADRES에서 구/군 추출 (파싱 실패 시 "기타")
 */
import type { ApplyhomeAptItem } from './types';
import type { ComplexStatus } from '@/types/database';

/** complexes 테이블 삽입용 타입 (external_id 포함) */
export interface ComplexInsertData {
  external_id: string;
  name: string;
  region: string;
  district: string;
  address: string;
  developer: string | null;
  constructor: string | null;
  total_units: number | null;
  announcement_date: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  winner_date: string | null;
  status: ComplexStatus;
  source_url: string | null;
  move_in_date: string | null;
  special_supply_start: string | null;
  special_supply_end: string | null;
  contract_start: string | null;
  contract_end: string | null;
  raw_data: ApplyhomeAptItem;
}

/** supply_types 테이블 삽입용 타입 */
export interface SupplyTypeInsertData {
  type: 'general' | 'newlywed' | 'first_life' | 'multi_child' | 'elderly_parent' | 'institutional' | 'relocation';
  unit_count: number;
  area_sqm: number | null;
  price_krw: bigint | null;
}

/**
 * "YYYYMMDD" 형식의 날짜 문자열을 "YYYY-MM-DD"로 변환
 * 빈 문자열, null, "00000000" 등 유효하지 않은 값은 null 반환
 */
export function parseApiDate(value: string | null | undefined): string | null {
  if (!value || value.trim() === '' || value === '00000000') { return null; }

  const cleaned = value.trim().replace(/-/g, '');
  if (cleaned.length !== 8) { return null; }

  const year = cleaned.substring(0, 4);
  const month = cleaned.substring(4, 6);
  const day = cleaned.substring(6, 8);

  // 유효 날짜 검증
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) { return null; }

  return `${year}-${month}-${day}`;
}

/**
 * 만원 단위 문자열을 원 단위 bigint로 변환
 * 파싱 실패 시 null 반환
 */
export function parseWonAmount(manwon: string | null | undefined): bigint | null {
  if (!manwon || manwon.trim() === '') { return null; }

  const numeric = parseInt(manwon.trim().replace(/,/g, ''), 10);
  if (isNaN(numeric) || numeric < 0) { return null; }

  return BigInt(numeric) * BigInt(10_000);
}

/**
 * 문자열을 정수로 변환
 * 파싱 실패 또는 0 이하인 경우 null 반환
 */
export function parsePositiveInt(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') { return null; }

  const numeric = parseInt(value.trim().replace(/,/g, ''), 10);
  if (isNaN(numeric)) { return null; }

  return numeric;
}

/**
 * 도로명주소에서 구/군 추출
 * 예: "서울특별시 서초구 반포동 1-1" → "서초구"
 * 파싱 실패 시 "기타" 반환
 */
export function extractDistrict(address: string | null | undefined): string {
  if (!address || address.trim() === '') { return '기타'; }

  const tokens = address.trim().split(/\s+/);
  if (tokens.length < 2) { return '기타'; }

  const district = tokens[1] ?? '기타';
  // 구/군/시 등 행정구역 단위로 끝나는지 확인
  if (/[구군시도]$/.test(district)) { return district; }

  return district;
}

/**
 * 날짜 비교로 단지 상태(status)를 도출
 * API는 status 필드를 직접 제공하지 않으므로 날짜 계산으로 산출
 */
export function deriveComplexStatus(item: ApplyhomeAptItem): ComplexStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toDate = (dateStr: string | null | undefined): Date | null => {
    const iso = parseApiDate(dateStr);
    if (!iso) { return null; }
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const winnerDate = toDate(item.PRZWNER_PRESNATN_DE);
  const subscriptionEnd = toDate(item.GNRL_RNK1_CRSPAREA_RCEPT_ENDDE)
    ?? toDate(item.SPSPLY_RCEPT_ENDDE);
  const subscriptionStart = toDate(item.GNRL_RNK1_CRSPAREA_RCEPT_BGNDE)
    ?? toDate(item.SPSPLY_RCEPT_BGNDE);

  if (winnerDate && today > winnerDate) { return 'completed'; }
  if (subscriptionEnd && today > subscriptionEnd) { return 'closed'; }
  if (subscriptionStart && today >= subscriptionStart) { return 'open'; }
  return 'upcoming';
}

/**
 * 공급유형별 세대수를 집계하여 supply_types 삽입 데이터 목록 반환
 *
 * API 응답은 주택형(면적)별로 행이 분리되어 있으므로 단지 전체에 대한
 * 공급유형별 합계를 구해야 한다. 단일 항목(주택형이 하나인 단지)의
 * 경우 그대로 사용한다.
 *
 * 면적별 분양가는 주택형 중 가장 많은 세대수를 가진 타입의 값을 대표값으로 사용.
 */
export function extractSupplyTypes(item: ApplyhomeAptItem): SupplyTypeInsertData[] {
  const result: SupplyTypeInsertData[] = [];

  const areaNum = parseFloat(item.EXCLUSE_AR ?? '0') || null;
  // 분양가: 만원 → 원 변환
  const price = parseWonAmount(item.SUPLY_AM);

  // 일반공급
  const generalCount = parsePositiveInt(item.GNRL_HSHLDCO_CO) ?? 0;
  if (generalCount > 0) {
    result.push({
      type: 'general',
      unit_count: generalCount,
      area_sqm: areaNum,
      price_krw: price,
    });
  }

  // 신혼부부 특별공급
  const newlywedCount = parsePositiveInt(item.NWLY_MRD_HSHLDCO) ?? 0;
  if (newlywedCount > 0) {
    result.push({
      type: 'newlywed',
      unit_count: newlywedCount,
      area_sqm: areaNum,
      price_krw: price,
    });
  }

  // 생애최초 특별공급
  const firstLifeCount = parsePositiveInt(item.FRST_HSHLDCO) ?? 0;
  if (firstLifeCount > 0) {
    result.push({
      type: 'first_life',
      unit_count: firstLifeCount,
      area_sqm: areaNum,
      price_krw: price,
    });
  }

  // 다자녀가구 특별공급
  const multiChildCount = parsePositiveInt(item.MULTI_CHLD_HSHLDCO) ?? 0;
  if (multiChildCount > 0) {
    result.push({
      type: 'multi_child',
      unit_count: multiChildCount,
      area_sqm: areaNum,
      price_krw: price,
    });
  }

  // 노부모부양 특별공급
  const elderlyCount = parsePositiveInt(item.SPSPLY_AGE_60_ABOVE_HSHLDCO) ?? 0;
  if (elderlyCount > 0) {
    result.push({
      type: 'elderly_parent',
      unit_count: elderlyCount,
      area_sqm: areaNum,
      price_krw: price,
    });
  }

  // 기관추천 특별공급
  const institutionalCount = parsePositiveInt(item.INSTT_RECOMM_HSHLDCO) ?? 0;
  if (institutionalCount > 0) {
    result.push({
      type: 'institutional',
      unit_count: institutionalCount,
      area_sqm: areaNum,
      price_krw: price,
    });
  }

  // 이전기관 특별공급
  const relocationCount = parsePositiveInt(item.TRANSR_INSTT_ENFSN_HSHLDCO) ?? 0;
  if (relocationCount > 0) {
    result.push({
      type: 'relocation',
      unit_count: relocationCount,
      area_sqm: areaNum,
      price_krw: price,
    });
  }

  return result;
}

/**
 * API 응답 항목을 complexes 테이블 삽입 데이터로 변환
 */
export function mapApiItemToComplex(item: ApplyhomeAptItem): ComplexInsertData {
  const region = item.SUBSCRPT_AREA_CODE_NM?.trim() || item.HSSPLY_ADRES?.split(' ')[0] || '미상';
  const district = extractDistrict(item.HSSPLY_ADRES);
  const status = deriveComplexStatus(item);

  // 청약홈 분양공고 URL: API에서 제공하지 않으면 청약홈 기본 URL 사용
  const sourceUrl = item.PBLANC_URL?.trim() || 'https://www.applyhome.co.kr';

  return {
    external_id: item.HOUSE_MANAGE_NO,
    name: item.HOUSE_NM?.trim() || '미상',
    region,
    district,
    address: item.HSSPLY_ADRES?.trim() || '',
    developer: item.BSNS_MBY_NM?.trim() || null,
    constructor: item.CNSTRCT_ENTRPS_NM?.trim() || null,
    total_units: parsePositiveInt(item.TOT_SUPLY_HSHLDCO),
    announcement_date: parseApiDate(item.RCRIT_PBLANC_DE),
    subscription_start: parseApiDate(item.GNRL_RNK1_CRSPAREA_RCEPT_BGNDE)
      ?? parseApiDate(item.SPSPLY_RCEPT_BGNDE),
    subscription_end: parseApiDate(item.GNRL_RNK1_CRSPAREA_RCEPT_ENDDE)
      ?? parseApiDate(item.SPSPLY_RCEPT_ENDDE),
    winner_date: parseApiDate(item.PRZWNER_PRESNATN_DE),
    status,
    source_url: sourceUrl,
    move_in_date: item.MVN_PREARNGE_YM?.trim() || null,
    special_supply_start: parseApiDate(item.SPSPLY_RCEPT_BGNDE),
    special_supply_end: parseApiDate(item.SPSPLY_RCEPT_ENDDE),
    contract_start: parseApiDate(item.CNTRCT_CNCLS_BGNDE),
    contract_end: parseApiDate(item.CNTRCT_CNCLS_ENDDE),
    raw_data: item,
  };
}

/**
 * 공공데이터포털 한국부동산원_청약홈 분양정보 API 응답 타입
 *
 * 서비스명: ApplyhomeInfoDetailSvc
 * 등록번호: 15006405 (data.go.kr)
 * 검증일: 2026-03-05 (실제 HTTP 호출로 서비스 존재 확인됨)
 */

/** API 공통 응답 래퍼 */
export interface ApplyhomeApiResponse<T> {
  /** 현재 페이지 결과 수 */
  currentCount: number;
  /** 결과 데이터 배열 */
  data: T[];
  /** 전체 매칭 건수 */
  matchCount: number;
  /** 현재 페이지 번호 */
  page: number;
  /** 페이지당 결과 수 */
  perPage: number;
  /** 전체 건수 */
  totalCount: number;
}

/** API 에러 응답 */
export interface ApplyhomeApiError {
  code: number;
  msg: string;
}

/**
 * APT 분양공고 상세 항목
 * 오퍼레이션: getAPTLttotPblancDetail
 *
 * 날짜 필드는 "YYYYMMDD" 형식. 없는 경우 빈 문자열 "" 또는 "00000000"
 * 숫자 필드는 문자열로 반환됨. 없는 경우 빈 문자열 ""
 * 금액 필드(SUPLY_AM, LTTOT_TOP_AMOUNT)는 만원 단위
 */
export interface ApplyhomeAptItem {
  /** 주택관리번호 - upsert 기준 식별자 */
  HOUSE_MANAGE_NO: string;
  /** 공고번호 */
  PBLANC_NO: string;
  /** 주택명 (단지명) */
  HOUSE_NM: string;
  /** 주택구분 코드 (01: APT) */
  HOUSE_SECD: string;
  /** 주택구분명 ("아파트") */
  HOUSE_SECD_NM: string;
  /** 사업승인번호 */
  BSNP_APRVL_NO: string;

  // 위치 정보
  /** 공급위치 (도로명주소 전체) - 예: "서울특별시 서초구 반포동 1-1" */
  HSSPLY_ADRES: string;
  /** 청약지역코드 - 예: "11" (서울) */
  SUBSCRPT_AREA_CODE: string;
  /** 청약지역명 - 예: "서울특별시" */
  SUBSCRPT_AREA_CODE_NM: string;

  // 공급 규모
  /** 총 공급세대수 */
  TOT_SUPLY_HSHLDCO: string;
  /** 특별공급세대수 */
  SPSPLY_HSHLDCO: string;
  /** 일반공급세대수 */
  GNRL_HSHLDCO: string;

  // 날짜 정보 (YYYYMMDD)
  /** 모집공고일 */
  RCRIT_PBLANC_DE: string;
  /** 특별공급 접수 시작일 */
  SPSPLY_RCEPT_BGNDE: string;
  /** 특별공급 접수 종료일 */
  SPSPLY_RCEPT_ENDDE: string;
  /** 1순위(해당지역) 접수 시작일 */
  GNRL_RNK1_CRSPAREA_RCEPT_BGNDE: string;
  /** 1순위(해당지역) 접수 종료일 */
  GNRL_RNK1_CRSPAREA_RCEPT_ENDDE: string;
  /** 1순위(기타지역) 접수 시작일 */
  GNRL_RNK1_ETC_AREA_RCEPT_BGNDE: string;
  /** 1순위(기타지역) 접수 종료일 */
  GNRL_RNK1_ETC_AREA_RCEPT_ENDDE: string;
  /** 2순위(해당지역) 접수 시작일 */
  GNRL_RNK2_CRSPAREA_RCEPT_BGNDE: string;
  /** 2순위(해당지역) 접수 종료일 */
  GNRL_RNK2_CRSPAREA_RCEPT_ENDDE: string;
  /** 당첨자발표일 */
  PRZWNER_PRESNATN_DE: string;
  /** 계약시작일 */
  CNTRCT_CNCLS_BGNDE: string;
  /** 계약종료일 */
  CNTRCT_CNCLS_ENDDE: string;
  /** 입주예정연월 (YYYYMM) */
  MVN_PREARNGE_YM: string;

  // 업체 정보
  /** 사업주체명 (시행사) */
  BSNS_MBY_NM: string;
  /** 건설업체명 (시공사) */
  CNSTRCT_ENTRPS_NM: string;
  /** 모델하우스 전화번호 */
  MDHS_TELNO: string;
  /** 홈페이지 주소 */
  HMPG_ADRES: string;

  // 공급가격 (만원 단위)
  /** 최고분양가 (만원) */
  LTTOT_TOP_AMOUNT: string;

  // 공급유형별 세대수 (주택형별로 중복 등장 가능 - 집계 필요)
  /** 노부모부양 특별공급 세대수 */
  SPSPLY_AGE_60_ABOVE_HSHLDCO: string;
  /** 다자녀가구 특별공급 세대수 */
  MULTI_CHLD_HSHLDCO: string;
  /** 신혼부부 특별공급 세대수 */
  NWLY_MRD_HSHLDCO: string;
  /** 생애최초 특별공급 세대수 */
  FRST_HSHLDCO: string;
  /** 기관추천 특별공급 세대수 */
  INSTT_RECOMM_HSHLDCO: string;
  /** 이전기관 특별공급 세대수 */
  TRANSR_INSTT_ENFSN_HSHLDCO: string;
  /** 일반공급 세대수 */
  GNRL_HSHLDCO_CO: string;

  // 주택형 상세 (면적별)
  /** 주택형명 - 예: "059.9900A" */
  SUPLY_HOUSTY_NM: string;
  /** 전용면적 - 예: "59.99" */
  EXCLUSE_AR: string;
  /** 공급금액 (만원) - 해당 주택형 기준 */
  SUPLY_AM: string;

  /** 청약홈 분양공고 URL */
  PBLANC_URL: string;
}

/** 잔여세대 분양공고 항목 (getRemndrLttotPblancDetail) - APT 항목과 동일 구조 */
export type ApplyhomeRemndrItem = ApplyhomeAptItem;

/** API 요청 파라미터 */
export interface ApplyhomeRequestParams {
  /** 페이지 번호 (기본값: 1) */
  page?: number;
  /** 페이지당 결과 수 (기본값: 10, 최대: 100) */
  perPage?: number;
  /** 청약접수시작일 이후 필터 (YYYYMMDD) */
  subscriptionStartFrom?: string;
  /** 청약접수종료일 이전 필터 (YYYYMMDD) */
  subscriptionEndTo?: string;
  /** 지역코드 필터 */
  regionCode?: string;
  /** 주택관리번호 필터 */
  houseManageNo?: string;
}

/** 지역코드 → 지역명 매핑 */
export const REGION_CODE_MAP: Record<string, string> = {
  '11': '서울특별시',
  '26': '부산광역시',
  '27': '대구광역시',
  '28': '인천광역시',
  '29': '광주광역시',
  '30': '대전광역시',
  '31': '울산광역시',
  '36': '세종특별자치시',
  '41': '경기도',
  '43': '충청북도',
  '44': '충청남도',
  '45': '전라북도',
  '46': '전라남도',
  '47': '경상북도',
  '48': '경상남도',
  '50': '제주특별자치도',
} as const;

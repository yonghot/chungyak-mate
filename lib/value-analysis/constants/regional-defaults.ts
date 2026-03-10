/**
 * 지역별 기본값 상수 (MVP 단계)
 *
 * 외부 API 미연동 단계에서 합리적인 점수를 산출하기 위해
 * 17개 광역시도의 지역 특성을 반영한 상수 테이블을 정의한다.
 * Phase 2에서 국토부 실거래 API, 카카오맵 API로 대체 예정.
 */

/** 지역별 기본값 인터페이스 (architecture.md 17.4절) */
export interface RegionalDefaults {
  region: string;
  /** 연평균 시세 상승률 (소수점, 예: 0.035 = 3.5%) */
  annualGrowthRate: number;
  /** DCF 할인율 */
  discountRate: number;
  /** 교통 등급 (1~5, 높을수록 우수) */
  transportGrade: number;
  /** 학군 등급 (1~5) */
  schoolGrade: number;
  /** 인프라 등급 (1~5) */
  infraGrade: number;
  /** 공급 지수 (1~5, 낮을수록 공급 과잉) */
  supplyDemandIndex: number;
}

/** region 코드 → 기본값 매핑 (17개 광역시도) */
export const REGIONAL_DEFAULTS: Record<string, RegionalDefaults> = {
  서울: {
    region: '서울',
    annualGrowthRate: 0.045,
    discountRate: 0.05,
    transportGrade: 4,
    schoolGrade: 4,
    infraGrade: 4,
    supplyDemandIndex: 4,
  },
  부산: {
    region: '부산',
    annualGrowthRate: 0.028,
    discountRate: 0.05,
    transportGrade: 3,
    schoolGrade: 3,
    infraGrade: 3,
    supplyDemandIndex: 3,
  },
  대구: {
    region: '대구',
    annualGrowthRate: 0.025,
    discountRate: 0.05,
    transportGrade: 3,
    schoolGrade: 3,
    infraGrade: 3,
    supplyDemandIndex: 2,
  },
  인천: {
    region: '인천',
    annualGrowthRate: 0.032,
    discountRate: 0.05,
    transportGrade: 3,
    schoolGrade: 3,
    infraGrade: 3,
    supplyDemandIndex: 3,
  },
  광주: {
    region: '광주',
    annualGrowthRate: 0.022,
    discountRate: 0.05,
    transportGrade: 2,
    schoolGrade: 3,
    infraGrade: 3,
    supplyDemandIndex: 2,
  },
  대전: {
    region: '대전',
    annualGrowthRate: 0.028,
    discountRate: 0.05,
    transportGrade: 2,
    schoolGrade: 3,
    infraGrade: 3,
    supplyDemandIndex: 3,
  },
  울산: {
    region: '울산',
    annualGrowthRate: 0.020,
    discountRate: 0.05,
    transportGrade: 2,
    schoolGrade: 2,
    infraGrade: 3,
    supplyDemandIndex: 2,
  },
  세종: {
    region: '세종',
    annualGrowthRate: 0.035,
    discountRate: 0.05,
    transportGrade: 2,
    schoolGrade: 4,
    infraGrade: 3,
    supplyDemandIndex: 3,
  },
  경기: {
    region: '경기',
    annualGrowthRate: 0.030,
    discountRate: 0.05,
    transportGrade: 3,
    schoolGrade: 3,
    infraGrade: 3,
    supplyDemandIndex: 3,
  },
  강원: {
    region: '강원',
    annualGrowthRate: 0.015,
    discountRate: 0.05,
    transportGrade: 2,
    schoolGrade: 2,
    infraGrade: 2,
    supplyDemandIndex: 2,
  },
  충북: {
    region: '충북',
    annualGrowthRate: 0.018,
    discountRate: 0.05,
    transportGrade: 2,
    schoolGrade: 2,
    infraGrade: 2,
    supplyDemandIndex: 2,
  },
  충남: {
    region: '충남',
    annualGrowthRate: 0.020,
    discountRate: 0.05,
    transportGrade: 2,
    schoolGrade: 2,
    infraGrade: 2,
    supplyDemandIndex: 3,
  },
  전북: {
    region: '전북',
    annualGrowthRate: 0.015,
    discountRate: 0.05,
    transportGrade: 2,
    schoolGrade: 2,
    infraGrade: 2,
    supplyDemandIndex: 2,
  },
  전남: {
    region: '전남',
    annualGrowthRate: 0.012,
    discountRate: 0.05,
    transportGrade: 1,
    schoolGrade: 2,
    infraGrade: 2,
    supplyDemandIndex: 2,
  },
  경북: {
    region: '경북',
    annualGrowthRate: 0.015,
    discountRate: 0.05,
    transportGrade: 2,
    schoolGrade: 2,
    infraGrade: 2,
    supplyDemandIndex: 2,
  },
  경남: {
    region: '경남',
    annualGrowthRate: 0.018,
    discountRate: 0.05,
    transportGrade: 2,
    schoolGrade: 2,
    infraGrade: 2,
    supplyDemandIndex: 2,
  },
  제주: {
    region: '제주',
    annualGrowthRate: 0.022,
    discountRate: 0.05,
    transportGrade: 2,
    schoolGrade: 2,
    infraGrade: 2,
    supplyDemandIndex: 3,
  },
};

/** 매핑 미존재 시 사용하는 전국 평균 기본값 */
export const NATIONAL_DEFAULT: RegionalDefaults = {
  region: '전국',
  annualGrowthRate: 0.025,
  discountRate: 0.05,
  transportGrade: 3,
  schoolGrade: 3,
  infraGrade: 3,
  supplyDemandIndex: 3,
};

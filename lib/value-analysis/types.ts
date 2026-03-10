/**
 * +가치 분석 엔진 내부 타입 정의 (architecture.md 17.3절)
 *
 * 외부에 노출되는 ValueAnalysis, ValueGrade는 types/plus-features.ts를 사용한다.
 * 이 파일은 엔진 내부(lib/value-analysis/) 전용 타입을 정의한다.
 */
import type { ValueGrade } from '@/types/plus-features';
import type { RegionalDefaults } from './constants/regional-defaults';

/** 엔진에 주입되는 단지 원시 데이터 */
export interface ComplexRawData {
  complexId: string;
  region: string;
  district: string;
  /** 평당 분양가 (원) */
  pricePerSqm: number;
  /** 전용면적 (㎡) */
  areaSqm: number;
  /** 분양가 (원) */
  totalPriceKrw: number;
  /** complexes.raw_data JSONB */
  rawData: Record<string, unknown>;
}

/** 팩터 계산 함수 시그니처 (순수 함수 계약) */
export type FactorCalculator = (
  data: ComplexRawData,
  defaults: RegionalDefaults,
) => FactorResult;

/** 팩터 계산 결과 */
export interface FactorResult {
  factorId: string;
  /** 0 ~ maxScore */
  rawScore: number;
  maxScore: number;
  /** 0 ~ 100 (가중치 적용 전) */
  normalizedScore: number;
  /** 외부 데이터 확보 여부 */
  dataAvailable: boolean;
  /** 사용자 표시용 한국어 설명 */
  description: string;
}

/** 카테고리별 집계 */
export interface CategoryResult {
  categoryId: 'pricing' | 'location' | 'future_price';
  label: string;
  /** 가중치 적용 후 점수 (0~35 또는 0~30) */
  weightedScore: number;
  maxWeightedScore: number;
  factors: FactorResult[];
}

/** analyzeValueScore() 최종 반환 타입 */
export interface ValueAnalysisEngineResult {
  grade: ValueGrade;
  /** 0 ~ 100 */
  totalScore: number;
  categories: CategoryResult[];
}

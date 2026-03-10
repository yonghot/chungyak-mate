/**
 * +가치 분석 엔진 공개 API
 *
 * analyzeValueScore() 단일 진입점을 통해 ComplexRawData를 받아
 * ValueAnalysisEngineResult를 반환한다. (architecture.md 17.3절)
 */
import { REGIONAL_DEFAULTS, NATIONAL_DEFAULT } from './constants/regional-defaults';
import { mapScoreToGrade } from './grade-mapper';
import {
  calculatePriceGapRatio,
  calculatePricePerSqm,
  calculateDcfPremium,
} from './factors/pricing';
import {
  calculateTransportScore,
  calculateSchoolScore,
  calculateInfraScore,
  calculateNatureScore,
  calculateDevelopmentScore,
} from './factors/location';
import {
  calculateHistoricalTrend,
  calculateSupplyDemand,
  calculateMarketSentiment,
} from './factors/future-price';
import type { ComplexRawData, CategoryResult, ValueAnalysisEngineResult } from './types';

/**
 * 카테고리 내 팩터 점수를 가중 합산한다.
 *
 * 가중 점수 = sum(rawScore) / sum(maxScore) × maxWeightedScore
 */
function calcWeightedScore(
  factors: CategoryResult['factors'],
  maxWeightedScore: number,
): number {
  const totalRaw = factors.reduce((acc, f) => acc + f.rawScore, 0);
  const totalMax = factors.reduce((acc, f) => acc + f.maxScore, 0);
  if (totalMax === 0) { return 0; }
  return Math.round((totalRaw / totalMax) * maxWeightedScore);
}

/**
 * 단지 원시 데이터를 분석하여 A~F 등급과 세부 점수를 반환한다.
 *
 * @param data - 엔진에 주입되는 단지 원시 데이터
 * @returns 등급, 총점, 카테고리별 결과를 포함한 분석 결과
 */
export function analyzeValueScore(data: ComplexRawData): ValueAnalysisEngineResult {
  // 1. 지역별 기본값 로드 (없으면 전국 평균 사용)
  const defaults = REGIONAL_DEFAULTS[data.region] ?? NATIONAL_DEFAULT;

  // 2. 팩터별 원시 점수 계산
  const pricingFactors = [
    calculatePriceGapRatio(data, defaults),
    calculatePricePerSqm(data, defaults),
    calculateDcfPremium(data, defaults),
  ];

  const locationFactors = [
    calculateTransportScore(data, defaults),
    calculateSchoolScore(data, defaults),
    calculateInfraScore(data, defaults),
    calculateNatureScore(data, defaults),
    calculateDevelopmentScore(data, defaults),
  ];

  const futurePriceFactors = [
    calculateHistoricalTrend(data, defaults),
    calculateSupplyDemand(data, defaults),
    calculateMarketSentiment(data, defaults),
  ];

  // 3. 카테고리 가중 합산 (분양가 35점, 입지 35점, 미래 30점)
  const pricingWeighted = calcWeightedScore(pricingFactors, 35);
  const locationWeighted = calcWeightedScore(locationFactors, 35);
  const futurePriceWeighted = calcWeightedScore(futurePriceFactors, 30);

  const categories: CategoryResult[] = [
    {
      categoryId: 'pricing',
      label: '분양가 적정성',
      weightedScore: pricingWeighted,
      maxWeightedScore: 35,
      factors: pricingFactors,
    },
    {
      categoryId: 'location',
      label: '입지 환경',
      weightedScore: locationWeighted,
      maxWeightedScore: 35,
      factors: locationFactors,
    },
    {
      categoryId: 'future_price',
      label: '미래 시세',
      weightedScore: futurePriceWeighted,
      maxWeightedScore: 30,
      factors: futurePriceFactors,
    },
  ];

  // 4. 총점 산출 (0~100)
  const totalScore = pricingWeighted + locationWeighted + futurePriceWeighted;

  // 5. 등급 결정
  const grade = mapScoreToGrade(totalScore);

  return { grade, totalScore, categories };
}

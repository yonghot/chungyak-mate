/**
 * 분양가 적정성 팩터 계산 (architecture.md 17.2절 카테고리 1)
 *
 * - price_gap_ratio: 주변 시세 대비 분양가 비율 (15점)
 * - price_per_sqm:   평당 분양가 경쟁력 (10점)
 * - dcf_premium:     DCF 기반 적정가 대비 프리미엄 (10점)
 */
import type { ComplexRawData, FactorResult } from '../types';
import type { RegionalDefaults } from '../constants/regional-defaults';
import { normalize } from '../normalizer';

/** 보유 기간 (년) — DCF 계산 기본값 */
const HOLDING_YEARS = 5;

/**
 * 주변 시세 대비 분양가 비율을 계산한다. (15점 만점)
 *
 * district 기반 시세를 regional defaults의 평당가격으로 추정한다.
 * 분양가가 주변 시세보다 낮을수록 높은 점수를 부여한다.
 */
export function calculatePriceGapRatio(
  data: ComplexRawData,
  defaults: RegionalDefaults,
): FactorResult {
  const MAX_SCORE = 15;
  // regional defaults 평당가격 추정: 연 상승률을 역산하여 현재 시장가 추정
  // MVP: 지역별 표준 평당가 = 서울 기준 1억원을 성장률 비례 조정
  const BASE_PRICE_PER_SQM = 10_000_000; // 서울 기준 1억원/㎡ 환산
  const regionMultiplier = defaults.annualGrowthRate / 0.045; // 서울 대비 비율
  const estimatedMarketPricePerSqm = BASE_PRICE_PER_SQM * regionMultiplier;

  // 분양가 / 추정 시세 비율 (1.0이면 동일, 낮을수록 저평가)
  const ratio = data.pricePerSqm / estimatedMarketPricePerSqm;

  // 0.7 이하(30% 저평가)면 만점, 1.3 이상(30% 고평가)이면 0점
  const normalizedScore = normalize(ratio, 0.7, 1.3, true);
  const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);

  const isUndervalued = ratio < 1.0;
  const diffPct = Math.abs((ratio - 1.0) * 100).toFixed(1);
  const description = isUndervalued
    ? `주변 시세 대비 약 ${diffPct}% 저렴한 분양가`
    : `주변 시세 대비 약 ${diffPct}% 높은 분양가 (지역 평균 기준)`;

  return {
    factorId: 'price_gap_ratio',
    rawScore,
    maxScore: MAX_SCORE,
    normalizedScore,
    dataAvailable: false, // MVP: 실거래 API 미연동
    description,
  };
}

/**
 * 평당 분양가 경쟁력을 계산한다. (10점 만점)
 *
 * region 내 동급 면적대 평균 대비 분양가를 평가한다.
 * 낮을수록 경쟁력 있는 분양가.
 */
export function calculatePricePerSqm(
  data: ComplexRawData,
  defaults: RegionalDefaults,
): FactorResult {
  const MAX_SCORE = 10;
  // 지역 평균 평당가 추정: 성장률 기반 스케일링
  const SEOUL_AVG_PRICE_PER_SQM = 8_000_000;
  const avgPricePerSqm = SEOUL_AVG_PRICE_PER_SQM * (defaults.annualGrowthRate / 0.045);

  // 분양가/지역평균 비율: 낮을수록 고점 (inverse=true)
  const ratio = data.pricePerSqm / avgPricePerSqm;
  const normalizedScore = normalize(ratio, 0.6, 1.5, true);
  const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);

  const formattedPrice = (data.pricePerSqm / 10_000).toFixed(0);
  const description = `평당 분양가 ${formattedPrice}만원 (지역 평균 기준)`;

  return {
    factorId: 'price_per_sqm',
    rawScore,
    maxScore: MAX_SCORE,
    normalizedScore,
    dataAvailable: false,
    description,
  };
}

/**
 * DCF 기반 적정가 대비 프리미엄을 계산한다. (10점 만점)
 *
 * DCF 공식 (architecture.md 17.2절):
 *   estimatedFuturePrice = currentMarketPrice × (1 + annualGrowthRate)^holdingYears
 *   presentValue = estimatedFuturePrice / (1 + discountRate)^holdingYears
 *   dcfGap = (presentValue - sellingPrice) / sellingPrice × 100
 *
 * dcfGap이 양수(현가 > 분양가)일수록 높은 점수.
 */
export function calculateDcfPremium(
  data: ComplexRawData,
  defaults: RegionalDefaults,
): FactorResult {
  const MAX_SCORE = 10;
  const { annualGrowthRate, discountRate } = defaults;

  // 현재 시장가 추정 = 평당 분양가 × 면적 (MVP: 분양가를 시장가로 근사)
  const currentMarketPrice = data.totalPriceKrw;

  const estimatedFuturePrice =
    currentMarketPrice * Math.pow(1 + annualGrowthRate, HOLDING_YEARS);
  const presentValue =
    estimatedFuturePrice / Math.pow(1 + discountRate, HOLDING_YEARS);
  const dcfGap =
    ((presentValue - data.totalPriceKrw) / data.totalPriceKrw) * 100;

  // dcfGap: -30% 이하면 0점, +30% 이상이면 만점
  const normalizedScore = normalize(dcfGap, -30, 30, false);
  const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);

  const gapText = dcfGap >= 0 ? `+${dcfGap.toFixed(1)}%` : `${dcfGap.toFixed(1)}%`;
  const description =
    dcfGap >= 0
      ? `5년 보유 기준 현가 대비 ${gapText} 수익성 예상`
      : `5년 보유 기준 현가 대비 ${gapText} 손실 예상`;

  return {
    factorId: 'dcf_premium',
    rawScore,
    maxScore: MAX_SCORE,
    normalizedScore,
    dataAvailable: true,
    description,
  };
}

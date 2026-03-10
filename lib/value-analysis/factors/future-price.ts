/**
 * 미래 시세 팩터 계산 (architecture.md 17.2절 카테고리 3)
 *
 * - historical_trend:  지역 시세 트렌드 (12점)
 * - supply_demand:     공급/수요 지수 (10점)
 * - market_sentiment:  시장 심리/수요 지수 (8점)
 */
import type { ComplexRawData, FactorResult } from '../types';
import type { RegionalDefaults } from '../constants/regional-defaults';
import { normalize } from '../normalizer';

/**
 * 지역 시세 트렌드를 계산한다. (12점 만점)
 *
 * regional defaults의 연평균 상승률(annualGrowthRate)을 기반으로 점수를 산출한다.
 * Phase 2에서 국토부 실거래 API로 대체 예정.
 */
export function calculateHistoricalTrend(
  _data: ComplexRawData,
  defaults: RegionalDefaults,
): FactorResult {
  const MAX_SCORE = 12;
  // 연평균 상승률: 0%(0점) ~ 5%(100점) 범위로 정규화
  const normalizedScore = normalize(defaults.annualGrowthRate, 0, 0.05, false);
  const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);

  const pctDisplay = (defaults.annualGrowthRate * 100).toFixed(1);
  const description = `최근 3년 연평균 ${pctDisplay}% 상승 (지역 상수 기준)`;

  return {
    factorId: 'historical_trend',
    rawScore,
    maxScore: MAX_SCORE,
    normalizedScore,
    dataAvailable: false, // Phase 2: 국토부 API 연동 후 true
    description,
  };
}

/**
 * 공급/수요 지수를 계산한다. (10점 만점)
 *
 * regional defaults의 supplyDemandIndex(1~5)를 점수로 변환한다.
 * 수치가 높을수록 수요 대비 공급이 적어 가격 상승 유리.
 */
export function calculateSupplyDemand(
  _data: ComplexRawData,
  defaults: RegionalDefaults,
): FactorResult {
  const MAX_SCORE = 10;
  const normalizedScore = normalize(defaults.supplyDemandIndex, 1, 5, false);
  const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);

  const gradeLabel = ['', '공급 과잉', '공급 다소 많음', '균형', '수요 우세', '수요 강세'][
    defaults.supplyDemandIndex
  ];
  const description = `공급·수요 현황 ${gradeLabel} (지역 평균 기준)`;

  return {
    factorId: 'supply_demand',
    rawScore,
    maxScore: MAX_SCORE,
    normalizedScore,
    dataAvailable: false,
    description,
  };
}

/**
 * 시장 심리/수요 지수를 계산한다. (8점 만점)
 *
 * complexes.raw_data에서 competition_rate(경쟁률) 키를 파싱한다.
 * 데이터 미확보 시 중간값(50점 정규화) 적용.
 */
export function calculateMarketSentiment(
  data: ComplexRawData,
  _defaults: RegionalDefaults,
): FactorResult {
  const MAX_SCORE = 8;
  const rawCompetitionRate = data.rawData['competition_rate'];

  if (typeof rawCompetitionRate === 'number' && rawCompetitionRate >= 0) {
    // 경쟁률: 0(미달/0점) ~ 50(50:1 이상, 100점) 범위
    const normalizedScore = normalize(rawCompetitionRate, 0, 50, false);
    const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);
    return {
      factorId: 'market_sentiment',
      rawScore,
      maxScore: MAX_SCORE,
      normalizedScore,
      dataAvailable: true,
      description: `유사 단지 경쟁률 ${rawCompetitionRate.toFixed(1)}:1 반영`,
    };
  }

  // 데이터 미확보: 중간값
  const normalizedScore = 50;
  const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);
  return {
    factorId: 'market_sentiment',
    rawScore,
    maxScore: MAX_SCORE,
    normalizedScore,
    dataAvailable: false,
    description: '시장 심리 데이터 미확보 (지역 평균 적용)',
  };
}

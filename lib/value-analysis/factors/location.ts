/**
 * 입지 환경 팩터 계산 (architecture.md 17.2절 카테고리 2)
 *
 * - transport_score:   교통 접근성 (10점)
 * - school_score:      학군 (8점)
 * - infra_score:       생활 인프라 (7점)
 * - nature_score:      자연환경 (5점)
 * - development_score: 개발 호재 (5점)
 */
import type { ComplexRawData, FactorResult } from '../types';
import type { RegionalDefaults } from '../constants/regional-defaults';
import { normalize } from '../normalizer';

/**
 * 등급(1~5)을 0~100 점수로 변환한다.
 *
 * @param grade - 1(최하) ~ 5(최상) 등급
 */
function gradeToNormalized(grade: number): number {
  return normalize(grade, 1, 5, false);
}

/**
 * 교통 접근성을 계산한다. (10점 만점)
 *
 * RegionalDefaults.transportGrade(1~5)를 점수로 변환한다.
 */
export function calculateTransportScore(
  _data: ComplexRawData,
  defaults: RegionalDefaults,
): FactorResult {
  const MAX_SCORE = 10;
  const normalizedScore = gradeToNormalized(defaults.transportGrade);
  const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);

  const gradeLabel = ['', '매우 낮음', '낮음', '보통', '높음', '매우 높음'][
    defaults.transportGrade
  ];
  const description = `교통 접근성 ${gradeLabel} (지역 평균 기준)`;

  return {
    factorId: 'transport_score',
    rawScore,
    maxScore: MAX_SCORE,
    normalizedScore,
    dataAvailable: false,
    description,
  };
}

/**
 * 학군 점수를 계산한다. (8점 만점)
 *
 * RegionalDefaults.schoolGrade(1~5)를 점수로 변환한다.
 */
export function calculateSchoolScore(
  _data: ComplexRawData,
  defaults: RegionalDefaults,
): FactorResult {
  const MAX_SCORE = 8;
  const normalizedScore = gradeToNormalized(defaults.schoolGrade);
  const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);

  const gradeLabel = ['', '매우 낮음', '낮음', '보통', '높음', '매우 높음'][
    defaults.schoolGrade
  ];
  const description = `학군 수준 ${gradeLabel} (지역 평균 기준)`;

  return {
    factorId: 'school_score',
    rawScore,
    maxScore: MAX_SCORE,
    normalizedScore,
    dataAvailable: false,
    description,
  };
}

/**
 * 생활 인프라 점수를 계산한다. (7점 만점)
 *
 * RegionalDefaults.infraGrade(1~5)를 점수로 변환한다.
 */
export function calculateInfraScore(
  _data: ComplexRawData,
  defaults: RegionalDefaults,
): FactorResult {
  const MAX_SCORE = 7;
  const normalizedScore = gradeToNormalized(defaults.infraGrade);
  const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);

  const gradeLabel = ['', '매우 낮음', '낮음', '보통', '높음', '매우 높음'][
    defaults.infraGrade
  ];
  const description = `생활 인프라 ${gradeLabel} (지역 평균 기준)`;

  return {
    factorId: 'infra_score',
    rawScore,
    maxScore: MAX_SCORE,
    normalizedScore,
    dataAvailable: false,
    description,
  };
}

/**
 * 자연환경 점수를 계산한다. (5점 만점)
 *
 * complexes.raw_data에서 nature_grade 키를 파싱한다.
 * 데이터 미확보 시 중간값(50점 정규화) 적용.
 */
export function calculateNatureScore(
  data: ComplexRawData,
  _defaults: RegionalDefaults,
): FactorResult {
  const MAX_SCORE = 5;
  const rawNatureGrade = data.rawData['nature_grade'];

  if (typeof rawNatureGrade === 'number' && rawNatureGrade >= 1 && rawNatureGrade <= 5) {
    const normalizedScore = gradeToNormalized(rawNatureGrade);
    const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);
    return {
      factorId: 'nature_score',
      rawScore,
      maxScore: MAX_SCORE,
      normalizedScore,
      dataAvailable: true,
      description: '강변/산세권/공원 조망 환경 분석',
    };
  }

  // 데이터 미확보: 중간값 (50점 정규화 = rawScore 절반)
  const normalizedScore = 50;
  const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);
  return {
    factorId: 'nature_score',
    rawScore,
    maxScore: MAX_SCORE,
    normalizedScore,
    dataAvailable: false,
    description: '자연환경 데이터 미확보 (지역 평균 적용)',
  };
}

/**
 * 개발 호재 점수를 계산한다. (5점 만점)
 *
 * complexes.raw_data에서 development_grade 키를 파싱한다.
 * 데이터 미확보 시 중간값(50점 정규화) 적용.
 */
export function calculateDevelopmentScore(
  data: ComplexRawData,
  _defaults: RegionalDefaults,
): FactorResult {
  const MAX_SCORE = 5;
  const rawDevelopmentGrade = data.rawData['development_grade'];

  if (
    typeof rawDevelopmentGrade === 'number' &&
    rawDevelopmentGrade >= 1 &&
    rawDevelopmentGrade <= 5
  ) {
    const normalizedScore = gradeToNormalized(rawDevelopmentGrade);
    const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);
    return {
      factorId: 'development_score',
      rawScore,
      maxScore: MAX_SCORE,
      normalizedScore,
      dataAvailable: true,
      description: 'GTX·재개발·신규 산업단지 등 개발 호재 반영',
    };
  }

  const normalizedScore = 50;
  const rawScore = Math.round((normalizedScore / 100) * MAX_SCORE);
  return {
    factorId: 'development_score',
    rawScore,
    maxScore: MAX_SCORE,
    normalizedScore,
    dataAvailable: false,
    description: '개발 호재 데이터 미확보 (지역 평균 적용)',
  };
}

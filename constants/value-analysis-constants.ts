/**
 * +가치 분석 UI 상수
 *
 * 등급별 색상(Tailwind 클래스)과 팩터 ID → 한국어 레이블 매핑을 정의한다.
 */
import type { ValueGrade, TrendDirection, DataSource } from '@/types/plus-features';

/** 등급별 Tailwind 색상 클래스 */
export const VALUE_GRADE_COLORS: Record<ValueGrade, string> = {
  A: 'text-emerald-600 bg-emerald-50',
  B: 'text-blue-600 bg-blue-50',
  C: 'text-yellow-600 bg-yellow-50',
  D: 'text-orange-600 bg-orange-50',
  E: 'text-red-500 bg-red-50',
  F: 'text-red-700 bg-red-100',
};

/** 등급별 한국어 설명 */
export const VALUE_GRADE_LABELS: Record<ValueGrade, string> = {
  A: '적극 권장',
  B: '권장',
  C: '보통',
  D: '주의',
  E: '비권장',
  F: '기회 소진 경고',
};

/** 팩터 ID → 한국어 레이블 매핑 */
export const FACTOR_LABELS: Record<string, string> = {
  price_gap_ratio: '주변 시세 대비 분양가 비율',
  price_per_sqm: '평당 분양가 경쟁력',
  dcf_premium: 'DCF 기반 적정가 대비 프리미엄',
  transport_score: '교통 접근성',
  school_score: '학군',
  infra_score: '생활 인프라',
  nature_score: '자연환경',
  development_score: '개발 호재',
  historical_trend: '지역 시세 트렌드',
  supply_demand: '공급/수요 지수',
  market_sentiment: '시장 심리/수요 지수',
};

/** 카테고리 ID → 한국어 레이블 매핑 */
export const CATEGORY_LABELS: Record<string, string> = {
  pricing: '분양가 적정성',
  location: '입지 환경',
  future_price: '미래 시세',
};

/** 시세 방향성 → 한국어 레이블 매핑 */
export const TREND_LABELS: Record<TrendDirection, string> = {
  up: '상승',
  down: '하락',
  neutral: '보합',
};

/** 시세 방향성 → 아이콘 문자 매핑 */
export const TREND_ICONS: Record<TrendDirection, string> = {
  up: '▲',
  down: '▼',
  neutral: '─',
};

/** 기본 데이터 출처 */
export const DATA_SOURCE_DEFAULT: DataSource = {
  label: '청약홈 공공데이터 + 자체 모델링',
  // split('T')[0]은 ISO 형식에서 항상 날짜 부분을 반환하므로 non-null 단언 대신 ?? 처리
  baseDate: new Date().toISOString().split('T')[0] ?? new Date().toISOString(),
};

/**
 * 원시 지표 → 0~100 정규화 순수 함수 (architecture.md 17.3절)
 */

/**
 * 원시 수치를 0~100 점수로 정규화한다.
 *
 * @param value     - 원시 값
 * @param minValue  - 최솟값 (0점 기준)
 * @param maxValue  - 최댓값 (100점 기준)
 * @param inverse   - true이면 값이 낮을수록 높은 점수 (예: 평당 분양가)
 * @returns 0~100 사이의 정수 점수
 */
export function normalize(
  value: number,
  minValue: number,
  maxValue: number,
  inverse = false,
): number {
  const clamped = Math.max(minValue, Math.min(maxValue, value));
  const ratio = (clamped - minValue) / (maxValue - minValue);
  return Math.round((inverse ? 1 - ratio : ratio) * 100);
}

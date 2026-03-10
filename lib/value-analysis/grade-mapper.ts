/**
 * 총점 → ValueGrade 매핑 순수 함수 (architecture.md 17.3절)
 */
import type { ValueGrade } from '@/types/plus-features';

/**
 * 총점을 A~F 등급으로 변환한다.
 *
 * @param totalScore - 0~100 총점
 * @returns ValueGrade (A~F)
 */
export function mapScoreToGrade(totalScore: number): ValueGrade {
  if (totalScore >= 85) { return 'A'; }
  if (totalScore >= 70) { return 'B'; }
  if (totalScore >= 55) { return 'C'; }
  if (totalScore >= 40) { return 'D'; }
  if (totalScore >= 25) { return 'E'; }
  return 'F';
}

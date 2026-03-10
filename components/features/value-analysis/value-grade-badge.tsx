import { cn } from '@/lib/utils/cn';
import {
  VALUE_GRADE_COLORS,
  VALUE_GRADE_LABELS,
} from '@/constants/value-analysis-constants';
import type { ValueGrade } from '@/types/plus-features';

interface ValueGradeBadgeProps {
  /** A~F 가치 등급 */
  grade: ValueGrade;
  /** 추가 Tailwind 클래스 */
  className?: string;
  /** 배지 크기 변형 */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base font-bold',
};

/**
 * +가치 분석 등급 배지
 *
 * A~F 등급을 등급별 색상으로 표시한다.
 * VALUE_GRADE_COLORS, VALUE_GRADE_LABELS는 상수 파일에서 관리한다.
 */
export function ValueGradeBadge({
  grade,
  className,
  size = 'md',
}: ValueGradeBadgeProps) {
  const colorClass = VALUE_GRADE_COLORS[grade];
  const label = VALUE_GRADE_LABELS[grade];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg font-semibold',
        colorClass,
        sizeClass,
        className,
      )}
      aria-label={`가치 등급 ${grade}: ${label}`}
    >
      <span className="font-bold">{grade}</span>
      <span className="opacity-80">{label}</span>
    </span>
  );
}

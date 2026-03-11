import { cn } from '@/lib/utils/cn';
import type { TrendDirection } from '@/types/plus-features';

interface TrendBadgeProps {
  direction: TrendDirection;
  className?: string;
}

/** 트렌드 방향별 표시 설정 */
const TREND_CONFIG: Record<
  TrendDirection,
  { label: string; ariaLabel: string; style: React.CSSProperties }
> = {
  up: {
    label: '▲ 상승',
    ariaLabel: '상승 추세',
    style: {
      color: 'hsl(var(--trend-up))',
      backgroundColor: 'hsl(var(--trend-up) / 0.1)',
    },
  },
  down: {
    label: '▼ 하락',
    ariaLabel: '하락 추세',
    style: {
      color: 'hsl(var(--trend-down))',
      backgroundColor: 'hsl(var(--trend-down) / 0.1)',
    },
  },
  neutral: {
    label: '─ 보합',
    ariaLabel: '보합',
    style: {
      color: 'hsl(var(--trend-neutral))',
      backgroundColor: 'hsl(var(--trend-neutral) / 0.1)',
    },
  },
};

/**
 * 시세 방향성을 시각적으로 표시하는 배지
 *
 * up/down/neutral 방향에 따라 색상과 레이블이 변경된다.
 */
export function TrendBadge({ direction, className }: TrendBadgeProps) {
  const config = TREND_CONFIG[direction];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        className,
      )}
      style={config.style}
      aria-label={config.ariaLabel}
    >
      {config.label}
    </span>
  );
}

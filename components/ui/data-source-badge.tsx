import { Database } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { DataSource } from '@/types/plus-features';

interface DataSourceBadgeProps {
  dataSource: DataSource;
  className?: string;
}

/**
 * ISO 날짜 문자열을 'YYYY.MM.DD' 형식으로 변환한다.
 *
 * @param isoDate - ISO 8601 날짜 문자열 (예: '2025-03-11')
 * @returns 변환된 날짜 문자열 (예: '2025.03.11')
 */
function formatBaseDate(isoDate: string): string {
  const parts = isoDate.slice(0, 10).split('-');
  if (parts.length !== 3) {
    return isoDate;
  }
  return parts.join('.');
}

/**
 * 데이터 출처와 기준일을 표시하는 배지
 *
 * Database 아이콘, 출처 레이블, 기준일을 인라인으로 표시한다.
 */
export function DataSourceBadge({ dataSource, className }: DataSourceBadgeProps) {
  const formattedDate = formatBaseDate(dataSource.baseDate);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-muted-foreground',
        className,
      )}
    >
      <Database className="h-3 w-3 shrink-0" aria-hidden="true" />
      {dataSource.label} · {formattedDate}
    </span>
  );
}

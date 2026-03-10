'use client';

import Link from 'next/link';
import { Heart, MapPin, Building2, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HoverLift } from '@/components/ui/motion';
import { cn } from '@/lib/utils/cn';
import { formatDateShort } from '@/lib/utils/format';
import { useValueAnalysis } from '@/hooks/use-value-analysis';
import { ValueGradeBadge } from '@/components/features/value-analysis/value-grade-badge';
import type { Complex, ComplexStatus } from '@/types';

interface ComplexCardProps {
  complex: Complex;
  bookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
}

const STATUS_CONFIG: Record<
  ComplexStatus,
  {
    label: string;
    className: string;
    barClassName: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  upcoming: {
    label: '접수예정',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    barClassName: 'from-slate-300 to-slate-400',
    icon: Clock,
  },
  open: {
    label: '접수중',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    barClassName: 'from-blue-400 to-blue-600',
    icon: CheckCircle2,
  },
  closed: {
    label: '접수마감',
    className: 'bg-red-50 text-red-600 border-red-200',
    barClassName: 'from-red-400 to-rose-500',
    icon: XCircle,
  },
  completed: {
    label: '완료',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
    barClassName: 'from-gray-300 to-gray-400',
    icon: CheckCircle2,
  },
};

export function ComplexCard({
  complex,
  bookmarked = false,
  onToggleBookmark,
}: ComplexCardProps) {
  const statusConfig = STATUS_CONFIG[complex.status];
  const StatusIcon = statusConfig.icon;
  const { data: valueData } = useValueAnalysis(complex.id);
  const valueGrade = valueData?.data?.grade;

  return (
    <HoverLift y={-4} scale={1.02}>
      <Card className="group relative overflow-hidden rounded-xl shadow-md transition-shadow hover:shadow-xl">
        {/* 상태별 그라데이션 바 */}
        <div
          className={cn(
            'absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r',
            statusConfig.barClassName,
          )}
          aria-hidden="true"
        />

        <Link href={`/complexes/${complex.id}`} className="absolute inset-0 z-0">
          <span className="sr-only">{complex.name} 상세보기</span>
        </Link>

        <CardHeader className="pb-3 pt-5 px-6">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug line-clamp-2">
              {complex.name}
            </CardTitle>
            {onToggleBookmark && (
              <Button
                variant="ghost"
                size="icon"
                className="relative z-10 h-8 w-8 shrink-0 rounded-full hover:bg-red-50"
                onClick={(e) => {
                  e.preventDefault();
                  onToggleBookmark(complex.id);
                }}
                aria-label={bookmarked ? '북마크 해제' : '북마크 추가'}
              >
                <Heart
                  className={cn(
                    'h-4 w-4 transition-all duration-200',
                    bookmarked
                      ? 'fill-red-500 text-red-500 scale-110'
                      : 'text-muted-foreground group-hover:text-red-400',
                  )}
                />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3.5 px-6 pb-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            <span className="truncate">
              {complex.region} {complex.district}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  statusConfig.className,
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
              {valueGrade && (
                <ValueGradeBadge grade={valueGrade} size="sm" />
              )}
            </div>

            {complex.total_units !== null && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span>{complex.total_units.toLocaleString()}세대</span>
              </div>
            )}
          </div>

          {(complex.subscription_start || complex.subscription_end) && (
            <div className="flex items-center gap-1.5 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>
                {complex.subscription_start
                  ? formatDateShort(complex.subscription_start)
                  : '-'}
                {' ~ '}
                {complex.subscription_end
                  ? formatDateShort(complex.subscription_end)
                  : '-'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </HoverLift>
  );
}

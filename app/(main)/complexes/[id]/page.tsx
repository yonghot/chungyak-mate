'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  BarChart3,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  Users,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  PageTransition,
  FadeInUp,
} from '@/components/ui/motion';
import { useComplexDetail, useToggleBookmark } from '@/hooks/use-complexes';
import { getSupplyTypeLabel } from '@/constants/supply-types';
import { formatCurrency, formatDate, formatArea } from '@/lib/utils/format';
import type { ComplexStatus } from '@/types';

const STATUS_MAP: Record<
  ComplexStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }
> = {
  upcoming: {
    label: '공고예정',
    variant: 'secondary',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  open: {
    label: '접수중',
    variant: 'default',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  closed: {
    label: '접수마감',
    variant: 'outline',
    className: 'bg-red-50 text-red-600 border-red-200',
  },
  completed: {
    label: '완료',
    variant: 'destructive',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
};

interface InfoItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}


export default function ComplexDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading, error } = useComplexDetail(id);
  const toggleBookmark = useToggleBookmark();

  const handleBookmarkToggle = async () => {
    try {
      const result = await toggleBookmark.mutateAsync(id);
      toast.success(
        result.bookmarked ? '북마크에 추가했습니다.' : '북마크에서 제거했습니다.',
      );
    } catch {
      toast.error('북마크 처리에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-9 w-72 rounded-md" />
          <Skeleton className="h-5 w-40 rounded-md" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </Button>
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <p className="mt-4 text-base font-semibold text-destructive">
            단지 정보를 불러오지 못했습니다
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            잠시 후 다시 시도해주세요.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-6"
            onClick={() => router.refresh()}
          >
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  const { complex, supplyTypes } = data;
  const statusInfo = STATUS_MAP[complex.status];

  const scheduleSteps = [
    complex.subscription_start
      ? { label: '접수 시작', date: formatDate(complex.subscription_start) }
      : null,
    complex.subscription_end
      ? { label: '접수 마감', date: formatDate(complex.subscription_end) }
      : null,
    complex.winner_date
      ? { label: '당첨자 발표', date: formatDate(complex.winner_date) }
      : null,
  ].filter(Boolean) as Array<{ label: string; date: string }>;

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* 헤더 영역 */}
        <FadeInUp>
          <div className="flex items-start justify-between">
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="mb-3 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
                목록으로
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">
                {complex.name}
              </h1>
              <div className="mt-3 flex items-center gap-2.5">
                <Badge
                  variant="outline"
                  className={statusInfo.className}
                >
                  {statusInfo.label}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    {complex.region} {complex.district}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="mt-10 rounded-xl"
              onClick={handleBookmarkToggle}
              disabled={toggleBookmark.isPending}
              aria-label="북마크 토글"
            >
              {toggleBookmark.isPending ? (
                <BookmarkCheck className="h-4 w-4 animate-pulse" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>
        </FadeInUp>

        {/* 기본 정보 카드 */}
        <FadeInUp delay={0.1}>
          <Card className="rounded-xl shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">단지 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {complex.address && (
                  <InfoItem
                    icon={MapPin}
                    label="주소"
                    value={complex.address}
                  />
                )}
                {complex.developer && (
                  <InfoItem
                    icon={Building2}
                    label="시행사"
                    value={complex.developer}
                  />
                )}
                {complex.total_units && (
                  <InfoItem
                    icon={Users}
                    label="총 세대수"
                    value={`${complex.total_units.toLocaleString()}세대`}
                  />
                )}
                {complex.announcement_date && (
                  <InfoItem
                    icon={Calendar}
                    label="공고일"
                    value={formatDate(complex.announcement_date)}
                  />
                )}
              </dl>

              {/* 청약 일정 타임라인 */}
              {scheduleSteps.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <div>
                    <h3 className="mb-4 text-sm font-semibold">청약 일정</h3>
                    <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {/* 연결선 (데스크탑) */}
                      {scheduleSteps.length > 1 && (
                        <div
                          className="absolute left-[16px] top-4 hidden h-0.5 bg-border sm:block"
                          style={{
                            right: `${(1 / scheduleSteps.length) * 100 + 16}px`,
                            left: `calc(${(1 / scheduleSteps.length) * 100}% + 16px)`,
                          }}
                          aria-hidden="true"
                        />
                      )}
                      {scheduleSteps.map((step, idx) => (
                        <div key={step.label} className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {step.label}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold">
                              {step.date}
                            </p>
                          </div>
                          {idx < scheduleSteps.length - 1 && (
                            <div className="mt-4 h-full w-0.5 bg-border sm:hidden" aria-hidden="true" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </FadeInUp>

        {/* 공급유형 테이블 */}
        {supplyTypes.length > 0 && (
          <FadeInUp delay={0.15}>
            <Card className="rounded-xl shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">
                  공급유형별 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                          공급유형
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                          세대수
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                          전용면적
                        </th>
                        <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                          분양가
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplyTypes.map((st) => (
                        <tr
                          key={st.id}
                          className="border-b transition-colors hover:bg-muted/40 last:border-0"
                        >
                          <td className="px-6 py-3.5 font-medium">
                            {getSupplyTypeLabel(st.type)}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums">
                            {st.unit_count.toLocaleString()}세대
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums">
                            {st.area_sqm ? formatArea(st.area_sqm) : '-'}
                          </td>
                          <td className="px-6 py-3.5 text-right tabular-nums">
                            {st.price_krw ? formatCurrency(st.price_krw) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </FadeInUp>
        )}

        {/* CTA 버튼 */}
        <FadeInUp delay={0.2}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="group flex flex-1 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-6 py-4 text-base font-semibold text-primary-foreground shadow-md transition-all hover:from-primary/90 hover:to-primary/70 hover:shadow-lg active:scale-[0.99]"
              onClick={() => router.push(`/complexes/${id}/eligibility`)}
            >
              자격 진단 시작하기
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              className="group flex flex-1 items-center justify-center gap-3 rounded-xl border-2 border-primary/20 bg-primary/5 px-6 py-4 text-base font-semibold text-primary shadow-sm transition-all hover:border-primary/40 hover:bg-primary/10 hover:shadow-md active:scale-[0.99]"
              onClick={() => router.push(`/complexes/${id}/value`)}
            >
              <BarChart3 className="h-5 w-5" />
              +가치 분석 보기
            </button>
          </div>
        </FadeInUp>
      </div>
    </PageTransition>
  );
}

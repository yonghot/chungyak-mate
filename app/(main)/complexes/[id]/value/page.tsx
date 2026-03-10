'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition, FadeInUp } from '@/components/ui/motion';
import { useValueAnalysis } from '@/hooks/use-value-analysis';
import { useComplexDetail } from '@/hooks/use-complexes';
import { ValueScoreCard } from '@/components/features/value-analysis/value-score-card';
import { CategoryBreakdown } from '@/components/features/value-analysis/category-breakdown';
import { FactorList } from '@/components/features/value-analysis/factor-list';

/** 로딩 스켈레톤 */
function ValueAnalysisLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="분석 결과 로딩 중">
      <div className="space-y-3">
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="h-9 w-48 rounded-md" />
        <Skeleton className="h-4 w-36 rounded-md" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-36 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/** 에러 상태 */
function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden="true" />
      </div>
      <p className="mt-4 text-base font-semibold text-destructive">
        가치 분석을 불러오지 못했습니다
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{message}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-6"
        onClick={onRetry}
      >
        다시 시도
      </Button>
    </div>
  );
}

/**
 * 단지별 +가치 분석 페이지
 *
 * /complexes/[id]/value 라우트.
 * useValueAnalysis 훅으로 API 호출 후 ValueScoreCard → CategoryBreakdown → FactorList 순으로 표시한다.
 */
export default function ValueAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: complexData } = useComplexDetail(id);
  const {
    data: analysisResponse,
    isLoading,
    error,
    refetch,
  } = useValueAnalysis(id);

  const complexName = complexData?.complex.name;

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* 헤더 스켈레톤 */}
        <div>
          <Skeleton className="mb-3 h-8 w-24 rounded-md" />
        </div>
        <ValueAnalysisLoading />
      </div>
    );
  }

  if (error || !analysisResponse) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : '잠시 후 다시 시도해주세요.';

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => router.push(`/complexes/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          단지 상세로
        </Button>
        <ErrorState message={errorMessage} onRetry={() => refetch()} />
      </div>
    );
  }

  const analysis = analysisResponse.data;

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* 헤더 */}
        <FadeInUp>
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-3 gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => router.push(`/complexes/${id}`)}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              단지 상세로
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">+가치 분석</h1>
            </div>
            {complexName && (
              <p className="mt-2 text-muted-foreground">{complexName}</p>
            )}
          </div>
        </FadeInUp>

        {/* 총점 요약 카드 */}
        <FadeInUp delay={0.1}>
          <ValueScoreCard
            grade={analysis.grade}
            totalScore={analysis.totalScore}
            maxScore={analysis.maxScore}
          />
        </FadeInUp>

        {/* 카테고리별 점수 막대 차트 */}
        <FadeInUp delay={0.15}>
          <CategoryBreakdown factors={analysis.factors} />
        </FadeInUp>

        {/* 세부 팩터 목록 */}
        <FadeInUp delay={0.2}>
          <FactorList factors={analysis.factors} />
        </FadeInUp>
      </div>
    </PageTransition>
  );
}

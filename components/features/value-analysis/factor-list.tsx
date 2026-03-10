import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { FACTOR_LABELS } from '@/constants/value-analysis-constants';
import type { ValueFactor } from '@/types/plus-features';

interface FactorListProps {
  /** 세부 팩터 점수 배열 */
  factors: ValueFactor[];
}

interface FactorItemProps {
  factor: ValueFactor;
}

/** 점수 비율에 따른 색상 결정 */
function getScoreColorClass(score: number, maxScore: number): string {
  if (maxScore === 0) {
    return 'text-muted-foreground';
  }
  const ratio = score / maxScore;
  if (ratio >= 0.8) {
    return 'text-emerald-600';
  }
  if (ratio >= 0.6) {
    return 'text-blue-600';
  }
  if (ratio >= 0.4) {
    return 'text-yellow-600';
  }
  if (ratio >= 0.2) {
    return 'text-orange-500';
  }
  return 'text-red-500';
}

/** 데이터 미확보 여부 판단 */
function isDataUnavailable(description: string): boolean {
  return description.includes('데이터 미확보') || description.includes('데이터 없음');
}

function FactorItem({ factor }: FactorItemProps) {
  const label = FACTOR_LABELS[factor.factor] ?? factor.factor;
  const percentage = factor.maxScore > 0 ? (factor.score / factor.maxScore) * 100 : 0;
  const scoreColorClass = getScoreColorClass(factor.score, factor.maxScore);
  const unavailable = isDataUnavailable(factor.description);

  return (
    <li className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug">{label}</span>
        <span
          className={cn(
            'shrink-0 text-sm font-semibold tabular-nums',
            scoreColorClass,
          )}
          aria-label={`점수 ${factor.score}점 / ${factor.maxScore}점`}
        >
          {factor.score} / {factor.maxScore}
        </span>
      </div>

      {/* 팩터 점수 진행 막대 */}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={factor.score}
        aria-valuemin={0}
        aria-valuemax={factor.maxScore}
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-primary/70 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 설명 또는 데이터 미확보 안내 */}
      {unavailable ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50" aria-hidden="true" />
          데이터 미확보 — 향후 업데이트 예정
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{factor.description}</p>
      )}
    </li>
  );
}

/**
 * 세부 팩터 목록
 *
 * ValueFactor[] 배열을 받아 각 팩터의 점수와 설명을 카드 형태로 나열한다.
 * description에 "데이터 미확보"가 포함되면 별도 안내 문구로 대체한다.
 */
export function FactorList({ factors }: FactorListProps) {
  if (factors.length === 0) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">분석 항목이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">세부 항목 점수</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="세부 팩터 점수 목록">
          {factors.map((factor) => (
            <FactorItem key={factor.factor} factor={factor} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

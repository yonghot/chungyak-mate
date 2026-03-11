import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ValueGradeBadge } from './value-grade-badge';
import { DataSourceBadge } from '@/components/ui/data-source-badge';
import { VALUE_GRADE_LABELS } from '@/constants/value-analysis-constants';
import type { ValueGrade, DataSource } from '@/types/plus-features';

interface ValueScoreCardProps {
  /** A~F 가치 등급 */
  grade: ValueGrade;
  /** 취득 점수 */
  totalScore: number;
  /** 최대 점수 */
  maxScore: number;
  /** 분석일 (ISO 날짜 문자열) */
  analyzedAt?: string;
  /** 데이터 출처 */
  dataSource?: DataSource;
  /** 데이터 신뢰도 (0~100) */
  confidence?: number;
}

/**
 * +가치 분석 총점 요약 카드
 *
 * 등급 배지, 총점, 등급 설명 텍스트, 데이터 출처 및 신뢰도를 함께 표시한다.
 */
export function ValueScoreCard({
  grade,
  totalScore,
  maxScore,
  dataSource,
  confidence,
}: ValueScoreCardProps) {
  const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const gradeDescription = VALUE_GRADE_LABELS[grade];

  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">+가치 분석 결과</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {/* 등급 배지 */}
          <ValueGradeBadge grade={grade} size="lg" />

          {/* 총점 표시 */}
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tabular-nums text-foreground">
                {totalScore}
              </span>
              <span className="text-lg text-muted-foreground">
                / {maxScore}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">종합 점수</p>
          </div>
        </div>

        {/* 점수 진행 막대 */}
        <div className="mt-4">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={totalScore}
            aria-valuemin={0}
            aria-valuemax={maxScore}
            aria-label={`총점 ${totalScore}점 / ${maxScore}점`}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
        </div>

        {/* 등급 설명 */}
        <p className="mt-3 text-sm text-muted-foreground">
          이 단지는 <strong className="text-foreground">{gradeDescription}</strong> 등급으로 평가되었습니다.
        </p>

        {/* 데이터 출처 및 신뢰도 */}
        {(dataSource ?? confidence !== undefined) && (
          <div className="mt-3 flex items-center justify-between">
            {dataSource && <DataSourceBadge dataSource={dataSource} />}
            {confidence !== undefined && (
              <span className="text-xs text-muted-foreground">
                데이터 신뢰도 {confidence}%
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

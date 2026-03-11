'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils/cn';
import {
  CATEGORY_LABELS,
  FACTOR_LABELS,
} from '@/constants/value-analysis-constants';
import type { ValueFactor } from '@/types/plus-features';

interface CategoryBreakdownProps {
  /** 세부 팩터 점수 배열 */
  factors: ValueFactor[];
}

/** 팩터 ID → 카테고리 키 매핑 */
const FACTOR_CATEGORY_MAP: Record<string, string> = {
  price_gap_ratio: 'pricing',
  price_per_sqm: 'pricing',
  dcf_premium: 'pricing',
  transport_score: 'location',
  school_score: 'location',
  infra_score: 'location',
  nature_score: 'location',
  development_score: 'location',
  historical_trend: 'future_price',
  supply_demand: 'future_price',
  market_sentiment: 'future_price',
};

/** 카테고리별 최대 점수 (설계 기준) */
const CATEGORY_MAX_SCORE: Record<string, number> = {
  pricing: 35,
  location: 35,
  future_price: 30,
};

/** 카테고리별 막대 색상 */
const CATEGORY_BAR_COLORS: Record<string, string> = {
  pricing: 'bg-blue-500',
  location: 'bg-emerald-500',
  future_price: 'bg-violet-500',
};

interface CategoryRow {
  categoryKey: string;
  label: string;
  score: number;
  maxScore: number;
  factorItems: Array<{ label: string; score: number; maxScore: number }>;
}

type CategoryKey = 'pricing' | 'location' | 'future_price';

type AccumulatorEntry = { score: number; factorItems: CategoryRow['factorItems'] };

/** 팩터 배열을 카테고리별로 집계한다 */
function groupByCategory(factors: ValueFactor[]): CategoryRow[] {
  const categoryOrder: CategoryKey[] = ['pricing', 'location', 'future_price'];

  const accumulator: Record<CategoryKey, AccumulatorEntry> = {
    pricing: { score: 0, factorItems: [] },
    location: { score: 0, factorItems: [] },
    future_price: { score: 0, factorItems: [] },
  };

  const isCategoryKey = (key: string): key is CategoryKey =>
    key === 'pricing' || key === 'location' || key === 'future_price';

  for (const factor of factors) {
    const categoryKey = FACTOR_CATEGORY_MAP[factor.factor];
    if (!categoryKey || !isCategoryKey(categoryKey)) {
      continue;
    }

    accumulator[categoryKey].score += factor.score;
    accumulator[categoryKey].factorItems.push({
      label: FACTOR_LABELS[factor.factor] ?? factor.factor,
      score: factor.score,
      maxScore: factor.maxScore,
    });
  }

  return categoryOrder.map((key) => {
    const entry = accumulator[key];
    return {
      categoryKey: key,
      label: CATEGORY_LABELS[key] ?? key,
      score: entry.score,
      maxScore: CATEGORY_MAX_SCORE[key] ?? 100,
      factorItems: entry.factorItems,
    };
  });
}

interface CategoryBarProps {
  row: CategoryRow;
}

function CategoryBar({ row }: CategoryBarProps) {
  const [open, setOpen] = React.useState(false);
  const percentage = row.maxScore > 0 ? (row.score / row.maxScore) * 100 : 0;
  const barColor = CATEGORY_BAR_COLORS[row.categoryKey] ?? 'bg-primary';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 트리거: 카테고리 헤더 + 막대 */}
      <CollapsibleTrigger className="w-full text-left">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">{row.label}</span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                  open && 'rotate-180',
                )}
                aria-hidden="true"
              />
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {row.score} / {row.maxScore}점
            </span>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={row.score}
            aria-valuemin={0}
            aria-valuemax={row.maxScore}
            aria-label={`${row.label} ${row.score}점 / ${row.maxScore}점`}
          >
            <div
              className={cn('h-full rounded-full transition-all duration-700', barColor)}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CollapsibleTrigger>

      {/* 세부 팩터 리스트 */}
      <CollapsibleContent>
        {row.factorItems.length > 0 ? (
          <ul className="mt-3 space-y-1.5 pl-1" aria-label={`${row.label} 세부 팩터`}>
            {row.factorItems.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {item.score} / {item.maxScore}점
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 pl-1 text-xs text-muted-foreground">세부 항목이 없습니다.</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * 3대 카테고리 점수 막대 차트 (Collapsible 상세 뷰 포함)
 *
 * 분양가 적정성(35점) / 입지 환경(35점) / 미래 시세(30점)를
 * Tailwind 가로 막대로 시각화하며, 클릭 시 세부 팩터를 펼쳐볼 수 있다.
 */
export function CategoryBreakdown({ factors }: CategoryBreakdownProps) {
  const categoryRows = groupByCategory(factors);

  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">카테고리별 점수</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {categoryRows.map((row) => (
          <CategoryBar key={row.categoryKey} row={row} />
        ))}
      </CardContent>
    </Card>
  );
}

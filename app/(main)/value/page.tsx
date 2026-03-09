'use client';

import { BarChart3 } from 'lucide-react';
import { PageTransition, FadeInUp } from '@/components/ui/motion';

export default function ValueAnalysisPage() {
  return (
    <PageTransition>
      <div className="space-y-8">
        <FadeInUp>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">+가치 분석</h1>
            <p className="mt-2 text-muted-foreground">
              단지의 입지, 시세, 인프라를 종합 분석하여 A~F 등급으로 평가합니다
            </p>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">가치 분석 기능 준비 중</p>
            <p className="mt-2 text-sm text-muted-foreground">
              곧 업데이트될 예정입니다. 잠시만 기다려주세요.
            </p>
          </div>
        </FadeInUp>
      </div>
    </PageTransition>
  );
}

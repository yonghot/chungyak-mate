'use client';

import { SlidersHorizontal } from 'lucide-react';
import { PageTransition, FadeInUp } from '@/components/ui/motion';

export default function SimulationPage() {
  return (
    <PageTransition>
      <div className="space-y-8">
        <FadeInUp>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">시뮬레이션</h1>
            <p className="mt-2 text-muted-foreground">
              가점 항목을 조정하며 당첨 가능성을 시뮬레이션해보세요
            </p>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <SlidersHorizontal className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">시뮬레이션 기능 준비 중</p>
            <p className="mt-2 text-sm text-muted-foreground">
              곧 업데이트될 예정입니다. 잠시만 기다려주세요.
            </p>
          </div>
        </FadeInUp>
      </div>
    </PageTransition>
  );
}

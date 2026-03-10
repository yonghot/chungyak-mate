'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTransition, FadeInUp } from '@/components/ui/motion';

export default function ValueAnalysisPage() {
  const router = useRouter();

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
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-muted/10 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">
              단지를 선택하여 가치 분석을 확인하세요
            </p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              단지 목록에서 관심 단지를 선택한 후, 상세 페이지에서
              +가치 분석 버튼을 눌러 A~F 등급 평가를 확인할 수 있습니다.
            </p>
            <Button
              className="mt-6 gap-2"
              onClick={() => router.push('/complexes')}
            >
              단지 목록 보기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </FadeInUp>
      </div>
    </PageTransition>
  );
}

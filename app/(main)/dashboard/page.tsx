'use client';

import { TrendingUp, Shield, BarChart3 } from 'lucide-react';
import { PageTransition, FadeInUp } from '@/components/ui/motion';

const COMING_SOON_FEATURES = [
  { icon: BarChart3, label: '+가치 분석', description: '단지별 A~F 등급 가치 평가' },
  { icon: TrendingUp, label: '+예측', description: '경쟁률 예측 및 당첨 확률' },
  { icon: Shield, label: '+보호', description: 'GO / WAIT / SKIP 시그널' },
] as const;

export default function DashboardPage() {
  return (
    <PageTransition>
      <div className="space-y-8">
        <FadeInUp>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
            <p className="mt-2 text-muted-foreground">
              내 청약 현황을 한눈에 확인하세요
            </p>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <div className="grid gap-4 sm:grid-cols-3">
            {COMING_SOON_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.label}
                  className="flex flex-col items-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">{feature.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                  <span className="mt-3 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    준비 중
                  </span>
                </div>
              );
            })}
          </div>
        </FadeInUp>
      </div>
    </PageTransition>
  );
}

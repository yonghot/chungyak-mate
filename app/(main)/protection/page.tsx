'use client';

import { Shield } from 'lucide-react';
import { PageTransition, FadeInUp } from '@/components/ui/motion';

export default function ProtectionPage() {
  return (
    <PageTransition>
      <div className="space-y-8">
        <FadeInUp>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">+보호</h1>
            <p className="mt-2 text-muted-foreground">
              GO / WAIT / SKIP 시그널로 최적의 청약 타이밍을 안내합니다
            </p>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">청약 기회 보호 기능 준비 중</p>
            <p className="mt-2 text-sm text-muted-foreground">
              곧 업데이트될 예정입니다. 잠시만 기다려주세요.
            </p>
          </div>
        </FadeInUp>
      </div>
    </PageTransition>
  );
}

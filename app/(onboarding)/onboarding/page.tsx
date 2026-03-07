'use client';

import { OnboardingWizard } from '@/components/forms/onboarding-wizard';

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">프로필 설정</h1>
        <p className="mt-2 text-muted-foreground">
          청약 자격 진단을 위해 기본 정보를 입력해주세요
        </p>
      </div>

      <OnboardingWizard />
    </div>
  );
}

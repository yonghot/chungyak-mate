import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * 온보딩 전용 레이아웃
 *
 * 인증 여부만 확인하고, 프로필 존재 여부는 체크하지 않는다.
 * (main) 레이아웃과 달리 사이드바/헤더 없이 최소 UI를 제공한다.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

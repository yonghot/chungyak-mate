'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Building2, LogOut, Menu, User, X } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import { Separator } from '@/components/ui/separator';

const MOBILE_NAV_LINKS = [
  { href: '/complexes', label: '홈' },
  { href: '/recommend', label: '맞춤추천' },
  { href: '/profile', label: '내 프로필' },
  { href: '/notifications', label: '알림' },
] as const;

export function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4">
        {/* 좌측: 햄버거 메뉴 + 로고 */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={cn(
              'md:hidden flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground',
              'transition-colors hover:bg-muted hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <Link
            href="/complexes"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            aria-label="청약플러스 홈으로 이동"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground tracking-tight">
              청약플러스
            </span>
          </Link>
        </div>

        {/* 우측: 액션 버튼 */}
        <div className="flex items-center gap-0.5">
          <Link
            href="/notifications"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground',
              'transition-all duration-150 hover:bg-muted hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
            aria-label="알림"
          >
            <Bell className="h-4.5 w-4.5" />
          </Link>

          <Link
            href="/profile"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground',
              'transition-all duration-150 hover:bg-muted hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
            aria-label="프로필"
          >
            <User className="h-4.5 w-4.5" />
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground',
              'transition-all duration-150 hover:bg-destructive/10 hover:text-destructive',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
            aria-label="로그아웃"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden"
            aria-label="모바일 내비게이션"
          >
            <ul className="space-y-0.5 px-3 py-3" role="list">
              {MOBILE_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground',
                      'transition-colors hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Separator />
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

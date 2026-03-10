'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bell, Home, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MobileNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: MobileNavItem[] = [
  { href: '/complexes', label: '홈', icon: Home },
  { href: '/recommend', label: '추천', icon: Star },
  { href: '/value', label: '+가치', icon: BarChart3 },
  { href: '/profile', label: '프로필', icon: User },
  { href: '/notifications', label: '알림', icon: Bell },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 block border-t border-border/60 bg-background/80 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="모바일 하단 내비게이션"
    >
      <ul className="flex h-14 items-stretch justify-around" role="list">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* 활성 탭 상단 인디케이터 */}
                <span
                  className={cn(
                    'absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-primary transition-opacity duration-200',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                  aria-hidden="true"
                />

                <Icon
                  className={cn(
                    'h-5 w-5 transition-all duration-200',
                    isActive ? 'scale-110' : 'scale-100',
                  )}
                />
                <span
                  className={cn(
                    'font-medium transition-colors duration-200',
                    isActive ? 'text-primary' : '',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bell, ClipboardCheck, Home, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  href: string;
  label: string;
  description?: string;
  icon: React.ElementType;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    href: '/complexes',
    label: '홈',
    icon: Home,
  },
  {
    href: '/complexes',
    label: '자격진단',
    description: '단지를 선택하여 진단',
    icon: ClipboardCheck,
  },
  {
    href: '/recommend',
    label: '맞춤추천',
    icon: Star,
  },
  {
    href: '/value',
    label: '+가치',
    description: '단지 가치 A~F 등급 분석',
    icon: BarChart3,
  },
];

const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    href: '/profile',
    label: '내 프로필',
    icon: User,
  },
  {
    href: '/notifications',
    label: '알림',
    icon: Bell,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] w-60 flex-col overflow-y-auto border-r bg-sidebar-background">
      <nav className="flex-1 py-4" aria-label="사이드바 내비게이션">
        {/* 주요 메뉴 */}
        <ul className="space-y-0.5 px-3" role="list">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={`${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-150',
                    isActive
                      ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* 활성 인디케이터 — 좌측 3px 보더 */}
                  {isActive && (
                    <span
                      className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  {/* 호버 인디케이터 */}
                  {!isActive && (
                    <span
                      className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary opacity-0 transition-opacity duration-150 group-hover:opacity-30"
                      aria-hidden="true"
                    />
                  )}

                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <div className="min-w-0">
                    <span className="block truncate">{item.label}</span>
                    {item.description && (
                      <span className="block truncate text-xs text-muted-foreground font-normal">
                        {item.description}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <Separator className="mx-3 my-3 w-auto" />

        {/* 보조 메뉴 */}
        <ul className="space-y-0.5 px-3" role="list">
          {SECONDARY_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={`${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-150',
                    isActive
                      ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <span
                      className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  {!isActive && (
                    <span
                      className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary opacity-0 transition-opacity duration-150 group-hover:opacity-30"
                      aria-hidden="true"
                    />
                  )}

                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <span className="block truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

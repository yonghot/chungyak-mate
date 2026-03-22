'use client';

import Link from 'next/link';
import { Home, Building2, Gavel, MapPin, BarChart3, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { label: '아파트', href: '/', icon: Building2, active: true },
  { label: '청약', href: '/complexes', icon: MapPin, active: false },
  { label: '시세분석', href: '/value', icon: BarChart3, active: false },
  { label: '경매', href: '/prediction', icon: Gavel, active: false },
] as const;

export function MapNavBar() {
  return (
    <header className="absolute left-0 right-0 top-0 z-20 border-b border-slate-200/60 bg-white/95 backdrop-blur-sm">
      <div className="flex h-12 items-center justify-between px-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <Home className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            청약플러스
          </span>
        </Link>

        {/* 네비게이션 */}
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  item.active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 우측 */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" asChild>
            <Link href="/login">
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">로그인</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

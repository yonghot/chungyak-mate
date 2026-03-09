'use client';

import Link from 'next/link';
import {
  ClipboardCheck,
  Star,
  Calculator,
  Building2,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Users,
  ShieldCheck,
  Home,
  MapPin,
  BarChart3,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  HoverLift,
  PageTransition,
} from '@/components/ui/motion';

/* ─── 데이터 상수 ─── */

const STATS = [
  { value: '10,000+', label: '자격 진단 완료', icon: CheckCircle2 },
  { value: '500+', label: '등록 단지', icon: Building2 },
  { value: '98%', label: '사용자 만족도', icon: Star },
  { value: '7가지', label: '공급유형 분석', icon: BarChart3 },
] as const;

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: '자격 진단',
    description:
      '일반공급, 특별공급 등 7개 공급유형에 대한 자격 조건을 자동으로 판정합니다. 복잡한 규정을 직접 공부할 필요 없이 내 조건만 입력하면 됩니다.',
    badge: '핵심 기능',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: Star,
    title: '맞춤 추천',
    description:
      '나의 소득, 자산, 가구 구성에 맞는 청약 단지를 우선순위별로 추천합니다. 당첨 가능성이 높은 단지부터 확인하세요.',
    badge: '인기 기능',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
  {
    icon: Calculator,
    title: '가점 분석',
    description:
      '청약 가점 84점 만점 기준으로 무주택 기간, 부양가족 수, 청약 통장 가입 기간을 항목별로 정확히 계산합니다.',
    badge: '정확성 보장',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
] as const;

const CHECKLIST = [
  '무주택 기간 자동 계산',
  '특별공급 중복 지원 여부 확인',
  '소득 기준 충족 여부 판정',
  '지역 우선공급 자격 분석',
  '청약 통장 유형별 적합 단지 매칭',
  '가점 시뮬레이션 및 경쟁률 예측',
] as const;

/* ─── 히어로 비주얼 컴포넌트 ─── */

function HeroVisual() {
  return (
    <div className="relative flex items-center justify-center">
      {/* 배경 원형 데코 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-72 w-72 rounded-full bg-blue-100/60 blur-3xl sm:h-96 sm:w-96" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-48 translate-x-8 translate-y-4 rounded-full bg-indigo-100/50 blur-2xl sm:h-64 sm:w-64" />
      </div>

      {/* 메인 카드 */}
      <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
        {/* 상단: 단지 카드 */}
        <div className="rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-xl backdrop-blur-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">래미안 센트럴 스위트</p>
              <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                서울 서초구 반포동
              </p>
            </div>
            <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              적격
            </span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg bg-blue-50 p-2 text-center">
              <p className="text-lg font-bold text-blue-600">68</p>
              <p className="text-xs text-muted-foreground">가점</p>
            </div>
            <div className="flex-1 rounded-lg bg-slate-50 p-2 text-center">
              <p className="text-lg font-bold text-foreground">12.4</p>
              <p className="text-xs text-muted-foreground">경쟁률</p>
            </div>
            <div className="flex-1 rounded-lg bg-indigo-50 p-2 text-center">
              <p className="text-lg font-bold text-indigo-600">84A</p>
              <p className="text-xs text-muted-foreground">타입</p>
            </div>
          </div>
        </div>

        {/* 중간: 자격 진단 결과 */}
        <div className="mx-4 rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-lg backdrop-blur-sm sm:mx-6">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold text-foreground">자격 진단 결과</span>
          </div>
          <div className="space-y-1.5">
            {['일반공급', '신혼부부 특별공급', '생애최초 특별공급'].map((item, i) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{item}</span>
                <span
                  className={`text-xs font-semibold ${
                    i === 1 ? 'text-muted-foreground' : 'text-emerald-600'
                  }`}
                >
                  {i === 1 ? '미충족' : '적격'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 하단: 가점 프로그레스 */}
        <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-lg backdrop-blur-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-foreground">나의 청약 가점</span>
            </div>
            <span className="text-sm font-bold text-blue-600">68 / 84점</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 w-[81%] rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">상위 12% 수준</p>
        </div>
      </div>
    </div>
  );
}

/* ─── 메인 컴포넌트 ─── */

export default function LandingPage() {
  return (
    <PageTransition className="flex min-h-screen flex-col">
      {/* ── 내비게이션 바 ── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight">청약플러스</span>
          </div>
          <nav className="hidden items-center gap-6 sm:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              기능
            </a>
            <a href="#cta" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              시작하기
            </a>
          </nav>
          <Button asChild size="sm">
            <Link href="/login">
              무료로 시작하기
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* ── 히어로 섹션 ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50/40 px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        {/* 배경 데코 */}
        <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-100/30 blur-2xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* 텍스트 영역 */}
          <div>
            <FadeInUp delay={0}>
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">내 청약 경쟁력에 +를 더하는</span>
              </div>
            </FadeInUp>

            <FadeInUp delay={0.08}>
              <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                복잡한 청약,
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  이제 쉽고 명확하게
                </span>
              </h1>
            </FadeInUp>

            <FadeInUp delay={0.16}>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                물건 가치 분석, 경쟁률 예측, 청약 기회 보호까지.
                내 청약 경쟁력을 한눈에 진단하고 최적의 전략을 세워보세요.
              </p>
            </FadeInUp>

            <FadeInUp delay={0.24}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button asChild size="lg" className="h-12 rounded-xl px-8 text-base font-semibold shadow-lg shadow-blue-200/60">
                  <Link href="/login">
                    무료로 시작하기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-8 text-base">
                  <a href="#features">
                    자세히 알아보기
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </FadeInUp>

            {/* 체크리스트 미리보기 */}
            <FadeInUp delay={0.32}>
              <div className="mt-8 flex flex-wrap gap-2">
                {['무료 진단', '3분 완성', '즉시 결과'].map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-medium text-foreground shadow-sm"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {tag}
                  </span>
                ))}
              </div>
            </FadeInUp>
          </div>

          {/* 비주얼 영역 */}
          <FadeInUp delay={0.2} className="hidden lg:block">
            <HeroVisual />
          </FadeInUp>
        </div>
      </section>

      {/* ── 통계 섹션 ── */}
      <section className="border-y border-slate-100 bg-white px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <StaggerContainer className="grid grid-cols-2 gap-6 sm:grid-cols-4" staggerDelay={0.08}>
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <StaggerItem key={stat.label}>
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-3xl font-bold text-primary">{stat.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ── 기능 섹션 ── */}
      <section id="features" className="bg-muted/20 px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <FadeInUp>
            <div className="mb-14 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">핵심 기능</p>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                청약의 모든 것을 한곳에서
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                복잡한 청약 제도를 직접 공부할 필요 없습니다.
                청약플러스가 모든 것을 분석해드립니다.
              </p>
            </div>
          </FadeInUp>

          <StaggerContainer className="grid gap-6 sm:grid-cols-3" staggerDelay={0.1}>
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={feature.title}>
                  <HoverLift y={-6} scale={1.01} className="h-full">
                    <div
                      className={`flex h-full flex-col rounded-2xl border ${feature.border} bg-white p-6 shadow-md transition-shadow hover:shadow-xl sm:p-7`}
                    >
                      <div className="mb-5">
                        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg}`}>
                          <Icon className={`h-6 w-6 ${feature.color}`} />
                        </div>
                        <span className={`rounded-full ${feature.bg} ${feature.color} px-2.5 py-0.5 text-xs font-semibold`}>
                          {feature.badge}
                        </span>
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-foreground">{feature.title}</h3>
                      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                      <div className={`mt-5 flex items-center gap-1 text-sm font-semibold ${feature.color}`}>
                        자세히 보기
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </HoverLift>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ── 체크리스트 섹션 ── */}
      <section className="bg-white px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* 텍스트 */}
          <FadeInUp>
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">왜 청약플러스인가</p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                전문가 수준의 분석을
                <br />
                누구나 쉽게
              </h2>
              <p className="mb-8 text-base leading-relaxed text-muted-foreground">
                청약 전문 시행사의 노하우를 담은 알고리즘이
                복잡한 규정과 자격 조건을 정확하게 분석합니다.
              </p>
              <Button asChild size="lg" className="rounded-xl font-semibold">
                <Link href="/login">
                  지금 진단해보기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </FadeInUp>

          {/* 체크리스트 */}
          <FadeInUp delay={0.12}>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">분석 항목</span>
              </div>
              <ul className="space-y-3">
                {CHECKLIST.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ── CTA 섹션 ── */}
      <section id="cta" className="px-4 py-20 sm:px-6 sm:py-24">
        <FadeInUp>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-8 py-16 text-center shadow-2xl shadow-blue-200/60 sm:px-12 sm:py-20">
            {/* 배경 오브 */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-12 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
            </div>

            <div className="relative">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <Home className="h-7 w-7 text-white" />
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                지금 바로 내 청약 자격을
                <br />
                확인하세요
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-base text-blue-100 sm:text-lg">
                3분이면 충분합니다. 복잡한 서류 없이 기본 정보만 입력하면
                맞춤형 청약 자격 진단 결과를 즉시 받아보실 수 있습니다.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-xl bg-white px-8 text-base font-bold text-blue-700 shadow-lg hover:bg-blue-50 hover:text-blue-800"
                >
                  <Link href="/login">
                    무료로 시작하기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <span className="text-sm text-blue-200">
                  회원가입 불필요 · 완전 무료
                </span>
              </div>
            </div>
          </div>
        </FadeInUp>
      </section>

      {/* ── 푸터 ── */}
      <footer className="border-t border-slate-100 bg-white px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-3">
            {/* 로고 + 설명 */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                  <Home className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-foreground">청약플러스</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                물건 가치 분석 x 경쟁률 예측 x 청약 기회 보호 통합 플랫폼.
                내 청약 경쟁력에 +를 더하는 서비스.
              </p>
            </div>

            {/* 서비스 링크 */}
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">서비스</p>
              <ul className="space-y-2">
                {[
                  { label: '자격 진단', href: '/login' },
                  { label: '단지 추천', href: '/login' },
                  { label: '가점 분석', href: '/login' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 안내 */}
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">안내</p>
              <ul className="space-y-2">
                {['서비스 소개', '이용약관', '개인정보처리방침'].map((item) => (
                  <li key={item}>
                    <span className="cursor-default text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              &copy; 2025 청약플러스. All rights reserved.
              <span className="mx-2 text-slate-300">|</span>
              본 서비스의 진단 결과는 참고용이며, 최종 자격 여부는 공식 기관에서 확인하시기 바랍니다.
            </p>
          </div>
        </div>
      </footer>
    </PageTransition>
  );
}

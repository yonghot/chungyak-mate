// @vitest-environment jsdom
/**
 * RecommendCard 컴포넌트 렌더링 테스트
 *
 * 검증 범위:
 * - 단지명 렌더링 확인
 * - 지역/구 표시 확인
 * - 적격 유형 개수 표시 확인
 * - 상세보기 링크 URL 확인
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Complex } from '@/types/database';

// next/link 모킹 — jsdom 환경에서 Next.js 라우터 없이 동작하도록
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// lucide-react 아이콘 모킹 — SVG 렌더링 불필요
vi.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  MapPin: () => <span data-testid="icon-map-pin" />,
  CheckCircle2: () => <span data-testid="icon-check-circle" />,
}));

import { RecommendCard } from '@/components/features/recommendation/recommend-card';

// ─── 팩토리 함수 ────────────────────────────────────────────

/** Complex 더미 데이터 생성 */
function createComplex(overrides?: Partial<Complex>): Complex {
  return {
    id: 'complex-uuid-001',
    name: '테스트아파트 1단지',
    region: '서울특별시',
    district: '강남구',
    address: '서울특별시 강남구 테헤란로 1',
    developer: '테스트시행사',
    constructor: '테스트건설',
    total_units: 100,
    announcement_date: '2026-03-01',
    subscription_start: '2026-03-20',
    subscription_end: '2026-03-25',
    winner_date: '2026-04-01',
    status: 'open',
    source_url: null,
    raw_data: null,
    external_id: null,
    move_in_date: null,
    special_supply_start: null,
    special_supply_end: null,
    contract_start: null,
    contract_end: null,
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
    ...overrides,
  };
}

// ─── 테스트 ─────────────────────────────────────────────────

describe('RecommendCard', () => {
  // ── 시나리오 1: 단지명 렌더링 ────────────────────────────

  describe('단지명 렌더링', () => {
    it('단지명이 화면에 표시된다', () => {
      const complex = createComplex({ name: '강남 테스트아파트' });

      render(<RecommendCard complex={complex} eligibleCount={3} />);

      expect(screen.getByText('강남 테스트아파트')).toBeDefined();
    });

    it('긴 단지명도 렌더링된다', () => {
      const complex = createComplex({ name: '서울특별시 강남구 테헤란로 초고층 랜드마크 아파트 1단지' });

      render(<RecommendCard complex={complex} eligibleCount={2} />);

      expect(screen.getByText('서울특별시 강남구 테헤란로 초고층 랜드마크 아파트 1단지')).toBeDefined();
    });
  });

  // ── 시나리오 2: 지역/구 표시 ─────────────────────────────

  describe('지역/구 표시', () => {
    it('지역과 구가 함께 표시된다', () => {
      const complex = createComplex({ region: '서울특별시', district: '강남구' });

      render(<RecommendCard complex={complex} eligibleCount={3} />);

      expect(screen.getByText('서울특별시 강남구')).toBeDefined();
    });

    it('다른 지역/구 값도 올바르게 표시된다', () => {
      const complex = createComplex({ region: '경기도', district: '성남시' });

      render(<RecommendCard complex={complex} eligibleCount={1} />);

      expect(screen.getByText('경기도 성남시')).toBeDefined();
    });
  });

  // ── 시나리오 3: 적격 유형 개수 표시 ──────────────────────

  describe('적격 유형 개수 표시', () => {
    it('적격 유형 개수가 "n개 유형 적격" 형식으로 표시된다', () => {
      const complex = createComplex();

      render(<RecommendCard complex={complex} eligibleCount={3} />);

      expect(screen.getByText('3개 유형 적격')).toBeDefined();
    });

    it('적격 유형이 1개인 경우도 올바르게 표시된다', () => {
      const complex = createComplex();

      render(<RecommendCard complex={complex} eligibleCount={1} />);

      expect(screen.getByText('1개 유형 적격')).toBeDefined();
    });

    it('적격 유형이 0개인 경우도 렌더링된다', () => {
      const complex = createComplex();

      render(<RecommendCard complex={complex} eligibleCount={0} />);

      expect(screen.getByText('0개 유형 적격')).toBeDefined();
    });
  });

  // ── 시나리오 4: 상세보기 링크 URL 확인 ───────────────────

  describe('상세보기 링크 URL', () => {
    it('상세보기 링크가 /complexes/{id} 경로를 가진다', () => {
      const complex = createComplex({ id: 'complex-uuid-001' });

      render(<RecommendCard complex={complex} eligibleCount={3} />);

      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/complexes/complex-uuid-001');
    });

    it('다른 단지 ID에 따라 링크 경로가 변경된다', () => {
      const complex = createComplex({ id: 'different-uuid-999' });

      render(<RecommendCard complex={complex} eligibleCount={2} />);

      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/complexes/different-uuid-999');
    });

    it('상세보기 버튼 텍스트가 표시된다', () => {
      const complex = createComplex();

      render(<RecommendCard complex={complex} eligibleCount={3} />);

      expect(screen.getByText('상세보기')).toBeDefined();
    });
  });
});

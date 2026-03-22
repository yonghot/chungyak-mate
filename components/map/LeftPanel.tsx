'use client';

import { useState } from 'react';
import {
  Search,
  TrendingUp,
  Building2,
  Calendar,
  MapPin,
  BarChart2,
  Home,
  Tag,
  Clock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatKoreanPrice, formatChangeRate } from '@/lib/utils/price-format';
import type { MapApartment } from '@/types/map.types';

type TabId = '실거래' | '지역분석' | '시세' | '매물' | '청약';

const TABS: TabId[] = ['실거래', '지역분석', '시세', '매물', '청약'];

interface LeftPanelProps {
  apartments: MapApartment[];
  selectedId: string | null;
  onSelect: (apartment: MapApartment) => void;
  isLoading: boolean;
}

export function LeftPanel({ apartments, selectedId, onSelect, isLoading }: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('실거래');

  return (
    <aside className="absolute left-0 top-12 z-10 hidden h-[calc(100vh-48px)] w-[360px] flex-col border-r border-slate-200/60 bg-white/95 backdrop-blur-sm sm:flex">
      {/* 검색바 */}
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="아파트, 지역, 학교 검색"
            className="h-9 rounded-lg border-slate-200 bg-slate-50 pl-8 text-xs"
          />
        </div>
      </div>

      {/* 필터 행 — 실거래 탭에서만 표시 */}
      {activeTab === '실거래' && (
        <div className="flex gap-1.5 border-b border-slate-100 px-4 py-2">
          {['실거래가', '매매', '1개월'].map((label, i) => (
            <button
              key={label}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                i === 0
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* AI 예측 헤더 — 실거래 탭에서만 표시 */}
      {activeTab === '실거래' && (
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            <p className="text-xs font-semibold text-blue-900">
              강남구, 2년 뒤 가장 상승할 아파트는?
            </p>
          </div>
        </div>
      )}

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === '실거래' && (
          <TabRealTransaction
            apartments={apartments}
            selectedId={selectedId}
            onSelect={onSelect}
            isLoading={isLoading}
          />
        )}
        {activeTab === '지역분석' && <TabRegionAnalysis />}
        {activeTab === '시세' && <TabPriceIndex apartments={apartments} />}
        {activeTab === '매물' && <TabComingSoon icon={<Tag className="h-8 w-8" />} message="매물 데이터 연동 준비 중" />}
        {activeTab === '청약' && <TabComingSoon icon={<Clock className="h-8 w-8" />} message="청약 일정 연동 준비 중" />}
      </div>

      {/* 탭 메뉴 */}
      <div className="flex border-t border-slate-200 bg-white">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); }}
            className={`flex-1 py-2.5 text-[11px] font-medium transition-colors ${
              activeTab === tab
                ? 'border-t-2 border-blue-600 text-blue-700'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </aside>
  );
}

/* ─── 탭 콘텐츠: 실거래 ─── */

function TabRealTransaction({
  apartments,
  selectedId,
  onSelect,
  isLoading,
}: {
  apartments: MapApartment[];
  selectedId: string | null;
  onSelect: (apartment: MapApartment) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (apartments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
        <Building2 className="h-8 w-8" />
        <p className="text-xs">이 영역에 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {apartments
        .filter((apt) => apt.latestPrice !== null)
        .sort((a, b) => (b.latestPrice ?? 0) - (a.latestPrice ?? 0))
        .map((apt, index) => (
          <ApartmentCard
            key={apt.id}
            apartment={apt}
            rank={index + 1}
            isSelected={apt.id === selectedId}
            onClick={() => { onSelect(apt); }}
          />
        ))}
    </div>
  );
}

/* ─── 탭 콘텐츠: 지역분석 ─── */

function TabRegionAnalysis() {
  const regionStats = [
    { icon: <MapPin className="h-4 w-4 text-blue-500" />, label: '행정구역', value: '강남구' },
    { icon: <Home className="h-4 w-4 text-emerald-500" />, label: '총 가구수', value: '약 24.2만 가구' },
    { icon: <BarChart2 className="h-4 w-4 text-violet-500" />, label: '인구', value: '53.8만 명' },
  ] as const;

  const schoolStats = [
    { label: '초등학교', value: '31개교' },
    { label: '중학교', value: '20개교' },
    { label: '고등학교', value: '24개교' },
  ] as const;

  const transportStats = [
    { label: '지하철 역사', value: '2·3·7·9호선 등' },
    { label: '버스 노선', value: '100개 이상' },
  ] as const;

  return (
    <div className="space-y-3 p-4">
      {/* 기본 정보 */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold text-slate-700">기본 정보</p>
        <div className="space-y-2.5">
          {regionStats.map(({ icon, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {icon}
                <span>{label}</span>
              </div>
              <span className="text-xs font-semibold text-slate-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 학군 */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold text-slate-700">학군</p>
        <div className="space-y-2.5">
          {schoolStats.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{label}</span>
              <span className="text-xs font-semibold text-slate-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 교통 */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold text-slate-700">교통</p>
        <div className="space-y-2.5">
          {transportStats.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{label}</span>
              <span className="text-xs font-semibold text-slate-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[10px] text-slate-300">* 통계청 기준 참고용 데이터</p>
    </div>
  );
}

/* ─── 탭 콘텐츠: 시세 ─── */

function TabPriceIndex({ apartments }: { apartments: MapApartment[] }) {
  const pricesWithValue = apartments
    .map((apt) => apt.latestPrice)
    .filter((p): p is number => p !== null && p > 0);

  if (pricesWithValue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
        <BarChart2 className="h-8 w-8" />
        <p className="text-xs">시세 데이터가 없습니다</p>
      </div>
    );
  }

  const avg = Math.round(pricesWithValue.reduce((sum, p) => sum + p, 0) / pricesWithValue.length);
  const max = Math.max(...pricesWithValue);
  const min = Math.min(...pricesWithValue);

  const stats = [
    { label: '평균가', value: formatKoreanPrice(avg), color: 'text-blue-700' },
    { label: '최고가', value: formatKoreanPrice(max), color: 'text-rose-600' },
    { label: '최저가', value: formatKoreanPrice(min), color: 'text-emerald-600' },
  ] as const;

  return (
    <div className="space-y-3 p-4">
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold text-slate-700">현재 영역 시세 요약</p>
        <div className="space-y-3">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{label}</span>
              <span className={`text-sm font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="mb-1 text-xs font-semibold text-slate-700">단지 수</p>
        <p className="text-2xl font-bold text-slate-900">
          {pricesWithValue.length}
          <span className="ml-1 text-sm font-normal text-slate-400">개</span>
        </p>
      </div>

      <p className="text-center text-[10px] text-slate-300">* 현재 지도 영역 내 실거래 기준</p>
    </div>
  );
}

/* ─── 탭 콘텐츠: 준비 중 공통 ─── */

function TabComingSoon({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
      {icon}
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
}

/* ─── 아파트 카드 ─── */

function ApartmentCard({
  apartment,
  rank,
  isSelected,
  onClick,
}: {
  apartment: MapApartment;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const price = apartment.latestPrice ? formatKoreanPrice(apartment.latestPrice) : '-';
  const predicted = apartment.predictedPrice ? formatKoreanPrice(apartment.predictedPrice) : null;
  const changeRate = apartment.predictionChangeRate
    ? formatChangeRate(apartment.predictionChangeRate)
    : null;

  return (
    <button
      onClick={onClick}
      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
        isSelected ? 'bg-blue-50/60' : ''
      }`}
    >
      {/* 순위 */}
      <div
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          rank <= 3
            ? 'bg-blue-600 text-white'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        {rank}
      </div>

      {/* 정보 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-slate-900">
            {apartment.name}
          </p>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>{apartment.dong}</span>
          {apartment.totalUnits && (
            <>
              <span>·</span>
              <span>{apartment.totalUnits.toLocaleString()}세대</span>
            </>
          )}
          {apartment.builtYear && (
            <>
              <span>·</span>
              <span>{apartment.builtYear}년</span>
            </>
          )}
        </div>

        {/* 가격 행 */}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{price}</span>
          {predicted && (
            <>
              <span className="text-slate-300">→</span>
              <span className="text-sm font-bold text-blue-600">{predicted}</span>
            </>
          )}
        </div>

        {/* 예측 뱃지 */}
        {changeRate && (
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5">
            <Calendar className="h-3 w-3 text-blue-500" />
            <span className="text-[10px] font-semibold text-blue-700">
              2년뒤 {changeRate} 예상
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

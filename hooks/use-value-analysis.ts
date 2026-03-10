'use client';

import { useQuery } from '@tanstack/react-query';
import type { ValueAnalysis } from '@/types/plus-features';

/** API 성공 응답 래퍼 형태 */
interface ValueAnalysisResponse {
  data: ValueAnalysis;
  error: null;
}

/**
 * +가치 분석 결과 조회 훅
 *
 * GET /api/complexes/:id/value 를 호출하여 단지 가치 분석 결과를 반환한다.
 * 분석 결과는 1시간 동안 캐시된다 (실시간 갱신 불필요).
 *
 * @param complexId - 단지 UUID
 */
export function useValueAnalysis(complexId: string) {
  return useQuery<ValueAnalysisResponse>({
    queryKey: ['value-analysis', complexId],
    queryFn: async () => {
      const res = await fetch(`/api/complexes/${complexId}/value`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error?.message ?? '가치 분석을 불러올 수 없습니다',
        );
      }
      return res.json() as Promise<ValueAnalysisResponse>;
    },
    staleTime: 1000 * 60 * 60,
    enabled: !!complexId,
  });
}

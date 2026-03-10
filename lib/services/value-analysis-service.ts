/**
 * +가치: 물건 가치 분석 서비스 (architecture.md 17.5절)
 *
 * Supabase에서 단지 + 공급유형 데이터를 조회하고,
 * 순수 함수 엔진(lib/value-analysis)을 호출하여 ValueAnalysis를 반환한다.
 */
import type { ValueAnalysis, ValueFactor } from '@/types/plus-features';
import type { SupabaseDb } from '@/types/supabase';
import { analyzeValueScore } from '@/lib/value-analysis';
import type { ComplexRawData } from '@/lib/value-analysis/types';
import { logger } from '@/lib/utils/logger';

/**
 * 단지 가치 분석을 실행하고 ValueAnalysis 결과를 반환한다.
 *
 * @param supabase  - 서버용 Supabase 클라이언트
 * @param complexId - 분석 대상 단지 UUID
 * @returns 가치 분석 결과. 단지 데이터 미존재 시 null.
 */
export async function analyzeValue(
  supabase: SupabaseDb,
  complexId: string,
): Promise<ValueAnalysis | null> {
  // 1. 단지 + 공급유형 데이터 로드
  const { data: complex, error } = await supabase
    .from('complexes')
    .select('*, supply_types(*)')
    .eq('id', complexId)
    .single();

  if (error) {
    logger.error('value-analysis-service.analyzeValue: complex not found', {
      complexId,
      error: error.message,
    });
    return null;
  }

  if (!complex) {
    return null;
  }

  // 2. 대표 공급유형(전용면적 최솟값) 선택
  const supplyTypes = complex.supply_types as Array<{
    price_krw: number;
    area_sqm: number;
  }>;
  const representativeType = selectRepresentativeSupplyType(supplyTypes);

  if (!representativeType) {
    logger.error('value-analysis-service.analyzeValue: no supply types found', {
      complexId,
    });
    return null;
  }

  // 3. 엔진 입력 데이터 조립
  const rawData: ComplexRawData = {
    complexId,
    region: (complex.region as string) ?? '',
    district: (complex.district as string) ?? '',
    pricePerSqm: representativeType.price_krw / representativeType.area_sqm,
    areaSqm: representativeType.area_sqm,
    totalPriceKrw: representativeType.price_krw,
    rawData: (complex.raw_data as Record<string, unknown>) ?? {},
  };

  // 4. 순수 함수 엔진 호출
  const engineResult = analyzeValueScore(rawData);

  // 5. ValueFactor[] 형태로 변환 (types/plus-features.ts 인터페이스 준수)
  const factors: ValueFactor[] = engineResult.categories.flatMap((cat) =>
    cat.factors.map((f) => ({
      factor: f.factorId,
      score: f.rawScore,
      maxScore: f.maxScore,
      description: f.description,
    })),
  );

  return {
    complexId,
    grade: engineResult.grade,
    totalScore: engineResult.totalScore,
    maxScore: 100,
    factors,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * 공급유형 배열에서 대표 타입(전용면적 최솟값)을 선택한다.
 *
 * @param supplyTypes - 공급유형 목록
 * @returns 대표 공급유형. 목록이 비어 있으면 null.
 */
function selectRepresentativeSupplyType(
  supplyTypes: Array<{ price_krw: number; area_sqm: number }>,
): { price_krw: number; area_sqm: number } | null {
  if (!supplyTypes || supplyTypes.length === 0) { return null; }
  return supplyTypes.reduce((prev, curr) =>
    curr.area_sqm < prev.area_sqm ? curr : prev,
  );
}

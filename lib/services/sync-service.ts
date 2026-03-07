/**
 * 청약홈 API 동기화 오케스트레이션 서비스
 *
 * 책임:
 * 1. 청약홈 API에서 분양공고 데이터 수집
 * 2. 데이터 변환 (API 응답 → DB 스키마)
 * 3. DB Upsert (중복 방지)
 * 4. 동기화 결과 로깅
 *
 * 이 서비스는 Cron API Route에서만 호출된다.
 * 직접 Supabase를 호출하지 않고 리포지토리를 통해서만 데이터에 접근한다.
 */
import { logger } from '@/lib/utils/logger';
import {
  fetchCurrentMonthAptListings,
  fetchRemndrListings,
  ApplyhomeApiClientError,
} from '@/lib/external/applyhome/client';
import {
  mapApiItemToComplex,
  extractSupplyTypes,
} from '@/lib/external/applyhome/mapper';
import type { ApplyhomeAptItem } from '@/lib/external/applyhome/types';
import {
  upsertComplex,
  replaceSupplyTypes,
  refreshComplexStatuses,
  createSyncLog,
  updateSyncLog,
} from '@/lib/repositories/sync-repository';
import type { SyncResult } from '@/lib/repositories/sync-repository';

/** 동기화 실행 옵션 */
export interface SyncOptions {
  /** 잔여세대 API도 함께 조회할지 여부 (기본값: true) */
  includeRemndr?: boolean;
  /** 단지별 상세 로그 출력 여부 (기본값: false) */
  verbose?: boolean;
}

/** 동기화 최종 결과 */
export interface SyncRunResult {
  success: boolean;
  totalFetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  statusRefreshed: number;
  durationMs: number;
  errors: Array<{ external_id: string; message: string }>;
}

/**
 * 단일 API 항목을 DB에 Upsert하고 결과를 집계한다.
 * 파싱 실패나 DB 에러는 해당 항목만 실패 처리하고 계속 진행한다.
 */
async function processSingleItem(
  item: ApplyhomeAptItem,
  result: SyncResult,
  verbose: boolean,
): Promise<void> {
  const externalId = item.HOUSE_MANAGE_NO;

  try {
    // 1. API 응답 → DB 스키마 변환
    const complexData = mapApiItemToComplex(item);

    // 2. complexes 테이블 Upsert
    const upsertResult = await upsertComplex(complexData);
    if (!upsertResult) {
      result.failed++;
      result.errors.push({ external_id: externalId, message: 'complexes upsert 실패' });
      return;
    }

    // 3. supply_types 교체
    const supplyTypes = extractSupplyTypes(item);
    if (supplyTypes.length > 0) {
      const supplyOk = await replaceSupplyTypes(upsertResult.id, supplyTypes);
      if (!supplyOk) {
        // supply_types 실패는 경고로만 처리 (단지 자체는 저장됨)
        logger.error('sync-service: supply_types 저장 실패 (단지는 저장됨)', {
          externalId,
          complexId: upsertResult.id,
        });
      }
    }

    if (upsertResult.isNew) {
      result.inserted++;
      if (verbose) {
        logger.error(`[신규] ${complexData.name} (${externalId})`, {});
      }
    } else {
      result.updated++;
      if (verbose) {
        logger.error(`[업데이트] ${complexData.name} (${externalId})`, {});
      }
    }
  } catch (error) {
    result.failed++;
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push({ external_id: externalId, message });
    logger.error('sync-service: 항목 처리 실패', { externalId, error: message });
  }
}

/**
 * 중복 항목 제거 (HOUSE_MANAGE_NO 기준)
 * API가 동일 단지를 주택형별로 복수 행으로 반환하는 경우 첫 번째 행만 사용
 *
 * 주의: 다수의 주택형을 가진 단지의 경우 세대수 집계는
 *       extractSupplyTypes에서 단일 항목 기준으로 처리됨.
 *       [PROD-TODO] 주택형이 여럿인 단지의 공급유형별 합계 집계 로직 보완 필요.
 */
function deduplicateByHouseManageNo(items: ApplyhomeAptItem[]): ApplyhomeAptItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.HOUSE_MANAGE_NO)) {
      return false;
    }
    seen.add(item.HOUSE_MANAGE_NO);
    return true;
  });
}

/**
 * 청약홈 API 전체 동기화 실행
 *
 * Cron Route에서 호출하는 진입점.
 * 에러가 발생해도 partial success를 허용하며 로그에 기록한다.
 */
export async function runSync(options: SyncOptions = {}): Promise<SyncRunResult> {
  const { includeRemndr = true, verbose = false } = options;
  const startTime = Date.now();

  const syncResult: SyncResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // 동기화 로그 생성 (running 상태)
  const logId = await createSyncLog({
    started_at: new Date().toISOString(),
    status: 'running',
    total_fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    error_detail: [],
  });

  let totalFetched = 0;

  try {
    logger.error('sync-service: 동기화 시작', { includeRemndr });

    // 1. 청약홈 APT 분양공고 조회
    let items: ApplyhomeAptItem[] = [];

    try {
      const aptItems = await fetchCurrentMonthAptListings();
      items = [...aptItems];
      logger.error(`sync-service: APT 분양공고 ${aptItems.length}건 조회`, {});
    } catch (error) {
      const message = error instanceof ApplyhomeApiClientError
        ? error.message
        : '알 수 없는 API 오류';
      logger.error('sync-service: APT 분양공고 조회 실패', { error: message });
      syncResult.errors.push({ external_id: 'APT_FETCH', message });
    }

    // 2. 잔여세대 분양공고 조회 (선택)
    if (includeRemndr) {
      try {
        const remndrItems = await fetchRemndrListings();
        items = [...items, ...remndrItems];
        logger.error(`sync-service: 잔여세대 분양공고 ${remndrItems.length}건 조회`, {});
      } catch (error) {
        // 잔여세대 실패는 경고로만 처리
        logger.error('sync-service: 잔여세대 분양공고 조회 실패 (계속 진행)', { error });
      }
    }

    // 3. 중복 제거
    const uniqueItems = deduplicateByHouseManageNo(items);
    totalFetched = uniqueItems.length;

    logger.error(`sync-service: 중복 제거 후 ${totalFetched}건 처리 예정`, {});

    // 4. 항목별 Upsert
    for (const item of uniqueItems) {
      await processSingleItem(item, syncResult, verbose);
    }

    // 5. 날짜 기반 status 일괄 갱신
    const statusRefreshed = await refreshComplexStatuses();

    const durationMs = Date.now() - startTime;
    const finalStatus = syncResult.failed === 0 ? 'success'
      : syncResult.failed < totalFetched ? 'partial'
      : 'failed';

    // 6. 동기화 로그 업데이트
    if (logId) {
      await updateSyncLog(logId, {
        finished_at: new Date().toISOString(),
        status: finalStatus,
        total_fetched: totalFetched,
        inserted: syncResult.inserted,
        updated: syncResult.updated,
        skipped: syncResult.skipped,
        failed: syncResult.failed,
        error_detail: syncResult.errors.slice(0, 50), // 최대 50건만 저장
      });
    }

    logger.error('sync-service: 동기화 완료', {
      status: finalStatus,
      totalFetched,
      inserted: syncResult.inserted,
      updated: syncResult.updated,
      failed: syncResult.failed,
      statusRefreshed,
      durationMs,
    });

    return {
      success: finalStatus !== 'failed',
      totalFetched,
      inserted: syncResult.inserted,
      updated: syncResult.updated,
      skipped: syncResult.skipped,
      failed: syncResult.failed,
      statusRefreshed,
      durationMs,
      errors: syncResult.errors,
    };
  } catch (unexpectedError) {
    const durationMs = Date.now() - startTime;
    const message = unexpectedError instanceof Error
      ? unexpectedError.message
      : String(unexpectedError);

    logger.error('sync-service: 예기치 않은 오류로 동기화 실패', {
      error: message,
      durationMs,
    });

    if (logId) {
      await updateSyncLog(logId, {
        finished_at: new Date().toISOString(),
        status: 'failed',
        total_fetched: totalFetched,
        inserted: syncResult.inserted,
        updated: syncResult.updated,
        failed: syncResult.failed + 1,
        error_detail: [{ external_id: 'UNEXPECTED', message }],
      });
    }

    return {
      success: false,
      totalFetched,
      inserted: syncResult.inserted,
      updated: syncResult.updated,
      skipped: syncResult.skipped,
      failed: syncResult.failed + 1,
      statusRefreshed: 0,
      durationMs,
      errors: [{ external_id: 'UNEXPECTED', message }],
    };
  }
}

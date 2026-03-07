/**
 * 공공데이터포털 청약홈 분양정보 API HTTP 클라이언트
 *
 * Base URL: https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/
 * 인증: serviceKey Query Parameter
 */
import { logger } from '@/lib/utils/logger';
import type {
  ApplyhomeApiResponse,
  ApplyhomeApiError,
  ApplyhomeAptItem,
  ApplyhomeRemndrItem,
  ApplyhomeRequestParams,
} from './types';

const BASE_URL = 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1';

/** 재시도 설정 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  /** 초기 대기 시간 (ms) - 지수 백오프 적용 */
  initialDelayMs: 1000,
} as const;

/** API 클라이언트 에러 */
export class ApplyhomeApiClientError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly attempt?: number,
  ) {
    super(message);
    this.name = 'ApplyhomeApiClientError';
  }
}

/** ms 단위 대기 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 지수 백오프 재시도 래퍼
 * 5xx 서버 에러와 네트워크 오류에 대해 재시도한다.
 * 4xx 클라이언트 에러는 즉시 실패 처리한다.
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // 4xx 에러는 재시도 불필요
      if (
        error instanceof ApplyhomeApiClientError &&
        error.code !== undefined &&
        error.code >= 400 &&
        error.code < 500
      ) {
        throw error;
      }

      if (attempt < RETRY_CONFIG.maxAttempts) {
        const delayMs = RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt - 1);
        logger.error(`${operationName} 실패 (시도 ${attempt}/${RETRY_CONFIG.maxAttempts}), ${delayMs}ms 후 재시도`, {
          error,
          attempt,
        });
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * 청약홈 API 공통 요청 함수
 * @param operation - API 오퍼레이션명
 * @param params - 요청 파라미터
 */
async function fetchApplyhome<T>(
  operation: string,
  params: ApplyhomeRequestParams,
): Promise<ApplyhomeApiResponse<T>> {
  const apiKey = process.env.APPLYHOME_API_KEY;

  if (!apiKey) {
    throw new ApplyhomeApiClientError(
      'APPLYHOME_API_KEY 환경변수가 설정되지 않았습니다.',
    );
  }

  const url = new URL(`${BASE_URL}/${operation}`);

  // serviceKey는 URL-encoded 상태로 전달 (공공데이터포털 인증키는 +, / 등 포함)
  url.searchParams.set('serviceKey', apiKey);
  url.searchParams.set('page', String(params.page ?? 1));
  url.searchParams.set('perPage', String(params.perPage ?? 50));
  url.searchParams.set('returnType', 'JSON');

  // 조건 필터 파라미터 (청약접수일 범위)
  if (params.subscriptionStartFrom) {
    url.searchParams.set(
      'cond[GNRL_RNK1_CRSPAREA_RCEPT_BGNDE::GTE]',
      params.subscriptionStartFrom,
    );
  }
  if (params.subscriptionEndTo) {
    url.searchParams.set(
      'cond[GNRL_RNK1_CRSPAREA_RCEPT_ENDDE::LTE]',
      params.subscriptionEndTo,
    );
  }
  if (params.regionCode) {
    url.searchParams.set('cond[SUBSCRPT_AREA_CODE::EQ]', params.regionCode);
  }
  if (params.houseManageNo) {
    url.searchParams.set('cond[HOUSE_MANAGE_NO::EQ]', params.houseManageNo);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    // Vercel Edge/Node 환경에서 타임아웃 설정
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new ApplyhomeApiClientError(
      `청약홈 API HTTP 에러: ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  const json = await response.json() as ApplyhomeApiResponse<T> | ApplyhomeApiError;

  // API 레벨 에러 처리 (code -4: 인증 실패, code -3: 서비스 없음 등)
  if ('code' in json && typeof json.code === 'number' && json.code < 0) {
    const apiError = json as ApplyhomeApiError;
    throw new ApplyhomeApiClientError(
      `청약홈 API 에러: ${apiError.msg} (code: ${apiError.code})`,
      apiError.code,
    );
  }

  return json as ApplyhomeApiResponse<T>;
}

/**
 * 페이지네이션을 처리하여 전체 데이터를 수집한다.
 * @param operation - API 오퍼레이션명
 * @param params - 요청 파라미터 (page 제외)
 * @param maxItems - 최대 수집 건수 (무한 루프 방지, 기본값: 1000)
 */
async function fetchAllPages<T>(
  operation: string,
  params: Omit<ApplyhomeRequestParams, 'page'>,
  maxItems = 1000,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  const perPage = params.perPage ?? 100;

  while (items.length < maxItems) {
    const response = await withRetry(
      () => fetchApplyhome<T>(operation, { ...params, page, perPage }),
      `${operation} 페이지 ${page}`,
    );

    items.push(...response.data);

    const totalFetched = items.length;
    const totalAvailable = response.totalCount;

    logger.error(`${operation}: ${totalFetched}/${totalAvailable}건 수집됨 (페이지 ${page})`, {});

    if (totalFetched >= totalAvailable || response.data.length < perPage) {
      break;
    }

    page++;
  }

  return items;
}

/**
 * 당월 + 익월 APT 분양공고 전체 조회
 * Cron에서 매일 호출하는 주 함수
 */
export async function fetchCurrentMonthAptListings(): Promise<ApplyhomeAptItem[]> {
  const today = new Date();

  // KST 기준 당월 1일 ~ 익월 말일
  const currentMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}01`;
  const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const nextMonthEndStr = `${nextMonthEnd.getFullYear()}${String(nextMonthEnd.getMonth() + 1).padStart(2, '0')}${String(nextMonthEnd.getDate()).padStart(2, '0')}`;

  logger.error('APT 분양공고 조회 시작', {
    from: currentMonth,
    to: nextMonthEndStr,
  });

  return fetchAllPages<ApplyhomeAptItem>('getAPTLttotPblancDetail', {
    subscriptionStartFrom: currentMonth,
    subscriptionEndTo: nextMonthEndStr,
    perPage: 100,
  });
}

/**
 * 최근 3개월 분양공고 전체 조회 (초기 데이터 로드 시 사용)
 * [PROD-TODO] 첫 연동 시 수동 실행 또는 별도 엔드포인트로 호출
 */
export async function fetchRecentAptListings(monthsBack = 3): Promise<ApplyhomeAptItem[]> {
  const today = new Date();
  const fromDate = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
  const fromStr = `${fromDate.getFullYear()}${String(fromDate.getMonth() + 1).padStart(2, '0')}01`;

  logger.error(`APT 분양공고 최근 ${monthsBack}개월 조회 시작`, { from: fromStr });

  return fetchAllPages<ApplyhomeAptItem>('getAPTLttotPblancDetail', {
    subscriptionStartFrom: fromStr,
    perPage: 100,
  });
}

/**
 * 잔여세대 분양공고 조회 (당월 기준)
 * 주 분양공고 조회 이후 보완 데이터로 활용
 */
export async function fetchRemndrListings(): Promise<ApplyhomeRemndrItem[]> {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}01`;

  logger.error('잔여세대 분양공고 조회 시작', { from: currentMonth });

  return fetchAllPages<ApplyhomeRemndrItem>('getRemndrLttotPblancDetail', {
    subscriptionStartFrom: currentMonth,
    perPage: 100,
  });
}

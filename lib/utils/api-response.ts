import { NextResponse } from 'next/server';

import type { ApiResponse, PaginatedResponse } from '@/types';

/**
 * API 에러 코드 (architecture.md 6.4절 기준)
 */
export const ErrorCode = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  COMPLEX_NOT_FOUND: 'COMPLEX_NOT_FOUND',
  EVALUATION_TIMEOUT: 'EVALUATION_TIMEOUT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  /** Plus 이상 플랜 필요 (architecture.md 17.6절) */
  PLAN_UPGRADE_REQUIRED: 'PLAN_UPGRADE_REQUIRED',
  /** 분석 데이터 부족 — 단지 정보 미확보 */
  VALUE_ANALYSIS_UNAVAILABLE: 'VALUE_ANALYSIS_UNAVAILABLE',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/** 에러 코드별 기본 HTTP 상태 코드 */
const ERROR_STATUS_MAP: Record<ErrorCodeValue, number> = {
  [ErrorCode.AUTH_REQUIRED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.PROFILE_INCOMPLETE]: 422,
  [ErrorCode.COMPLEX_NOT_FOUND]: 404,
  [ErrorCode.EVALUATION_TIMEOUT]: 504,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.RATE_LIMIT]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.PLAN_UPGRADE_REQUIRED]: 403,
  [ErrorCode.VALUE_ANALYSIS_UNAVAILABLE]: 503,
};

/** 에러 코드별 기본 한국어 메시지 */
const ERROR_MESSAGE_MAP: Record<ErrorCodeValue, string> = {
  [ErrorCode.AUTH_REQUIRED]: '로그인이 필요합니다.',
  [ErrorCode.FORBIDDEN]: '접근 권한이 없습니다.',
  [ErrorCode.PROFILE_INCOMPLETE]: '프로필을 먼저 완성해주세요.',
  [ErrorCode.COMPLEX_NOT_FOUND]: '해당 단지를 찾을 수 없습니다.',
  [ErrorCode.EVALUATION_TIMEOUT]: '판정 처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.VALIDATION_ERROR]: '입력값을 확인해주세요.',
  [ErrorCode.RATE_LIMIT]: '요청 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.INTERNAL_ERROR]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ErrorCode.METHOD_NOT_ALLOWED]: '허용되지 않는 요청 방식입니다.',
  [ErrorCode.CONFLICT]: '이미 존재하는 데이터입니다.',
  [ErrorCode.PLAN_UPGRADE_REQUIRED]: '+가치 분석은 Plus 플랜 이상에서 이용 가능합니다.',
  [ErrorCode.VALUE_ANALYSIS_UNAVAILABLE]: '단지 정보가 부족하여 가치 분석을 수행할 수 없습니다.',
};

/**
 * 성공 응답 생성
 * @param data - 응답 데이터
 * @param status - HTTP 상태 코드 (기본값: 200)
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null }, { status });
}

/**
 * 페이지네이션 성공 응답 생성
 * @param items - 아이템 목록
 * @param total - 전체 아이템 수
 * @param page - 현재 페이지 번호
 * @param limit - 페이지당 아이템 수
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): NextResponse<ApiResponse<PaginatedResponse<T>>> {
  return NextResponse.json(
    {
      data: { items, total, page, limit },
      error: null,
    },
    { status: 200 }
  );
}

/**
 * 에러 응답 생성
 * @param code - 에러 코드 (ErrorCode enum 값)
 * @param message - 에러 메시지 (미지정 시 기본 메시지 사용)
 * @param status - HTTP 상태 코드 (미지정 시 에러 코드 기반 자동 매핑)
 */
export function errorResponse(
  code: ErrorCodeValue,
  message?: string,
  status?: number
): NextResponse<ApiResponse<never>> {
  const resolvedStatus = status ?? ERROR_STATUS_MAP[code] ?? 500;
  const resolvedMessage = message ?? ERROR_MESSAGE_MAP[code] ?? '알 수 없는 오류가 발생했습니다.';

  return NextResponse.json(
    {
      data: null,
      error: { code, message: resolvedMessage },
    },
    { status: resolvedStatus }
  );
}

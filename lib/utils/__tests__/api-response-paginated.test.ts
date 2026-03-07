/**
 * api-response — paginatedResponse 추가 테스트
 *
 * 테스트 대상: lib/utils/api-response.ts > paginatedResponse
 * 범위: paginatedResponse만 검증 (successResponse, errorResponse는 기존 테스트에서 검증됨)
 *
 * paginatedResponse 동작:
 * - HTTP 200으로 고정
 * - 응답 body: { data: { items, total, page, limit }, error: null }
 * - totalPages는 응답에 포함되지 않음 — 호출 측에서 Math.ceil(total/limit)으로 계산
 */

import { describe, it, expect } from 'vitest';
import { paginatedResponse } from '@/lib/utils/api-response';

// ─── 테스트 데이터 팩토리 ─────────────────────────────────────────────────

interface TestItem {
  id: string;
  name: string;
}

/**
 * 더미 TestItem 배열을 생성한다.
 */
function createItems(count: number): TestItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `항목 ${i + 1}`,
  }));
}

// ─── 테스트 ──────────────────────────────────────────────────────────────

describe('paginatedResponse', () => {
  // ── 정상 페이지네이션 응답 ─────────────────────────────────────────

  it('정상 페이지네이션 응답은 HTTP 200을 반환한다', async () => {
    const items = createItems(10);
    const response = paginatedResponse(items, 50, 1, 10);

    expect(response.status).toBe(200);
  });

  it('정상 페이지네이션 응답의 body에 items, total, page, limit이 포함된다', async () => {
    const items = createItems(10);
    const response = paginatedResponse(items, 50, 1, 10);
    const body = await response.json();

    expect(body).toEqual({
      data: {
        items,
        total: 50,
        page: 1,
        limit: 10,
      },
      error: null,
    });
  });

  it('응답 body의 error 필드는 null이다', async () => {
    const response = paginatedResponse(createItems(5), 20, 1, 10);
    const body = await response.json();

    expect(body.error).toBeNull();
  });

  // ── 빈 배열 ────────────────────────────────────────────────────────

  it('items가 빈 배열이면 items: []로 응답한다', async () => {
    const response = paginatedResponse([], 0, 1, 10);
    const body = await response.json();

    expect(body.data.items).toEqual([]);
  });

  it('items가 빈 배열이고 total이 0이면 정상 응답한다', async () => {
    const response = paginatedResponse([], 0, 1, 10);
    const body = await response.json();

    expect(body.data.total).toBe(0);
  });

  // ── 마지막 페이지 ──────────────────────────────────────────────────

  it('마지막 페이지에서 items가 limit보다 적어도 정상 응답한다', async () => {
    // total=25, limit=10 → 3페이지에 5건
    const items = createItems(5);
    const response = paginatedResponse(items, 25, 3, 10);
    const body = await response.json();

    expect(body.data.items).toHaveLength(5);
    expect(body.data.page).toBe(3);
  });

  it('마지막 페이지의 total과 limit으로 totalPages를 올바르게 계산할 수 있다', async () => {
    // paginatedResponse는 totalPages를 계산하지 않으므로 호출 측에서 계산한다
    const total = 25;
    const limit = 10;
    const response = paginatedResponse(createItems(5), total, 3, limit);
    const body = await response.json();

    const expectedTotalPages = Math.ceil(body.data.total / body.data.limit);

    expect(expectedTotalPages).toBe(3);
  });

  // ── totalPages 계산 검증 ───────────────────────────────────────────

  it('total이 limit의 정수배이면 totalPages가 나머지 없이 계산된다', async () => {
    // total=30, limit=10 → 3페이지 (나머지 0)
    const response = paginatedResponse(createItems(10), 30, 1, 10);
    const body = await response.json();

    const totalPages = Math.ceil(body.data.total / body.data.limit);

    expect(totalPages).toBe(3);
  });

  it('total이 limit으로 나누어 떨어지지 않으면 totalPages가 올림된다', async () => {
    // total=31, limit=10 → 4페이지 (나머지 1)
    const response = paginatedResponse(createItems(10), 31, 1, 10);
    const body = await response.json();

    const totalPages = Math.ceil(body.data.total / body.data.limit);

    expect(totalPages).toBe(4);
  });

  it('total이 1이고 limit이 크면 totalPages는 1이다', async () => {
    const response = paginatedResponse(createItems(1), 1, 1, 100);
    const body = await response.json();

    const totalPages = Math.ceil(body.data.total / body.data.limit);

    expect(totalPages).toBe(1);
  });

  // ── page 번호 정확성 ───────────────────────────────────────────────

  it('page 번호가 응답 body에 그대로 반영된다', async () => {
    const response = paginatedResponse(createItems(10), 100, 5, 10);
    const body = await response.json();

    expect(body.data.page).toBe(5);
  });

  it('limit 값이 응답 body에 그대로 반영된다', async () => {
    const response = paginatedResponse(createItems(20), 200, 1, 20);
    const body = await response.json();

    expect(body.data.limit).toBe(20);
  });
});

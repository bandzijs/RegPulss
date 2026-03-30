import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const queryBuilder = {
    update: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
  };
  const fromMock = vi.fn(() => queryBuilder);
  const createClientMock = vi.fn(() => ({
    from: fromMock,
  }));
  return { queryBuilder, fromMock, createClientMock };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClientMock,
}));

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  },
}));

import { GET } from '@/app/api/unsubscribe/route';

function makeRequest(url: string): NextRequest {
  const parsed = new URL(url);
  return {
    url,
    nextUrl: parsed,
  } as unknown as NextRequest;
}

describe('GET /api/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queryBuilder.update.mockReturnValue(mocks.queryBuilder);
    mocks.queryBuilder.eq.mockReturnValue(mocks.queryBuilder);
  });

  it('redirects to success for a valid token and updated row', async () => {
    mocks.queryBuilder.select.mockResolvedValue({
      data: [{ id: 'sub_1' }],
      error: null,
    });

    const response = await GET(
      makeRequest('https://regpulss.lv/api/unsubscribe?token=valid-token')
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/unsubscribed?status=success');
  });

  it('redirects to error when token is missing', async () => {
    const response = await GET(
      makeRequest('https://regpulss.lv/api/unsubscribe')
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/unsubscribed?status=error');
    expect(mocks.queryBuilder.select).not.toHaveBeenCalled();
  });

  it('redirects to error for an invalid token (query error)', async () => {
    mocks.queryBuilder.select.mockResolvedValue({
      data: null,
      error: { message: 'Invalid token' },
    });

    const response = await GET(
      makeRequest('https://regpulss.lv/api/unsubscribe?token=invalid-token')
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/unsubscribed?status=error');
  });

  it('redirects to error when no rows were updated', async () => {
    mocks.queryBuilder.select.mockResolvedValue({
      data: [],
      error: null,
    });

    const response = await GET(
      makeRequest('https://regpulss.lv/api/unsubscribe?token=no-rows-token')
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/unsubscribed?status=error');
  });
});


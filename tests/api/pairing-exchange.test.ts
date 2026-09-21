import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const rpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc })),
}));

import { POST } from '@/app/api/pairing/exchange/route';

function request(credential: { readonly code: string } | { readonly token: string } = { code: '7KPM-4XQ2' }) {
  return new NextRequest('http://localhost/api/pairing/exchange', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.10' },
    body: JSON.stringify({ ...credential, deviceLabel: 'Tablet của bé' }),
  });
}

describe('pairing exchange API', () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it.each([
    ['expired', 410],
    ['revoked', 410],
    ['consumed', 409],
    ['attempts_exhausted', 429],
    ['rate_limited', 429],
    ['invalid', 404],
  ])('denies %s challenges', async (exchangeStatus, expectedStatus) => {
    rpc.mockResolvedValue({ data: [{ exchange_status: exchangeStatus }], error: null });
    const response = await POST(request());
    expect(response.status).toBe(expectedStatus);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('issues an HttpOnly cookie without returning the credential in JSON', async () => {
    rpc.mockResolvedValue({
      data: [{ exchange_status: 'ok', session_expires_at: '2026-10-19T00:00:00.000Z' }],
      error: null,
    });

    const response = await POST(request());
    const body = await response.json();
    const cookie = response.headers.get('set-cookie') ?? '';

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(cookie).toContain('kidhabit_child_session=');
    expect(cookie.toLowerCase()).toContain('httponly');
    expect(JSON.stringify(body)).not.toMatch(/token|pin|profiles|familyId/i);
  });

  it('exchanges a QR token through the persistent credential boundary', async () => {
    // Given
    rpc.mockResolvedValue({
      data: [{ exchange_status: 'ok', session_expires_at: '2026-10-19T00:00:00.000Z' }],
      error: null,
    });

    // When
    const response = await POST(request({ token: 'qr-token-with-at-least-thirty-two-characters' }));

    // Then
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('exchange_pairing_credential', expect.objectContaining({
      pairing_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      manual_code_id: null,
      manual_verifier_hash: null,
    }));
  });
});

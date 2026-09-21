import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, from, rpc } = vi.hoisted(() => ({
  getParentContext: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ from, rpc })),
}));

import { POST as readCredential } from '@/app/api/pairing/credentials/route';
import { POST as rotateCredential } from '@/app/api/pairing/credentials/rotate/route';

const CHILD_ID = '11111111-1111-4111-8111-111111111111';
const FAMILY_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '33333333-3333-4333-8333-333333333333';

function request(path: string): NextRequest {
  return new NextRequest(`https://kid.example${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ childId: CHILD_ID }),
  });
}

describe('persistent pairing credential API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PAIRING_RATE_LIMIT_SECRET = 'test-secret-at-least-32-characters';
    getParentContext.mockResolvedValue({ familyId: FAMILY_ID, user: { id: USER_ID } });
  });

  it('requires parent authentication before reading a credential', async () => {
    // Given
    getParentContext.mockResolvedValue(null);

    // When
    const response = await readCredential(request('/api/pairing/credentials'));

    // Then
    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('returns 404 when the child is outside the parent family', async () => {
    // Given
    from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: null, error: null })) })),
        })),
      })),
    });

    // When
    const response = await readCredential(request('/api/pairing/credentials'));

    // Then
    expect(response.status).toBe(404);
  });

  it('returns the same public material for repeated reads without exposing hashes', async () => {
    // Given
    rpc.mockResolvedValue({
      data: [{ rotation_nonce: '44444444-4444-4444-8444-444444444444', rotated_at: '2026-09-21T12:00:00.000Z' }],
      error: null,
    });
    const childQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: { id: CHILD_ID }, error: null })) })),
        })),
      })),
    };
    from.mockReturnValue(childQuery);

    // When
    const first = await readCredential(request('/api/pairing/credentials'));
    const second = await readCredential(request('/api/pairing/credentials'));
    const firstBody = await first.json();
    const secondBody = await second.json();

    // Then
    expect(secondBody).toEqual(firstBody);
    expect(firstBody).toMatchObject({ childId: CHILD_ID, rotatedAt: '2026-09-21T12:00:00.000Z' });
    expect(firstBody.qrPayload).toMatch(/^https:\/\/kid\.example\/\?pair=/);
    expect(JSON.stringify(firstBody)).not.toMatch(/hash|nonce|secret/i);
  });

  it('rotates through the family-scoped database boundary and returns new material', async () => {
    // Given
    rpc.mockResolvedValue({
      data: [{ rotation_nonce: '55555555-5555-4555-8555-555555555555', rotated_at: '2026-09-21T12:05:00.000Z' }],
      error: null,
    });

    // When
    const response = await rotateCredential(request('/api/pairing/credentials/rotate'));
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('rotate_pairing_credential', expect.objectContaining({
      target_child_id: CHILD_ID,
    }));
    expect(body).toMatchObject({ childId: CHILD_ID, rotatedAt: '2026-09-21T12:05:00.000Z' });
    expect(JSON.stringify(body)).not.toMatch(/hash|nonce|secret/i);
  });
});

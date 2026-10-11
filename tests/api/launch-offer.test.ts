import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc }) }));
vi.mock('@/lib/site', () => ({ getMarketingOrigin: () => new URL('https://marketing.example') }));

import { GET } from '@/app/api/offers/launch/route';

const remaining: Record<string, number> = { pro_plus_founding: 7, pro_plus_upsell_690: 150, pro_plus_b1g1: 0 };

describe('GET /api/offers/launch', () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockImplementation(async (_name: string, args: { offer: string }) => ({ data: remaining[args.offer], error: null }));
  });

  it('reports every offer\'s counts, for the marketing origin, cached for a minute', async () => {
    const response = await GET();
    for (const offer of ['pro_plus_founding', 'pro_plus_upsell_690', 'pro_plus_b1g1']) expect(rpc).toHaveBeenCalledWith('launch_offer_remaining', { offer });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      code: 'pro_plus_founding', slots: 10, remaining: 7,
      offers: [
        { code: 'pro_plus_founding', slots: 10, remaining: 7, endsAt: null },
        { code: 'pro_plus_upsell_690', slots: 200, remaining: 150, endsAt: null },
        { code: 'pro_plus_b1g1', slots: 100, remaining: 0, endsAt: '2026-12-31T17:00:00.000Z' },
      ],
    });
    expect(response.headers.get('access-control-allow-origin')).toBe('https://marketing.example');
    expect(response.headers.get('cache-control')).toBe('public, max-age=60');
  });

  it('answers 503 without error details when a count cannot be read', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'relation secret_table failed' } });
    const response = await GET();
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain('secret_table');
  });

  it('answers 503 when any one count is missing', async () => {
    rpc.mockImplementation(async (_name: string, args: { offer: string }) => ({ data: args.offer === 'pro_plus_b1g1' ? null : 5, error: null }));
    expect((await GET()).status).toBe(503);
  });
});

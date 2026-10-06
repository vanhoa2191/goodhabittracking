import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc }) }));
vi.mock('@/lib/site', () => ({ getMarketingOrigin: () => new URL('https://marketing.example') }));

import { GET } from '@/app/api/offers/launch/route';

describe('GET /api/offers/launch', () => {
  beforeEach(() => rpc.mockReset());

  it('reports only the counts, for the marketing origin, cached for a minute', async () => {
    rpc.mockResolvedValue({ data: 7, error: null });
    const response = await GET();
    expect(rpc).toHaveBeenCalledWith('launch_offer_remaining', { offer: 'pro_plus_founding' });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ code: 'pro_plus_founding', slots: 10, remaining: 7 });
    expect(response.headers.get('access-control-allow-origin')).toBe('https://marketing.example');
    expect(response.headers.get('cache-control')).toBe('public, max-age=60');
  });

  it('answers 503 without error details when the count cannot be read', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'relation secret_table failed' } });
    const response = await GET();
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain('secret_table');
  });

  it('answers 503 when the count is not a number', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect((await GET()).status).toBe(503);
  });
});

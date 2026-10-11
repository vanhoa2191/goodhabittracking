import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, from, rpc } = vi.hoisted(() => ({ getParentContext: vi.fn(), from: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => ({ from, rpc }) }));
import { GET } from '@/app/api/entitlement/route';

const subscription = { plan: 'solo_monthly', status: 'active', trial_ends_at: null, subscription_ends_at: '2026-11-11T00:00:00Z' };

describe('GET /api/entitlement add-ons', () => {
  beforeEach(() => {
    getParentContext.mockResolvedValue({ familyId: 'family-1', role: 'owner', user: { id: 'owner-1' } });
    from.mockReset();
    rpc.mockReset();
    from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: subscription, error: null }) }) }) });
  });

  it('refuses an anonymous caller', async () => {
    getParentContext.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it('adds the add-on snapshot to the entitlement', async () => {
    rpc.mockResolvedValue({ data: { aiUntil: '2026-11-01T00:00:00Z', aiIncluded: false, printables: true }, error: null });
    const body = await (await GET()).json();
    expect(rpc).toHaveBeenCalledWith('family_addons_snapshot');
    expect(body).toMatchObject({
      success: true,
      entitlement: { plan: 'solo_monthly' },
      addons: { aiUntil: '2026-11-01T00:00:00Z', aiIncluded: false, printables: true },
    });
  });

  it('reads the snapshot when the family has no subscription row', async () => {
    from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) });
    rpc.mockResolvedValue({ data: { aiUntil: null, aiIncluded: true, printables: false }, error: null });
    const body = await (await GET()).json();
    expect(body.entitlement.plan).toBe('free');
    expect(body.addons).toEqual({ aiUntil: null, aiIncluded: true, printables: false });
  });

  it.each([
    ['an rpc error', { data: null, error: { message: 'missing function' } }],
    ['a null result', { data: null, error: null }],
    ['a malformed result', { data: { aiUntil: 5, aiIncluded: 'yes' }, error: null }],
  ])('falls back to no add-ons on %s, keeping the entitlement', async (_label, result) => {
    rpc.mockResolvedValue(result);
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.addons).toEqual({ aiUntil: null, aiIncluded: false, printables: false });
    expect(body.entitlement.plan).toBe('solo_monthly');
  });

  it('falls back when the rpc throws', async () => {
    rpc.mockRejectedValue(new Error('network'));
    const body = await (await GET()).json();
    expect(body.addons).toEqual({ aiUntil: null, aiIncluded: false, printables: false });
  });
});

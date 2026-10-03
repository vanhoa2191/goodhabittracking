import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSupabase } from '@/lib/supabase';
import { loadCaregiverProgress, loadCloudIdentitySnapshot } from '@/lib/store/caregiver-progress';

vi.mock('@/lib/supabase', () => ({ getSupabase: vi.fn() }));

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const activityId = '33333333-3333-4333-8333-333333333333';
const userId = '44444444-4444-4444-8444-444444444444';

function progress() {
  return {
    familyId,
    familyRole: 'caregiver' as const,
    profiles: [{ id: childId, name: 'An', avatar: '🦁', theme_color: 'indigo' }],
    activities: [{ id: activityId, child_id: null, title: 'Read together', description: null }],
    completionCounts: [{ child_id: childId, count: 7 }],
  };
}

type Result = { data: unknown; error: { code: string; message?: string } | null };

function transport(options: { role?: string; membership?: Result; snapshot?: Result } = {}) {
  const single = vi.fn(async () => options.membership ?? {
    data: { family_id: familyId, role: options.role ?? 'caregiver' }, error: null,
  });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn((table: string) => {
    if (table !== 'family_memberships') throw new Error(`Forbidden table read: ${table}`);
    return { select };
  });
  const rpc = vi.fn(async () => options.snapshot ?? { data: progress(), error: null });
  const client = { from, rpc } as unknown as NonNullable<ReturnType<typeof getSupabase>>;
  vi.mocked(getSupabase).mockReturnValue(client);
  return { client, from, rpc, select, eq, single };
}

beforeEach(() => vi.resetAllMocks());

describe('caregiver progress projection', () => {
  it('loads the minimal projection and aggregate counts using only its dedicated RPC', async () => {
    const { client, rpc, from } = transport();
    await expect(loadCaregiverProgress(client)).resolves.toEqual(progress());
    expect(rpc.mock.calls).toEqual([['caregiver_progress_snapshot']]);
    expect(from).not.toHaveBeenCalled();
  });

  it('accepts a family with no children or progress', async () => {
    const empty = { ...progress(), profiles: [], activities: [], completionCounts: [] };
    const { client } = transport({ snapshot: { data: empty, error: null } });
    await expect(loadCaregiverProgress(client)).resolves.toEqual(empty);
  });

  it.each([0, 12])('preserves an integer completion count of %i', async (count) => {
    const data = progress();
    data.completionCounts[0].count = count;
    const { client } = transport({ snapshot: { data, error: null } });
    await expect(loadCaregiverProgress(client)).resolves.toEqual(data);
  });

  it.each([
    ['root log rows', () => ({ ...progress(), logs: [] })],
    ['profile financial fields', () => ({ ...progress(), profiles: [{ ...progress().profiles[0], points: 42 }] })],
    ['activity points', () => ({ ...progress(), activities: [{ ...progress().activities[0], points: 10 }] })],
    ['completion log detail', () => ({ ...progress(), completionCounts: [{ ...progress().completionCounts[0], note: 'private' }] })],
    ['manager role', () => ({ ...progress(), familyRole: 'owner' })],
    ['invalid family id', () => ({ ...progress(), familyId: 'not-a-uuid' })],
    ['missing counts', () => ({ familyId, familyRole: 'caregiver', profiles: [], activities: [] })],
    ['null response', () => null],
    ['array response', () => []],
  ])('rejects %s instead of hydrating a wider or malformed snapshot', async (_name, payload) => {
    const { client, rpc, from } = transport({ snapshot: { data: payload(), error: null } });
    await expect(loadCaregiverProgress(client)).rejects.toThrow();
    expect(rpc.mock.calls).toEqual([['caregiver_progress_snapshot']]);
    expect(from).not.toHaveBeenCalled();
  });

  it.each([-1, 1.5, '7', null, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid aggregate count %s', async (count) => {
    const data = { ...progress(), completionCounts: [{ child_id: childId, count }] };
    const { client, from } = transport({ snapshot: { data, error: null } });
    await expect(loadCaregiverProgress(client)).rejects.toThrow();
    expect(from).not.toHaveBeenCalled();
  });

  it.each(['PGRST202', '42883', '42501'])('propagates RPC error %s without a table or family snapshot fallback', async (code) => {
    const error = { code, message: 'Projection unavailable' };
    const { client, rpc, from } = transport({ snapshot: { data: progress(), error } });
    await expect(loadCaregiverProgress(client)).rejects.toBe(error);
    expect(rpc.mock.calls).toEqual([['caregiver_progress_snapshot']]);
    expect(from).not.toHaveBeenCalled();
  });

  it('does not substitute a broad snapshot after a transport exception', async () => {
    const { client, rpc, from } = transport();
    const error = new Error('Connection interrupted');
    rpc.mockRejectedValueOnce(error);
    await expect(loadCaregiverProgress(client)).rejects.toBe(error);
    expect(rpc).toHaveBeenCalledOnce();
    expect(from).not.toHaveBeenCalled();
  });

  it('fails closed when the client is not configured', async () => {
    vi.mocked(getSupabase).mockReturnValue(null);
    await expect(loadCaregiverProgress()).rejects.toThrow('not configured');
    await expect(loadCloudIdentitySnapshot(userId)).rejects.toThrow('not configured');
  });
});

function familySnapshot(role: string) {
  return {
    familyId, familyRole: role, profiles: [], activities: [], logs: [], rewards: [], redemptions: [],
    childBadges: [], kudos: [], groups: [], groupMembers: [],
    subscription: role === 'caregiver' ? null : { plan: 'monthly', status: 'active', subscription_ends_at: '2027-10-03T00:00:00Z' },
  };
}

/** Answers each RPC by name, the way the two loaders call them. */
function rpcTransport(answers: Record<string, Result | Error>) {
  const from = vi.fn((table: string) => { throw new Error(`Forbidden table read: ${table}`); });
  const rpc = vi.fn(async (name: string) => {
    const answer = answers[name];
    if (answer instanceof Error) throw answer;
    return answer ?? { data: null, error: { code: 'PGRST202' } };
  });
  vi.mocked(getSupabase).mockReturnValue({ from, rpc } as unknown as NonNullable<ReturnType<typeof getSupabase>>);
  return { from, rpc };
}

describe('cloud identity snapshot routing', () => {
  it.each(['owner', 'parent', 'guardian'])('loads a %s with the family snapshot alone, in one round trip', async (role) => {
    const { rpc, from } = rpcTransport({ family_snapshot: { data: familySnapshot(role), error: null } });
    await expect(loadCloudIdentitySnapshot(userId)).resolves.toMatchObject({
      familyRole: 'manager', snapshot: { familyId, familyRole: role, subscriptionPlan: 'monthly' },
    });
    expect(rpc.mock.calls.map(([name]) => name)).toEqual(['family_snapshot']);
    expect(from).not.toHaveBeenCalled();
  });

  it('asks for the caregiver projection only after the snapshot names a caregiver', async () => {
    const { rpc } = rpcTransport({
      family_snapshot: { data: familySnapshot('caregiver'), error: null },
      caregiver_progress_snapshot: { data: progress(), error: null },
    });
    await expect(loadCloudIdentitySnapshot(userId)).resolves.toEqual({ familyRole: 'caregiver', progress: progress() });
    expect(rpc.mock.calls.map(([name]) => name)).toEqual(['family_snapshot', 'caregiver_progress_snapshot']);
  });

  it.each(['PGRST202', '42883', '42501'])('keeps caregiver routing closed when the projection fails with %s', async (code) => {
    const error = { code };
    rpcTransport({
      family_snapshot: { data: familySnapshot('caregiver'), error: null },
      caregiver_progress_snapshot: { data: null, error },
    });
    await expect(loadCloudIdentitySnapshot(userId)).rejects.toBe(error);
  });

  it('rejects a projection returned for a changed family', async () => {
    rpcTransport({
      family_snapshot: { data: familySnapshot('caregiver'), error: null },
      caregiver_progress_snapshot: { data: { ...progress(), familyId: userId }, error: null },
    });
    await expect(loadCloudIdentitySnapshot(userId)).rejects.toThrow('membership changed');
  });

  it('loads nothing more when the account has no family', async () => {
    const { rpc } = rpcTransport({ family_snapshot: { data: null, error: null } });
    await expect(loadCloudIdentitySnapshot(userId)).rejects.toThrow('no family membership');
    expect(rpc.mock.calls.map(([name]) => name)).toEqual(['family_snapshot']);
  });
});

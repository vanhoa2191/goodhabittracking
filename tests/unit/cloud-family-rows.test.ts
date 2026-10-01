import { describe, expect, it, vi } from 'vitest';
import { readCloudFamilyRows } from '@/lib/store/cloud-family-sync';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const activityId = '33333333-3333-4333-8333-333333333333';
const observation = {
  log_id: '44444444-4444-4444-8444-444444444444', family_id: familyId, child_id: childId, activity_id: activityId,
  support_level: 'alone', recorded_by: 'parent', recorded_at: '2026-09-30T09:00:00.000Z',
};

type TableResult = { data: unknown; error: { code: string } | null };

/** A query builder that answers every chained call and resolves to the table's canned result. */
function fakeSupabase(tables: Record<string, TableResult>) {
  const resultFor = (table: string): TableResult => {
    if (table === 'family_memberships') return { data: { family_id: familyId, role: 'owner' }, error: null };
    return tables[table] ?? { data: table === 'user_subscriptions' || table === 'family_engagement_settings' ? null : [], error: null };
  };
  return {
    rpc: async () => ({ data: null, error: { code: 'PGRST202' } }),
    from(table: string) {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        limit: () => query,
        maybeSingle: async () => resultFor(table),
        then: (resolve: (value: TableResult) => unknown) => Promise.resolve(resultFor(table)).then(resolve),
      };
      return query;
    },
  } as unknown as NonNullable<Parameters<typeof readCloudFamilyRows>[1]>;
}

describe('cloud family rows', () => {
  it('reads support observations and cue plans into the experience state', async () => {
    const rows = await readCloudFamilyRows('user-1', fakeSupabase({
      habit_support_observations: { data: [observation], error: null },
    }));
    expect(rows.experience).toMatchObject({ supportObservations: [observation], cuePlans: [] });
  });

  it('still loads the family when the habit program tables are not created yet', async () => {
    const rows = await readCloudFamilyRows('user-1', fakeSupabase({
      habit_support_observations: { data: null, error: { code: 'PGRST205' } },
      habit_cue_plans: { data: null, error: { code: '42P01' } },
    }));
    expect(rows.experience).toMatchObject({ supportObservations: [], cuePlans: [] });
  });

  it('still fails for any other error on those tables and for other tables', async () => {
    await expect(readCloudFamilyRows('user-1', fakeSupabase({
      habit_cue_plans: { data: null, error: { code: '42501' } },
    }))).rejects.toMatchObject({ code: '42501' });
    await expect(readCloudFamilyRows('user-1', fakeSupabase({
      child_task_deferrals: { data: null, error: { code: 'PGRST205' } },
    }))).rejects.toMatchObject({ code: 'PGRST205' });
  });

  describe('one round trip', () => {
    const snapshot = {
      familyId, familyRole: 'owner', profiles: [], activities: [], logs: [], rewards: [], redemptions: [], childBadges: [],
      kudos: [], groups: [], groupMembers: [], subscription: null,
      experience: { children: [], settings: null, letters: [], quests: [], wishlists: [], deferredTasks: [], supportObservations: [observation], cuePlans: [], journalEntries: [], cityPurchases: [] },
    };

    function withRpc(result: { data: unknown; error: { code: string } | null }) {
      const from = vi.fn();
      const rpc = vi.fn(async () => result);
      return { client: { rpc, from } as unknown as NonNullable<Parameters<typeof readCloudFamilyRows>[1]>, from, rpc };
    }

    it('reads everything with the single function and touches no table', async () => {
      const { client, from, rpc } = withRpc({ data: snapshot, error: null });
      const rows = await readCloudFamilyRows('user-1', client);
      expect(rpc).toHaveBeenCalledWith('family_snapshot', expect.objectContaining({ include_journal: expect.any(Boolean) }));
      expect(from).not.toHaveBeenCalled();
      expect(rows.familyId).toBe(familyId);
      expect(rows.experience).toMatchObject({ supportObservations: [observation] });
    });

    it('says the account has no family when the function returns nothing', async () => {
      const { client } = withRpc({ data: null, error: null });
      await expect(readCloudFamilyRows('user-1', client)).rejects.toThrow('no family membership');
    });

    it.each(['PGRST202', '42883'])('falls back to the separate queries when the database has no function (%s)', async (code) => {
      const client = fakeSupabase({});
      (client as unknown as { rpc: unknown }).rpc = async () => ({ data: null, error: { code } });
      await expect(readCloudFamilyRows('user-1', client)).resolves.toMatchObject({ familyId });
    });

    it.each([[[]], [{ unexpected: true }], ['text']])('does not trust an answer that is not a family (%j) and reads the tables instead', async (answer) => {
      const client = fakeSupabase({});
      (client as unknown as { rpc: unknown }).rpc = async () => ({ data: answer, error: null });
      await expect(readCloudFamilyRows('user-1', client)).resolves.toMatchObject({ familyId });
    });

    it('does not hide any other database error behind the fallback', async () => {
      const { client, from } = withRpc({ data: null, error: { code: '42501' } });
      await expect(readCloudFamilyRows('user-1', client)).rejects.toMatchObject({ code: '42501' });
      expect(from).not.toHaveBeenCalled();
    });
  });
});

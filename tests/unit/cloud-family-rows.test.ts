import { describe, expect, it } from 'vitest';
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
});

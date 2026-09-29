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

import { GET, POST } from '@/app/api/domain/experience/route';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const deferredTask = {
  family_id: familyId,
  child_id: childId,
  activity_id: childId,
  local_date: '2026-09-25',
  deferred_at: '2026-09-25T12:00:00.000Z',
};

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/domain/experience', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/domain/experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentContext.mockResolvedValue({ familyId, user: { id: 'parent' } });
    rpc.mockResolvedValue({ data: { status: 'saved', changed: true }, error: null });
    from.mockImplementation((table: string) => ({
      select: () => ({
        eq: () => table === 'family_engagement_settings'
          ? { maybeSingle: async () => ({ data: null, error: null }) }
          : Promise.resolve({ data: [], error: null }),
      }),
    }));
  });

  it('requires a parent before reading or writing', async () => {
    getParentContext.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await POST(request({ type: 'pauseFamily' }))).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('hydrates a family with no engagement rows', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      children: [], settings: null, letters: [], quests: [], wishlists: [], deferredTasks: [],
      supportObservations: [], cuePlans: [], journalEntries: [], cityPurchases: [],
    });
  });

  it('rejects malformed commands without a database mutation', async () => {
    expect((await POST(request({ type: 'chooseWishlist', childId }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects the obsolete timestamp-only mascot command', async () => {
    const response = await POST(request({
      type: 'selectMascot', childId, familyId: '33333333-3333-4333-8333-333333333333',
    }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([true, false])('reports whether the parent choice changed: %s', async (changed) => {
    rpc.mockResolvedValue({ data: { status: 'saved', changed }, error: null });
    const response = await POST(request({ type: 'chooseWishlist', childId, rewardId: childId }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, changed });
    expect(rpc).toHaveBeenCalledWith('choose_parent_wishlist', {
      target_family_id: familyId,
      target_child_id: childId,
      target_reward_id: childId,
    });
  });

  it('reports a database rejection instead of claiming a cross-family write succeeded', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '23503' } });
    const response = await POST(request({ type: 'chooseWishlist', childId, rewardId: childId }));
    expect(response.status).toBe(503);
  });

  it('does not save an inactive or foreign reward', async () => {
    rpc.mockResolvedValue({ data: { status: 'reward_unavailable' }, error: null });
    const response = await POST(request({ type: 'chooseWishlist', childId, rewardId: childId }));
    expect(response.status).toBe(409);
    expect(rpc).toHaveBeenCalledOnce();
  });

  it('saves a dated task deferral through the parent family boundary', async () => {
    rpc.mockResolvedValue({ data: { status: 'saved', changed: true, deferredTask }, error: null });
    const response = await POST(request({
      type: 'setTaskDeferred', childId, activityId: childId, date: '2026-09-25', deferred: true,
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, changed: true, deferredTask });
    expect(rpc).toHaveBeenCalledWith('set_parent_task_deferral', {
      target_family_id: familyId,
      target_child_id: childId,
      target_activity_id: childId,
      target_local_date: '2026-09-25',
      should_defer: true,
    });
  });

  it('rejects a completed task deferral without a false success', async () => {
    rpc.mockResolvedValue({ data: { status: 'already_complete' }, error: null });
    const response = await POST(request({
      type: 'setTaskDeferred', childId, activityId: childId, date: '2026-09-25', deferred: true,
    }));
    expect(response.status).toBe(409);
  });

  describe('habit programs', () => {
    const logId = '99999999-9999-4999-8999-999999999999';
    const observation = {
      log_id: logId,
      family_id: familyId,
      child_id: childId,
      activity_id: childId,
      support_level: 'alone',
      recorded_by: 'parent',
      recorded_at: '2026-09-30T09:00:00.000Z',
    };
    const cuePlan = {
      family_id: familyId,
      child_id: childId,
      activity_id: childId,
      cue_kind: 'time',
      cue_text: 'Lúc 7 giờ tối, con đọc sách',
      cue_time: '19:00:00',
      place_text: null,
      weekend_variant_text: 'Cuối tuần đọc sau bữa sáng',
      created_at: '2026-09-29T09:00:00.000Z',
      updated_at: '2026-09-30T09:00:00.000Z',
    };
    const savePlan = {
      type: 'saveCuePlan', childId, activityId: childId, cueKind: 'time', cueText: 'Lúc 7 giờ tối, con đọc sách',
      cueTime: '19:00', placeText: null, weekendVariantText: 'Cuối tuần đọc sau bữa sáng',
    };

    it('reads support observations and cue plans with the rest of the family state', async () => {
      const rows: Record<string, unknown[]> = { habit_support_observations: [observation], habit_cue_plans: [cuePlan] };
      from.mockImplementation((table: string) => ({
        select: () => ({
          eq: () => table === 'family_engagement_settings'
            ? { maybeSingle: async () => ({ data: null, error: null }) }
            : Promise.resolve({ data: rows[table] ?? [], error: null }),
        }),
      }));
      const body = await (await GET()).json();
      expect(body.supportObservations).toEqual([observation]);
      expect(body.cuePlans).toEqual([cuePlan]);
    });

    it('fails the read when either table cannot be loaded', async () => {
      from.mockImplementation((table: string) => ({
        select: () => ({
          eq: () => table === 'family_engagement_settings'
            ? { maybeSingle: async () => ({ data: null, error: null }) }
            : Promise.resolve(table === 'habit_cue_plans' ? { data: null, error: { code: 'x' } } : { data: [], error: null }),
        }),
      }));
      expect((await GET()).status).toBe(503);
    });

    it('records how a completed habit was done through the family boundary', async () => {
      rpc.mockResolvedValue({ data: { status: 'saved', changed: true, observation }, error: null });
      const response = await POST(request({ type: 'recordSupport', logId, level: 'alone' }));
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true, changed: true, observation });
      expect(rpc).toHaveBeenCalledWith('set_parent_habit_support', {
        target_family_id: familyId, target_log_id: logId, target_level: 'alone',
      });
    });

    it('rejects an unknown level and a log that is not completed or not the family\'s', async () => {
      expect((await POST(request({ type: 'recordSupport', logId, level: 'perfect' }))).status).toBe(400);
      expect((await POST(request({ type: 'recordSupport', logId: 'bad', level: 'alone' }))).status).toBe(400);
      expect(rpc).not.toHaveBeenCalled();
      rpc.mockResolvedValue({ data: { status: 'log_unavailable' }, error: null });
      expect((await POST(request({ type: 'recordSupport', logId, level: 'alone' }))).status).toBe(409);
      rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
      expect((await POST(request({ type: 'recordSupport', logId, level: 'alone' }))).status).toBe(401);
    });

    it('does not report success when the saved row is not the one requested', async () => {
      rpc.mockResolvedValue({ data: { status: 'saved', changed: true, observation: { ...observation, support_level: 'prompted' } }, error: null });
      expect((await POST(request({ type: 'recordSupport', logId, level: 'alone' }))).status).toBe(503);
      rpc.mockResolvedValue({ data: { status: 'saved', changed: true, observation: { ...observation, family_id: '33333333-3333-4333-8333-333333333333' } }, error: null });
      expect((await POST(request({ type: 'recordSupport', logId, level: 'alone' }))).status).toBe(503);
    });

    it('saves a cue plan and trims what the parent typed', async () => {
      rpc.mockResolvedValue({ data: { status: 'saved', cuePlan }, error: null });
      const response = await POST(request({ ...savePlan, cueText: '  Lúc 7 giờ tối, con đọc sách  ' }));
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true, cuePlan });
      expect(rpc).toHaveBeenCalledWith('save_parent_habit_cue_plan', {
        target_family_id: familyId,
        target_child_id: childId,
        target_activity_id: childId,
        target_cue_kind: 'time',
        target_cue_text: 'Lúc 7 giờ tối, con đọc sách',
        target_cue_time: '19:00',
        target_place_text: null,
        target_weekend_variant_text: 'Cuối tuần đọc sau bữa sáng',
      });
    });

    it('rejects a time cue without a time, an event cue with one, and over-long text', async () => {
      expect((await POST(request({ ...savePlan, cueTime: null }))).status).toBe(400);
      expect((await POST(request({ ...savePlan, cueKind: 'event' }))).status).toBe(400);
      expect((await POST(request({ ...savePlan, cueTime: '25:00' }))).status).toBe(400);
      expect((await POST(request({ ...savePlan, cueText: 'x'.repeat(201) }))).status).toBe(400);
      expect((await POST(request({ ...savePlan, cueText: '   ' }))).status).toBe(400);
      expect(rpc).not.toHaveBeenCalled();
    });

    it('reports an unavailable child or habit and a mismatching saved plan', async () => {
      rpc.mockResolvedValue({ data: { status: 'plan_unavailable' }, error: null });
      expect((await POST(request(savePlan))).status).toBe(409);
      rpc.mockResolvedValue({ data: { status: 'saved', cuePlan: { ...cuePlan, activity_id: '33333333-3333-4333-8333-333333333333' } }, error: null });
      expect((await POST(request(savePlan))).status).toBe(503);
    });
  });
});


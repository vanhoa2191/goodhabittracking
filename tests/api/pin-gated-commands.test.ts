import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { userRpc, adminRpc, unlock } = vi.hoisted(() => ({ userRpc: vi.fn(), adminRpc: vi.fn(), unlock: vi.fn() }));

vi.mock('@/lib/auth/parent-context', () => ({
  getParentContext: vi.fn(async () => ({ familyId: 'family-a', role: 'owner', user: { id: 'parent-user-1' } })),
}));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc: userRpc })) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: vi.fn(() => ({ rpc: adminRpc })) }));
vi.mock('@/lib/security/parent-unlock', () => ({ requireParentUnlock: unlock }));

import { POST } from '@/app/api/domain/commands/route';

const uuid = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';

function post(body: unknown) {
  return POST(new NextRequest('http://localhost/api/domain/commands', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

const protectedCommands = [
  { label: 'reviewing a habit', body: { type: 'reviewHabit', logId: uuid, decision: 'approve' }, fn: 'review_habit_command', args: { target_log_id: uuid, decision: 'approve' } },
  { label: 'reviewing habits in a batch', body: { type: 'reviewHabits', logIds: [uuid, other], decision: 'approve' }, fn: 'review_habits_command', args: { target_log_ids: [uuid, other], decision: 'approve' } },
  { label: 'moving a reward redemption', body: { type: 'transitionRedemption', redemptionId: uuid, decision: 'approve' }, fn: 'transition_redemption_command', args: { target_redemption_id: uuid, decision: 'approve' } },
  { label: 'adjusting points by hand', body: { type: 'adjustPoints', childId: uuid, amount: 10, reason: 'Extra help', commandId: other }, fn: 'adjust_child_points_command', args: { target_child_id: uuid, amount: 10, reason: 'Extra help', command_id: other } },
] as const;

describe('PIN-protected domain commands', () => {
  beforeEach(() => {
    userRpc.mockReset();
    adminRpc.mockReset();
    unlock.mockReset();
    unlock.mockResolvedValue(null);
    adminRpc.mockResolvedValue({ data: { status: 'approved' }, error: null });
    userRpc.mockResolvedValue({ data: { status: 'completed' }, error: null });
  });

  it.each(protectedCommands)('runs %s through the server-only wrapper for the verified parent, never as the browser user', async ({ body, fn, args }) => {
    const response = await post(body);
    expect(response.status).toBe(200);
    expect(adminRpc).toHaveBeenCalledWith(`${fn}_as`, { actor_user_id: 'parent-user-1', ...args });
    expect(userRpc).not.toHaveBeenCalled();
  });

  it.each(protectedCommands)('does not reach the database at all while the PIN is locked (%s)', async ({ body }) => {
    unlock.mockResolvedValue(new Response(JSON.stringify({ code: 'parent_pin_required' }), { status: 403 }));
    const response = await post(body);
    expect(response.status).toBe(403);
    expect(adminRpc).not.toHaveBeenCalled();
    expect(userRpc).not.toHaveBeenCalled();
  });

  it('keeps the child ticks and undo with the signed-in user, outside the PIN', async () => {
    await post({ type: 'completeHabit', activityId: uuid, childId: other, date: '2026-10-04', commandId: uuid });
    expect(userRpc).toHaveBeenCalledWith('complete_habit_command', expect.anything());
    expect(adminRpc).not.toHaveBeenCalled();
    expect(unlock).not.toHaveBeenCalled();
  });

  it.each(['PGRST202', '42501'])('reports a failure (%s) instead of retrying as the browser user', async (code) => {
    adminRpc.mockResolvedValue({ data: null, error: { code } });
    const response = await post(protectedCommands[0].body);
    expect(response.status).toBe(409);
    expect(userRpc).not.toHaveBeenCalled();
  });
});

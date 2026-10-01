import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const from = vi.fn();

vi.mock('@/lib/auth/parent-context', () => ({
  getParentContext: vi.fn(async () => ({ familyId: 'family-a', role: 'owner', user: { id: 'user-a' } })),
}));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc, from })) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: vi.fn(() => ({ rpc, from })) }));
vi.mock('@/lib/billing/payos-server', () => ({ createPayOSPayment: vi.fn() }));

import { DELETE as deleteFamily } from '@/app/api/family/route';
import { DELETE as revokeDevice } from '@/app/api/devices/[id]/route';
import { POST as ensureCredential } from '@/app/api/pairing/credentials/route';
import { POST as rotateCredential } from '@/app/api/pairing/credentials/rotate/route';
import { POST as createPayment } from '@/app/api/payment/create/route';
import { POST as runCommand } from '@/app/api/domain/commands/route';
import { POST as affiliateAction } from '@/app/api/affiliate/route';

const uuid = '11111111-1111-4111-8111-111111111111';

function call(method: string, path: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('sensitive parent actions need the PIN entered in this browser', () => {
  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
    vi.stubEnv('PAIRING_RATE_LIMIT_SECRET', 'x'.repeat(40));
    rpc.mockImplementation(async (name: string) => (
      name === 'get_parent_pin_status' ? { data: { configured: true, lockedUntil: null }, error: null } : { data: { status: 'done' }, error: null }
    ));
  });

  const actions: ReadonlyArray<readonly [string, () => Promise<Response>]> = [
    ['deleting the family', () => deleteFamily(call('DELETE', '/api/family', { confirmation: 'DELETE FAMILY' }))],
    ['revoking a paired device', () => revokeDevice(call('DELETE', `/api/devices/${uuid}`), { params: Promise.resolve({ id: uuid }) })],
    ['showing a child pairing code', () => ensureCredential(call('POST', '/api/pairing/credentials', { childId: uuid }))],
    ['rotating a child pairing code', () => rotateCredential(call('POST', '/api/pairing/credentials/rotate', { childId: uuid }))],
    ['starting a payment', () => createPayment(call('POST', '/api/payment/create', { planId: 'monthly' }))],
    ['approving a task', () => runCommand(call('POST', '/api/domain/commands', { type: 'reviewHabit', logId: uuid, decision: 'approve' }))],
    ['adjusting points by hand', () => runCommand(call('POST', '/api/domain/commands', { type: 'adjustPoints', childId: uuid, amount: 10, reason: 'Extra help', commandId: uuid }))],
    ['saving referral payout details', () => affiliateAction(call('POST', '/api/affiliate', { action: 'savePayout', bank: 'Vietcombank', accountNumber: '0123456789', accountName: 'Nguyen Van A' }))],
    ['requesting a referral payout', () => affiliateAction(call('POST', '/api/affiliate', { action: 'requestPayout' }))],
    ['approving a reward', () => runCommand(call('POST', '/api/domain/commands', { type: 'transitionRedemption', redemptionId: uuid, decision: 'approve' }))],
  ];

  it.each(actions)('refuses %s without the PIN', async (_label, act) => {
    const response = await act();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: 'parent_pin_required' });
    const mutations = rpc.mock.calls.filter(([name]) => name !== 'get_parent_pin_status');
    expect(mutations).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it('does not put the child\'s own taps behind the PIN', async () => {
    const response = await runCommand(call('POST', '/api/domain/commands', {
      type: 'completeHabit', activityId: uuid, childId: uuid, date: '2026-09-30', commandId: uuid,
    }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('complete_habit_command', expect.anything());
  });
});

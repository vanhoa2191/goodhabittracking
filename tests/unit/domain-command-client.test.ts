import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DomainCommandRequestError,
  requestChildDomainCommand,
  requestDomainCommand,
  type DomainCommandRequester,
} from '@/lib/store/domain-command-client';

describe('domain command client', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('posts a typed command and returns a parsed result', async () => {
    const requester: DomainCommandRequester = vi.fn(async () => new Response(JSON.stringify({
      success: true,
      result: { status: 'pending', redemptionId: '33333333-3333-4333-8333-333333333333' },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const command = {
      type: 'redeemReward',
      rewardId: '11111111-1111-4111-8111-111111111111',
      childId: '22222222-2222-4222-8222-222222222222',
      commandId: '33333333-3333-4333-8333-333333333333',
    } as const;

    const result = await requestDomainCommand(command, requester);

    expect(result.status).toBe('pending');
    expect(requester).toHaveBeenCalledWith('/api/domain/commands', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(command),
    });
  });

  it('rejects a server-declared command failure', async () => {
    const requester: DomainCommandRequester = async () => new Response(JSON.stringify({
      success: false,
      error: 'The change could not be saved.',
    }), { status: 409, headers: { 'content-type': 'application/json' } });

    await expect(requestDomainCommand({
      type: 'undoHabit',
      logId: '11111111-1111-4111-8111-111111111111',
    }, requester)).rejects.toMatchObject({
      name: 'DomainCommandRequestError',
      message: 'The change could not be saved.',
      status: 409,
    });
  });

  it('rejects malformed success payloads before store hydration', async () => {
    const requester: DomainCommandRequester = async () => new Response(JSON.stringify({
      success: true,
      result: { accepted: true },
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    const request = requestDomainCommand({
      type: 'reviewHabit',
      logId: '11111111-1111-4111-8111-111111111111',
      decision: 'approve',
    }, requester);

    await expect(request).rejects.toBeInstanceOf(DomainCommandRequestError);
  });

  it('returns the outcome of every log in a batch review', async () => {
    const first = '11111111-1111-4111-8111-111111111111';
    const second = '22222222-2222-4222-8222-222222222222';
    const requester: DomainCommandRequester = vi.fn(async () => new Response(JSON.stringify({
      success: true,
      result: {
        status: 'reviewed',
        results: [
          { logId: first, status: 'approved', pointsAwarded: 10 },
          { logId: second, status: 'already_reviewed' },
        ],
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const result = await requestDomainCommand({ type: 'reviewHabits', logIds: [first, second], decision: 'approve' }, requester);

    expect(result.status).toBe('reviewed');
    expect(result.results).toEqual([
      { logId: first, status: 'approved', pointsAwarded: 10 },
      { logId: second, status: 'already_reviewed' },
    ]);
  });

  it('posts a child command without accepting a caller-supplied child id', async () => {
    const requester: DomainCommandRequester = vi.fn(async () => new Response(JSON.stringify({
      success: true,
      result: { status: 'pending_approval', logId: '33333333-3333-4333-8333-333333333333' },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const command = {
      type: 'completeHabit',
      activityId: '11111111-1111-4111-8111-111111111111',
      date: '2026-09-21',
      commandId: '33333333-3333-4333-8333-333333333333',
    } as const;

    await expect(requestChildDomainCommand(command, requester)).resolves.toMatchObject({
      status: 'pending_approval',
    });
    expect(requester).toHaveBeenCalledWith('/api/child/commands', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(command),
    }));
  });
  it.each([
    { status: 409, body: { success: false, error: 'RPC refused' }, outcome: 'refused' },
    { status: 200, body: { success: true, result: { status: 'rejected' }, error: 'Contradictory refusal' }, outcome: 'unknown' },
    { status: 409, body: { success: false, error: 'RPC refused', result: { status: 'rejected' } }, outcome: 'unknown' },
    { status: 403, body: { success: false, error: 'Unlock required', code: 'parent_pin_required' }, outcome: 'refused' },
    { status: 403, body: { error: 'Parent PIN required.', code: 'parent_pin_required' }, outcome: 'refused' },
    { status: 403, body: { error: 'Set a parent PIN first.', code: 'parent_pin_not_set' }, outcome: 'refused' },
    { status: 403, body: { error: 'Parent PIN required.', code: 'parent_pin_required', result: { status: 'rejected' } }, outcome: 'unknown' },
    { status: 503, body: { success: false, error: 'Upstream unavailable' }, outcome: 'unknown' },
    { status: 503, body: { success: true, result: { status: 'rejected' } }, outcome: 'unknown' },
    { status: 409, body: { success: true, result: { status: 'rejected' } }, outcome: 'unknown' },
    { status: 200, body: { success: true, result: {} }, outcome: 'unknown' },
    { status: 200, body: null, outcome: 'unknown' },
    { status: 403, body: { error: 'Unlock required' }, outcome: 'unknown' },
  ])('classifies HTTP $status / $outcome from the validated envelope, not its message', async ({ status, body, outcome }) => {
    await expect(requestDomainCommand({ type: 'transitionRedemption', redemptionId: '11111111-1111-4111-8111-111111111111', decision: 'reject' },
      async () => Response.json(body, { status }))).rejects.toMatchObject({ status, outcome });
  });

  it('classifies an unreadable HTTP body as unknown', async () => {
    await expect(requestDomainCommand({ type: 'reviewHabits', logIds: ['11111111-1111-4111-8111-111111111111'], decision: 'approve' },
      async () => new Response('not JSON', { status: 503 }))).rejects.toMatchObject({ outcome: 'unknown' });
  });

  it.each([
    { status: 503, body: { success: false, error: 'Temporary failure' } },
    { status: 200, body: { success: true, result: { status: 'rejected' }, error: 'Contradictory refusal' } },
    { status: 409, body: { success: false, error: 'RPC refused', result: { status: 'rejected' } } },
    { status: 503, body: { success: true, result: { status: 'rejected' } } },
    { status: 200, body: { success: true, result: { status: 'future_unknown_status' } } },
  ])('reconciles the actual HTTP $status envelope through the parent redemption action', async ({ status, body }) => {
    const { createRewardActions } = await import('@/lib/store/reward-actions');
    const syncCloudFamily = vi.fn(async () => true);
    const setRedemptions = vi.fn();
    const setProfiles = vi.fn();
    const request = vi.fn<typeof fetch>(async () => Response.json(body, { status }));
    vi.stubGlobal('fetch', request);
    const actions = createRewardActions({
      activeChildId: null, currentUser: { id: '22222222-2222-4222-8222-222222222222', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2026-10-19T00:00:00.000Z' },
      familyId: '33333333-3333-4333-8333-333333333333', isFamilyConnected: false, isDemoSession: false,
      profiles: [], redemptions: [], rewards: [], setProfiles, setRedemptions, setRewards: vi.fn(),
      setCloudSyncActive: vi.fn(), refreshChildSession: vi.fn(async () => false), syncCloudFamily,
    });
    await expect(actions.rejectRedemption('11111111-1111-4111-8111-111111111111')).resolves.toEqual({ command: 'unknown', refresh: 'synced' });
    expect(request).toHaveBeenCalledOnce();
    expect(syncCloudFamily).toHaveBeenCalledOnce();
    expect(setProfiles).not.toHaveBeenCalled();
    expect(setRedemptions).not.toHaveBeenCalled();
  });

  it('treats a contradictory paired-child ACK as unknown instead of confirming a claim', async () => {
    await expect(requestChildDomainCommand({ type: 'redeemReward',
      rewardId: '11111111-1111-4111-8111-111111111111', commandId: '22222222-2222-4222-8222-222222222222' },
    async () => Response.json({ success: true, result: { status: 'pending' }, error: 'Contradictory refusal' })))
      .rejects.toMatchObject({ outcome: 'unknown' });
  });

});

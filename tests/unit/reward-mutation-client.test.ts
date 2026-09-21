import { describe, expect, it, vi } from 'vitest';
import {
  requestRewardMutation,
  RewardMutationRequestError,
  type RewardMutationRequester,
} from '@/lib/store/reward-mutation-client';

const reward = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Đi công viên',
  icon: '🌳',
  costPoints: 30,
  stock: -1,
  isActive: true,
  createdAt: '2026-09-20T00:00:00.000Z',
} as const;

describe('reward mutation client', () => {
  it('sends only the typed reward mutation and parses success', async () => {
    const requester = vi.fn<RewardMutationRequester>(async () => new Response(JSON.stringify({
      success: true,
      rewardId: reward.id,
    }), { status: 200 }));

    await expect(requestRewardMutation({ type: 'create', reward }, requester))
      .resolves.toEqual({ rewardId: reward.id });
    const body = requester.mock.calls[0]?.[1]?.body;
    expect(body).toEqual(expect.stringContaining(reward.id));
    expect(body).not.toEqual(expect.stringContaining('familyId'));
    expect(body).not.toEqual(expect.stringContaining('userId'));
  });

  it('rejects malformed success payloads', async () => {
    const requester = vi.fn<RewardMutationRequester>(
      async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
    );

    await expect(requestRewardMutation({
      type: 'delete', rewardId: reward.id,
    }, requester)).rejects.toBeInstanceOf(RewardMutationRequestError);
  });

  it('preserves expected server errors', async () => {
    const requester = vi.fn<RewardMutationRequester>(async () => new Response(JSON.stringify({
      success: false,
      error: 'The reward could not be saved.',
    }), { status: 409 }));

    await expect(requestRewardMutation({
      type: 'update', rewardId: reward.id, updates: { stock: 3 },
    }, requester)).rejects.toMatchObject({ status: 409 });
  });
});

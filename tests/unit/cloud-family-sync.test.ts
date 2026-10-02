import { describe, expect, it, vi } from 'vitest';
import { loadCloudFamilySnapshot } from '@/lib/store/cloud-family-sync';

const familyId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const groupId = '33333333-3333-4333-8333-333333333333';
const childId = '44444444-4444-4444-8444-444444444444';

describe('cloud family sync', () => {
  it('builds one typed snapshot and joins group memberships', async () => {
    const reader = vi.fn(async () => ({
      familyId,
      familyRole: 'caregiver' as const,
      profiles: [],
      activities: [],
      logs: [],
      rewards: [],
      redemptions: [],
      childBadges: [],
      kudos: [],
      groups: [{
        id: groupId,
        family_id: familyId,
        name: 'Nhóm tử tế',
        invite_code: 'KIND88',
        icon: '🤝',
        created_by_child_id: childId,
        weekly_target_points: 120,
        reward_type: 'custom',
        custom_reward_text: 'Picnic cuối tuần',
        created_at: '2026-09-20T00:00:00.000Z',
      }],
      groupMembers: [{ group_id: groupId, child_id: childId }],
      subscription: {
        plan: 'monthly',
        status: 'active',
        trial_ends_at: null,
        subscription_ends_at: '2027-09-20T00:00:00.000Z',
      },
    }));

    const snapshot = await loadCloudFamilySnapshot(userId, reader);

    expect(reader).toHaveBeenCalledWith(userId);
    expect(snapshot).toMatchObject({
      familyId,
      familyRole: 'caregiver',
      subscriptionPlan: 'monthly',
      trialEndsAt: null,
      subscriptionEndsAt: '2027-09-20T00:00:00.000Z',
      groups: [{
        id: groupId,
        familyId,
        memberChildIds: [childId],
        customRewardText: 'Picnic cuối tuần',
      }],
    });
  });

  it('reads kudos as the table stores them and names the sender from the profiles', async () => {
    const reader = vi.fn(async () => ({
      familyId,
      familyRole: 'owner' as const,
      profiles: [{
        id: childId, family_id: familyId, name: 'Bin', show_real_name_on_leaderboard: false,
        is_public_on_leaderboard: false, avatar: 'mascot:leo', theme_color: 'indigo', points: 0, total_earned: 0,
        level: 1, streak: 0, created_at: '2026-09-20T00:00:00.000Z',
      }],
      activities: [], logs: [], rewards: [], redemptions: [], childBadges: [],
      kudos: [{
        id: groupId, family_id: familyId, from_child_id: childId, to_child_id: childId,
        emoji: '👏', sent_at: '2026-09-21T00:00:00.000Z',
      }],
      groups: [], groupMembers: [], subscription: null,
    }));

    await expect(loadCloudFamilySnapshot(userId, reader)).resolves.toMatchObject({
      kudos: [{ fromChildId: childId, fromChildName: 'Bin', emoji: '👏' }],
    });
  });

  it('defaults a missing subscription to the free plan', async () => {
    const reader = vi.fn(async () => ({
      familyId,
      familyRole: 'owner' as const,
      profiles: [], activities: [], logs: [], rewards: [], redemptions: [],
      childBadges: [], kudos: [], groups: [], groupMembers: [], subscription: null,
    }));

    await expect(loadCloudFamilySnapshot(userId, reader)).resolves.toMatchObject({
      subscriptionPlan: 'free',
      trialEndsAt: null,
      subscriptionEndsAt: null,
    });
  });

  it.each(['cancelled', 'inactive'])('grants nothing for a %s subscription, whatever plan it still names', async (status) => {
    const reader = vi.fn(async () => ({
      familyId,
      familyRole: 'owner' as const,
      profiles: [], activities: [], logs: [], rewards: [], redemptions: [],
      childBadges: [], kudos: [], groups: [], groupMembers: [],
      subscription: {
        plan: 'yearly',
        status,
        trial_ends_at: null,
        subscription_ends_at: '2027-09-20T00:00:00.000Z',
      },
    }));

    await expect(loadCloudFamilySnapshot(userId, reader)).resolves.toMatchObject({
      subscriptionPlan: 'free',
      trialEndsAt: null,
      subscriptionEndsAt: null,
    });
  });

  it('rejects malformed cloud rows before state hydration', async () => {
    const reader = vi.fn(async () => ({
      familyId,
      familyRole: 'owner' as const,
      profiles: [], activities: [], logs: [], rewards: [], redemptions: [],
      childBadges: [], kudos: [],
      groups: [{ id: 'not-a-uuid' }],
      groupMembers: [],
      subscription: null,
    }));

    await expect(loadCloudFamilySnapshot(userId, reader)).rejects.toThrow();
  });
});

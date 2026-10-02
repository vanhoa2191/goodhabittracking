import { describe, expect, it } from 'vitest';
import { profileMutationSchema } from '@/lib/domain/profile-mutations';

const update = (updates: unknown) => profileMutationSchema.safeParse({
  type: 'update',
  profileId: '11111111-1111-4111-8111-111111111111',
  updates,
});

describe('profile mutation age band override', () => {
  it('accepts a band, off, or null to follow the age again', () => {
    for (const value of ['young', 'tween', 'teen', 'off', null]) {
      expect(update({ ageBandOverride: value }).success).toBe(true);
    }
  });

  it('rejects any other value', () => {
    expect(update({ ageBandOverride: 'toddler' }).success).toBe(false);
    expect(update({ ageBandOverride: 3 }).success).toBe(false);
  });

  it('does not let a new profile carry it', () => {
    const created = profileMutationSchema.safeParse({
      type: 'create',
      profile: {
        id: '11111111-1111-4111-8111-111111111111', name: 'An', avatar: 'mascot:leo', themeColor: '#F59E0B',
        points: 0, totalEarned: 0, level: 1, streak: 0, createdAt: '2026-10-02T00:00:00.000Z', ageBandOverride: 'teen',
      },
      starterActivities: [],
    });
    expect(created.success).toBe(false);
  });
});

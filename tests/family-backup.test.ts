import { describe, expect, it } from 'vitest';
import { parseFamilyBackup, serializeFamilyBackup } from '@/lib/family-backup';

const emptyBackup = {
  pin: '1234',
  storageMode: 'local' as const,
  activeChildId: null,
  parentProfile: null,
  subscriptionPlan: 'free' as const,
  trialEndsAt: null,
  subscriptionEndsAt: null,
  profiles: [],
  activities: [],
  logs: [],
  rewards: [],
  redemptions: [],
  childBadges: [],
  groups: [],
  kudos: [],
};

describe('family backup contract', () => {
  it('round-trips a versioned backup', () => {
    const parsed = parseFamilyBackup(serializeFamilyBackup(emptyBackup));
    expect(parsed).toMatchObject({ version: 2, pin: '1234', storageMode: 'local' });
    expect(parsed?.exportedAt).toEqual(expect.any(String));
  });

  it('rejects malformed content without partially accepting it', () => {
    expect(parseFamilyBackup('{not-json')).toBeNull();
    expect(parseFamilyBackup(JSON.stringify({ version: 2, profiles: [] }))).toBeNull();
    expect(parseFamilyBackup(JSON.stringify({ ...emptyBackup, version: 2, pin: '12ab' }))).toBeNull();
  });
});

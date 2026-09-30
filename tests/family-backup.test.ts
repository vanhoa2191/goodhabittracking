import { describe, expect, it } from 'vitest';
import { parseFamilyBackup, serializeFamilyBackup } from '@/lib/family-backup';
import { emptyExperienceState } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';

const familyId = '11111111-1111-4111-8111-111111111111';
const otherFamilyId = '22222222-2222-4222-8222-222222222222';
const childId = '33333333-3333-4333-8333-333333333333';
const activityId = '44444444-4444-4444-8444-444444444444';
const logId = '55555555-5555-4555-8555-555555555555';

const experience: ExperienceState = {
  ...emptyExperienceState,
  wishlists: [{
    family_id: familyId,
    child_id: childId,
    reward_id: '66666666-6666-4666-8666-666666666666',
    chosen_at: '2026-09-25T09:00:00+07:00',
  }],
  deferredTasks: [{
    family_id: familyId,
    child_id: childId,
    activity_id: activityId,
    local_date: '2026-09-25',
    deferred_at: '2026-09-25T09:00:00+07:00',
  }],
  journalEntries: [{
    family_id: familyId,
    child_id: childId,
    local_date: '2026-09-25',
    entry_text: 'Hôm nay con tự đánh răng.',
    created_at: '2026-09-25T20:00:00+07:00',
    updated_at: '2026-09-25T20:00:00+07:00',
  }],
  cuePlans: [{
    family_id: familyId,
    child_id: childId,
    activity_id: activityId,
    cue_kind: 'event',
    cue_text: 'Sau khi ăn tối',
    cue_time: null,
    place_text: null,
    weekend_variant_text: null,
    created_at: '2026-09-25T09:00:00+07:00',
    updated_at: '2026-09-25T09:00:00+07:00',
  }],
  supportObservations: [{
    log_id: logId,
    family_id: familyId,
    child_id: childId,
    activity_id: activityId,
    support_level: 'prompted',
    recorded_by: 'parent',
    recorded_at: '2026-09-25T21:00:00+07:00',
  }],
};

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

  it('round-trips the experience rows of a family', () => {
    const parsed = parseFamilyBackup(serializeFamilyBackup({ ...emptyBackup, experience }));
    expect(parsed?.experience).toEqual(experience);
  });

  it('still reads an older backup that has no experience rows', () => {
    const older = JSON.parse(serializeFamilyBackup(emptyBackup)) as Record<string, unknown>;
    expect('experience' in older).toBe(false);
    const parsed = parseFamilyBackup(JSON.stringify({ ...older, version: 1 }));
    expect(parsed).not.toBeNull();
    expect(parsed?.experience).toBeUndefined();
  });

  it('reads a backup whose experience predates the newest row kinds', () => {
    const older = Object.fromEntries(Object.entries(experience).filter(([key]) => (
      !['supportObservations', 'cuePlans', 'deferredTasks'].includes(key)
    )));
    const parsed = parseFamilyBackup(JSON.stringify({ ...emptyBackup, version: 2, experience: older }));
    expect(parsed?.experience?.journalEntries).toEqual(experience.journalEntries);
    expect(parsed?.experience?.cuePlans).toEqual([]);
    expect(parsed?.experience?.supportObservations).toEqual([]);
  });

  it.each([
    ['not an object', 'oops'],
    ['a malformed row', { ...experience, journalEntries: [{ ...experience.journalEntries[0], child_id: 'child-1' }] }],
    ['rows of two families', {
      ...experience,
      wishlists: [{ ...experience.wishlists[0], family_id: otherFamilyId }],
    }],
  ])('keeps the rest of the backup when experience is %s', (_name, badExperience) => {
    const parsed = parseFamilyBackup(JSON.stringify({ ...emptyBackup, version: 2, experience: badExperience }));
    expect(parsed).toMatchObject({ version: 2, pin: '1234' });
    expect(parsed?.experience).toBeUndefined();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { exportFamilyData, importFamilyData } from '@/lib/store/family-backup-actions';
import { emptyExperienceState } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';

const sourceFamilyId = '11111111-1111-4111-8111-111111111111';
const targetFamilyId = '99999999-9999-4999-8999-999999999999';
const childId = '33333333-3333-4333-8333-333333333333';
const experience: ExperienceState = {
  ...emptyExperienceState,
  journalEntries: [{
    family_id: sourceFamilyId,
    child_id: childId,
    local_date: '2026-09-25',
    entry_text: 'Hôm nay con tự đánh răng.',
    created_at: '2026-09-25T20:00:00+07:00',
    updated_at: '2026-09-25T20:00:00+07:00',
  }],
  supportObservations: [{
    log_id: '55555555-5555-4555-8555-555555555555',
    family_id: sourceFamilyId,
    child_id: childId,
    activity_id: '44444444-4444-4444-8444-444444444444',
    support_level: 'together',
    recorded_by: 'child',
    recorded_at: '2026-09-25T21:00:00+07:00',
  }],
};

const validBackup = {
  version: 2,
  profiles: [{
    id: 'child-1',
    name: 'Bé An',
    avatar: '🦁',
    themeColor: '#f97316',
    createdAt: '2026-09-01T00:00:00.000Z',
  }],
  activities: [],
  logs: [],
  rewards: [],
  redemptions: [],
  childBadges: [],
  groups: [],
  kudos: [],
};

const emptyFamily = {
  profiles: [], activities: [], logs: [], rewards: [], redemptions: [], childBadges: [], groups: [], kudos: [],
};

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe('family backup store actions', () => {
  it('does not mutate state when imported JSON is invalid', () => {
    const apply = vi.fn();

    const imported = importFamilyData('{not-json', apply, createStorage(), createStorage());

    expect(imported).toBe(false);
    expect(apply).not.toHaveBeenCalled();
  });

  it('normalizes an unavailable active child and switches to a real local session', () => {
    const apply = vi.fn();
    const localStorage = createStorage();
    const sessionStorage = createStorage();
    sessionStorage.setItem('kidhabit_demo_session', 'true');
    sessionStorage.setItem('kidhabit_demo_state', JSON.stringify(validBackup));

    const imported = importFamilyData(
      JSON.stringify({ ...validBackup, activeChildId: 'missing-child' }),
      apply,
      localStorage,
      sessionStorage,
    );

    expect(imported).toBe(true);
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ activeChildId: 'child-1' }));
    expect(sessionStorage.getItem('kidhabit_demo_session')).toBeNull();
    expect(sessionStorage.getItem('kidhabit_demo_state')).toBeNull();
    expect(localStorage.getItem('kidhabit_local_family_session')).toBe('true');
  });

  it('exports the experience rows next to the family data', () => {
    const json = exportFamilyData({ ...emptyFamily, experience });
    expect(JSON.parse(json).experience).toEqual(experience);
  });

  it('restores experience rows into the family of this device', () => {
    const apply = vi.fn();
    const localStorage = createStorage();
    localStorage.setItem('kidhabit_family_id', targetFamilyId);

    const imported = importFamilyData(
      exportFamilyData({ ...emptyFamily, experience }),
      apply,
      localStorage,
      createStorage(),
    );

    expect(imported).toBe(true);
    const restored = apply.mock.calls[0][0].experience as ExperienceState;
    expect(restored.journalEntries).toEqual([{ ...experience.journalEntries[0], family_id: targetFamilyId }]);
    expect(restored.supportObservations).toEqual([{ ...experience.supportObservations[0], family_id: targetFamilyId }]);
    expect(JSON.parse(localStorage.getItem('kidhabit_experience') ?? '{}')).toEqual(restored);
  });

  it('replaces the experience of the device when an older backup has none', () => {
    const apply = vi.fn();
    const localStorage = createStorage();
    localStorage.setItem('kidhabit_family_id', targetFamilyId);
    localStorage.setItem('kidhabit_experience', JSON.stringify(experience));

    expect(importFamilyData(JSON.stringify(validBackup), apply, localStorage, createStorage())).toBe(true);

    expect(apply.mock.calls[0][0].experience).toEqual(emptyExperienceState);
    expect(JSON.parse(localStorage.getItem('kidhabit_experience') ?? '{}')).toEqual(emptyExperienceState);
  });

  it('imports the family data even when the experience part cannot be used', () => {
    const apply = vi.fn();
    const localStorage = createStorage();
    localStorage.setItem('kidhabit_family_id', targetFamilyId);

    const imported = importFamilyData(
      JSON.stringify({ ...validBackup, experience: { journalEntries: 'broken' } }),
      apply,
      localStorage,
      createStorage(),
    );

    expect(imported).toBe(true);
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ experience: emptyExperienceState }));
  });
});

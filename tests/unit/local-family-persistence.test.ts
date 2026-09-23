import { describe, expect, it } from 'vitest';
import {
  clearFamilyScopedStorage,
  loadLocalExperience,
  loadLocalFamilyState,
  persistLocalFamilyState,
  saveLocalExperience,
} from '@/lib/store/local-family-persistence';
import { emptyExperienceState } from '@/lib/experience-state';

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe('local family persistence', () => {
  it('persists the complete local family state under stable keys', () => {
    const storage = createStorage();

    persistLocalFamilyState(storage, {
      pin: '4321',
      storageMode: 'local',
      activeChildId: 'child-1',
      profiles: [],
      activities: [],
      logs: [],
      rewards: [],
      redemptions: [],
      childBadges: [],
      groups: [],
      kudos: [],
    });

    expect(storage.getItem('kidhabit_pin')).toBe('4321');
    expect(storage.getItem('kidhabit_storage_mode')).toBe('local');
    expect(storage.getItem('kidhabit_activeChildId')).toBe('child-1');
    expect(storage.getItem('kidhabit_profiles')).toBe('[]');
    expect(storage.getItem('kidhabit_kudos')).toBe('[]');
  });

  it('clears family-scoped data without deleting device preferences', () => {
    const storage = createStorage();
    storage.setItem('kidhabit_profiles', '[{"id":"child-1"}]');
    storage.setItem('kidhabit_family_id', 'family-1');
    storage.setItem('kidhabit_language', 'en');
    storage.setItem('kidhabit_storage_mode', 'local');
    storage.setItem('kidhabit_experience', '{}');

    clearFamilyScopedStorage(storage);

    expect(storage.getItem('kidhabit_profiles')).toBeNull();
    expect(storage.getItem('kidhabit_family_id')).toBeNull();
    expect(storage.getItem('kidhabit_language')).toBe('en');
    expect(storage.getItem('kidhabit_storage_mode')).toBe('local');
    expect(storage.getItem('kidhabit_experience')).toBeNull();
  });

  it('hydrates missing experience data and keeps local data family-scoped', () => {
    const storage = createStorage();
    const familyA = '11111111-1111-4111-8111-111111111111';
    const familyB = '22222222-2222-4222-8222-222222222222';
    expect(loadLocalExperience(storage, familyA)).toEqual(emptyExperienceState);
    saveLocalExperience(storage, {
      ...emptyExperienceState,
      settings: { family_id: familyA, paused_at: null, pause_reason: null },
    });
    expect(loadLocalExperience(storage, familyA).settings?.family_id).toBe(familyA);
    expect(loadLocalExperience(storage, familyB)).toEqual(emptyExperienceState);
  });

  it('identifies demo hydration without reading family data', () => {
    const localStorage = createStorage();
    const sessionStorage = createStorage();
    sessionStorage.setItem('kidhabit_demo_session', 'true');

    const state = loadLocalFamilyState(localStorage, sessionStorage, () => 'generated-family');

    expect(state).toEqual({ kind: 'demo' });
    expect(localStorage.getItem('kidhabit_family_id')).toBeNull();
  });

  it('restores valid keys when a neighboring JSON collection is malformed', () => {
    const localStorage = createStorage();
    const sessionStorage = createStorage();
    localStorage.setItem('kidhabit_pin', '4321');
    localStorage.setItem('kidhabit_storage_mode', 'local');
    localStorage.setItem('kidhabit_logs', '{bad-json');
    localStorage.setItem('kidhabit_rewards', JSON.stringify([{
      id: 'reward-1',
      title: 'Đi công viên',
      icon: '🌳',
      costPoints: 30,
      stock: 1,
      isActive: true,
      createdAt: '2026-09-20T00:00:00.000Z',
    }]));

    const state = loadLocalFamilyState(localStorage, sessionStorage, () => 'generated-family');

    expect(state).toMatchObject({
      kind: 'family',
      pin: '4321',
      storageMode: 'local',
      familyId: 'generated-family',
      logs: [],
      rewards: [{ id: 'reward-1', title: 'Đi công viên' }],
    });
    expect(localStorage.getItem('kidhabit_family_id')).toBe('generated-family');
  });
});

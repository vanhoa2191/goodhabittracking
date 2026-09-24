import { describe, expect, it } from 'vitest';
import {
  clearDemoFamilyState,
  clearFamilyScopedStorage,
  loadLocalExperience,
  loadLocalFamilyState,
  persistLocalFamilyState,
  persistDemoFamilyState,
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
      settings: { family_id: familyA, paused_at: null, pause_reason: null, pause_periods: [] },
      wishlists: [{
        family_id: familyA,
        child_id: '33333333-3333-4333-8333-333333333333',
        reward_id: '44444444-4444-4444-8444-444444444444',
        chosen_at: '2026-09-23T12:00:00.000Z',
      }],
    });
    expect(loadLocalExperience(storage, familyA).settings?.family_id).toBe(familyA);
    expect(loadLocalExperience(storage, familyA).wishlists[0]?.reward_id).toBe('44444444-4444-4444-8444-444444444444');
    expect(loadLocalExperience(storage, familyB)).toEqual(emptyExperienceState);
  });

  it('restores a paused demo family from tab storage', () => {
    const storage = createStorage();
    const demoFamilyId = '00000000-0000-4000-8000-000000000000';
    saveLocalExperience(storage, {
      ...emptyExperienceState,
      settings: { family_id: demoFamilyId, paused_at: '2026-09-24T10:00:00.000Z', pause_reason: null, pause_periods: [] },
    });

    expect(loadLocalExperience(storage, demoFamilyId).settings?.paused_at).toBe('2026-09-24T10:00:00.000Z');
  });

  it('accepts demo child identities only for demo hydration', () => {
    const storage = createStorage();
    const demoFamilyId = '00000000-0000-4000-8000-000000000000';
    saveLocalExperience(storage, {
      ...emptyExperienceState,
      settings: { family_id: demoFamilyId, paused_at: '2026-09-24T10:00:00.000Z', pause_reason: null, pause_periods: [] },
      letters: [{ family_id: demoFamilyId, child_id: 'child-1', local_date: '2026-09-24', template_key: 'leo_1', read_at: null }],
    });

    expect(loadLocalExperience(storage, demoFamilyId)).toEqual(emptyExperienceState);
    expect(loadLocalExperience(storage, demoFamilyId, true).settings?.paused_at).toBe('2026-09-24T10:00:00.000Z');
  });

  it('identifies demo hydration without reading family data', () => {
    const localStorage = createStorage();
    const sessionStorage = createStorage();
    sessionStorage.setItem('kidhabit_demo_session', 'true');

    const state = loadLocalFamilyState(localStorage, sessionStorage, () => 'generated-family');

    expect(state).toEqual({ kind: 'demo' });
    expect(localStorage.getItem('kidhabit_family_id')).toBeNull();
  });

  it('restores a demo assignment from tab storage without reading a real family', () => {
    const localStorage = createStorage();
    const sessionStorage = createStorage();
    localStorage.setItem('kidhabit_activities', 'not-demo-data');
    sessionStorage.setItem('kidhabit_demo_session', 'true');
    sessionStorage.setItem('kidhabit_demo_state', JSON.stringify({
      version: 2,
      activeChildId: 'child-1',
      profiles: [],
      activities: [{
        id: 'activity-1', title: 'Drink water', icon: '💧', category: 'nutrition',
        timeOfDay: 'anytime', createdAt: '2026-09-24T00:00:00.000Z',
      }],
      logs: [], rewards: [], redemptions: [], childBadges: [], groups: [], kudos: [],
    }));

    const state = loadLocalFamilyState(localStorage, sessionStorage, () => 'generated-family');

    expect(state).toMatchObject({ kind: 'demo', snapshot: { activities: [{ id: 'activity-1' }] } });
    expect(localStorage.getItem('kidhabit_family_id')).toBeNull();
  });

  it('keeps demo changes separate and clears them when leaving the demo', () => {
    const localStorage = createStorage();
    const sessionStorage = createStorage();
    sessionStorage.setItem('kidhabit_demo_session', 'true');
    localStorage.setItem('kidhabit_activities', 'real-family-data');
    persistDemoFamilyState(sessionStorage, {
      pin: '1234', activeChildId: null, profiles: [], activities: [], logs: [],
      rewards: [], redemptions: [], childBadges: [], groups: [], kudos: [],
    });
    saveLocalExperience(sessionStorage, emptyExperienceState);

    expect(loadLocalFamilyState(localStorage, sessionStorage, () => 'family').kind).toBe('demo');
    expect(localStorage.getItem('kidhabit_activities')).toBe('real-family-data');

    clearDemoFamilyState(sessionStorage);
    expect(sessionStorage.getItem('kidhabit_demo_state')).toBeNull();
    expect(sessionStorage.getItem('kidhabit_experience')).toBeNull();
    expect(localStorage.getItem('kidhabit_activities')).toBe('real-family-data');
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

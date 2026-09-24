import { describe, expect, it, vi } from 'vitest';
import { importFamilyData } from '@/lib/store/family-backup-actions';

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
});

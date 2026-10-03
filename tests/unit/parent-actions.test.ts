import { describe, expect, it } from 'vitest';
import {
  appBadgeCount,
  groupPendingByChild,
  selectAllPending,
  selectParentActions,
  toggleSelection,
} from '@/lib/parent-actions';

describe('selectParentActions', () => {
  it('lists only what is waiting, tasks first', () => {
    expect(selectParentActions({ pendingTasks: 3, pendingRewards: 0, suggestions: 2 })).toEqual([
      { kind: 'review-tasks', count: 3 },
      { kind: 'suggestions', count: 2 },
    ]);
  });

  it('is empty when nothing waits', () => {
    expect(selectParentActions({ pendingTasks: 0, pendingRewards: 0, suggestions: 0 })).toEqual([]);
  });
});

describe('appBadgeCount', () => {
  it('counts decisions but not suggestions, and never goes below zero', () => {
    expect(appBadgeCount({ pendingTasks: 2, pendingRewards: 1 })).toBe(3);
    expect(appBadgeCount({ pendingTasks: -4, pendingRewards: 0 })).toBe(0);
  });
});

describe('groupPendingByChild', () => {
  const profiles = [
    { id: 'a', name: 'An', nickname: '' },
    { id: 'b', name: 'Bình', nickname: 'Bin' },
    { id: 'c', name: 'Chi', nickname: '' },
  ];

  it('counts per child in listed order, prefers the nickname and drops children with nothing waiting', () => {
    const logs = [{ id: '1', childId: 'b' }, { id: '2', childId: 'a' }, { id: '3', childId: 'b' }];
    expect(groupPendingByChild(logs, profiles)).toEqual([
      { childId: 'a', childName: 'An', count: 1 },
      { childId: 'b', childName: 'Bin', count: 2 },
    ]);
  });
});

describe('selection helpers', () => {
  it('toggles one id without changing the original set', () => {
    const start = new Set(['a']);
    expect([...toggleSelection(start, 'b')].sort()).toEqual(['a', 'b']);
    expect([...toggleSelection(start, 'a')]).toEqual([]);
    expect([...start]).toEqual(['a']);
  });

  it('does not tick more than the limit one by one', () => {
    expect([...toggleSelection(new Set(['a', 'b']), 'c', 2)].sort()).toEqual(['a', 'b']);
    expect([...toggleSelection(new Set(['a', 'b']), 'a', 2)]).toEqual(['b']);
  });

  it('selects at most the limit', () => {
    expect([...selectAllPending(['a', 'b', 'c'], 2)]).toEqual(['a', 'b']);
  });
});

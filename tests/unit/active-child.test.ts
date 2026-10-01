import { describe, expect, it } from 'vitest';
import { resolveActiveChildId } from '@/lib/store/active-child';

const profiles = [{ id: 'a' }, { id: 'b' }];

describe('resolveActiveChildId', () => {
  it('keeps the selected child while that child exists', () => {
    expect(resolveActiveChildId(profiles, 'b')).toBe('b');
  });

  it('falls back to the first child when nothing is selected, so the tap saves for the child on screen', () => {
    expect(resolveActiveChildId(profiles, null)).toBe('a');
  });

  it('falls back when the selected child is gone', () => {
    expect(resolveActiveChildId(profiles, 'removed')).toBe('a');
  });

  it('is empty only when there are no children at all', () => {
    expect(resolveActiveChildId([], null)).toBeNull();
    expect(resolveActiveChildId([], 'a')).toBeNull();
  });
});

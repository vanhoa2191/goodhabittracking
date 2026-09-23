import { describe, expect, it } from 'vitest';
import { getMascotChangeAvailableAt } from '@/lib/mascot-selection';

describe('mascot change window', () => {
  it('allows a first selection when no timestamp exists', () => {
    expect(getMascotChangeAvailableAt(null, new Date('2026-09-23T10:00:00.000Z'))).toBeNull();
  });

  it('returns the next change time during the seven-day window', () => {
    expect(getMascotChangeAvailableAt(
      '2026-09-20T10:00:00.000Z',
      new Date('2026-09-23T10:00:00.000Z'),
    )?.toISOString()).toBe('2026-09-27T10:00:00.000Z');
  });

  it('allows a change at the exact seven-day boundary', () => {
    expect(getMascotChangeAvailableAt(
      '2026-09-20T10:00:00.000Z',
      new Date('2026-09-27T10:00:00.000Z'),
    )).toBeNull();
  });
});

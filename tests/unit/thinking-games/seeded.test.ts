import { describe, expect, it, vi } from 'vitest';

import {
  createSeededRandom,
  hashSeed,
  pickOne,
  shuffleDeterministic,
  stableSeedKey,
} from '@/lib/thinking-games';
import { generateRuleSequencePuzzle } from '@/lib/thinking-games';

describe('seeded utilities', () => {
  it('is stable for the same seed and changes with a different seed', () => {
    const first = createSeededRandom('same');
    const second = createSeededRandom('same');
    const other = createSeededRandom('other');
    const firstValues = Array.from({ length: 8 }, () => first());
    expect(Array.from({ length: 8 }, () => second())).toEqual(firstValues);
    expect(Array.from({ length: 8 }, () => other())).not.toEqual(firstValues);
  });

  it('hashes without ambiguity between adjacent parts', () => {
    expect(stableSeedKey(['ab', 'c'])).not.toBe(stableSeedKey(['a', 'bc']));
    expect(hashSeed('seed')).toBe(hashSeed('seed'));
    expect(hashSeed('seed')).not.toBe(hashSeed('seep'));
  });

  it('shuffles deterministically and picks from a non-empty list', () => {
    const values = ['a', 'b', 'c', 'd'];
    const first = shuffleDeterministic(createSeededRandom('x'), values);
    const second = shuffleDeterministic(createSeededRandom('x'), values);
    expect(first).toEqual(second);
    expect([...first].sort()).toEqual([...values].sort());
    expect(values).toEqual(['a', 'b', 'c', 'd']);
    expect(pickOne(createSeededRandom('x'), ['only'])).toBe('only');
  });

  it('does not consult the clock or unseeded randomness', () => {
    const now = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('clock used');
    });
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('unseeded random used');
    });
    expect(() => generateRuleSequencePuzzle({ seed: 'stable', ageTrack: 'age_6_8', variant: 'lặp một thuộc tính' })).not.toThrow();
    now.mockRestore();
    random.mockRestore();
  });
});

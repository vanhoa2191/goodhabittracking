import { describe, expect, it } from 'vitest';

import {
  assertFingerprint,
  fingerprintsEqual,
  parseManifest,
  puzzleFingerprint,
  stableStringify,
} from '@/lib/thinking-games';
import type { MemorySequenceBoard, PathBoard, RuleSequenceBoard } from '@/lib/thinking-games';
import { loadPilot } from './helpers';

describe('fingerprint', () => {
  it('ignores option order and skin-like labels that do not change structure', () => {
    const first: RuleSequenceBoard = {
      kind: 'rule-sequence',
      sequence: ['lá', 'hoa', 'lá', 'hoa'],
      options: ['lá', 'hoa', 'quả'],
      ruleKind: 'alternating',
    };
    const reordered: RuleSequenceBoard = { ...first, options: ['quả', 'lá', 'hoa'] };
    expect(puzzleFingerprint('g01-t1', first)).toBe(puzzleFingerprint('g01-t1', reordered));
    expect(puzzleFingerprint('g01-t1', first)).not.toBe(puzzleFingerprint('g01-t1', {
      ...first,
      sequence: ['hoa', 'lá', 'hoa', 'lá'],
    }));
  });

  it('normalizes path rotation/reflection but not a structural wall change', () => {
    const board: PathBoard = {
      kind: 'path-planning',
      width: 5,
      height: 5,
      start: { x: 0, y: 0 },
      goal: { x: 4, y: 4 },
      walls: [{ x: 2, y: 2 }],
      waypoints: [{ id: 'w1', x: 1, y: 3 }],
    };
    const rotated: PathBoard = {
      ...board,
      start: { x: 4, y: 0 },
      goal: { x: 0, y: 4 },
      walls: [{ x: 2, y: 2 }],
      waypoints: [{ id: 'w1', x: 1, y: 1 }],
    };
    expect(puzzleFingerprint('g06-t1', board)).toBe(puzzleFingerprint('g06-t1', rotated));
    expect(puzzleFingerprint('g06-t1', board)).not.toBe(puzzleFingerprint('g06-t1', {
      ...board,
      walls: [{ x: 2, y: 1 }],
    }));
  });

  it('does not normalize memory sequence order', () => {
    const board: MemorySequenceBoard = {
      kind: 'memory-sequence',
      sequence: ['a', 'b', 'c'],
      options: ['a', 'b', 'c'],
      displayMs: 1200,
    };
    const optionsReordered: MemorySequenceBoard = { ...board, options: ['c', 'a', 'b'] };
    const sequenceReordered: MemorySequenceBoard = { ...board, sequence: ['b', 'a', 'c'] };
    expect(puzzleFingerprint('g03-t1', board)).toBe(puzzleFingerprint('g03-t1', optionsReordered));
    expect(puzzleFingerprint('g03-t1', board)).not.toBe(puzzleFingerprint('g03-t1', sequenceReordered));
  });

  it('matches every pilot item and uses stable stringification', () => {
    const pilot = parseManifest(loadPilot());
    for (const item of pilot.items) expect(() => assertFingerprint(item)).not.toThrow();
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
    expect(fingerprintsEqual('a', 'a')).toBe(true);
    expect(fingerprintsEqual('a', 'b')).toBe(false);
  });
});

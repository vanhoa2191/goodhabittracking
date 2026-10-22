import { describe, expect, it } from 'vitest';

import {
  assertNoAnswerLeak,
  parseManifest,
  parsePuzzleItem,
  puzzleItemSchema,
  toGradingData,
  toPublicPuzzle,
} from '@/lib/thinking-games';
import type { PuzzleItem } from '@/lib/thinking-games';
import { loadPilot } from './helpers';

const pilot = parseManifest(loadPilot());
const first = pilot.items[0] as PuzzleItem;

function clone(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

describe('puzzle schema', () => {
  it('parses every pilot item strictly', () => {
    for (const item of pilot.items) expect(parsePuzzleItem(item)).toEqual(item);
  });

  it('rejects extra keys, bad day bounds, bad hint counts and approved items without editorial review', () => {
    const extra = clone(first);
    extra.answer = 'leak';
    expect(puzzleItemSchema.safeParse(extra).success).toBe(false);

    const dayZero = clone(first);
    dayZero.dayIndex = 0;
    expect(puzzleItemSchema.safeParse(dayZero).success).toBe(false);

    const threeHints = clone(first);
    threeHints.hints = ['a', 'b', 'c'];
    expect(puzzleItemSchema.safeParse(threeHints).success).toBe(false);

    const approved = clone(first);
    approved.status = 'approved';
    approved.editorial = null;
    expect(puzzleItemSchema.safeParse(approved).success).toBe(false);
  });

  it('rejects a hint that contains the full answer', () => {
    const leak = clone(first);
    leak.hints = [`Đáp án là ${String(leak.solution)}`, 'Thử lại nhé.'];
    expect(puzzleItemSchema.safeParse(leak).success).toBe(false);
    expect(() => assertNoAnswerLeak(leak as unknown as PuzzleItem)).toThrow();
  });

  it('separates the public payload from grading data', () => {
    const publicPuzzle = toPublicPuzzle(first);
    expect(publicPuzzle).not.toHaveProperty('solution');
    expect(publicPuzzle).not.toHaveProperty('explanation');
    expect(publicPuzzle).not.toHaveProperty('editorial');
    expect(publicPuzzle).not.toHaveProperty('source');
    expect(publicPuzzle).not.toHaveProperty('validSolutionPredicate');
    expect(toGradingData(first)).toMatchObject({
      solution: first.solution,
      explanation: first.explanation,
      validSolutionPredicate: first.validSolutionPredicate,
    });
  });
});

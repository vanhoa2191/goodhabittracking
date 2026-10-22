import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  REMAINING_MECHANICS,
  checkAnswer,
  parsePuzzleItem,
  solvePuzzle,
  toPublicPuzzle,
  validatePuzzle,
} from '@/lib/thinking-games';
import type { AgeTrack, PuzzleItem } from '@/lib/thinking-games';

const fixture = JSON.parse(readFileSync(join(process.cwd(), 'content', 'thinking-games', 'p06-fixtures', 'p06-fixtures-v1.json'), 'utf8')) as {
  fixtureVersion: string;
  status: string;
  humanApproved: boolean;
  ageTracks: readonly AgeTrack[];
  typeIds: number;
  variantsPerType: number;
  items: readonly PuzzleItem[];
};

describe('P06 internal fixtures', () => {
  it('covers all 21 mechanics, both tracks and all four variants without claiming approval', () => {
    expect(fixture.fixtureVersion).toBe('p06-fixtures-v1');
    expect(fixture.status).toBe('internal_test_only');
    expect(fixture.humanApproved).toBe(false);
    expect(fixture.ageTracks).toEqual(['age_6_8', 'age_9_12']);
    expect(fixture.typeIds).toBe(21);
    expect(fixture.variantsPerType).toBe(4);
    expect(fixture.items).toHaveLength(168);
    expect(new Set(fixture.items.map((item) => item.gameTypeId))).toEqual(new Set(REMAINING_MECHANICS.map((mechanic) => mechanic.gameTypeId)));
    expect(new Set(fixture.items.map((item) => item.id)).size).toBe(168);
    expect(new Set(fixture.items.map((item) => item.fingerprint)).size).toBe(168);
    for (const mechanic of REMAINING_MECHANICS) {
      for (const ageTrack of fixture.ageTracks) {
        expect(fixture.items.filter((item) => item.gameTypeId === mechanic.gameTypeId && item.ageTrack === ageTrack)).toHaveLength(4);
      }
    }
  });

  it('keeps every fixture solvable, internally consistent and free of public answer leakage', () => {
    for (const raw of fixture.items) {
      const item = parsePuzzleItem(raw) as PuzzleItem;
      expect(item.status).toBe('design_only');
      expect(item.editorial).toBeNull();
      expect(validatePuzzle(item)).toEqual({ ok: true });
      const solved = solvePuzzle(item);
      expect(solved.ok).toBe(true);
      expect(checkAnswer(item, item.solution)).toEqual({ ok: true, correct: true });
      expect(toPublicPuzzle(item)).not.toHaveProperty('solution');
    }
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  AVAILABLE_GAME_TYPE_IDS,
  GAME_AGE_TRACKS,
  GAME_MECHANICS,
  checkAnswer,
  parsePuzzleItem,
  solvePuzzle,
  toPublicPuzzle,
  validatePuzzle,
} from '@/lib/thinking-games';
import type { GameAgeTrack, PuzzleItem } from '@/lib/thinking-games';

const fixture = JSON.parse(readFileSync(join(process.cwd(), 'content', 'thinking-games', 'p06-fixtures', 'p06-fixtures-v2.json'), 'utf8')) as {
  fixtureVersion: string;
  status: string;
  humanApproved: boolean;
  ageTracks: readonly GameAgeTrack[];
  typeIds: number;
  variantsPerType: number;
  items: readonly PuzzleItem[];
};

describe('P06 four-track internal fixtures', () => {
  it('covers all 24 available mechanics, four tracks and all four variants without claiming approval', () => {
    expect(fixture.fixtureVersion).toBe('p06-fixtures-v2');
    expect(fixture.status).toBe('internal_test_only');
    expect(fixture.humanApproved).toBe(false);
    expect(fixture.ageTracks).toEqual([...GAME_AGE_TRACKS]);
    expect(fixture.typeIds).toBe(24);
    expect(fixture.variantsPerType).toBe(4);
    expect(fixture.items).toHaveLength(384);
    expect(new Set(fixture.items.map((item) => item.gameTypeId))).toEqual(new Set(AVAILABLE_GAME_TYPE_IDS));
    expect(new Set(fixture.items.map((item) => item.id)).size).toBe(384);
    for (const mechanic of GAME_MECHANICS.filter((entry) => entry.available)) {
      for (const ageTrack of fixture.ageTracks) {
        const matching = fixture.items.filter((item) => item.gameTypeId === mechanic.gameTypeId && item.ageTrack === ageTrack);
        expect(matching).toHaveLength(4);
        expect(new Set(matching.map((item) => item.fingerprint)).size).toBe(4);
      }
    }
  });

  it('keeps every fixture solvable, internally consistent and free of public answer leakage', { timeout: 10000 }, () => {
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

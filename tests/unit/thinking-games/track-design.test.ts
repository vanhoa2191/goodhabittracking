import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  GAME_AGE_TRACKS,
  TITLE_NAMES,
  TRACK_HINTS,
  describeMemorySequenceBoard,
  describePathBoard,
  describeRuleSequenceBoard,
  difficultyScore,
  generateMemorySequencePuzzle,
  generatePathPuzzle,
  generateRuleSequencePuzzle,
  getGameMechanic,
  getTrackHints,
  getVariedTitle,
  themeOfTitle,
  REMAINING_MECHANICS,
} from '@/lib/thinking-games';
import type { BoardData, GameAgeTrack, GameTypeId, PuzzleItem } from '@/lib/thinking-games';

import * as v2Check from '../../../scripts/check-thinking-games-candidates-v2.mjs';

const TYPE_IDS = Object.keys(TRACK_HINTS) as GameTypeId[];
const SEEDS = Array.from({ length: 40 }, (_, index) => `design-seed-${index}`);

function generate(gameTypeId: GameTypeId, ageTrack: GameAgeTrack, seed: string, variant: string) {
  if (gameTypeId === 'g01-t1') {
    const board = generateRuleSequencePuzzle({ seed, ageTrack, variant });
    return { board: board as BoardData, hints: describeRuleSequenceBoard(board, { ageTrack, seed }).hints };
  }
  if (gameTypeId === 'g03-t1') {
    const board = generateMemorySequencePuzzle({ seed, ageTrack, variant });
    return { board: board as BoardData, hints: describeMemorySequenceBoard(board, { ageTrack, seed }).hints };
  }
  if (gameTypeId === 'g06-t1') {
    const board = generatePathPuzzle({ seed, ageTrack, variant });
    return { board: board as BoardData, hints: describePathBoard(board, { ageTrack, seed }).hints };
  }
  const generated = REMAINING_MECHANICS.find((entry) => entry.gameTypeId === gameTypeId)!.generate({ seed, ageTrack, variant });
  return { board: generated.board, hints: generated.hints };
}

describe('track-specific hints', () => {
  it('covers all 24 game types for both tiers', () => {
    expect(TYPE_IDS).toHaveLength(24);
    for (const id of TYPE_IDS) {
      expect(Object.keys(TRACK_HINTS[id].young).sort()).toEqual(Object.keys(TRACK_HINTS[id].older).sort());
    }
  });

  it('never shares a hint text between the younger and the older tier', () => {
    for (const id of TYPE_IDS) {
      const young = new Set(Object.values(TRACK_HINTS[id].young).flat().flat());
      for (const text of Object.values(TRACK_HINTS[id].older).flat().flat()) {
        expect(young.has(text), `${id}: "${text}"`).toBe(false);
      }
    }
  });

  it('keeps younger hints short and every hint inside the 180 character limit', () => {
    for (const id of TYPE_IDS) {
      for (const [tier, modes] of Object.entries(TRACK_HINTS[id])) {
        for (const pair of Object.values(modes).flat()) {
          expect(pair[0].length).toBeLessThanOrEqual(120);
          for (const text of pair) {
            expect(text.length).toBeLessThanOrEqual(tier === 'young' ? 100 : 180);
            expect(text).not.toMatch(/\d/);
          }
        }
      }
    }
  });

  it('is deterministic and fills board placeholders', () => {
    const first = getTrackHints('g05-t3', 'age_9_12', 'seed-a', 'any', { target: 7, max: 3 });
    expect(getTrackHints('g05-t3', 'age_9_12', 'seed-a', 'any', { target: 7, max: 3 })).toEqual(first);
    expect(first.join(' ')).toContain('7');
    expect(first.join(' ')).not.toMatch(/[{}]/);
  });

  it('gives 6-8 and 9-12 different hints for every game type, variant and seed', { timeout: 60000 }, () => {
    for (const id of TYPE_IDS) {
      const variants = getGameMechanic(id)!.variants;
      for (const variant of variants) {
        for (const seed of SEEDS.slice(0, 6)) {
          const young = generate(id, 'age_6_8', seed, variant).hints;
          const older = generate(id, 'age_9_12', seed, variant).hints;
          expect(young[0], `${id} ${variant}`).not.toBe(older[0]);
          expect(young[1], `${id} ${variant}`).not.toBe(older[1]);
        }
      }
    }
  });

  it('does not reveal the answer in hint 1', { timeout: 60000 }, () => {
    for (const id of TYPE_IDS) {
      const mechanic = REMAINING_MECHANICS.find((entry) => entry.gameTypeId === id);
      for (const variant of getGameMechanic(id)!.variants) {
        for (const ageTrack of ['age_6_8', 'age_9_12'] as const) {
          const { board, hints } = generate(id, ageTrack, 'leak-seed', variant);
          const solution = mechanic ? mechanic.solve(board) : null;
          if (typeof solution === 'string') {
            expect(hints[0].toLocaleLowerCase('vi')).not.toContain(solution.toLocaleLowerCase('vi'));
          }
        }
      }
    }
  });

  it('keeps the original mechanics backwards compatible without a hint context', () => {
    const board = generateRuleSequencePuzzle({ seed: 's', ageTrack: 'age_6_8', variant: 'tăng đều' });
    expect(describeRuleSequenceBoard(board).hints[0]).toBe('Nhìn xem mỗi số tăng thêm bao nhiêu.');
  });
});

describe('varied titles', () => {
  it('has unique names per game type and no cross-type collisions', () => {
    const all = Object.values(TITLE_NAMES).flat().map((name) => name.text);
    expect(new Set(all).size).toBe(all.length);
    for (const names of Object.values(TITLE_NAMES)) expect(names.length).toBeGreaterThanOrEqual(8);
  });

  it('is deterministic and honours the avoid list', () => {
    const input = { gameTypeId: 'g02-t1' as const, theme: 'Vườn hoa', ageTrack: 'age_6_8' as const, slotId: 'D010-main' };
    const first = getVariedTitle(input);
    expect(getVariedTitle(input)).toBe(first);
    expect(first).toContain('Vườn hoa');
    expect(getVariedTitle({ ...input, avoid: new Set([first]) })).not.toBe(first);
  });

  it('extracts the chapter name from a legacy title', () => {
    expect(themeOfTitle('Hạt giống · Ghép bóng')).toBe('Hạt giống');
  });

  it('uses several title shapes and keeps titles clean child copy', { timeout: 60000 }, () => {
    const titles = new Set<string>();
    for (let day = 1; day <= 60; day += 1) {
      for (const gameTypeId of TYPE_IDS) {
        titles.add(getVariedTitle({ gameTypeId, theme: 'Bãi cát', ageTrack: 'age_9_12', slotId: `D${String(day).padStart(3, '0')}-main` }));
      }
    }
    const delimiters = new Set([...titles].map((title) => (title.includes(' · ') ? '·' : title.includes(': ') ? ':' : '—')));
    expect(delimiters.size).toBe(3);
    for (const title of titles) {
      expect(title.length).toBeLessThanOrEqual(120);
      expect(title).not.toMatch(/\d|-/);
    }
  });
});

describe('difficulty gap between 6-8 and 9-12', () => {
  it('scores 9-12 strictly above 6-8 for every game type and variant (same seed)', { timeout: 60000 }, () => {
    for (const id of TYPE_IDS) {
      let harder = 0;
      let total = 0;
      let young = 0;
      let older = 0;
      for (const variant of getGameMechanic(id)!.variants) {
        for (const seed of SEEDS) {
          const a = difficultyScore(generate(id, 'age_6_8', seed, variant).board);
          const b = difficultyScore(generate(id, 'age_9_12', seed, variant).board);
          total += 1;
          young += a;
          older += b;
          if (b > a) harder += 1;
        }
      }
      expect(harder / total, id).toBeGreaterThanOrEqual(0.95);
      expect(older / total, id).toBeGreaterThanOrEqual((young / total) * v2Check.DIFFICULTY_MIN_TYPE_RATIO);
    }
  });

  it('keeps the track ladder 3-5 <= 6-8 < 9-12 <= 13+ on average', { timeout: 60000 }, () => {
    for (const id of TYPE_IDS) {
      const averages = GAME_AGE_TRACKS.map((track) => {
        let sum = 0;
        let count = 0;
        for (const variant of getGameMechanic(id)!.variants) {
          for (const seed of SEEDS.slice(0, 10)) {
            sum += difficultyScore(generate(id, track, seed, variant).board);
            count += 1;
          }
        }
        return sum / count;
      });
      expect(averages[0], id).toBeLessThanOrEqual(averages[1]!);
      expect(averages[1], id).toBeLessThan(averages[2]!);
      expect(averages[2], id).toBeLessThanOrEqual(averages[3]!);
    }
  });
});

describe('audit rules for tracks', () => {
  const base = {
    gameTypeId: 'g02-t1',
    dayIndex: 1,
    slotType: 'main',
    boardData: { kind: 'x' },
    hints: ['Gợi ý một', 'Gợi ý hai'],
    title: 'A',
  };
  const item = (overrides: Record<string, unknown>) => ({ ...base, id: `i-${Math.random()}`, ageTrack: 'age_6_8', ...overrides }) as unknown as PuzzleItem;

  it('fails identical hints across tracks for the same (day, slot)', () => {
    const errors = v2Check.crossTrackHintErrors([
      item({ ageTrack: 'age_6_8' }),
      item({ ageTrack: 'age_9_12', hints: ['Khác hẳn', 'Gợi ý hai'] }),
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('hints_identical_across_tracks');
    expect(v2Check.crossTrackHintErrors([
      item({ ageTrack: 'age_6_8' }),
      item({ ageTrack: 'age_9_12', hints: ['Khác', 'Cũng khác'] }),
      item({ ageTrack: 'age_9_12', dayIndex: 2, hints: base.hints }),
    ])).toEqual([]);
  });

  it('fails a title repeated on consecutive days or twice on one day within a track', () => {
    const errors = v2Check.titleRepeatErrors([
      item({ dayIndex: 1, title: 'Cùng tên' }),
      item({ dayIndex: 2, title: 'Cùng tên' }),
      item({ dayIndex: 3, title: 'Khác' }),
      item({ dayIndex: 3, slotType: 'bonus', title: 'Khác' }),
      item({ ageTrack: 'age_9_12', dayIndex: 2, title: 'Cùng tên' }),
    ]);
    expect(errors.map((error: { code: string }) => error.code).sort()).toEqual(['title_repeated_consecutive_days', 'title_repeated_same_day']);
    expect(v2Check.titleRepeatErrors([
      item({ dayIndex: 1, title: 'A' }),
      item({ dayIndex: 2, title: 'B' }),
      item({ dayIndex: 3, title: 'A' }),
    ])).toEqual([]);
  });

  it('fails when more than 5% of the pairs are not harder, or a type is not clearly harder', () => {
    const engine = { difficultyScore: (board: { score: number }) => board.score };
    const pairs = (count: number, notHarder: number, older = 12, young = 10) => Array.from({ length: count }, (_, index) => [
      item({ dayIndex: index + 1, boardData: { score: young } }),
      item({ dayIndex: index + 1, ageTrack: 'age_9_12', boardData: { score: index < notHarder ? young : older } }),
    ]).flat();
    expect(v2Check.difficultyGapErrors(pairs(100, 5), engine as never).filter((error: { code: string }) => error.code === 'difficulty_gap')).toEqual([]);
    expect(v2Check.difficultyGapErrors(pairs(100, 6), engine as never).some((error: { code: string }) => error.code === 'difficulty_gap')).toBe(true);
    expect(v2Check.difficultyGapErrors(pairs(100, 0, 10.5), engine as never).some((error: { code: string }) => error.code === 'difficulty_gap_type')).toBe(true);
    expect(v2Check.difficultyGapErrors(pairs(100, 0), engine as never)).toEqual([]);
  });
});

describe('regenerated V2 candidates', () => {
  const manifest = JSON.parse(readFileSync(new URL('../../../content/thinking-games/candidates/365-v2/candidate-manifest-v2.json', import.meta.url), 'utf8')) as { items: PuzzleItem[] };

  it('has no identical hints across tracks, no repeated titles and unique titles per track', () => {
    expect(v2Check.crossTrackHintErrors(manifest.items)).toEqual([]);
    expect(v2Check.titleRepeatErrors(manifest.items)).toEqual([]);
    const items = manifest.items.filter((entry) => entry.ageTrack === 'age_6_8' || entry.ageTrack === 'age_9_12');
    expect(items).toHaveLength(1460);
    expect(manifest.items.every((entry) => entry.status === 'design_only')).toBe(true);
    for (const track of GAME_AGE_TRACKS) {
      const titles = manifest.items.filter((entry) => entry.ageTrack === track).map((entry) => entry.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });
});

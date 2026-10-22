import { describe, expect, it } from 'vitest';

import {
  AVAILABLE_GAME_TYPE_IDS,
  REMAINING_MECHANICS,
  assertNoAnswerLeak,
  checkPath,
  generateMemorySequencePuzzle,
  generatePathPuzzle,
  generateRuleSequencePuzzle,
  getGameMechanic,
  puzzleFingerprint,
  puzzleItemSchema,
  solvePath,
} from '@/lib/thinking-games';
import type { GameAgeTrack, PathBoard, PuzzleItem } from '@/lib/thinking-games';

describe('Defect 1: Seed diversity for static generators (g06-t2, g07-t1, g07-t3, g08-t2)', () => {
  const staticTypes = ['g06-t2', 'g07-t1', 'g07-t3', 'g08-t2'] as const;
  const tracks: GameAgeTrack[] = ['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus'];

  it.each(staticTypes)('generates diverse boards across 8 different seeds for %s', (typeId) => {
    const mechanic = getGameMechanic(typeId);
    expect(mechanic).toBeDefined();
    const impl = REMAINING_MECHANICS.find((m) => m.gameTypeId === typeId);
    expect(impl).toBeDefined();
    for (const variant of mechanic!.variants) {
      for (const track of tracks) {
        const fingerprints = new Set<string>();
        for (let i = 1; i <= 8; i += 1) {
          const puzzle = impl!.generate({
            ageTrack: track,
            variant,
            seed: `seed-eval-${i}`,
          });
          const fp = puzzleFingerprint(typeId, puzzle.board);
          fingerprints.add(fp);
        }
        // At least 3 distinct canonical fingerprints across 8 seeds
        expect(
          fingerprints.size,
          `Expected meaningful diversity across 8 seeds for ${typeId}:${variant} on ${track}, got ${fingerprints.size}`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe('Defect 2: solvePath must return simple paths without cell revisits, satisfying checkPath', () => {
  it('does not return a path with cell revisits on a board with waypoints in a dead end', () => {
    // 3x3 board where start is (0,0), goal is (2,2)
    // Waypoint at (0,2). If a path goes (0,0) -> (0,1) -> (0,2), to exit it must revisit (0,1).
    // If walls force exiting via (0,1), no SIMPLE path can reach goal via (0,2).
    const deadEndBoard: PathBoard = {
      kind: 'path-planning',
      width: 3,
      height: 3,
      start: { x: 0, y: 0 },
      goal: { x: 2, y: 2 },
      walls: [
        { x: 1, y: 2 }, // wall to right of (0,2)
      ],
      waypoints: [{ id: 'w1', x: 0, y: 2 }],
      waypointOrder: 'any',
    };

    const solution = solvePath(deadEndBoard);
    if (solution !== null) {
      // Must satisfy checkPath
      expect(checkPath(deadEndBoard, solution)).toBe(true);

      // Must have NO duplicate cells
      const cells = solution.map((p) => `${p.x},${p.y}`);
      expect(new Set(cells).size).toBe(cells.length);
    }
  });

  it('satisfies checkPath on every solvable board and never revisits cells', () => {
    // A corridor board where start is (0,0), waypoint at (2,0), goal at (0,1)
    // with walls blocking (1,1) and (2,1).
    // A simple path cannot go to (2,0) and then backtrack to (0,0) to reach (0,1).
    const corridorBoard: PathBoard = {
      kind: 'path-planning',
      width: 3,
      height: 2,
      start: { x: 0, y: 0 },
      goal: { x: 0, y: 1 },
      walls: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      waypoints: [{ id: 'w1', x: 2, y: 0 }],
      waypointOrder: 'any',
    };

    const solution = solvePath(corridorBoard);
    // There is no simple path that visits (2,0) and ends at (0,1) without revisiting (1,0) or (0,0).
    // Therefore solvePath MUST return null, because checkPath forbids revisits!
    expect(solution).toBeNull();
  });
});

describe('Defect 3: assertNoAnswerLeak Unicode-aware word boundary matching', () => {
  const dummyItem = (solution: unknown, hints: readonly [string, string]): PuzzleItem => ({
    schemaVersion: 1,
    contentVersion: 'v2',
    id: 'D001-main-vi68',
    dayIndex: 1,
    slotType: 'main',
    skillGroup: 'memory',
    gameTypeId: 'g03-t1',
    ruleVariantId: 'g03-t1:nhắc lại cùng chiều',
    ageTrack: 'age_6_8',
    locale: 'vi',
    title: 'Ghi nhớ',
    invitation: 'Nhớ các hình',
    tutorial: 'Làm theo hướng dẫn',
    boardData: {
      kind: 'memory-sequence',
      sequence: ['táo', 'mèo', 'cá'],
      options: ['táo', 'mèo', 'cá'],
      displayMs: 1500,
    },
    hints,
    explanation: 'Giải thích',
    solution,
    validSolutionPredicate: 'memory-sequence-v1',
    status: 'design_only',
    source: null,
    editorial: null,
    targetSeconds: 75,
    praiseKeys: {
      correct: 'thinking-games.praise.correct',
      retry: 'thinking-games.praise.tryAgain',
    },
    fingerprint: '0123456789abcdef',
  });

  it('does NOT falsely flag substring matches like "cá" inside "các"', () => {
    const item = dummyItem(['cá'], [
      'Hãy chú ý đến các hình xuất hiện trên màn hình.',
      'Thử nhớ lại thứ tự ban đầu.',
    ]);
    expect(() => assertNoAnswerLeak(item)).not.toThrow();
    expect(puzzleItemSchema.safeParse(item).success).toBe(true);
  });

  it('does NOT falsely flag numeric substring like "1" inside "12"', () => {
    const item = dummyItem('1', [
      'Bảng có 12 ô cần kiểm tra.',
      'Đếm từ trái sang phải.',
    ]);
    expect(() => assertNoAnswerLeak(item)).not.toThrow();
    expect(puzzleItemSchema.safeParse(item).success).toBe(true);
  });

  it('DOES catch genuine answer leak when whole word is present', () => {
    const item = dummyItem(['cá'], [
      'Chọn cá để hoàn thành.',
      'Thử nhớ lại thứ tự.',
    ]);
    expect(() => assertNoAnswerLeak(item)).toThrow(/hint leaks the full answer/);
    expect(puzzleItemSchema.safeParse(item).success).toBe(false);
  });

  it('DOES catch genuine numeric answer leak when standalone number is present', () => {
    const item = dummyItem('1', [
      'Đáp án là 1 nhé.',
      'Kiểm tra lại.',
    ]);
    expect(() => assertNoAnswerLeak(item)).toThrow(/hint leaks the full answer/);
    expect(puzzleItemSchema.safeParse(item).success).toBe(false);
  });
});

describe('Defect 4: Age complexity monotonicity across all 96 variant pairs', () => {
  function boardComplexity(value: unknown): number {
    if (Array.isArray(value)) return value.length + value.reduce((total: number, entry: unknown) => total + boardComplexity(entry), 0);
    if (value && typeof value === 'object') {
      let total = Object.keys(value).length;
      for (const entry of Object.values(value)) {
        if (typeof entry === 'number' && Number.isFinite(entry)) total += Math.min(Math.abs(entry), 12) * 0.05;
        else if (entry && typeof entry === 'object') total += boardComplexity(entry);
      }
      return total;
    }
    return 0;
  }

  function generateBoard(typeId: string, input: { seed: string; ageTrack: GameAgeTrack; variant: string }): unknown {
    if (typeId === 'g01-t1') return generateRuleSequencePuzzle(input);
    if (typeId === 'g03-t1') return generateMemorySequencePuzzle(input);
    if (typeId === 'g06-t1') return generatePathPuzzle(input);
    const m = REMAINING_MECHANICS.find((entry) => entry.gameTypeId === typeId);
    if (!m) throw new Error(`Missing mechanic: ${typeId}`);
    return m.generate(input).board;
  }

  it('guarantees average complexity is strictly monotonic across all 4 age tracks for all 96 variant pairs', { timeout: 30000 }, () => {
    const mechanics = AVAILABLE_GAME_TYPE_IDS.map((typeId) => getGameMechanic(typeId)!);
    const nonMonotonic: { typeId: string; variant: string; scores: Record<GameAgeTrack, number> }[] = [];
    const tracks: GameAgeTrack[] = ['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus'];
    const sampleSeeds = ['seed-alpha', 'seed-beta', 'seed-gamma'];

    for (const mechanic of mechanics) {
      for (const variant of mechanic.variants) {
        const scores: Record<GameAgeTrack, number> = {
          age_3_5: 0,
          age_6_8: 0,
          age_9_12: 0,
          age_13_plus: 0,
        };

        for (const track of tracks) {
          let sum = 0;
          for (const seed of sampleSeeds) {
            const board = generateBoard(mechanic.gameTypeId, { seed, ageTrack: track, variant });
            sum += boardComplexity(board);
          }
          scores[track] = Number((sum / sampleSeeds.length).toFixed(2));
        }

        const monotonic = scores.age_13_plus > scores.age_9_12
          && scores.age_9_12 > scores.age_6_8
          && scores.age_6_8 > scores.age_3_5;

        if (!monotonic) {
          nonMonotonic.push({ typeId: mechanic.gameTypeId, variant, scores });
        }
      }
    }

    expect(
      nonMonotonic,
      `Expected 0 non-monotonic variant pairs, but found ${nonMonotonic.length}: ${JSON.stringify(nonMonotonic, null, 2)}`,
    ).toEqual([]);
  });
});


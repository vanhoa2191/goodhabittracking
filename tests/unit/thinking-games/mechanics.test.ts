import { describe, expect, it } from 'vitest';

import {
  checkAnswer,
  checkMemorySequence,
  checkPath,
  checkRuleSequence,
  describeMemorySequenceBoard,
  describePathBoard,
  describeRuleSequenceBoard,
  GAME_AGE_TRACKS,
  generateMemorySequencePuzzle,
  generatePathPuzzle,
  generateRuleSequencePuzzle,
  getGameMechanic,
  parseManifest,
  solveMemorySequence,
  solvePath,
  solvePuzzle,
  solveRuleSequence,
  targetSecondsForAge,
  validatePuzzle,
} from '@/lib/thinking-games';
import type { GameAgeTrack, PathBoard, PuzzleItem } from '@/lib/thinking-games';
import { loadPilot } from './helpers';

const pilot = parseManifest(loadPilot());

describe('rule-sequence', () => {
  it('generates a unique, solvable sequence for both tracks', () => {
    for (const ageTrack of ['age_6_8', 'age_9_12'] as const) {
      for (let index = 0; index < 8; index += 1) {
        const board = generateRuleSequencePuzzle({
          seed: `rule-${ageTrack}-${index}`,
          ageTrack,
          variant: index % 2 === 0 ? 'lặp một thuộc tính' : 'tăng số phần tử',
        });
        const solution = solveRuleSequence(board);
        expect(solution).not.toBeNull();
        expect(board.options.filter((option) => option === solution)).toHaveLength(1);
        expect(checkRuleSequence(board, solution)).toBe(true);
        expect(checkRuleSequence(board, board.options.find((option) => option !== solution))).toBe(false);
      }
    }
  });

  it('supports the repeating-block rule without accepting a wrong next token', () => {
    const board = generateRuleSequencePuzzle({ seed: 'repeat-rule', ageTrack: 'age_6_8', variant: 'nhắc lại theo nhóm' });
    const solution = solveRuleSequence(board);
    expect(board.ruleKind).toBe('repeat');
    expect(solution).not.toBeNull();
    expect(checkRuleSequence(board, solution)).toBe(true);
    expect(checkRuleSequence(board, board.options.find((option) => option !== solution))).toBe(false);
  });
});

describe('path-planning', () => {
  const board: PathBoard = {
    kind: 'path-planning',
    width: 5,
    height: 5,
    start: { x: 0, y: 0 },
    goal: { x: 1, y: 1 },
    walls: [],
    waypoints: [],
  };

  it('accepts every valid path, not only the solver path', () => {
    expect(checkPath(board, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }])).toBe(true);
    expect(checkPath(board, [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }])).toBe(true);
    expect(solvePath(board)).not.toBeNull();
  });

  it('rejects teleports, walls, out-of-bounds, repeats and missing waypoints', () => {
    expect(checkPath(board, [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(false);
    expect(checkPath({ ...board, walls: [{ x: 1, y: 0 }] }, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }])).toBe(false);
    expect(checkPath(board, [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }])).toBe(false);
    expect(checkPath(board, [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 5, y: 1 }])).toBe(false);
    expect(checkPath({ ...board, waypoints: [{ id: 'w', x: 0, y: 1 }] }, [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ])).toBe(false);
  });

  it('generates structurally different boards for the two age tracks', () => {
    const young = generatePathPuzzle({ seed: 'path-young', ageTrack: 'age_6_8', variant: 'đến đích tránh chướng ngại' });
    const older = generatePathPuzzle({ seed: 'path-older', ageTrack: 'age_9_12', variant: 'đi qua một điểm bắt buộc' });
    expect([young.width, young.height]).toEqual([5, 5]);
    expect([older.width, older.height]).toEqual([7, 7]);
    expect(young.waypoints).toHaveLength(0);
    expect(older.waypoints).toHaveLength(1);
    expect(solvePath(young)).not.toBeNull();
    expect(solvePath(older)).not.toBeNull();
  });
});

describe('memory-sequence', () => {
  it('checks exact order and rejects missing, extra or reordered tokens', () => {
    const board = generateMemorySequencePuzzle({ seed: 'memory', ageTrack: 'age_9_12', variant: 'nhắc lại theo nhóm' });
    const solution = solveMemorySequence(board);
    expect(checkMemorySequence(board, solution)).toBe(true);
    expect(checkMemorySequence(board, [...solution].reverse())).toBe(false);
    expect(checkMemorySequence(board, solution.slice(0, -1))).toBe(false);
    expect(checkMemorySequence(board, [...solution, 'extra'])).toBe(false);
  });

  it('uses shorter sequences and fewer options for 6-8', () => {
    const young = generateMemorySequencePuzzle({ seed: 'memory-young', ageTrack: 'age_6_8', variant: 'nhắc lại cùng chiều' });
    const older = generateMemorySequencePuzzle({ seed: 'memory-older', ageTrack: 'age_9_12', variant: 'nhắc lại theo nhóm' });
    expect(young.sequence.length).toBeLessThanOrEqual(4);
    expect(older.sequence.length).toBe(5);
    expect(young.options).toHaveLength(young.sequence.length);
    expect(older.options.length).toBeGreaterThan(older.sequence.length);
  });
});

describe('checker dispatch', () => {
  it('validates every pilot item and accepts its solution', () => {
    for (const item of pilot.items) {
      expect(validatePuzzle(item)).toEqual({ ok: true });
      const result = checkAnswer(item, item.solution);
      expect(result).toEqual({ ok: true, correct: true });
      expect(solvePuzzle(item).ok).toBe(true);
    }
  });

  it('reports malformed answers separately from wrong answers', () => {
    const rule = pilot.items.find((item) => item.gameTypeId === 'g01-t1') as PuzzleItem;
    const memory = pilot.items.find((item) => item.gameTypeId === 'g03-t1') as PuzzleItem;
    const path = pilot.items.find((item) => item.gameTypeId === 'g06-t1') as PuzzleItem;
    expect(checkAnswer(rule, 4)).toEqual({ ok: false, code: 'invalid_answer' });
    expect(checkAnswer(memory, 'not-an-array')).toEqual({ ok: false, code: 'invalid_answer' });
    expect(checkAnswer(path, [{ x: 0 }])).toEqual({ ok: false, code: 'invalid_answer' });
    expect(checkAnswer(rule, 'wrong')).toEqual({ ok: true, correct: false });
  });

  it('returns format_unavailable for metadata-only mechanics', () => {
    const fake = { gameTypeId: 'g01-t2' } as unknown as PuzzleItem;
    expect(solvePuzzle(fake)).toEqual({ ok: false, code: 'format_unavailable' });
  });
});

describe('original mechanics across all tracks and variants', () => {
  const tracks: readonly GameAgeTrack[] = GAME_AGE_TRACKS;
  const cases = [
    {
      gameTypeId: 'g01-t1',
      generate: (input: { seed: string; ageTrack: GameAgeTrack; variant: string }) => generateRuleSequencePuzzle(input),
      solve: (board: unknown) => solveRuleSequence(board as Parameters<typeof solveRuleSequence>[0]),
      check: (board: unknown, answer: unknown) => checkRuleSequence(board as Parameters<typeof checkRuleSequence>[0], answer),
      describe: (board: unknown) => describeRuleSequenceBoard(board as Parameters<typeof describeRuleSequenceBoard>[0]),
    },
    {
      gameTypeId: 'g03-t1',
      generate: (input: { seed: string; ageTrack: GameAgeTrack; variant: string }) => generateMemorySequencePuzzle(input),
      solve: (board: unknown) => solveMemorySequence(board as Parameters<typeof solveMemorySequence>[0]),
      check: (board: unknown, answer: unknown) => checkMemorySequence(board as Parameters<typeof checkMemorySequence>[0], answer),
      describe: (board: unknown) => describeMemorySequenceBoard(board as Parameters<typeof describeMemorySequenceBoard>[0]),
    },
    {
      gameTypeId: 'g06-t1',
      generate: (input: { seed: string; ageTrack: GameAgeTrack; variant: string }) => generatePathPuzzle(input),
      solve: (board: unknown) => solvePath(board as Parameters<typeof solvePath>[0]),
      check: (board: unknown, answer: unknown) => checkPath(board as Parameters<typeof checkPath>[0], answer),
      describe: (board: unknown) => describePathBoard(board as Parameters<typeof describePathBoard>[0]),
    },
  ] as const;

  it('generates a solvable board and a rejected answer for every variant on every track', { timeout: 15000 }, () => {
    for (const entry of cases) {
      const variants = getGameMechanic(entry.gameTypeId)?.variants ?? [];
      expect(variants).toHaveLength(4);
      for (const ageTrack of tracks) {
        const fingerprints = new Set<string>();
        for (const variant of variants) {
          const board = entry.generate({ seed: `original-${entry.gameTypeId}-${ageTrack}`, ageTrack, variant });
          const solution = entry.solve(board);
          expect(solution, `${entry.gameTypeId} ${ageTrack} ${variant}`).not.toBeNull();
          expect(entry.check(board, solution), `${entry.gameTypeId} ${ageTrack} ${variant}`).toBe(true);
          expect(entry.check(board, []), `${entry.gameTypeId} ${ageTrack} ${variant} wrong`).toBe(false);
          const described = entry.describe(board);
          expect(described.hints).toHaveLength(2);
          expect(described.hints.every((hint) => hint.length > 0)).toBe(true);
          expect(described.explanation.length).toBeGreaterThan(0);
          expect(targetSecondsForAge(ageTrack)).toBeGreaterThanOrEqual(60);
          fingerprints.add(JSON.stringify(board));
        }
        expect(fingerprints.size, `${entry.gameTypeId} ${ageTrack}`).toBe(4);
      }
    }
  });

  it('maps each declared rule variant to its actual rule or board shape', () => {
    for (const ageTrack of tracks) {
      const alternating = generateRuleSequencePuzzle({ seed: `rule-alt-${ageTrack}`, ageTrack, variant: 'xen kẽ hai chuỗi' });
      expect(alternating.ruleKind).toBe('alternating');
      const increment = generateRuleSequencePuzzle({ seed: `rule-inc-${ageTrack}`, ageTrack, variant: 'tăng số phần tử' });
      expect(increment.ruleKind).toBe('increment');
      const repeat = generateRuleSequencePuzzle({ seed: `rule-rep-${ageTrack}`, ageTrack, variant: 'suy ngược phần đầu' });
      expect(repeat.ruleKind).toBe('repeat');
      expect(describeRuleSequenceBoard(repeat).hints.join(' ').toLocaleLowerCase('vi')).toContain('lặp');

      const memoryMissing = generateMemorySequencePuzzle({ seed: `mem-missing-${ageTrack}`, ageTrack, variant: 'chọn phần tử còn thiếu' });
      expect(memoryMissing.mode).toBe('missing');
      const memoryGrouped = generateMemorySequencePuzzle({ seed: `mem-group-${ageTrack}`, ageTrack, variant: 'nhắc lại theo nhóm' });
      expect(memoryGrouped.mode).toBe('grouped');
      const memorySwapped = generateMemorySequencePuzzle({ seed: `mem-swap-${ageTrack}`, ageTrack, variant: 'tìm cặp bị đổi thứ tự' });
      expect(memorySwapped.mode).toBe('swapped');

      const pathRequired = generatePathPuzzle({ seed: `path-required-${ageTrack}`, ageTrack, variant: 'đi qua một điểm bắt buộc' });
      expect(pathRequired.waypoints).toHaveLength(1);
      const pathKey = generatePathPuzzle({ seed: `path-key-${ageTrack}`, ageTrack, variant: 'lấy chìa trước khi tới cửa' });
      expect(pathKey.waypoints).toHaveLength(2);
      expect(pathKey.waypointOrder).toBe('ordered');
      const pathShortest = generatePathPuzzle({ seed: `path-short-${ageTrack}`, ageTrack, variant: 'chọn đường ít bước trong bàn nhỏ' });
      expect(pathShortest.shortestPathOnly).toBe(true);
    }
  });
});

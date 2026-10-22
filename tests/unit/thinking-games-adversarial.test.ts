import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  GAME_MECHANICS,
  IMPLEMENTED_GAME_TYPE_IDS,
  checkAnswer,
  checkPath,
  checkRuleSequence,
  memorySequenceBoardSchema,
  parseManifest,
  pathBoardSchema,
  puzzleFingerprint,
  puzzleItemSchema,
  resolveAssignment,
  resolveInternalPilotAssignment,
  ruleSequenceBoardSchema,
  solvePuzzle,
  solveRuleSequence,
  validateManifest,
  validatePuzzle,
} from '@/lib/thinking-games';
import type {
  MemorySequenceBoard,
  PathBoard,
  PuzzleItem,
  RuleSequenceBoard,
  ThinkingGamesManifest,
} from '@/lib/thinking-games';
import { loadPilot, loadRelease } from './thinking-games/helpers';

const pilot = parseManifest(loadPilot()) as ThinkingGamesManifest;
const pilotItems = pilot.items as readonly PuzzleItem[];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function request(overrides: Partial<Parameters<typeof resolveAssignment>[0]> = {}) {
  return {
    manifest: pilot,
    childId: 'kilo-child',
    dayIndex: 1,
    slotType: 'main' as const,
    ageTrack: 'age_6_8' as const,
    locale: 'vi' as const,
    contentVersion: 'pilot-2026-10-21',
    ...overrides,
  };
}

function ruleBoard(seed: string) {
  const board = {
    kind: 'rule-sequence' as const,
    sequence: [`${seed}1`, `${seed}2`, `${seed}1`, `${seed}2`],
    options: [`${seed}1`, `${seed}2`, `${seed}3`],
    ruleKind: 'alternating' as const,
  };
  return { board, fingerprint: puzzleFingerprint('g01-t1', board), solution: `${seed}1` };
}

/* ------------------------------------------------------------------ *
 * Independent reference implementations (deliberately not the engine's)
 * ------------------------------------------------------------------ */

function independentNextToken(board: RuleSequenceBoard): string | null {
  const { sequence, ruleKind, period } = board;
  if (ruleKind === 'alternating') {
    if (sequence.length < 4) return null;
    for (let i = 2; i < sequence.length; i += 1) {
      if (sequence[i] !== sequence[i - 2]) return null;
    }
    return sequence.length % 2 === 0 ? sequence[0] ?? null : sequence[1] ?? null;
  }
  if (ruleKind === 'repeat') {
    const block = period ?? 0;
    if (block < 2 || sequence.length < block) return null;
    for (let i = block; i < sequence.length; i += 1) {
      if (sequence[i] !== sequence[i - block]) return null;
    }
    return sequence[sequence.length % block] ?? null;
  }
  const values = sequence.map((token) => Number(token));
  if (values.some((value) => !Number.isFinite(value))) return null;
  const step = values[1]! - values[0]!;
  if (step <= 0) return null;
  for (let i = 2; i < values.length; i += 1) {
    if (values[i]! - values[i - 1]! !== step) return null;
  }
  return String(values[values.length - 1]! + step);
}

function independentPathValid(board: PathBoard, answer: unknown): boolean {
  if (!Array.isArray(answer) || answer.length < 2) return false;
  const points = answer as Array<{ x?: unknown; y?: unknown }>;
  const wallKeys = new Set(board.walls.map((wall) => `${wall.x},${wall.y}`));
  const seen = new Set<string>();
  let previous: { x: number; y: number } | null = null;
  for (const raw of points) {
    const x = raw.x;
    const y = raw.y;
    if (typeof x !== 'number' || typeof y !== 'number') return false;
    if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
    if (x < 0 || y < 0 || x >= board.width || y >= board.height) return false;
    const key = `${x},${y}`;
    if (wallKeys.has(key)) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    if (previous && Math.abs(previous.x - x) + Math.abs(previous.y - y) !== 1) return false;
    previous = { x, y };
  }
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (first.x !== board.start.x || first.y !== board.start.y) return false;
  if (last.x !== board.goal.x || last.y !== board.goal.y) return false;
  return board.waypoints.every((waypoint) => seen.has(`${waypoint.x},${waypoint.y}`));
}

function independentMemoryValid(board: MemorySequenceBoard, answer: unknown): boolean {
  if (!Array.isArray(answer) || answer.length !== board.sequence.length) return false;
  return answer.every((token, index) => token === board.sequence[index]);
}

function enumerateSimplePaths(
  board: PathBoard,
): Array<Array<{ x: number; y: number }>> {
  const results: Array<Array<{ x: number; y: number }>> = [];
  const wallKeys = new Set(board.walls.map((wall) => `${wall.x},${wall.y}`));
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  const walk = (path: Array<{ x: number; y: number }>, visited: Set<string>): void => {
    const last = path[path.length - 1]!;
    if (last.x === board.goal.x && last.y === board.goal.y) {
      results.push(path.map((point) => ({ ...point })));
      return;
    }
    for (const direction of directions) {
      const next = { x: last.x + direction.x, y: last.y + direction.y };
      if (next.x < 0 || next.y < 0 || next.x >= board.width || next.y >= board.height) continue;
      const key = `${next.x},${next.y}`;
      if (wallKeys.has(key) || visited.has(key)) continue;
      visited.add(key);
      path.push(next);
      walk(path, visited);
      path.pop();
      visited.delete(key);
    }
  };
  walk([{ ...board.start }], new Set([`${board.start.x},${board.start.y}`]));
  return results;
}

function dihedral(board: PathBoard, transform: number): PathBoard {
  const swaps = transform === 1 || transform === 3 || transform === 6 || transform === 7;
  const width = swaps ? board.height : board.width;
  const height = swaps ? board.width : board.height;
  const point = (step: { x: number; y: number }): { x: number; y: number } => {
    switch (transform) {
      case 1: return { x: board.height - 1 - step.y, y: step.x };
      case 2: return { x: board.width - 1 - step.x, y: board.height - 1 - step.y };
      case 3: return { x: step.y, y: board.width - 1 - step.x };
      case 4: return { x: board.width - 1 - step.x, y: step.y };
      case 5: return { x: step.x, y: board.height - 1 - step.y };
      case 6: return { x: step.y, y: step.x };
      case 7: return { x: board.height - 1 - step.y, y: board.width - 1 - step.x };
      default: return { x: step.x, y: step.y };
    }
  };
  return {
    kind: 'path-planning',
    width,
    height,
    start: point(board.start),
    goal: point(board.goal),
    walls: board.walls.map(point),
    waypoints: board.waypoints.map((waypoint) => ({ id: waypoint.id, ...point(waypoint) })),
  };
}

function manifestWithExtraCandidate(): ThinkingGamesManifest {
  const manifest = clone(pilot) as unknown as {
    items: Array<Record<string, unknown>>;
  };
  const extra = ruleBoard('kx');
  manifest.items.push({
    ...clone(manifest.items[0]!),
    id: 'D001-main-68x',
    boardData: extra.board,
    fingerprint: extra.fingerprint,
    solution: extra.solution,
  });
  return manifest as unknown as ThinkingGamesManifest;
}

describe('adversarial: assignment is deterministic and never rerolls', () => {
  it('returns the identical pin for repeated attempts of the same explicit internal pilot request', () => {
    const first = resolveInternalPilotAssignment(request());
    const second = resolveInternalPilotAssignment(request());
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.assignment.pin).toEqual(second.assignment.pin);
    expect(first.assignment.item.id).toBe(second.assignment.item.id);
    expect(first.assignment.seededOrder).toEqual(second.assignment.seededOrder);
  });

  it('ignores the order of manifest items when selecting a candidate from the internal profile', () => {
    const manifest = manifestWithExtraCandidate();
    const reversed: ThinkingGamesManifest = { ...manifest, items: [...manifest.items].reverse() };
    const forward = resolveInternalPilotAssignment(request({ manifest }));
    const backward = resolveInternalPilotAssignment(request({ manifest: reversed }));
    expect(forward.ok && backward.ok).toBe(true);
    if (!forward.ok || !backward.ok) return;
    expect(backward.assignment.item.id).toBe(forward.assignment.item.id);
    expect(backward.assignment.pin).toEqual(forward.assignment.pin);
    expect(backward.assignment.seededOrder).toEqual(forward.assignment.seededOrder);
  });

  it('exposes a seeded order that is a permutation of the matching internal pilot candidates', () => {
    const manifest = manifestWithExtraCandidate();
    const resolved = resolveInternalPilotAssignment(request({ manifest }));
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    const candidates = manifest.items
      .filter((item) => item.dayIndex === 1 && item.slotType === 'main' && item.ageTrack === 'age_6_8'
        && item.locale === 'vi' && item.contentVersion === 'pilot-2026-10-21')
      .map((item) => item.fingerprint);
    expect(candidates).toHaveLength(2);
    expect([...resolved.assignment.seededOrder].sort()).toEqual([...candidates].sort());
    expect(resolved.assignment.seededOrder).toContain(resolved.assignment.item.fingerprint);
  });

  it('separates days and slots and never leaks content across age tracks when the internal profile is used', () => {
    const base = resolveInternalPilotAssignment(request());
    const otherDay = resolveInternalPilotAssignment(request({ dayIndex: 2 }));
    const otherSlot = resolveInternalPilotAssignment(request({ slotType: 'bonus' }));
    expect(base.ok && otherDay.ok && otherSlot.ok).toBe(true);
    if (!base.ok || !otherDay.ok || !otherSlot.ok) return;
    const ids = new Set([
      base.assignment.item.id,
      otherDay.assignment.item.id,
      otherSlot.assignment.item.id,
    ]);
    expect(ids.size).toBe(3);

    const young = resolveInternalPilotAssignment(request({ ageTrack: 'age_6_8' }));
    const older = resolveInternalPilotAssignment(request({ ageTrack: 'age_9_12' }));
    expect(young.ok && older.ok).toBe(true);
    if (!young.ok || !older.ok) return;
    expect(young.assignment.item.ageTrack).toBe('age_6_8');
    expect(older.assignment.item.ageTrack).toBe('age_9_12');
    expect(young.assignment.item.id).not.toBe(older.assignment.item.id);
  });

  it('keeps a competing slot stable for a child across repeated explicit internal pilot attempts', () => {
    const manifest = manifestWithExtraCandidate();
    const first = resolveInternalPilotAssignment(request({ manifest, childId: 'stable-child' }));
    const second = resolveInternalPilotAssignment(request({ manifest, childId: 'stable-child' }));
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.assignment.pin).toEqual(first.assignment.pin);
    expect(first.assignment.item.id).toBe('D001-main-68');
  });

  it('pins the served internal pilot item and refuses a tampered pin', () => {
    const resolved = resolveInternalPilotAssignment(request());
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    const { pin, item } = resolved.assignment;
    expect(pin.itemId).toBe(item.id);
    expect(pin.fingerprint).toBe(item.fingerprint);
    expect(pin.contentVersion).toBe(item.contentVersion);
    expect(resolved.assignment.publicPuzzle).not.toHaveProperty('solution');
    expect(resolved.assignment.publicPuzzle).not.toHaveProperty('explanation');
  });

  it('answers unknown age, locale, day and content version with explicit errors', () => {
    expect(resolveAssignment(request({ ageTrack: 'age_3_5' as never })))
      .toEqual({ ok: false, code: 'age_track_unavailable' });
    expect(resolveAssignment(request({ locale: 'en' as never })))
      .toEqual({ ok: false, code: 'locale_unavailable' });
    expect(resolveAssignment(request({ dayIndex: 366 })))
      .toEqual({ ok: false, code: 'journey_complete' });
    expect(resolveAssignment(request({ dayIndex: 0 })))
      .toEqual({ ok: false, code: 'content_unavailable' });
    expect(resolveAssignment(request({ dayIndex: 8 })))
      .toEqual({ ok: false, code: 'content_unavailable' });
    expect(resolveAssignment(request({ contentVersion: 'other-version' })))
      .toEqual({ ok: false, code: 'content_unavailable' });
    expect(resolveInternalPilotAssignment(request({ ageTrack: 'age_13_plus' as never })))
      .toEqual({ ok: false, code: 'age_track_unavailable' });
  });

  it('keeps the 21 metadata-only mechanics explicitly unavailable', () => {
    const metadataOnly = GAME_MECHANICS.filter((mechanic) => !mechanic.implemented);
    expect(metadataOnly).toHaveLength(21);
    expect(IMPLEMENTED_GAME_TYPE_IDS).toHaveLength(3);
    for (const mechanic of metadataOnly) {
      const fake = { gameTypeId: mechanic.gameTypeId } as unknown as PuzzleItem;
      expect(solvePuzzle(fake)).toEqual({ ok: false, code: 'format_unavailable' });
    }
  });
});

describe('adversarial: schema rejects unsafe boards', () => {
  const pathBase = {
    kind: 'path-planning',
    width: 5,
    height: 5,
    start: { x: 0, y: 0 },
    goal: { x: 4, y: 4 },
    walls: [],
    waypoints: [],
  };

  it('rejects non-finite, fractional and out-of-range numbers', () => {
    expect(pathBoardSchema.safeParse({ ...pathBase, width: Number.NaN }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, width: Number.POSITIVE_INFINITY }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, start: { x: Number.NaN, y: 0 } }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, goal: { x: 4.5, y: 4 } }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, start: { x: -1, y: 0 } }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, goal: { x: 5, y: 4 } }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, height: 4 }).success).toBe(false);
  });

  it('rejects walls on start or goal, duplicate walls and blocked waypoints', () => {
    expect(pathBoardSchema.safeParse({ ...pathBase, walls: [{ x: 0, y: 0 }] }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, walls: [{ x: 4, y: 4 }] }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, walls: [{ x: 1, y: 1 }, { x: 1, y: 1 }] }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, walls: [{ x: 5, y: 0 }] }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, walls: [{ x: 1, y: 1 }], waypoints: [{ id: 'w', x: 1, y: 1 }] }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, waypoints: [{ id: 'w', x: 1, y: 1 }, { id: 'w', x: 2, y: 2 }] }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, waypoints: [{ id: 'w', x: 1, y: 1 }, { id: 'v', x: 1, y: 1 }] }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, waypoints: [{ id: 'w', x: 9, y: 9 }] }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, start: { x: 4, y: 4 } }).success).toBe(false);
  });

  it('rejects unknown keys and oversized lists', () => {
    expect(pathBoardSchema.safeParse({ ...pathBase, extra: 1 }).success).toBe(false);
    expect(pathBoardSchema.safeParse({
      ...pathBase,
      walls: Array.from({ length: 13 }, (_, index) => ({ x: index, y: 4 })),
    }).success).toBe(false);
    expect(pathBoardSchema.safeParse({
      ...pathBase,
      waypoints: [
        { id: 'a', x: 1, y: 1 },
        { id: 'b', x: 2, y: 1 },
        { id: 'c', x: 3, y: 1 },
        { id: 'd', x: 1, y: 2 },
      ],
    }).success).toBe(false);
    expect(pathBoardSchema.safeParse({ ...pathBase, kind: 'rule-sequence' }).success).toBe(false);
  });

  it('rejects malformed rule and memory boards', () => {
    const rule = {
      kind: 'rule-sequence',
      sequence: ['a', 'b', 'a', 'b'],
      options: ['a', 'b', 'c'],
      ruleKind: 'alternating',
    };
    expect(ruleSequenceBoardSchema.safeParse({ ...rule, options: ['a', 'a', 'b'] }).success).toBe(false);
    expect(ruleSequenceBoardSchema.safeParse({ ...rule, ruleKind: 'repeat' }).success).toBe(false);
    expect(ruleSequenceBoardSchema.safeParse({ ...rule, period: 2 }).success).toBe(false);
    expect(ruleSequenceBoardSchema.safeParse({ ...rule, sequence: ['a', 'b'] }).success).toBe(false);
    expect(ruleSequenceBoardSchema.safeParse({ ...rule, sequence: ['a', 'b', ''] }).success).toBe(false);
    expect(ruleSequenceBoardSchema.safeParse({ ...rule, ruleKind: 'increment' }).success).toBe(true);

    const memory = {
      kind: 'memory-sequence',
      sequence: ['a', 'b', 'c'],
      options: ['a', 'b', 'c'],
      displayMs: 1200,
    };
    expect(memorySequenceBoardSchema.safeParse({ ...memory, options: ['a', 'b'] }).success).toBe(false);
    expect(memorySequenceBoardSchema.safeParse({ ...memory, options: ['a', 'b', 'b'] }).success).toBe(false);
    expect(memorySequenceBoardSchema.safeParse({ ...memory, sequence: ['a', 'b', 'z'] }).success).toBe(false);
    expect(memorySequenceBoardSchema.safeParse({ ...memory, displayMs: 999 }).success).toBe(false);
    expect(memorySequenceBoardSchema.safeParse({ ...memory, displayMs: 2001 }).success).toBe(false);
  });

  it('rejects out-of-range item level fields', () => {
    const item = clone(pilotItems[0]!) as unknown as Record<string, unknown>;
    const mutate = (patch: Record<string, unknown>): boolean =>
      puzzleItemSchema.safeParse({ ...item, ...patch }).success;
    expect(mutate({ dayIndex: 0 })).toBe(false);
    expect(mutate({ dayIndex: 366 })).toBe(false);
    expect(mutate({ targetSeconds: 59 })).toBe(false);
    expect(mutate({ targetSeconds: 121 })).toBe(false);
    expect(mutate({ ageTrack: 'age_99' as never })).toBe(false);
    expect(mutate({ ageTrack: 'age_3_5' as never })).toBe(true);
    expect(mutate({ ageTrack: 'age_13_plus' as never })).toBe(true);
    expect(mutate({ locale: 'en' })).toBe(false);
    expect(mutate({ fingerprint: 'NOTHEX' })).toBe(false);
    expect(mutate({ id: 'nope' })).toBe(false);
    expect(mutate({ contentVersion: 'Pilot Version' })).toBe(false);
    expect(mutate({ leaked: true })).toBe(false);
  });
});

describe('adversarial: answers agree with an independent reference', () => {
  it('grades rule sequences against an independently computed next token', () => {
    const boards: RuleSequenceBoard[] = [
      { kind: 'rule-sequence', sequence: ['a', 'b', 'a', 'b'], options: ['a', 'b', 'c'], ruleKind: 'alternating' },
      { kind: 'rule-sequence', sequence: ['a', 'b', 'a', 'b', 'a'], options: ['a', 'b', 'c'], ruleKind: 'alternating' },
      { kind: 'rule-sequence', sequence: ['x', 'y', 'z', 'x'], options: ['x', 'y', 'z'], ruleKind: 'repeat', period: 3 },
      { kind: 'rule-sequence', sequence: ['1', '2', '3', '4'], options: ['5', '6', '4'], ruleKind: 'increment' },
      { kind: 'rule-sequence', sequence: ['2', '5', '8', '11'], options: ['14', '13', '12'], ruleKind: 'increment' },
    ];
    for (const board of boards) {
      const expected = independentNextToken(board);
      expect(expected).not.toBeNull();
      expect(solveRuleSequence(board)).toBe(expected);
      for (const option of board.options) {
        expect(checkRuleSequence(board, option)).toBe(option === expected);
      }
    }
  });

  it('grades every shipped rule item against the independent next token', () => {
    const ruleItems = pilotItems.filter((item) => item.gameTypeId === 'g01-t1');
    expect(ruleItems).toHaveLength(10);
    for (const item of ruleItems) {
      const board = item.boardData as RuleSequenceBoard;
      const expected = independentNextToken(board);
      expect(expected).not.toBeNull();
      expect(item.solution).toBe(expected);
      expect(checkAnswer(item, expected)).toEqual({ ok: true, correct: true });
      const wrong = board.options.find((option) => option !== expected);
      expect(wrong).toBeDefined();
      expect(checkAnswer(item, wrong)).toEqual({ ok: true, correct: false });
    }
  });

  it('grades memory sequences against an independent exact-order reference', () => {
    const board: MemorySequenceBoard = {
      kind: 'memory-sequence',
      sequence: ['cây', 'cá', 'mèo'],
      options: ['cây', 'cá', 'mèo', 'mưa'],
      displayMs: 1200,
    };
    expect(independentMemoryValid(board, ['cây', 'cá', 'mèo'])).toBe(true);
    expect(independentMemoryValid(board, ['mèo', 'cá', 'cây'])).toBe(false);
    expect(independentMemoryValid(board, ['cây', 'cá'])).toBe(false);
    expect(independentMemoryValid(board, ['cây', 'cá', 'mèo', 'mưa'])).toBe(false);
    for (const item of pilotItems.filter((candidate) => candidate.gameTypeId === 'g03-t1')) {
      const memory = item.boardData as MemorySequenceBoard;
      const solution = item.solution as string[];
      expect(independentMemoryValid(memory, solution)).toBe(true);
      expect(independentMemoryValid(memory, [...solution].reverse())).toBe(false);
      expect(checkAnswer(item, solution)).toEqual({ ok: true, correct: true });
      expect(checkAnswer(item, [...solution].reverse())).toEqual({ ok: true, correct: false });
    }
  });

  it('accepts and rejects paths exactly as an independent enumerator does', () => {
    const board: PathBoard = {
      kind: 'path-planning',
      width: 4,
      height: 4,
      start: { x: 0, y: 0 },
      goal: { x: 3, y: 3 },
      walls: [{ x: 1, y: 1 }],
      waypoints: [{ id: 'w1', x: 2, y: 1 }],
    };
    const paths = enumerateSimplePaths(board);
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect(checkPath(board, path)).toBe(independentPathValid(board, path));
    }
    const withWaypoint = paths.filter((path) => path.some((point) => point.x === 2 && point.y === 1));
    const withoutWaypoint = paths.filter((path) => !path.some((point) => point.x === 2 && point.y === 1));
    expect(withWaypoint.length).toBeGreaterThan(1);
    expect(withoutWaypoint.length).toBeGreaterThan(0);
    for (const path of withWaypoint) expect(checkPath(board, path)).toBe(true);
    for (const path of withoutWaypoint) expect(checkPath(board, path)).toBe(false);
  });
});

describe('adversarial: path answers reject unsafe geometry', () => {
  const board: PathBoard = {
    kind: 'path-planning',
    width: 4,
    height: 4,
    start: { x: 0, y: 0 },
    goal: { x: 3, y: 3 },
    walls: [{ x: 1, y: 1 }],
    waypoints: [{ id: 'w1', x: 2, y: 1 }],
  };

  it('rejects teleports, walls, repeats, out-of-bounds, wrong start and non-terminal paths', () => {
    expect(checkPath(board, [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }])).toBe(false);
    expect(checkPath(board, [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }])).toBe(false);
    expect(checkPath(board, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 9 }, { x: 3, y: 9 }])).toBe(false);
    expect(checkPath(board, [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }])).toBe(false);
    expect(checkPath(board, [{ x: 0, y: 0 }, { x: 1, y: 0 }])).toBe(false);
    expect(checkPath(board, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }])).toBe(false);
  });

  it('accepts two different valid solutions for the same board', () => {
    const first = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }];
    const second = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 1 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }];
    expect(checkPath(board, first)).toBe(true);
    expect(checkPath(board, second)).toBe(true);
    expect(independentPathValid(board, first)).toBe(true);
    expect(independentPathValid(board, second)).toBe(true);
    expect(first).not.toEqual(second);
  });

  it('reports a malformed path answer as invalid_answer and a wrong path as a graded miss', () => {
    const item = pilotItems.find((candidate) => candidate.gameTypeId === 'g06-t1') as PuzzleItem;
    expect(checkAnswer(item, [{ x: 0 }])).toEqual({ ok: false, code: 'invalid_answer' });
    expect(checkAnswer(item, 'nope')).toEqual({ ok: false, code: 'invalid_answer' });
    const boardData = item.boardData as PathBoard;
    const wrongPath = [{ x: boardData.start.x, y: boardData.start.y }, { x: boardData.start.x, y: boardData.start.y + 1 }];
    expect(checkAnswer(item, wrongPath)).toEqual({ ok: true, correct: false });
  });
});

describe('adversarial: memory order and engine-side pause scope', () => {
  it('treats a wrong order as a graded miss rather than a malformed answer', () => {
    const item = pilotItems.find((candidate) => candidate.gameTypeId === 'g03-t1') as PuzzleItem;
    const solution = item.solution as string[];
    const reversed = [...solution].reverse();
    expect(reversed).not.toEqual(solution);
    expect(checkAnswer(item, reversed)).toEqual({ ok: true, correct: false });
    expect(checkAnswer(item, solution.slice(0, -1))).toEqual({ ok: true, correct: false });
    expect(checkAnswer(item, 'not-an-array')).toEqual({ ok: false, code: 'invalid_answer' });
  });

  it('keeps pause, bedtime and play-window decisions out of the pure engine', () => {
    const serverOnly = ['paused', 'bedtime', 'outside_play_window', 'day_changed', 'attempt_expired', 'rate_limited', 'feature_off'];
    const item = pilotItems[0] as PuzzleItem;
    const produced = new Set<string>();
    const resolved = resolveAssignment(request());
    produced.add(resolved.ok ? 'ok' : resolved.code);
    const checked = checkAnswer(item, item.solution);
    produced.add(checked.ok ? 'ok' : checked.code);
    const solved = solvePuzzle(item);
    produced.add(solved.ok ? 'ok' : solved.code);
    const validated = validatePuzzle(item);
    produced.add(validated.ok ? 'ok' : validated.code);
    for (const code of serverOnly) expect(produced.has(code)).toBe(false);
  });
});

describe('adversarial: pilot hints and explanations agree with the board', () => {
  it('states the graded answer in the explanation of every pilot item', () => {
    for (const item of pilotItems) {
      if (item.gameTypeId === 'g01-t1') {
        expect(item.explanation.endsWith(`${String(item.solution)}.`)).toBe(true);
      } else if (item.gameTypeId === 'g03-t1') {
        const chain = (item.solution as string[]).join(' → ');
        expect(item.explanation.endsWith(`${chain}.`)).toBe(true);
      } else {
        const listed = item.explanation.match(/\((\d+,\d+)\)/g) ?? [];
        expect(listed.length).toBeGreaterThan(1);
        const parsed = listed.map((entry) => {
          const [x, y] = entry.slice(1, -1).split(',');
          return { x: Number(x), y: Number(y) };
        });
        expect(independentPathValid(item.boardData as PathBoard, parsed)).toBe(true);
      }
    }
  });

  it('never leaks the graded answer inside a public hint', () => {
    for (const item of pilotItems) {
      const answer = item.gameTypeId === 'g06-t1'
        ? (item.solution as Array<{ x: number; y: number }>).map((point) => `${point.x},${point.y}`).join(' ')
        : item.gameTypeId === 'g03-t1'
          ? (item.solution as string[]).join(' → ')
          : String(item.solution);
      for (const hint of item.hints) {
        expect(hint.toLocaleLowerCase('vi')).not.toContain(answer.toLocaleLowerCase('vi'));
      }
    }
  });

  it('does not attach a repetition hint to a board whose items never repeat', () => {
    for (const item of pilotItems) {
      if (item.gameTypeId !== 'g01-t1') continue;
      const board = item.boardData as RuleSequenceBoard;
      const numeric = board.sequence.every((token) => Number.isFinite(Number(token)));
      if (!numeric) continue;
      expect(new Set(board.sequence).size).toBe(board.sequence.length);
      for (const hint of item.hints) {
        expect(hint.toLocaleLowerCase('vi')).not.toContain('lặp lại');
      }
    }
  });
});

describe('adversarial: canonical fingerprints neither collapse nor split data', () => {
  it('treats option order and dihedral rotations as the same board', () => {
    const rule: RuleSequenceBoard = {
      kind: 'rule-sequence',
      sequence: ['a', 'b', 'a', 'b'],
      options: ['a', 'b', 'c'],
      ruleKind: 'alternating',
    };
    expect(puzzleFingerprint('g01-t1', { ...rule, options: ['c', 'a', 'b'] }))
      .toBe(puzzleFingerprint('g01-t1', rule));

    const path: PathBoard = {
      kind: 'path-planning',
      width: 5,
      height: 7,
      start: { x: 0, y: 0 },
      goal: { x: 4, y: 6 },
      walls: [{ x: 2, y: 3 }, { x: 3, y: 1 }],
      waypoints: [{ id: 'w1', x: 1, y: 5 }],
    };
    for (let transform = 0; transform < 8; transform += 1) {
      expect(puzzleFingerprint('g06-t1', dihedral(path, transform)))
        .toBe(puzzleFingerprint('g06-t1', path));
    }
  });

  it('keeps semantically different boards apart', () => {
    const path: PathBoard = {
      kind: 'path-planning',
      width: 5,
      height: 5,
      start: { x: 0, y: 0 },
      goal: { x: 4, y: 4 },
      walls: [{ x: 2, y: 2 }],
      waypoints: [],
    };
    const base = puzzleFingerprint('g06-t1', path);
    expect(puzzleFingerprint('g06-t1', { ...path, walls: [{ x: 2, y: 1 }] })).not.toBe(base);
    expect(puzzleFingerprint('g06-t1', { ...path, walls: [] })).not.toBe(base);
    expect(puzzleFingerprint('g06-t1', { ...path, waypoints: [{ id: 'w1', x: 1, y: 3 }] })).not.toBe(base);
    expect(puzzleFingerprint('g06-t1', { ...path, start: { x: 0, y: 1 }, goal: { x: 4, y: 3 } })).not.toBe(base);

    const rule: RuleSequenceBoard = {
      kind: 'rule-sequence',
      sequence: ['a', 'b', 'a', 'b'],
      options: ['a', 'b', 'c'],
      ruleKind: 'alternating',
    };
    const ruleBase = puzzleFingerprint('g01-t1', rule);
    expect(puzzleFingerprint('g01-t1', { ...rule, sequence: ['a', 'b', 'a', 'c'] })).not.toBe(ruleBase);
    expect(puzzleFingerprint('g01-t1', { ...rule, ruleKind: 'repeat', period: 2 })).not.toBe(ruleBase);

    const memory: MemorySequenceBoard = {
      kind: 'memory-sequence',
      sequence: ['a', 'b', 'c'],
      options: ['a', 'b', 'c'],
      displayMs: 1200,
    };
    const memoryBase = puzzleFingerprint('g03-t1', memory);
    expect(puzzleFingerprint('g03-t1', { ...memory, options: ['c', 'b', 'a'] })).toBe(memoryBase);
    expect(puzzleFingerprint('g03-t1', { ...memory, sequence: ['b', 'a', 'c'] })).not.toBe(memoryBase);
    expect(puzzleFingerprint('g03-t1', { ...memory, displayMs: 1600 })).not.toBe(memoryBase);
  });

  it('never gives two different rule or memory boards the same fingerprint', () => {
    const seen = new Set<string>();
    for (let index = 0; index < 120; index += 1) {
      const board: RuleSequenceBoard = {
        kind: 'rule-sequence',
        sequence: [`s${index}a`, `s${index}b`, `s${index}a`, `s${index}b`],
        options: [`s${index}a`, `s${index}b`, `s${index}c`],
        ruleKind: 'alternating',
      };
      const fingerprint = puzzleFingerprint('g01-t1', board);
      expect(seen.has(fingerprint)).toBe(false);
      seen.add(fingerprint);
    }
    for (let index = 0; index < 120; index += 1) {
      const board: MemorySequenceBoard = {
        kind: 'memory-sequence',
        sequence: [`m${index}a`, `m${index}b`, `m${index}c`],
        options: [`m${index}a`, `m${index}b`, `m${index}c`],
        displayMs: 1200,
      };
      const fingerprint = puzzleFingerprint('g03-t1', board);
      expect(seen.has(fingerprint)).toBe(false);
      seen.add(fingerprint);
    }
    expect(seen.size).toBe(240);
  });

  it('collapses exactly one orbit per path board and keeps distinct boards apart', () => {
    const boards: PathBoard[] = [];
    for (let width = 5; width <= 7; width += 1) {
      for (let height = 5; height <= 7; height += 1) {
        for (let wallX = 1; wallX <= width - 2; wallX += 1) {
          boards.push({
            kind: 'path-planning',
            width,
            height,
            start: { x: 0, y: 0 },
            goal: { x: width - 1, y: height - 1 },
            walls: [{ x: wallX, y: 1 }],
            waypoints: [],
          });
        }
      }
    }
    const orbitKey = (board: PathBoard): string =>
      [...new Set(Array.from({ length: 8 }, (_, transform) => JSON.stringify(dihedral(board, transform))))].sort().join('|');
    const byOrbit = new Map<string, PathBoard[]>();
    for (const board of boards) {
      const key = orbitKey(board);
      byOrbit.set(key, [...(byOrbit.get(key) ?? []), board]);
    }
    const fingerprintsByOrbit = new Map<string, string>();
    for (const [key, orbit] of byOrbit) {
      const fingerprints = new Set(orbit.map((board) => puzzleFingerprint('g06-t1', board)));
      expect(fingerprints.size).toBe(1);
      const fingerprint = [...fingerprints][0]!;
      const other = fingerprintsByOrbit.get(key);
      expect(other === undefined || other === fingerprint).toBe(true);
      fingerprintsByOrbit.set(key, fingerprint);
    }
    const distinct = new Set([...byOrbit.keys()].map((key) => fingerprintsByOrbit.get(key)));
    expect(distinct.size).toBe(byOrbit.size);
    expect(byOrbit.size).toBeGreaterThan(1);
  });

  it('finds no dihedrally equivalent pair inside the shipped pilot', () => {
    const pathItems = pilotItems.filter((item) => item.gameTypeId === 'g06-t1');
    expect(pathItems).toHaveLength(10);
    const seen = new Map<string, string>();
    for (const item of pathItems) {
      const board = item.boardData as PathBoard;
      const own = puzzleFingerprint('g06-t1', board);
      for (let transform = 0; transform < 8; transform += 1) {
        expect(puzzleFingerprint('g06-t1', dihedral(board, transform))).toBe(own);
      }
      const previous = seen.get(own);
      expect(previous).toBeUndefined();
      seen.set(own, item.id);
    }
    expect(seen.size).toBe(10);
  });
});

describe('adversarial: profile gates and honest coverage claims', () => {
  it('refuses the pilot fixture under the release profile and never claims release coverage', () => {
    const rejected = validateManifest(clone(pilot), { profile: 'release' });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.errors.map((entry) => entry.code)).toContain('pilot_fixture_not_release');
      expect(rejected.metrics.coverageKind).toBe('pilot');
      expect(rejected.metrics.typeIds).toBe(3);
      expect(rejected.metrics.itemCount).toBe(28);
    }
  });

  it('rejects the release placeholder for the real reasons', () => {
    const result = validateManifest(loadRelease(), { profile: 'release' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const codes = result.errors.map((entry) => entry.code);
      expect(codes).toContain('release_item_count');
      expect(codes).toContain('release_editorial');
      expect(result.metrics.itemCount).toBe(0);
    }
  });

  it('keeps the pilot inside its own claimed shape', () => {
    const result = validateManifest(clone(pilot), { profile: 'pilot' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.metrics).toMatchObject({
      coverageKind: 'pilot',
      dayCount: 7,
      slotCount: 28,
      itemCount: 28,
      typeIds: 3,
      skillCount: 3,
      equalSkillDays: 0,
    });
    expect(pilotItems).toHaveLength(28);
    expect(new Set(pilotItems.map((item) => item.ageTrack)).size).toBe(2);
    expect(new Set(pilotItems.map((item) => item.slotType)).size).toBe(2);
    expect(new Set(pilotItems.map((item) => item.locale))).toEqual(new Set(['vi']));
  });

  it('separates the 24 measured metadata ids from the 3 playable mechanics', () => {
    expect(GAME_MECHANICS).toHaveLength(24);
    expect(IMPLEMENTED_GAME_TYPE_IDS).toEqual(['g01-t1', 'g06-t1', 'g03-t1']);
    const playable = new Set(pilotItems.map((item) => item.gameTypeId));
    expect([...playable].sort()).toEqual([...IMPLEMENTED_GAME_TYPE_IDS].sort());
    for (const item of pilotItems) {
      expect(item.status).toBe('design_only');
      expect(item.editorial).toBeNull();
      expect(item.source).toBeNull();
    }
  });

  it('lets no client-facing module select the permissive pilot profile', () => {
    const roots = ['src/app', 'src/components', 'src/lib/store', 'src/lib/i18n'];
    const offenders: string[] = [];
    const walk = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
          walk(path);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;
        if (/allowPilotProfile/.test(readFileSync(path, 'utf8'))) offenders.push(path);
      }
    };
    for (const root of roots) {
      try {
        statSync(root);
      } catch {
        continue;
      }
      walk(root);
    }
    expect(offenders).toEqual([]);
  });
});

describe('adversarial: pilot profile rejects a per-track equal-skill day', () => {
  it('rejects a day where one age track repeats the same skill in both slots', () => {
    const manifest = clone(pilot) as unknown as {
      items: Array<Record<string, unknown>>;
    };
    const olderDayOne = manifest.items.filter((item) => item.dayIndex === 1 && item.ageTrack === 'age_9_12');
    const main = olderDayOne.find((item) => item.slotType === 'main');
    const bonus = olderDayOne.find((item) => item.slotType === 'bonus');
    expect(main && bonus).toBeTruthy();
    if (!main || !bonus) return;
    const mainBoard = {
      kind: 'rule-sequence',
      sequence: ['ka1', 'ka2', 'ka1', 'ka2'],
      options: ['ka1', 'ka2', 'ka3'],
      ruleKind: 'alternating',
    };
    const bonusBoard = {
      kind: 'rule-sequence',
      sequence: ['kb1', 'kb2', 'kb1', 'kb2'],
      options: ['kb1', 'kb2', 'kb3'],
      ruleKind: 'alternating',
    };
    main.gameTypeId = 'g01-t1';
    main.skillGroup = 'rule';
    main.ruleVariantId = 'g01-t1:lặp một thuộc tính';
    main.validSolutionPredicate = 'rule-sequence-v1';
    main.boardData = mainBoard;
    main.fingerprint = puzzleFingerprint('g01-t1', mainBoard);
    main.solution = 'ka1';
    bonus.gameTypeId = 'g01-t1';
    bonus.skillGroup = 'rule';
    bonus.ruleVariantId = 'g01-t1:lặp một thuộc tính';
    bonus.validSolutionPredicate = 'rule-sequence-v1';
    bonus.boardData = bonusBoard;
    bonus.fingerprint = puzzleFingerprint('g01-t1', bonusBoard);
    bonus.solution = 'kb1';

    const result = validateManifest(manifest, { profile: 'pilot' });
    const codes = result.ok ? [] : result.errors.map((entry) => entry.code);
    expect(codes).toContain('pilot_equal_skill');
    expect(result.ok).toBe(false);
  });
});

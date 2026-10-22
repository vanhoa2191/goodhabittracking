import { describe, expect, it } from 'vitest';

import {
  AVAILABLE_GAME_TYPE_IDS,
  GAME_AGE_TRACKS,
  GAME_INTERACTIONS,
  GAME_MECHANICS,
  REMAINING_MECHANICS,
  checkAnswer,
  getGameMechanic,
  parsePuzzleItem,
  puzzleFingerprint,
  solvePuzzle,
  toPublicPuzzle,
  validatePuzzle,
} from '@/lib/thinking-games';
import type { GameAgeTrack, GameTypeId, PuzzleItem } from '@/lib/thinking-games';

const TRACKS: readonly GameAgeTrack[] = GAME_AGE_TRACKS;

function itemFor(mechanic: (typeof REMAINING_MECHANICS)[number], seed: string, ageTrack: GameAgeTrack, variant: string): PuzzleItem {
  const generated = mechanic.generate({ seed, ageTrack, variant });
  const registry = getGameMechanic(mechanic.gameTypeId);
  if (!registry) throw new Error(`missing registry entry for ${mechanic.gameTypeId}`);
  return parsePuzzleItem({
    schemaVersion: 1,
    contentVersion: 'p06-fixtures',
    id: 'P001-main',
    dayIndex: 1,
    slotType: 'main',
    skillGroup: registry.skillGroup,
    gameTypeId: mechanic.gameTypeId,
    ruleVariantId: `${mechanic.gameTypeId}:${variant}`,
    ageTrack,
    locale: 'vi',
    title: generated.title,
    invitation: 'Bạn thử sức với thử thách này nhé.',
    tutorial: generated.tutorial,
    explanation: generated.explanation,
    boardData: generated.board,
    solution: generated.solution,
    validSolutionPredicate: mechanic.checkerId,
    hints: generated.hints,
    praiseKeys: generated.praiseKeys,
    targetSeconds: generated.targetSeconds,
    status: 'design_only',
    fingerprint: puzzleFingerprint(mechanic.gameTypeId, generated.board),
    source: null,
    editorial: null,
  }) as PuzzleItem;
}

function wrongAnswer(item: PuzzleItem): unknown {
  const solution = item.solution;
  const candidates: unknown[] = [];
  if (typeof solution === 'number') {
    candidates.push(solution + 1, Math.max(0, solution - 1));
  } else if (typeof solution === 'string') {
    const board = item.boardData as { options?: readonly unknown[] };
    const options = Array.isArray(board.options) ? board.options : [];
    candidates.push(...options.filter((option) => typeof option === 'string' && option !== solution));
    candidates.push(`${solution}-sai`);
  } else if (Array.isArray(solution)) {
    if (solution.every((entry) => entry && typeof entry === 'object' && 'x' in entry)) candidates.push([{ x: -1, y: -1 }]);
    else candidates.push(['không-có']);
  }
  for (const candidate of candidates) {
    const checked = checkAnswer(item, candidate);
    if (!checked.ok || !checked.correct) return candidate;
  }
  return 'không-có';
}


function malformedAnswer(item: PuzzleItem): unknown {
  const descriptor = GAME_INTERACTIONS[item.gameTypeId];
  if (descriptor.answerType === 'string') return 123;
  if (descriptor.answerType === 'number') return 'không-phải-số';
  if (descriptor.answerType === 'string-array') return ['hợp-lệ', 1];
  if (descriptor.answerType === 'point') return { x: 'sai', y: 0 };
  return [{ x: 0 }];
}

describe('P06 remaining mechanics', () => {
  it('registers all 21 new mechanics as available with matching checker metadata', () => {
    expect(REMAINING_MECHANICS).toHaveLength(21);
    for (const mechanic of REMAINING_MECHANICS) {
      const registry = getGameMechanic(mechanic.gameTypeId);
      expect(registry?.available).toBe(true);
      expect(registry?.checkerId).toBe(mechanic.checkerId);
      expect(registry?.boardKind).toBe(mechanic.boardKind);
      expect(AVAILABLE_GAME_TYPE_IDS).toContain(mechanic.gameTypeId);
    }
    expect(new Set(REMAINING_MECHANICS.map((mechanic) => mechanic.gameTypeId)).size).toBe(21);
  });

  it('generates, solves, checks, validates and fingerprints every variant on all four tracks', () => {
    for (const mechanic of REMAINING_MECHANICS) {
      const registry = getGameMechanic(mechanic.gameTypeId);
      if (!registry) throw new Error(`missing registry entry for ${mechanic.gameTypeId}`);
      for (const ageTrack of TRACKS) {
        const fingerprints = new Set<string>();
        for (const variant of registry.variants) {
          console.log(`Testing: ${mechanic.gameTypeId} ${ageTrack} ${variant}`);
          const item = itemFor(mechanic, `p06-${mechanic.gameTypeId}-${ageTrack}`, ageTrack, variant);
          const board = mechanic.parseBoard(item.boardData);
          const solved = mechanic.solve(board);
          expect(solved, `${mechanic.gameTypeId} ${ageTrack} ${variant}`).not.toBeNull();
          expect(mechanic.check(board, solved), `${mechanic.gameTypeId} ${ageTrack} ${variant}`).toBe(true);
          expect(mechanic.check(board, item.solution), `${mechanic.gameTypeId} ${ageTrack} ${variant}`).toBe(true);
          expect(checkAnswer(item, item.solution)).toEqual({ ok: true, correct: true });
          const solvedPuzzle = solvePuzzle(item);
          expect(solvedPuzzle.ok).toBe(true);
          if (solvedPuzzle.ok) expect(checkAnswer(item, solvedPuzzle.solution)).toEqual({ ok: true, correct: true });
          expect(validatePuzzle(item)).toEqual({ ok: true });
          expect(toPublicPuzzle(item)).not.toHaveProperty('solution');
          const wrong = checkAnswer(item, wrongAnswer(item));
          expect(wrong.ok && wrong.correct, `${mechanic.gameTypeId} ${ageTrack} ${variant} wrong answer`).toBe(false);
          fingerprints.add(item.fingerprint);
        }
        expect(fingerprints.size, `${mechanic.gameTypeId} ${ageTrack}`).toBe(registry.variants.length);
      }
    }
  });

  it('rejects malformed answer shapes for every remaining mechanic', () => {
    for (const mechanic of REMAINING_MECHANICS) {
      const registry = getGameMechanic(mechanic.gameTypeId);
      if (!registry) throw new Error(`missing registry entry for ${mechanic.gameTypeId}`);
      const item = itemFor(mechanic, `malformed-${mechanic.gameTypeId}`, 'age_6_8', registry.variants[0]!);
      const checked = checkAnswer(item, malformedAnswer(item));
      expect(checked.ok && checked.correct, `${mechanic.gameTypeId} malformed`).toBe(false);
    }
  });

  it('accepts alternative valid answers where the mechanic allows them', () => {
    const ifThen = REMAINING_MECHANICS.find((mechanic) => mechanic.gameTypeId === 'g04-t2');
    const alternativePath = REMAINING_MECHANICS.find((mechanic) => mechanic.gameTypeId === 'g07-t3');
    if (!ifThen || !alternativePath) throw new Error('missing mechanics');
    const ifThenRegistry = getGameMechanic('g04-t2');
    if (!ifThenRegistry) throw new Error('missing g04-t2 registry');
    const ifThenBoard = ifThen.generate({ seed: 'multi-if-then', ageTrack: 'age_9_12', variant: ifThenRegistry.variants[3]! }).board;
    if (ifThenBoard.kind !== 'reasoning-if-then') throw new Error('wrong board');
    // g04-t2 checker uses oracle semantics: accepts any option that is derivable and not an initial fact
    const canonicalSolution = ifThen.solve(ifThenBoard);
    expect(canonicalSolution).toBeTruthy();
    expect(ifThen.check(ifThenBoard, canonicalSolution!)).toBe(true);
    // Non-derivable distractor should be rejected
    const nonDerivable = ifThenBoard.options.find((option) => {
      const known = new Set(ifThenBoard.facts);
      const closure = new Set(ifThenBoard.facts);
      let changed = true;
      while (changed) {
        changed = false;
        for (const rule of ifThenBoard.rules) {
          if (closure.has(rule.if) && !closure.has(rule.then)) {
            closure.add(rule.then);
            changed = true;
          }
        }
      }
      return !known.has(option) && !closure.has(option);
    });
    expect(nonDerivable).toBeTruthy();
    expect(ifThen.check(ifThenBoard, nonDerivable!)).toBe(false);
    // Initial fact should be rejected
    const initialFact = ifThenBoard.facts[0]!;
    expect(ifThen.check(ifThenBoard, initialFact)).toBe(false);
    // Oracle semantics: if a board had two derivable options, both would be accepted
    // (Current generator ensures exactly one, but checker semantics allow multiple)
    const pathRegistry = getGameMechanic('g07-t3');
    if (!pathRegistry) throw new Error('missing g07-t3 registry');
    const pathBoard = alternativePath.generate({ seed: 'multi-path', ageTrack: 'age_6_8', variant: pathRegistry.variants[0]! }).board;
    if (pathBoard.kind !== 'flexibility-alternative') throw new Error('wrong board');
    const zigzag = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }];
    expect(alternativePath.check(pathBoard, zigzag)).toBe(true);
  });

  it('g04-t2 generator produces exactly one rule-valid option per item', () => {
    const ifThen = REMAINING_MECHANICS.find((mechanic) => mechanic.gameTypeId === 'g04-t2');
    if (!ifThen) throw new Error('missing g04-t2');
    const registry = getGameMechanic('g04-t2');
    if (!registry) throw new Error('missing g04-t2 registry');
    for (const ageTrack of ['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus'] as const) {
      for (const variant of registry.variants) {
        for (let day = 1; day <= 5; day += 1) {
          const seed = `g04-t2-regression-${ageTrack}-${variant}-${day}`;
          const generated = ifThen.generate({ seed, ageTrack, variant });
          if (generated.board.kind !== 'reasoning-if-then') throw new Error('wrong board');
          const known = new Set(generated.board.facts);
          const closure = new Set(generated.board.facts);
          let changed = true;
          while (changed) {
            changed = false;
            for (const rule of generated.board.rules) {
              if (closure.has(rule.if) && !closure.has(rule.then)) {
                closure.add(rule.then);
                changed = true;
              }
            }
          }
          const ruleValidOptions = generated.board.options.filter((opt) => !known.has(opt) && closure.has(opt));
          expect(ruleValidOptions.length).toBe(1);
          expect(ruleValidOptions[0]).toBe(generated.solution);
        }
      }
    }
  });

  it('is deterministic for the same seed, track and variant', () => {
    for (const mechanic of REMAINING_MECHANICS) {
      const registry = getGameMechanic(mechanic.gameTypeId);
      if (!registry) throw new Error(`missing registry entry for ${mechanic.gameTypeId}`);
      for (const variant of registry.variants) {
        const first = mechanic.generate({ seed: 'deterministic-p06', ageTrack: 'age_6_8', variant });
        const second = mechanic.generate({ seed: 'deterministic-p06', ageTrack: 'age_6_8', variant });
        expect(second.board).toEqual(first.board);
        expect(second.solution).toEqual(first.solution);
      }
    }
  });

  it('exports a renderer-agnostic interaction descriptor for every game type', () => {
    expect(Object.keys(GAME_INTERACTIONS)).toHaveLength(24);
    for (const mechanic of GAME_MECHANICS) {
      const descriptor = GAME_INTERACTIONS[mechanic.gameTypeId];
      expect(descriptor.boardKind).toBe(mechanic.boardKind);
      expect(['single', 'multi', 'ordered', 'number', 'index', 'point', 'cells', 'path']).toContain(descriptor.selection);
      expect(['string', 'number', 'string-array', 'point', 'point-array']).toContain(descriptor.answerType);
    }
  });

  it('keeps all 24 game types available while preserving legacy implemented metadata', () => {
    expect(GAME_MECHANICS).toHaveLength(24);
    expect(GAME_MECHANICS.every((mechanic) => mechanic.available)).toBe(true);
    expect(GAME_MECHANICS.filter((mechanic) => mechanic.implemented).map((mechanic) => mechanic.gameTypeId).sort()).toEqual([
      'g01-t1', 'g03-t1', 'g06-t1',
    ]);
    expect(new Set(AVAILABLE_GAME_TYPE_IDS)).toEqual(new Set(GAME_MECHANICS.map((mechanic) => mechanic.gameTypeId)));
    expect(new Set(GAME_MECHANICS.map((mechanic) => mechanic.gameTypeId as GameTypeId)).size).toBe(24);
  });
});

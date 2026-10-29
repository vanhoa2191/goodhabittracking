import { describe, expect, it } from 'vitest';

import {
  REMAINING_MECHANICS,
  checkMemorySequence,
  checkPath,
  checkRuleSequence,
  generateMemorySequencePuzzle,
  generatePathPuzzle,
  generateRuleSequencePuzzle,
  getGameMechanic,
  puzzleFingerprint,
  solveMemorySequence,
  solvePath,
  solveRuleSequence,
} from '@/lib/thinking-games';
import type { GameAgeTrack } from '@/lib/thinking-games';
import { normalizedStructuralSignature } from '../../../scripts/check-thinking-games-candidates-v2.mjs';

const seed = (day: number, extra = '') => `p08-candidates-365-v2|D${String(day).padStart(3, '0')}-main|${extra}`;
const mechanic = (id: string) => REMAINING_MECHANICS.find((entry) => entry.gameTypeId === id)!;
const variant = (id: string, index = 0) => getGameMechanic(id)!.variants[index]!;

describe('V2 candidate variety at the generation source', () => {
  it('does not mistake different path layouts with the same size and wall count for a duplicate', () => {
    const first = generatePathPuzzle({ seed: seed(30, 'a'), ageTrack: 'age_3_5', variant: variant('g06-t1') });
    const second = generatePathPuzzle({ seed: seed(30, 'b'), ageTrack: 'age_3_5', variant: variant('g06-t1') });
    expect(first.width).toBe(second.width);
    expect(first.walls.length).toBe(second.walls.length);
    const item = (boardData: typeof first) => ({ boardData, solution: solvePath(boardData) });
    expect(normalizedStructuralSignature(item(first))).not.toBe(normalizedStructuralSignature(item(second)));
    expect(normalizedStructuralSignature(item(first))).toBe(normalizedStructuralSignature(item(first)));
  });

  it('moves sequence, path and memory demands through the year while keeping solutions valid', () => {
    for (const ageTrack of ['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus'] as GameAgeTrack[]) {
      const early = seed(12);
      const late = seed(345);
      const ruleEarly = generateRuleSequencePuzzle({ seed: early, ageTrack, variant: variant('g01-t1', 1) });
      const ruleLate = generateRuleSequencePuzzle({ seed: late, ageTrack, variant: variant('g01-t1', 1) });
      expect(ruleLate.sequence.length).toBeGreaterThan(ruleEarly.sequence.length);
      expect(checkRuleSequence(ruleLate, solveRuleSequence(ruleLate))).toBe(true);

      const memoryEarly = generateMemorySequencePuzzle({ seed: early, ageTrack, variant: variant('g03-t1', 1) });
      const memoryLate = generateMemorySequencePuzzle({ seed: late, ageTrack, variant: variant('g03-t1', 1) });
      expect(memoryLate.sequence.length).toBeGreaterThanOrEqual(memoryEarly.sequence.length);
      expect(memoryLate.displayMs).toBeLessThan(memoryEarly.displayMs);
      expect(checkMemorySequence(memoryLate, solveMemorySequence(memoryLate))).toBe(true);

      const pathEarly = generatePathPuzzle({ seed: early, ageTrack, variant: variant('g06-t1') });
      const pathLate = generatePathPuzzle({ seed: late, ageTrack, variant: variant('g06-t1') });
      expect(pathLate.width).toBeGreaterThan(pathEarly.width);
      expect(pathLate.walls.length).toBeGreaterThanOrEqual(pathEarly.walls.length);
      const pathSolution = solvePath(pathLate);
      expect(pathSolution).not.toBeNull();
      expect(checkPath(pathLate, pathSolution)).toBe(true);
    }
  });

  it('puts a real obstacle on every generated preschool path', () => {
    for (let day = 1; day <= 31; day += 1) {
      for (const pathVariant of getGameMechanic('g06-t1')!.variants) {
        const board = generatePathPuzzle({ seed: seed(day), ageTrack: 'age_3_5', variant: pathVariant });
        expect(board.walls.length).toBeGreaterThan(0);
        expect(checkPath(board, solvePath(board))).toBe(true);
      }
    }
  });

  it('varies hidden memory positions, viewpoints and alternative-path endpoints', () => {
    const missing = new Set<number>();
    const swaps = new Set<string>();
    const distances = new Set<number>();
    const endpoints = new Set<string>();
    for (let day = 1; day <= 40; day += 1) {
      const memoryMissing = generateMemorySequencePuzzle({ seed: seed(day), ageTrack: 'age_9_12', variant: variant('g03-t1', 1) });
      const memorySwapped = generateMemorySequencePuzzle({ seed: seed(day), ageTrack: 'age_9_12', variant: variant('g03-t1', 3) });
      missing.add(memoryMissing.missingIndex!);
      swaps.add(memorySwapped.swappedIndices!.join(','));
      const perspective = mechanic('g07-t2').generate({ seed: seed(day), ageTrack: 'age_13_plus', variant: variant('g07-t2') });
      if (perspective.board.kind !== 'flexibility-perspective') throw new Error('wrong board');
      distances.add(Math.abs(perspective.board.viewer.x - perspective.board.target.x) + Math.abs(perspective.board.viewer.y - perspective.board.target.y));
      expect(mechanic('g07-t2').check(perspective.board, perspective.solution)).toBe(true);
      const alternative = mechanic('g07-t3').generate({ seed: seed(day), ageTrack: 'age_3_5', variant: variant('g07-t3') });
      if (alternative.board.kind !== 'flexibility-alternative') throw new Error('wrong board');
      endpoints.add(`${alternative.board.start.y},${alternative.board.goal.y}`);
      expect(mechanic('g07-t3').check(alternative.board, alternative.solution)).toBe(true);
    }
    expect(missing.size).toBeGreaterThan(2);
    expect(swaps.size).toBeGreaterThan(2);
    expect(endpoints.size).toBeGreaterThan(2);
    // Older players have more than just the adjacent-object case.
    expect([...distances].some((distance) => distance > 1)).toBe(true);
  });

  it('uses varied grouping arithmetic and makes every older elimination clue necessary', () => {
    const grouping = mechanic('g05-t2');
    const elimination = mechanic('g04-t1');
    const groupingBoards = new Set<string>();
    for (let day = 1; day <= 31; day += 1) {
      const item = grouping.generate({ seed: seed(day), ageTrack: 'age_13_plus', variant: variant('g05-t2', day % 4) });
      expect(grouping.check(item.board, item.solution)).toBe(true);
      groupingBoards.add(puzzleFingerprint('g05-t2', item.board));
    }
    expect(groupingBoards.size).toBeGreaterThanOrEqual(27);
    for (const ageTrack of ['age_9_12', 'age_13_plus'] as GameAgeTrack[]) {
      for (let day = 1; day <= 20; day += 1) {
        const item = elimination.generate({ seed: seed(day), ageTrack, variant: variant('g04-t1', day % 4) });
        const board = item.board;
        if (board.kind !== 'reasoning-elimination') throw new Error('wrong board');
        const matches = (clues: typeof board.clues) => board.candidates.filter((candidate) => clues.every((clue) => (
          clue.negate ? candidate.traits[clue.trait] !== clue.value : candidate.traits[clue.trait] === clue.value
        )));
        expect(matches(board.clues)).toHaveLength(1);
        expect(elimination.check(board, item.solution)).toBe(true);
        for (let index = 0; index < board.clues.length; index += 1) {
          expect(matches(board.clues.filter((_, clueIndex) => clueIndex !== index)).length).toBeGreaterThan(1);
        }
      }
    }
  });

  it('generates distinct repair paths and scene arrangements across repeated slots', () => {
    for (const id of ['g06-t3', 'g08-t3']) {
      const generated = Array.from({ length: 30 }, (_, index) => mechanic(id).generate({
        seed: seed(index + 1),
        ageTrack: 'age_3_5',
        variant: variant(id, index % 4),
      }));
      for (const item of generated) expect(mechanic(id).check(item.board, item.solution)).toBe(true);
      const signatures = new Set(generated.map((item) => normalizedStructuralSignature({ boardData: item.board, solution: item.solution })));
      expect(signatures.size, id).toBeGreaterThanOrEqual(id === 'g06-t3' ? 15 : 25);
    }
    const early = mechanic('g06-t3').generate({ seed: seed(10), ageTrack: 'age_13_plus', variant: variant('g06-t3') });
    const late = mechanic('g06-t3').generate({ seed: seed(350), ageTrack: 'age_13_plus', variant: variant('g06-t3') });
    if (early.board.kind !== 'planning-fix-step' || late.board.kind !== 'planning-fix-step') throw new Error('wrong board');
    expect(late.board.width).toBeGreaterThanOrEqual(early.board.width);
    expect(late.board.walls.length).toBeGreaterThan(early.board.walls.length);
  });
});

import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  checkAnswer,
  checkMemorySequence,
  checkPath,
  getNaturalTutorial,
  memoryPositionRequiredCount,
  memorySequenceAnswerLength,
  memorySequenceSlots,
  quantityBalanceReplaceTarget,
  quantityTargetSatisfies,
  solveMemorySequence,
  solvePath,
} from '@/lib/thinking-games';
import type {
  MemoryPositionBoard,
  MemorySequenceBoard,
  PathBoard,
  PuzzleItem,
  QuantityBalanceBoard,
  QuantityTargetBoard,
} from '@/lib/thinking-games/types';

import { MemorySequenceGame } from '@/components/thinking-games/MemorySequenceGame';
import { MemoryPositionGame } from '@/components/thinking-games/MemoryPositionGame';
import { QuantityBalanceGame } from '@/components/thinking-games/QuantityBalanceGame';
import { QuantityTargetGame } from '@/components/thinking-games/QuantityTargetGame';
import { PathPlanningGame } from '@/components/thinking-games/PathPlanningGame';

describe('Rules vs Checker Remediation Tests', () => {
  /* ------------------------------------------------------------------
   * GROUP E: g03-t1 MemorySequence (missing & swapped modes)
   * ------------------------------------------------------------------ */
  describe('Group E: g03-t1 Memory Sequence', () => {
    const missingBoard: MemorySequenceBoard = {
      kind: 'memory-sequence',
      sequence: ['mưa', 'cá', 'cây', 'trăng'],
      options: ['trăng', 'mưa', 'cá', 'cây'],
      displayMs: 1200,
      mode: 'missing',
      missingIndex: 2,
    };

    const swappedBoard: MemorySequenceBoard = {
      kind: 'memory-sequence',
      sequence: ['cá', 'mưa', 'mèo', 'trăng'],
      options: ['mèo', 'trăng', 'cá', 'mưa'],
      displayMs: 1200,
      mode: 'swapped',
      swappedIndices: [1, 2],
    };

    const recallBoard: MemorySequenceBoard = {
      kind: 'memory-sequence',
      sequence: ['mưa', 'cá', 'cây'],
      options: ['mưa', 'cá', 'cây'],
      displayMs: 1200,
      mode: 'recall',
    };

    it('computes expected answer length and target slots by mode', () => {
      expect(memorySequenceAnswerLength(missingBoard)).toBe(1);
      expect(memorySequenceSlots(missingBoard)).toEqual([2]);

      expect(memorySequenceAnswerLength(swappedBoard)).toBe(2);
      expect(memorySequenceSlots(swappedBoard)).toEqual([1, 2]);

      expect(memorySequenceAnswerLength(recallBoard)).toBe(3);
      expect(memorySequenceSlots(recallBoard)).toEqual([0, 1, 2]);
    });

    it('checker accepts correct token length and rejects full sequence in missing/swapped mode', () => {
      expect(solveMemorySequence(missingBoard)).toEqual(['cây']);
      expect(checkMemorySequence(missingBoard, ['cây'])).toBe(true);
      expect(checkMemorySequence(missingBoard, ['mưa', 'cá', 'cây', 'trăng'])).toBe(false);
      expect(checkMemorySequence(missingBoard, ['cá'])).toBe(false);

      expect(solveMemorySequence(swappedBoard)).toEqual(['mưa', 'mèo']);
      expect(checkMemorySequence(swappedBoard, ['mưa', 'mèo'])).toBe(true);
      expect(checkMemorySequence(swappedBoard, ['mèo', 'mưa'])).toBe(true);
      expect(checkMemorySequence(swappedBoard, ['cá', 'mưa', 'mèo', 'trăng'])).toBe(false);
      expect(checkMemorySequence(swappedBoard, ['cá', 'trăng'])).toBe(false);
    });

    it('renders MemorySequenceGame with mode-specific submittable structure', () => {
      const htmlMissing = renderToStaticMarkup(
        React.createElement(MemorySequenceGame, {
          board: missingBoard,
          ageTrack: 'age_6_8',
          onSubmit: () => {},
        })
      );
      expect(htmlMissing).toContain('memory-sequence-game');

      const htmlSwapped = renderToStaticMarkup(
        React.createElement(MemorySequenceGame, {
          board: swappedBoard,
          ageTrack: 'age_9_12',
          onSubmit: () => {},
        })
      );
      expect(htmlSwapped).toContain('memory-sequence-game');
    });
  });

  /* ------------------------------------------------------------------
   * GROUP F: g03-t2 MemoryPosition (missing mode)
   * ------------------------------------------------------------------ */
  describe('Group F: g03-t2 Memory Position', () => {
    const board: Extract<MemoryPositionBoard, { kind: 'memory-position' }> = {
      kind: 'memory-position',
      width: 4,
      height: 4,
      targets: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
      revealed: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      mode: 'missing',
      displayMs: 1200,
      options: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
      ],
    };

    it('computes correct required count excluding revealed positions', () => {
      expect(memoryPositionRequiredCount(board)).toBe(1);
    });

    it('checker accepts only the unrevealed target', () => {
      const item: PuzzleItem = {
        schemaVersion: 1,
        contentVersion: 'p08-candidates-365-v2',
        id: 'test-g03-t2',
        dayIndex: 1,
        slotType: 'main',
        skillGroup: 'memory',
        gameTypeId: 'g03-t2',
        ruleVariantId: 'g03-t2:còn thiếu',
        ageTrack: 'age_6_8',
        locale: 'vi',
        title: 'Test',
        invitation: 'Test',
        tutorial: 'Test',
        explanation: 'Test',
        boardData: board,
        solution: [{ x: 2, y: 2 }],
        validSolutionPredicate: 'memory-position-v1',
        hints: ['a', 'b'],
        praiseKeys: { correct: 'ok', retry: 'try' },
        targetSeconds: 60,
        status: 'design_only',
        fingerprint: 'test-fp',
        source: null,
        editorial: null,
      };

      const correct = checkAnswer(item, [{ x: 2, y: 2 }]);
      expect(correct.ok && correct.correct).toBe(true);

      const allTargets = checkAnswer(item, board.targets);
      expect(allTargets.ok && allTargets.correct).toBe(false);

      const wrong = checkAnswer(item, [{ x: 3, y: 3 }]);
      expect(wrong.ok && wrong.correct).toBe(false);
    });

    it('renders MemoryPositionGame showing required count', () => {
      const html = renderToStaticMarkup(
        React.createElement(MemoryPositionGame, {
          board,
          ageTrack: 'age_6_8',
          onSubmit: () => {},
        })
      );
      expect(html).toContain('memory-position-game');
    });
  });

  /* ------------------------------------------------------------------
   * GROUP G: g05-t3 QuantityTarget (fewest, exact-two, maxItems)
   * ------------------------------------------------------------------ */
  describe('Group G: g05-t3 Quantity Target', () => {
    const fewestBoard: Extract<QuantityTargetBoard, { kind: 'quantity-target' }> = {
      kind: 'quantity-target',
      items: [
        { id: 'item-1', value: 6 },
        { id: 'item-2', value: 3 },
        { id: 'item-3', value: 9 },
        { id: 'item-4', value: 1 },
      ],
      target: 9,
      mode: 'fewest',
      maxItems: 3,
      options: ['item-1', 'item-2', 'item-3', 'item-4'],
    };

    const exactTwoBoard: Extract<QuantityTargetBoard, { kind: 'quantity-target' }> = {
      kind: 'quantity-target',
      items: [
        { id: 'item-1', value: 2 },
        { id: 'item-2', value: 8 },
        { id: 'item-3', value: 7 },
        { id: 'item-4', value: 1 },
      ],
      target: 10,
      mode: 'exact-two',
      maxItems: 2,
      options: ['item-1', 'item-2', 'item-3', 'item-4'],
    };

    it('quantityTargetSatisfies correctly validates against mode rules', () => {
      // In fewest mode: item-3 (length 1) satisfies; item-1+item-2 (length 2) does not
      expect(quantityTargetSatisfies(fewestBoard, ['item-3'])).toBe(true);
      expect(quantityTargetSatisfies(fewestBoard, ['item-1', 'item-2'])).toBe(false);
      expect(quantityTargetSatisfies(fewestBoard, ['item-4'])).toBe(false);

      // In exact-two mode: item-1+item-2 (length 2) satisfies; item-3+item-4+item-1 (length 3, sum 10) does not
      expect(quantityTargetSatisfies(exactTwoBoard, ['item-1', 'item-2'])).toBe(true);
      expect(quantityTargetSatisfies(exactTwoBoard, ['item-3', 'item-4', 'item-1'])).toBe(false);
    });

    it('renders QuantityTargetGame with mode-specific badges and prompts', () => {
      const htmlFewest = renderToStaticMarkup(
        React.createElement(QuantityTargetGame, {
          board: fewestBoard,
          ageTrack: 'age_9_12',
          onSubmit: () => {},
        })
      );
      expect(htmlFewest).toContain('Ít món nhất');
      expect(htmlFewest).toContain('số món ít nhất');

      const htmlExactTwo = renderToStaticMarkup(
        React.createElement(QuantityTargetGame, {
          board: exactTwoBoard,
          ageTrack: 'age_9_12',
          onSubmit: () => {},
        })
      );
      expect(htmlExactTwo).toContain('Đúng 2 món');
      expect(htmlExactTwo).toContain('Chọn đúng 2 món');
    });
  });

  /* ------------------------------------------------------------------
   * GROUP H: g05-t1 QuantityBalance (replace mode)
   * ------------------------------------------------------------------ */
  describe('Group H: g05-t1 Quantity Balance', () => {
    const replaceBoard: Extract<QuantityBalanceBoard, { kind: 'quantity-balance' }> = {
      kind: 'quantity-balance',
      left: [
        { id: 'left-1', weight: 1 },
        { id: 'left-2', weight: 1 },
      ],
      right: [{ id: 'right-1', weight: 7 }],
      mode: 'replace',
      replaceId: 'left-1',
      options: [4, 5, 6, 7],
    };

    it('quantityBalanceReplaceTarget locates the item to replace', () => {
      const target = quantityBalanceReplaceTarget(replaceBoard);
      expect(target).toEqual({ side: 'left', index: 0, weight: 1 });
    });

    it('renders QuantityBalanceGame highlighting the replace target', () => {
      const html = renderToStaticMarkup(
        React.createElement(QuantityBalanceGame, {
          board: replaceBoard,
          ageTrack: 'age_6_8',
          onSubmit: () => {},
        })
      );
      expect(html).toContain('replace-target-slot-left');
      expect(html).toContain('Cần thay');
      expect(html).toContain('thay thế quả được đánh dấu');
    });
  });

  /* ------------------------------------------------------------------
   * GROUP J: g06-t1 PathPlanning (shortestPathOnly)
   * ------------------------------------------------------------------ */
  describe('Group J: g06-t1 Path Planning', () => {
    const shortestBoard: PathBoard = {
      kind: 'path-planning',
      width: 4,
      height: 4,
      start: { x: 0, y: 0 },
      goal: { x: 3, y: 3 },
      walls: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      waypoints: [],
      shortestPathOnly: true,
    };

    it('checker strictly checks shortest path when shortestPathOnly=true', () => {
      const shortest = solvePath(shortestBoard);
      expect(shortest).not.toBeNull();
      if (!shortest) return;

      expect(checkPath(shortestBoard, shortest)).toBe(true);

      // Create a detour path if possible
      const detour = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: 3 },
        { x: 1, y: 3 },
        { x: 2, y: 3 },
        { x: 3, y: 3 },
      ];
      if (detour.length > shortest.length) {
        expect(checkPath(shortestBoard, detour)).toBe(false);
      }
    });

    it('renders PathPlanningGame with shortest path indicators', () => {
      const html = renderToStaticMarkup(
        React.createElement(PathPlanningGame, {
          board: shortestBoard,
          ageTrack: 'age_9_12',
          onSubmit: () => {},
        })
      );
      expect(html).toContain('Đường ngắn nhất');
      expect(html).toContain('ít bước nhất');
    });
  });

  /* ------------------------------------------------------------------
   * TUTORIAL TEXT: Mode-specific tutorials
   * ------------------------------------------------------------------ */
  describe('Mode-specific tutorial copy', () => {
    it('returns mode-specific tutorials for g03-t1, g03-t2, g05-t1, g05-t3, g06-t1', () => {
      const tutG03T1Missing = getNaturalTutorial('g03-t1', 'age_6_8', 1, 'seed-1', {
        kind: 'memory-sequence',
        sequence: ['a', 'b'],
        options: ['a', 'b'],
        displayMs: 1000,
        mode: 'missing',
      });
      expect(tutG03T1Missing).toMatch(/còn trống|bỏ trống|để trống/);

      const tutG03T2Missing = getNaturalTutorial('g03-t2', 'age_6_8', 1, 'seed-1', {
        kind: 'memory-position',
        width: 3,
        height: 3,
        targets: [{ x: 0, y: 0 }],
        revealed: [],
        mode: 'missing',
        displayMs: 1000,
        options: [],
      });
      expect(tutG03T2Missing).toMatch(/còn lại|chưa đánh dấu/);

      const tutG05T1Replace = getNaturalTutorial('g05-t1', 'age_6_8', 1, 'seed-1', {
        kind: 'quantity-balance',
        left: [],
        right: [],
        mode: 'replace',
        options: [],
      });
      expect(tutG05T1Replace).toMatch(/thay/);

      const tutG05T3Fewest = getNaturalTutorial('g05-t3', 'age_9_12', 1, 'seed-1', {
        kind: 'quantity-target',
        items: [],
        target: 10,
        mode: 'fewest',
        maxItems: 3,
        options: [],
      });
      expect(tutG05T3Fewest).toMatch(/ít nhất/);

      const tutG06T1Shortest = getNaturalTutorial('g06-t1', 'age_6_8', 1, 'seed-1', {
        kind: 'path-planning',
        width: 4,
        height: 4,
        start: { x: 0, y: 0 },
        goal: { x: 3, y: 3 },
        walls: [],
        waypoints: [],
        shortestPathOnly: true,
      });
      expect(tutG06T1Shortest).toMatch(/ngắn nhất|ít bước nhất/);
    });
  });
});

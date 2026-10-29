import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { generateRuleSequencePuzzle, describeRuleSequenceBoard } from '@/lib/thinking-games/mechanics/rule-sequence';
import { REMAINING_MECHANICS } from '@/lib/thinking-games/mechanics/remaining';
import { getGameMechanic } from '@/lib/thinking-games/registry';
import { getNaturalTutorial } from '@/lib/thinking-games/content/copy';
import { displayReasoningEliminationExplanation } from '@/lib/thinking-games/display-order';
import { generatePathPuzzle } from '@/lib/thinking-games/mechanics/path-planning';
import type { PuzzleItem } from '@/lib/thinking-games';
import { ReasoningEliminationGame } from '@/components/thinking-games/ReasoningEliminationGame';
import { ReasoningMissingInfoGame } from '@/components/thinking-games/ReasoningMissingInfoGame';
import { QuantityTargetGame } from '@/components/thinking-games/QuantityTargetGame';
import { QuantityGroupingGame } from '@/components/thinking-games/QuantityGroupingGame';

import * as v2Check from '../../../scripts/check-thinking-games-candidates-v2.mjs';

const TRACKS = ['age_6_8', 'age_9_12'] as const;

function generate(gameTypeId: string, seed: string, ageTrack: (typeof TRACKS)[number], variantIndex = 0) {
  const mechanic = REMAINING_MECHANICS.find((entry) => entry.gameTypeId === gameTypeId)!;
  const variants = getGameMechanic(gameTypeId as never)!.variants;
  const variant = variants[variantIndex % variants.length]!;
  return mechanic.generate({ seed, ageTrack, variant });
}

function correctIndex(board: { options: readonly unknown[] }, solution: unknown): number {
  return board.options.findIndex((option) => (typeof option === 'object' && option !== null ? (option as { id: string }).id : option) === solution);
}

describe('answer position bias (finding A)', () => {
  const cases = ['g02-t1', 'g02-t2', 'g03-t3', 'g05-t1', 'g05-t2', 'g07-t2'] as const;

  it.each(cases)('%s spreads the correct option over several slots and keeps it solvable', (gameTypeId) => {
    const positions = new Map<number, number>();
    const total = 120;
    for (let n = 0; n < total; n += 1) {
      const generated = generate(gameTypeId, `seed-${n}`, TRACKS[n % 2]!, n);
      const board = generated.board as unknown as { options: readonly unknown[] };
      const index = correctIndex(board, generated.solution);
      expect(index).toBeGreaterThanOrEqual(0);
      positions.set(index, (positions.get(index) ?? 0) + 1);
    }
    expect(positions.size).toBeGreaterThanOrEqual(3);
    expect(Math.max(...positions.values()) / total).toBeLessThanOrEqual(0.5);
  });

  it('aligns g04-t1 card order with the shuffled, auditable answer order', () => {
    const positions = new Set<number>();
    for (let n = 0; n < 120; n += 1) {
      const generated = generate('g04-t1', `seed-${n}`, TRACKS[n % 2]!, n);
      const board = generated.board as Extract<typeof generated.board, { kind: 'reasoning-elimination' }>;
      const displayedIndex = board.candidates.findIndex((candidate) => candidate.id === generated.solution);
      expect(board.options).toEqual(board.candidates.map((candidate) => candidate.id));
      expect(v2Check.correctOptionIndex({ gameTypeId: 'g04-t1', solution: generated.solution, boardData: board })).toBe(displayedIndex);
      positions.add(displayedIndex);
    }
    expect(positions.size).toBeGreaterThanOrEqual(3);
  });

  it('renders elimination cards in the audited order', () => {
    const generated = generate('g04-t1', 'rendered-order', 'age_9_12');
    const board = generated.board as Extract<typeof generated.board, { kind: 'reasoning-elimination' }>;
    const html = renderToStaticMarkup(React.createElement(ReasoningEliminationGame, {
      board,
      ageTrack: 'age_9_12',
      onSubmit: () => undefined,
    }));
    const renderedIds = [...html.matchAll(/data-testid="option-button-([^"]+)"/g)].map((match) => match[1]);

    expect(renderedIds).toEqual(board.options);
    expect(renderedIds.indexOf(String(generated.solution))).toBe(v2Check.correctOptionIndex({ gameTypeId: 'g04-t1', solution: generated.solution, boardData: board }));
  });

  it('updates an existing elimination explanation to the displayed answer number', () => {
    const generated = generate('g04-t1', 'explanation-order', 'age_9_12');
    const board = generated.board as Extract<typeof generated.board, { kind: 'reasoning-elimination' }>;
    const reorderedOptions = [...board.options.filter((id) => id !== generated.solution), String(generated.solution)];
    const reorderedBoard = { ...board, options: reorderedOptions };
    const corrected = displayReasoningEliminationExplanation(reorderedBoard, 'Đáp án là Bạn số 1.');

    expect(corrected).toBe(`Đáp án là Bạn số ${board.candidates.length}.`);
  });

  it('keeps generated game identifiers out of child-visible text and accessible names', () => {
    const missingInfo = generate('g04-t3', 'copy-render', 'age_6_8').board as Extract<ReturnType<typeof generate>['board'], { kind: 'reasoning-missing-info' }>;
    const quantityTarget = generate('g05-t3', 'copy-render', 'age_6_8').board as Extract<ReturnType<typeof generate>['board'], { kind: 'quantity-target' }>;
    const missingHtml = renderToStaticMarkup(React.createElement(ReasoningMissingInfoGame, {
      board: missingInfo,
      ageTrack: 'age_6_8',
      onSubmit: () => undefined,
    }));
    const targetHtml = renderToStaticMarkup(React.createElement(QuantityTargetGame, {
      board: quantityTarget,
      ageTrack: 'age_6_8',
      onSubmit: () => undefined,
    }));

    expect(missingHtml.replace(/<[^>]+>/g, ' ')).not.toMatch(/candidate-\d+/);
    expect(missingHtml).toContain('Bạn #1');
    expect(targetHtml.replace(/<[^>]+>/g, ' ')).not.toMatch(/item-\d+/);
    expect(targetHtml).toContain('aria-label="Món số 1: giá trị');
  });

  it('audits g05-t2 position bias within each age-track and rule variant', () => {
    const items = Array.from({ length: 6 }, (_, index) => ({
      id: `group-${index}`,
      gameTypeId: 'g05-t2',
      ageTrack: 'age_6_8',
      ruleVariantId: 'g05-t2:exact',
      solution: 4,
      boardData: { mode: 'exact', options: [1, 2, 3, 4] },
    })) as unknown as PuzzleItem[];

    expect(v2Check.positionBiasErrors(items)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'g05-t2:age_6_8|g05-t2:exact' }),
    ]));
  });

  it('renders grouping options in the shuffled order used by its position audit', () => {
    const generated = generate('g05-t2', 'rendered-groups', 'age_9_12', 0);
    const board = generated.board as Extract<typeof generated.board, { kind: 'quantity-grouping' }>;
    const html = renderToStaticMarkup(React.createElement(QuantityGroupingGame, {
      board,
      ageTrack: 'age_9_12',
      onSubmit: () => undefined,
    }));
    const renderedOptions = [...html.matchAll(/data-testid="option-button-(\d+)"/g)].map((match) => Number(match[1]));

    expect(renderedOptions).toEqual(board.options);
    expect(renderedOptions.indexOf(generated.solution as number)).toBe(v2Check.correctOptionIndex({ gameTypeId: 'g05-t2', solution: generated.solution, boardData: board }));
  });

  it('is deterministic per seed', () => {
    const first = generate('g02-t1', 'same-seed', 'age_9_12');
    const second = generate('g02-t1', 'same-seed', 'age_9_12');
    expect(second).toEqual(first);
  });

  it('audit flags a gameType whose correct slot exceeds 60%', () => {
    const items = Array.from({ length: 30 }, (_, index) => ({
      id: `x-${index}`,
      gameTypeId: 'g02-t1',
      solution: 'a',
      boardData: { options: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] },
    })) as unknown as PuzzleItem[];
    const errors = v2Check.positionBiasErrors(items);
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('answer_position_bias');
  });

  it('audit accepts a balanced gameType and ignores tiny samples', () => {
    const ids = ['a', 'b', 'c'];
    const balanced = Array.from({ length: 30 }, (_, index) => ({
      id: `x-${index}`,
      gameTypeId: 'g02-t1',
      solution: ids[index % 3],
      boardData: { options: ids.map((id) => ({ id })) },
    })) as unknown as PuzzleItem[];
    expect(v2Check.positionBiasErrors(balanced)).toHaveLength(0);
    expect(v2Check.positionBiasErrors(balanced.slice(0, 5).map((item) => ({ ...item, solution: 'a' })) as unknown as PuzzleItem[])).toHaveLength(0);
  });
});

describe('V2 catalog quality counters', () => {
  it('reports zero duplicate totals and does not block the quality gate', async () => {
    const { result } = await v2Check.checkAll({ write: false });

    expect(Number.isFinite(result.metrics.duplicateFingerprints)).toBe(true);
    expect(Number.isFinite(result.metrics.normalizedCollisions)).toBe(true);
    expect(result.metrics.duplicateFingerprints).toBe(0);
    expect(result.metrics.normalizedCollisions).toBe(0);
    expect(result.quality).toMatchObject({
      duplicateFingerprints: 0,
      normalizedCollisions: 0,
      blocked: false,
    });
    expect(result.status).toBe('pass_with_review_warnings');
  }, 60_000);
});

describe('g07-t2 perspective (finding B)', () => {
  it('varies the answer direction and never duplicates "ở ở" or shows English', () => {
    const directions = new Set<unknown>();
    for (let n = 0; n < 60; n += 1) {
      const generated = generate('g07-t2', `persp-${n}`, TRACKS[n % 2]!, n);
      directions.add(generated.solution);
      expect(generated.explanation).not.toMatch(/\bở\s+ở\b/);
        expect(generated.explanation).toMatch(/phía trước|phía sau|bên trái|sang phải/);
      const copyErrors = v2Check.copyAuditErrors({ title: 't', invitation: 'i', tutorial: generated.tutorial, explanation: generated.explanation, hints: generated.hints, solution: generated.solution });
      expect(copyErrors).toEqual([]);
    }
    expect(directions.size).toBe(4);
  });
});

describe('underscore tokens (finding C)', () => {
  it('copy audit rejects underscore tokens in child text', () => {
    const errors = v2Check.copyAuditErrors({ title: 'Tên', invitation: 'ok', tutorial: 'Chọn theo kích_cỡ nhé.', explanation: 'ok', hints: ['a', 'b'], solution: 'x' });
    expect(errors.map((error: { code: string }) => error.code)).toContain('copy_underscore_token');
  });

  it.each(['g04-t1', 'g07-t1', 'g08-t2'])('%s emits natural trait names', (gameTypeId) => {
    for (let n = 0; n < 40; n += 1) {
      const generated = generate(gameTypeId, `trait-${n}`, TRACKS[n % 2]!, n);
      const text = JSON.stringify([generated.hints, generated.explanation, generated.tutorial, generated.board]);
      expect(text).not.toMatch(/[\p{L}]_[\p{L}]/u);
    }
  });
});

describe('explanations follow the actual board (finding D)', () => {
  it('g01-t1 interleaved explanation names both steps and the right one for the next slot', () => {
    let checked = 0;
    for (let n = 0; n < 40; n += 1) {
      const board = generateRuleSequencePuzzle({ seed: `inter-${n}`, ageTrack: 'age_9_12', variant: 'xen kẽ' });
      const numeric = board.sequence.every((token) => Number.isFinite(Number(token)));
      if (board.ruleKind !== 'alternating' || !numeric) continue;
      const { explanation } = describeRuleSequenceBoard(board);
      const values = board.sequence.map(Number);
      const first = values[2]! - values[0]!;
      const second = values[3]! - values[1]!;
      expect(explanation).toContain(`1, 3, 5... tăng thêm ${first}`);
      expect(explanation).toContain(`2, 4, 6... tăng thêm ${second}`);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('g06-t1 tutorials only mention stars/keys the board really has', () => {
    const cases = [
      { variant: 'đến đích tránh chướng ngại', stars: false },
      { variant: 'chọn đường ít bước trong bàn nhỏ', stars: false },
      { variant: 'đi qua một điểm bắt buộc', stars: true },
      { variant: 'lấy chìa trước khi tới cửa', stars: true },
    ];
    for (const { variant, stars } of cases) {
      for (const ageTrack of TRACKS) {
        for (let n = 0; n < 6; n += 1) {
          const board = generatePathPuzzle({ seed: `p-${n}`, ageTrack, variant });
          const tutorial = getNaturalTutorial('g06-t1', ageTrack, n, `p-${n}`, board);
          expect(/ngôi sao/.test(tutorial)).toBe(stars);
          expect(tutorial).not.toMatch(/điểm mốc|chìa|cánh cửa/);
          if (board.shortestPathOnly) expect(tutorial).not.toMatch(/hợp lệ/);
        }
      }
    }
  }, 30000);
});

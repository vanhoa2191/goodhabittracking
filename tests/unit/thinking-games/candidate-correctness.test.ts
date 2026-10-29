import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuantityGroupingGame } from '@/components/thinking-games/QuantityGroupingGame';
import { ReasoningMissingInfoGame } from '@/components/thinking-games/ReasoningMissingInfoGame';
import { REMAINING_MECHANICS } from '@/lib/thinking-games/mechanics/remaining';
import { getGameMechanic } from '@/lib/thinking-games/registry';
import { getNaturalTutorial } from '@/lib/thinking-games/content/copy';
import { displayQuantityGroupingOptions } from '@/lib/thinking-games/display-order';
import type { GameAgeTrack, GameTypeId, RuleErrorBoard, SpatialRotationBoard } from '@/lib/thinking-games/types';
import { candidateCorrectnessErrors, correctOptionIndex, positionBiasErrors } from '../../../scripts/check-thinking-games-candidates-v2.mjs';
import { readEditorialRows } from '../../../scripts/generate-thinking-games-candidates-v2.mjs';

const tracks = ['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus'] as const;
const mechanic = (id: GameTypeId) => REMAINING_MECHANICS.find((entry) => entry.gameTypeId === id)!;
const generate = (id: GameTypeId, ageTrack: GameAgeTrack, variant = 0, n = 0) => mechanic(id).generate({
  ageTrack, variant: getGameMechanic(id)!.variants[variant]!, seed: `correctness-${n}`,
});
const points = (cells: readonly { x: number; y: number }[]) => cells.map(({ x, y }) => `${x},${y}`).sort();
const permutations = (values: readonly string[]): string[][] => values.length === 0 ? [[]]
  : values.flatMap((v) => permutations(values.filter((other) => other !== v)).map((rest) => [v, ...rest]));

// Independent repair oracle: omit each possible bad slot and infer the rule
// from all remaining evidence, including slots preceding the first period.
function repairs(sequence: readonly string[], period: number): number[] {
  return sequence.flatMap((_, omitted) => {
    const groups = Array.from({ length: period }, (_, residue) => new Set(sequence.filter((_, i) => i !== omitted && i % period === residue)));
    return groups.every((group) => group.size === 1) && !groups[omitted % period]!.has(sequence[omitted]!) ? [omitted] : [];
  });
}

describe('candidate correctness fixes', () => {
  it.each(['age_6_8', 'age_9_12'] as const)('audits the actual rendered grouping slots and target-card positions on %s', (ageTrack) => {
    for (let n = 0; n < 20; n++) {
      const g = generate('g05-t2', ageTrack, n % 4, n);
      const m = generate('g04-t3', ageTrack, n % 4, n);
      if (g.board.kind !== 'quantity-grouping' || m.board.kind !== 'reasoning-missing-info') throw new Error('board');
      const groupingHtml = renderToStaticMarkup(React.createElement(QuantityGroupingGame, { board: g.board, ageTrack, onSubmit: () => undefined }));
      const displayed = [...groupingHtml.matchAll(/data-testid="option-button-(\d+)"/g)].map((match) => Number(match[1]));
      expect(displayed).toEqual(displayQuantityGroupingOptions(g.board));
      expect(displayed.indexOf(Number(g.solution))).toBe(correctOptionIndex({ gameTypeId: 'g05-t2', solution: g.solution, boardData: g.board }, { displayQuantityGroupingOptions }));
      const missingHtml = renderToStaticMarkup(React.createElement(ReasoningMissingInfoGame, { board: m.board, ageTrack, onSubmit: () => undefined }));
      const cardClasses = [...missingHtml.matchAll(/class="(flex flex-col items-center rounded-2xl border p-2\.5[^"]*)"/g)].map((match) => match[1]!);
      const board = m.board;
      expect(cardClasses).toHaveLength(board.candidates.length);
      expect(cardClasses.findIndex((classes) => classes.includes('ring-2'))).toBe(board.candidates.findIndex((candidate) => candidate.id === board.targetId));
    }
  });

  it.each(tracks)('balances the actual 365-day grouping and target-card strata on %s', (ageTrack) => {
    const items = readEditorialRows().rows.flatMap((row) => [row.main, row.bonus]
      .filter((slot) => ['g05-t2', 'g04-t3'].includes(slot.typeId)).map((slot) => {
        const id = slot.typeId as 'g05-t2' | 'g04-t3';
        const generated = mechanic(id).generate({ ageTrack, variant: slot.variant, seed: `p08-candidates-365-v2|${slot.slotId}|${ageTrack}|vi|${id}|${slot.variant}` });
        return { gameTypeId: id, ageTrack, ruleVariantId: `${id}:${slot.variant}`, boardData: generated.board, solution: generated.solution };
      }));
    expect(items).toHaveLength(61);
    expect(positionBiasErrors(items, { displayQuantityGroupingOptions })).toEqual([]);
  });

  it('candidate audit catches a checker-consistent but ambiguous repeat and a fixed first error slot', () => {
    const item = { id: 'ambiguous', gameTypeId: 'g01-t2', solution: 3, boardData: { kind: 'rule-error', ruleKind: 'repeat', period: 2, sequence: ['lá', 'hoa', 'lá', 'quả'] } };
    expect(candidateCorrectnessErrors(item)).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'rule_error_ambiguous' })]));
    expect(correctOptionIndex(item)).toBe(3);
    expect(positionBiasErrors(Array.from({ length: 30 }, () => item))).toEqual(expect.arrayContaining([expect.objectContaining({ gameTypeId: 'g01-t2', code: 'answer_position_bias' })]));
  });

  it.each(tracks)('candidate audit accepts fresh mechanics and catches missing-info target bias on %s', (track) => {
    for (const id of ['g01-t2', 'g02-t2', 'g02-t3', 'g03-t3', 'g04-t2', 'g06-t2'] as const) {
      for (let variant = 0; variant < 4; variant++) {
        for (let n = 0; n < 15; n++) {
          const generated = generate(id, track, variant, n);
          const board = generated.board;
          const tutorial = getNaturalTutorial(id, track, 1, `correctness-${n}`, board);
          const item = { id: `audit-${n}`, gameTypeId: id, ruleVariantId: `${id}:${getGameMechanic(id)!.variants[variant]}`, solution: generated.solution, boardData: board, tutorial };
          expect(candidateCorrectnessErrors(item), `${id}/${variant}/${track}/${n}`).toEqual([]);
          expect(mechanic(id).parseBoard(board)).toEqual(board);
        }
      }
    }
    const items = Array.from({ length: 30 }, (_, n) => {
      const { board, solution } = generate('g04-t3', track, 0, n);
      if (board.kind !== 'reasoning-missing-info') throw new Error('board');
      return { gameTypeId: 'g04-t3', ageTrack: track, ruleVariantId: 'same', solution, boardData: { ...board, candidates: [...board.candidates].sort((a) => a.id === board.targetId ? -1 : 1) } };
    });
    expect(positionBiasErrors(items)).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'answer_position_bias', gameTypeId: 'g04-t3' })]));
  });
  it.each(tracks)('uses actual clockwise rotation then left-right reflection on %s', (track) => {
    for (let n = 0; n < 40; n++) {
      const { board, solution, tutorial } = generate('g02-t2', track, 3, n);
      if (board.kind !== 'spatial-rotation') throw new Error('board');
      expect(board.mechanicRevision).toBe(2);
      // Clockwise (maxY-y,x), then left-right reflection -> (y,x).
      const expected = board.shape.map(({ x, y }) => ({ x: y, y: x }));
      expect(points(board.options.find((o) => o.id === solution)!.cells)).toEqual(points(expected));
      expect(getNaturalTutorial('g02-t2', track, 1, `correctness-${n}`, board)).toMatch(/trái.*phải/);
      expect(tutorial).toMatch(/trái.*phải/);
      expect(board.options.filter((o) => mechanic('g02-t2').check(board, o.id))).toHaveLength(1);
    }
  });

  it.each(tracks)('specifies one mirror axis and excludes the other-axis distractor on %s', (track) => {
    for (let n = 0; n < 40; n++) {
      const { board } = generate('g02-t2', track, 2, n);
      if (board.kind !== 'spatial-rotation') throw new Error('board');
      expect(getNaturalTutorial('g02-t2', track, 1, `correctness-${n}`, board)).toMatch(/trái.*phải/);
      const maxY = Math.max(...board.shape.map((p) => p.y));
      const other = points(board.shape.map(({ x, y }) => ({ x, y: maxY - y })));
      const solution = mechanic('g02-t2').solve(board);
      for (const option of board.options.filter((o) => o.id !== solution)) expect(points(option.cells)).not.toEqual(other);
    }
  });

  it.each(tracks)('has exactly one independently repairable rule-error slot and varies its position on %s', (track) => {
    for (const variant of [0, 1, 2, 3]) {
      const slots = new Set<number>();
      for (let n = 0; n < 100; n++) {
        const { board, solution } = generate('g01-t2', track, variant, n);
        if (board.kind !== 'rule-error') throw new Error('board');
        expect(board.mechanicRevision).toBe(2);
        const period = board.period ?? 2;
        expect(board.sequence.length).toBeGreaterThanOrEqual(2 * period);
        if (board.ruleKind === 'increment') {
          const valid = board.sequence.flatMap((_, omitted) => {
            const points = board.sequence.map((value, i) => ({ value: Number(value), i })).filter((p) => p.i !== omitted);
            const step = (points[1]!.value - points[0]!.value) / (points[1]!.i - points[0]!.i);
            const start = points[0]!.value - points[0]!.i * step;
            return step > 0 && Number.isInteger(step) && points.every((p) => p.value === start + p.i * step) ? [omitted] : [];
          });
          expect(valid).toEqual([solution]);
        } else expect(repairs(board.sequence, period)).toEqual([solution]);
        expect(mechanic('g01-t2').solve(board)).toBe(solution);
        slots.add(Number(solution));
      }
      expect(slots.has(0)).toBe(true);
      expect(slots.has(1)).toBe(true);
      expect(slots.size).toBeGreaterThanOrEqual(4);
    }
  });

  it('rejects a repeat puzzle whose two slots can both be repaired', () => {
    expect(mechanic('g01-t2').solve({ kind: 'rule-error', mechanicRevision: 2, ruleKind: 'repeat', period: 2, sequence: ['lá', 'hoa', 'lá', 'quả'] })).toBeNull();
  });

  it('preserves historical unversioned rule/rotation boards while revision 2 uses corrected semantics', () => {
    const repeat: RuleErrorBoard = { kind: 'rule-error', ruleKind: 'repeat', period: 2, sequence: ['lá', 'hoa', 'lá', 'quả'] };
    expect(mechanic('g01-t2').parseBoard(repeat)).toEqual(repeat);
    expect(mechanic('g01-t2').solve(repeat)).toBe(3);
    expect(mechanic('g01-t2').check(repeat, 3)).toBe(true);
    expect(mechanic('g01-t2').solve({ ...repeat, mechanicRevision: 2 })).toBeNull();
    const rotation: SpatialRotationBoard = {
      kind: 'spatial-rotation', turn: 'quarter-mirror', shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 0 }],
      options: [
        { id: 'old', cells: [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 0 }] },
        { id: 'new', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 2 }] },
      ],
    };
    expect(mechanic('g02-t2').parseBoard(rotation)).toEqual(rotation);
    expect(mechanic('g02-t2').solve(rotation)).toBe('old');
    expect(mechanic('g02-t2').check(rotation, 'new')).toBe(false);
    expect(mechanic('g02-t2').solve({ ...rotation, mechanicRevision: 2 })).toBe('new');
    expect(mechanic('g02-t2').check({ ...rotation, mechanicRevision: 2 }, 'old')).toBe(false);
  });

  it.each(tracks)('has multiple valid command orders and presents constraints out of solution order on %s', (track) => {
    for (let n = 0; n < 30; n++) {
      const { board, solution } = generate('g06-t2', track, n % 4, n);
      if (board.kind !== 'planning-command-order') throw new Error('board');
      const orders = permutations(board.commands.map((c) => c.id));
      const valid = orders.filter((order) => board.before.every(([a, b]) => order.indexOf(a) < order.indexOf(b)));
      expect(valid.length).toBeGreaterThanOrEqual(2);
      for (const order of orders) expect(mechanic('g06-t2').check(board, order)).toBe(valid.includes(order));
      expect(valid).toContainEqual(solution);
      const positions = new Map((solution as string[]).map((id, i) => [id, i]));
      const sorted = [...board.before].sort(([a, b], [c, d]) => positions.get(a)! - positions.get(c)! || positions.get(b)! - positions.get(d)!);
      expect(board.before).not.toEqual(sorted);
      expect(getNaturalTutorial('g06-t2', track, 1, 'test', board)).not.toContain((solution as string[]).map((id) => board.commands.find((c) => c.id === id)!.text).join(' → '));
    }
  });

  it.each(tracks)('offers both cells of the broken symmetry pair and accepts both on %s', (track) => {
    const { board, explanation } = generate('g02-t3', track, 1);
    if (board.kind !== 'spatial-symmetry') throw new Error('board');
    const mismatches = board.grid.flatMap((row, y) => row.flatMap((value, x) => {
      const other = board.axis === 'vertical' ? { x: row.length - 1 - x, y } : { x, y: board.grid.length - 1 - y };
      return value !== board.grid[other.y]![other.x] ? [{ x, y }] : [];
    }));
    expect(mismatches).toHaveLength(2);
    for (const point of mismatches) {
      expect(board.options).toContainEqual(point);
      expect(mechanic('g02-t3').check(board, point)).toBe(true);
    }
    expect(explanation).toMatch(/cặp ô/);
  });

  it.each(tracks)('makes the two-step if-then variants require two actual inferences on %s', (track) => {
    for (const variant of [2, 3]) {
      const { board, solution } = generate('g04-t2', track, variant);
      if (board.kind !== 'reasoning-if-then') throw new Error('board');
      expect(board.rules.length).toBeGreaterThanOrEqual(2);
      expect(board.rules.filter((r) => board.facts.includes(r.if)).map((r) => r.then)).not.toContain(solution);
      expect(mechanic('g04-t2').check(board, solution)).toBe(true);
    }
  });

  it.each(tracks)('uses equally formatted color choices for memory property changes on %s', (track) => {
    for (let n = 0; n < 30; n++) {
      const { board, solution } = generate('g03-t3', track, 3, n);
      if (board.kind !== 'memory-change') throw new Error('board');
      expect(board.options.every((option) => / (đỏ|xanh|vàng|tím)$/.test(option))).toBe(true);
      expect(board.options.filter((option) => mechanic('g03-t3').check(board, option))).toEqual([solution]);
    }
  });

  it.each(tracks)('spreads grouping answer slots and missing-info target cards on %s', (track) => {
    for (const variant of [0, 1, 2, 3]) {
      const grouping: number[] = [];
      const missing: number[] = [];
      for (let n = 0; n < 100; n++) {
        const g = generate('g05-t2', track, variant, n);
        const m = generate('g04-t3', track, variant, n);
        if (g.board.kind !== 'quantity-grouping' || m.board.kind !== 'reasoning-missing-info') throw new Error('board');
        grouping.push(displayQuantityGroupingOptions(g.board).indexOf(Number(g.solution)));
        const missingBoard = m.board;
        missing.push(missingBoard.candidates.findIndex((c) => c.id === missingBoard.targetId));
      }
      for (const slots of [grouping, missing]) {
        expect(new Set(slots).size).toBeGreaterThanOrEqual(3);
        expect(Math.max(...slots.map((slot) => slots.filter((v) => v === slot).length)) / slots.length).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it.each(tracks)('quantity-target accepts all and only independently valid subsets on %s', (track) => {
    for (let variant = 0; variant < 4; variant++) {
      for (let n = 0; n < 15; n++) {
        const { board } = generate('g05-t3', track, variant, n);
        if (board.kind !== 'quantity-target') throw new Error('board');
        const subsets = Array.from({ length: 2 ** board.items.length }, (_, mask) => board.items.filter((_, i) => mask & 2 ** i));
        const allowed = subsets.filter((s) => s.length > 0 && s.length <= board.maxItems);
        const sum = (s: typeof board.items) => s.reduce((a, item) => a + item.value, 0);
        const exact = allowed.filter((s) => sum(s) === board.target);
        const min = Math.min(...exact.map((s) => s.length));
        const best = Math.max(...allowed.filter((s) => sum(s) <= board.target).map(sum));
        for (const subset of subsets) {
          const valid = allowed.includes(subset) && (board.mode === 'not-over' ? sum(subset) === best
            : sum(subset) === board.target && (board.mode === 'fewest' ? subset.length === min : board.mode !== 'exact-two' || subset.length === 2));
          expect(mechanic('g05-t3').check(board, subset.map((i) => i.id))).toBe(valid);
        }
      }
    }
  });
});

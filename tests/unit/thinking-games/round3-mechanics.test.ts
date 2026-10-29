import { describe, expect, it } from 'vitest';

import { REMAINING_MECHANICS } from '@/lib/thinking-games/mechanics/remaining';
import { getGameMechanic } from '@/lib/thinking-games/registry';
import type { BoardData, GameTypeId } from '@/lib/thinking-games/types';

const TRACKS = ['age_6_8', 'age_9_12'] as const;

function mechanicFor(id: GameTypeId) {
  return REMAINING_MECHANICS.find((mechanic) => mechanic.gameTypeId === id)!;
}

function permutations(values: readonly string[]): string[][] {
  if (values.length === 0) return [[]];
  return values.flatMap((value) => permutations(values.filter((other) => other !== value)).map((rest) => [value, ...rest]));
}

describe('round 3 generator semantics', () => {
  it.each(TRACKS)('g04-t2 treats every word pool as game-local symbols on %s', (ageTrack) => {
    const mechanic = mechanicFor('g04-t2');
    const pools = new Set<string>();
    for (const variant of getGameMechanic('g04-t2')!.variants) {
      for (let seed = 0; seed < 40; seed += 1) {
        const generated = mechanic.generate({ seed: `r3-${seed}`, ageTrack, variant });
        const board = generated.board;
        if (board.kind !== 'reasoning-if-then') throw new Error('wrong board');
        expect(mechanic.parseBoard(board)).toEqual(board);
        pools.add(board.facts[0]!);
        expect(generated.tutorial).toContain('thẻ ký hiệu');
        expect(generated.tutorial).toContain('chỉ dùng trong ván này');
        expect(generated.explanation).toContain('thẻ ký hiệu');
        // Independently apply the displayed rules, rather than trusting solve/check.
        const known = new Set(board.facts);
        for (let pass = 0; pass < board.rules.length; pass += 1) {
          for (const rule of board.rules) {
            if (known.has(rule.if)) known.add(rule.then);
            const text = `"${rule.if}" → "${rule.then}"`;
            expect(generated.explanation).toContain(text);
          }
        }
        const valid = board.options.filter((option) => known.has(option) && !board.facts.includes(option));
        expect(valid).toEqual([generated.solution]);
        expect(generated.explanation).toContain(`thẻ "${generated.solution}"`);
        expect(mechanic.solve(board)).toBe(generated.solution);
        for (const option of board.options) expect(mechanic.check(board, option)).toBe(valid.includes(option));
        expect(mechanic.check(board, board.facts[0])).toBe(false);
        const steps = ageTrack === 'age_6_8' ? 2 : 3;
        expect(board.options).toHaveLength(steps + 2);
        expect(board.rules).toHaveLength(steps + (variant === getGameMechanic('g04-t2')!.variants[3] ? 1 : 0));
        expect(generated.tutorial.length).toBeLessThanOrEqual(240);
        expect(generated.explanation.length).toBeLessThanOrEqual(300);
      }
    }
    expect(pools).toEqual(new Set(['mây', 'hạt mầm', 'mặt trời', 'nắng gắt']));
  });

  it.each(TRACKS)('g06-t2 exposes all ordering constraints and accepts exactly their topological sorts on %s', (ageTrack) => {
    const mechanic = mechanicFor('g06-t2');
    const scenarios = new Set<string>();
    for (const variant of getGameMechanic('g06-t2')!.variants) {
      for (let seed = 0; seed < 24; seed += 1) {
        const generated = mechanic.generate({ seed: `r3-${seed}`, ageTrack, variant });
        const board = generated.board;
        if (board.kind !== 'planning-command-order') throw new Error('wrong board');
        expect(mechanic.parseBoard(board)).toEqual(board);
        scenarios.add(board.commands.find((command) => command.id === 'step-1')!.text);
        expect(board.commands).toHaveLength(ageTrack === 'age_6_8' ? 4 : 5);
        expect(generated.tutorial).toMatch(/quy tắc/);
        expect(generated.explanation).toContain('Một thứ tự theo luật của ván này');
        for (const [before, after] of board.before) {
          const first = board.commands.find((command) => command.id === before)!.text;
          const second = board.commands.find((command) => command.id === after)!.text;
          const constraint = `${first} → ${second}`;
          expect(generated.tutorial).toContain(`${first} phải làm trước ${second}`);
          expect(generated.explanation).toContain(constraint);
        }
        const orders = permutations(board.commands.map((command) => command.id));
        for (const order of orders) {
          const valid = board.before.every(([first, second]) => order.indexOf(first) < order.indexOf(second));
          expect(mechanic.check(board, order)).toBe(valid);
        }
        expect(mechanic.check(board, mechanic.solve(board))).toBe(true);
        expect(mechanic.check(board, generated.solution)).toBe(true);
        expect(mechanic.check(board, board.commands.map(() => board.commands[0]!.id))).toBe(false);
        expect(generated.tutorial.length).toBeLessThanOrEqual(240);
        expect(generated.explanation.length).toBeLessThanOrEqual(300);
      }
    }
    expect(scenarios.size).toBe(6);
  });

  it('g06-t2 keeps all valid alternatives when the rules leave two steps unordered', () => {
    const mechanic = mechanicFor('g06-t2');
    const board: Extract<BoardData, { kind: 'planning-command-order' }> = {
      kind: 'planning-command-order',
      commands: [{ id: 'bowl', text: 'Lấy bát' }, { id: 'rice', text: 'Xới cơm' }, { id: 'soup', text: 'Múc canh' }, { id: 'invite', text: 'Mời cả nhà' }],
      before: [['bowl', 'rice'], ['bowl', 'soup'], ['rice', 'invite'], ['soup', 'invite']],
    };
    const accepted = permutations(board.commands.map((command) => command.id)).filter((order) => mechanic.check(board, order));
    expect(accepted).toEqual([['bowl', 'rice', 'soup', 'invite'], ['bowl', 'soup', 'rice', 'invite']]);
    expect(mechanic.check(board, mechanic.solve(board))).toBe(true);
  });

  it.each(TRACKS)('g08-t3 explains the actual wrong scene and relevant rule on %s', (ageTrack) => {
    const mechanic = mechanicFor('g08-t3');
    const badScenes = new Set<string>();
    const positions = new Set<number>();
    const variants = getGameMechanic('g08-t3')!.variants;
    for (const [index, variant] of variants.entries()) {
      for (let seed = 0; seed < 32; seed += 1) {
        const generated = mechanic.generate({ seed: `r3-${seed}`, ageTrack, variant });
        const board = generated.board;
        if (board.kind !== 'observation-implausible') throw new Error('wrong board');
        expect(mechanic.parseBoard(board)).toEqual(board);
        expect(board.scene).toHaveLength(ageTrack === 'age_6_8' ? 4 : 5);
        const wrong = board.scene.filter((scene) => scene.traits[board.rule.trait] !== board.rule.value);
        expect(wrong).toHaveLength(1);
        const scene = wrong[0]!;
        const sceneIndex = board.scene.indexOf(scene);
        badScenes.add(scene.text);
        positions.add(sceneIndex);
        expect(generated.solution).toBe(scene.id);
        expect(mechanic.solve(board)).toBe(scene.id);
        for (const option of board.options) expect(mechanic.check(board, option)).toBe(option === scene.id);
        expect(generated.explanation).toContain(`Tình huống ${sceneIndex + 1}`);
        expect(generated.explanation).toContain(scene.text);
        expect(generated.explanation).toContain(`"${board.rule.value}"`);
        expect(generated.explanation).toContain(`"${scene.traits[board.rule.trait]}"`);
        expect(generated.explanation.length).toBeLessThanOrEqual(300);
        if (index === 3) {
          expect(scene.traits.bước).toBe('đi ngoài vạch');
          expect(generated.explanation).not.toContain('đi sai hướng');
        } else if (index === 1) {
          expect(scene.traits.bước).toBe('đi sai hướng');
          expect(generated.explanation).not.toContain('đi ngoài vạch');
        }
      }
    }
    expect(badScenes.size).toBe(4);
    expect(positions.size).toBeGreaterThan(1);
  });
});

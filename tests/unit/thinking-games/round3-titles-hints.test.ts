import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { getTrackHints, TRACK_HINTS } from '@/lib/thinking-games/content/hints';
import { getVariedTitle, TITLE_NAMES } from '@/lib/thinking-games/content/titles';
import { REMAINING_MECHANICS } from '@/lib/thinking-games/mechanics/remaining';
import { checkPath, describePathBoard, solvePath } from '@/lib/thinking-games/mechanics/path-planning';
import { getGameMechanic } from '@/lib/thinking-games/registry';
import type { BoardData, GameAgeTrack, GameTypeId, PathBoard } from '@/lib/thinking-games/types';

const TRACKS = ['age_6_8', 'age_9_12'] as const;
const mechanic = (id: GameTypeId) => REMAINING_MECHANICS.find((entry) => entry.gameTypeId === id)!;
const variants = (id: GameTypeId) => getGameMechanic(id)!.variants;
const generate = (id: GameTypeId, ageTrack: GameAgeTrack, index = 0, seed = 'r3-hints') =>
  mechanic(id).generate({ ageTrack, seed, variant: variants(id)[index]! });
const ui = (file: string) => readFileSync(new URL(`../../../src/components/thinking-games/${file}.tsx`, import.meta.url), 'utf8');
const allHints = (id: GameTypeId) => Object.values(TRACK_HINTS[id]).flatMap((tier) => Object.values(tier).flat().flat()).join(' ');

describe('round 3 title/hint semantic regressions', () => {
  it('TH-F01 guides the real no-adjacent-twins alternating counterexample', () => {
    const board: Extract<BoardData, { kind: 'rule-error' }> = {
      kind: 'rule-error', sequence: ['lá', 'nắng', 'hoa', 'nắng', 'lá'], ruleKind: 'alternating',
    };
    expect(board.sequence.every((token, index) => index === 0 || token !== board.sequence[index - 1])).toBe(true);
    expect(mechanic('g01-t2').check(board, 2)).toBe(true);
    const hints = getTrackHints('g01-t2', 'age_6_8', 'D006-bonus-vi68', board.ruleKind).join(' ');
    expect(hints).not.toMatch(/giống nhau đứng liền nhau/);
    expect(hints).toMatch(/từng vị trí/);
    expect(hints).toMatch(/nhịp/);
  });

  it.each(TRACKS)('TH-F02 distinguishes all actual transformation modes on %s', (ageTrack) => {
    const seen = new Set<string>();
    for (let index = 0; index < variants('g02-t2').length; index += 1) {
      const generated = generate('g02-t2', ageTrack, index);
      const board = generated.board;
      if (board.kind !== 'spatial-rotation') throw new Error('wrong board');
      seen.add(board.turn);
      expect(mechanic('g02-t2').check(board, generated.solution)).toBe(true);
      const hints = generated.hints.join(' ');
      if (board.turn === 'quarter-mirror') {
        expect(ui('SpatialRotationGame')).toContain('Xoay 90 độ rồi lật qua gương');
        expect(hints).toMatch(/xoay.*rồi.*lật/i);
        expect(generated.hints).not.toEqual(getTrackHints('g02-t2', ageTrack, 'r3-hints', 'flip'));
      } else if (board.turn === 'mirror') {
        expect(hints).toMatch(/lật/);
        expect(hints).not.toMatch(/xoay.*rồi.*lật/i);
      } else {
        expect(hints).toMatch(/xoay/);
      }
      // Generic explanation must also describe mirror-only and combined operations.
      expect(generated.explanation).not.toMatch(/đúng góc quay|Khi xoay hình mẫu/);
      expect(generated.explanation).toMatch(/thao tác|biến đổi/);
    }
    expect(seen).toEqual(new Set(['quarter', 'half', 'mirror', 'quarter-mirror']));
  });

  it.each([
    ['g02-t2', /xoay|lật|một vòng/i, ['quarter', 'half', 'mirror', 'quarter-mirror']],
    ['g02-t3', /hoàn thành|làm tranh cân xứng|tranh hai bên giống nhau/i, ['fill', 'find-break']],
    ['g05-t1', /cần thêm/i, ['missing', 'compare', 'replace']],
    ['g05-t2', /được mấy nhóm/i, ['exact', 'floor', 'remainder', 'needed']],
    ['g07-t3', /không đi đường cũ|không trùng|tránh đường cũ/i, []],
  ] as const)('TH-F03..F06/F09: all %s title names fit every board mode', (id, misleading, expectedModes) => {
    const modes = new Set<string>();
    for (const ageTrack of TRACKS) {
      for (let index = 0; index < variants(id).length; index += 1) {
        const board = generate(id, ageTrack, index).board;
        if (board.kind === 'spatial-rotation') modes.add(board.turn);
        else if ('mode' in board) modes.add(String(board.mode));
        for (const name of TITLE_NAMES[id]) {
          expect(name.text).not.toMatch(misleading);
          expect(name.text.length).toBeGreaterThan(5);
        }
      }
    }
    for (const mode of expectedModes) expect(modes.has(mode), `${id}: ${mode}`).toBe(true);
  });

  it('TH-F07 keeps every young ordering hint tied to the declared game relations', () => {
    for (let index = 0; index < variants('g06-t2').length; index += 1) {
      const generated = generate('g06-t2', 'age_6_8', index);
      if (generated.board.kind !== 'planning-command-order') throw new Error('wrong board');
      expect(generated.board.before.length).toBeGreaterThan(0);
      expect(generated.tutorial).toContain('Luật riêng của ván này');
    }
    for (const pair of TRACK_HINTS['g06-t2'].young.default!) {
      expect(pair.join(' ')).toMatch(/luật.*ván này/);
      expect(pair.join(' ')).not.toMatch(/ở nhà|làm việc đó thật/);
    }
  });

  it('TH-F08 allows screen-aligned directions when the viewer faces north', () => {
    const generated = generate('g07-t2', 'age_9_12');
    if (generated.board.kind !== 'flexibility-perspective') throw new Error('wrong board');
    expect(generated.board.viewer.facing).toBe('north');
    expect(mechanic('g07-t2').check(generated.board, generated.solution)).toBe(true);
    const hints = allHints('g07-t2');
    expect(hints).not.toContain('của bạn ấy khác với');
    expect(hints).toMatch(/có thể khác/);
  });

  it.each(TRACKS)('TH-F09 accepts a route overlapping old interior cells on %s', (ageTrack) => {
    const knownPath = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }];
    const alternate = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }];
    const board: Extract<BoardData, { kind: 'flexibility-alternative' }> = {
      kind: 'flexibility-alternative', width: 3, height: 3, start: knownPath[0]!, goal: knownPath[4]!, walls: [], knownPath,
    };
    expect(mechanic('g07-t3').check(board, alternate)).toBe(true);
    expect(mechanic('g07-t3').check(board, knownPath)).toBe(false);
    expect(ui('FlexibilityAlternativeGame')).toContain('Đường cũ');
    const hints = getTrackHints('g07-t3', ageTrack, 'overlap').join(' ');
    expect(hints).toMatch(/[đĐ]ường cũ/);
    expect(hints).toMatch(/chung|trùng một đoạn/);
    expect(hints).toMatch(/khác.*chỗ|rẽ khác/);
    expect(hints).not.toMatch(/xám|màu|không trùng|không đi đường cũ/);
  });

  it('TH-F10 uses the actual cross-out control', () => {
    expect(ui('ReasoningEliminationGame')).toContain("'Gạch bớt'");
    const hints = allHints('g04-t1');
    expect(hints).toContain('Gạch bớt');
    expect(hints).not.toMatch(/úp xuống|lật thẻ/);
  });

  it('TH-F11 compares counts instead of guaranteeing largest-first on historical D213-main-vi912', () => {
    const values = [6, 8, 1, 9, 4];
    const board: Extract<BoardData, { kind: 'quantity-target' }> = {
      kind: 'quantity-target', items: values.map((value, i) => ({ id: `item-${i + 1}`, value })),
      target: 14, maxItems: 3, mode: 'fewest', options: values.map((_, i) => `item-${i + 1}`),
    };
    expect(mechanic('g05-t3').check(board, ['item-4', 'item-5', 'item-3'])).toBe(false); // 9+4+1
    expect(mechanic('g05-t3').check(board, ['item-1', 'item-2'])).toBe(true); // 6+8
    const valid = Array.from({ length: 1 << values.length }, (_, mask) => values.filter((_, i) => (mask & (1 << i)) !== 0))
      .filter((parts) => parts.reduce((sum, value) => sum + value, 0) === 14);
    expect(Math.min(...valid.map((parts) => parts.length))).toBe(2);
    const hints = getTrackHints('g05-t3', 'age_9_12', 'D213-main-vi912', 'fewest', { target: 14 }).join(' ');
    expect(hints).not.toMatch(/bắt đầu từ các số lớn|thay hai món nhỏ/i);
    expect(hints).toMatch(/cặp/);
    expect(hints).toMatch(/[sS]o.*cách/);
    expect(hints).toContain('14');
  });

  it('TH-S01/S02/S04 uses concrete trait labels and mình–bạn vocabulary', () => {
    for (const ageTrack of TRACKS) {
      const hints = getTrackHints('g07-t1', ageTrack, 'shape', 'default', { trait: 'hình' }).join(' ');
      expect(hints).not.toMatch(/có hình đúng|đặc điểm hình;/);
      expect(hints).toMatch(/hình dạng|luật/);
    }
    expect(allHints('g04-t2')).not.toMatch(/cho ta/);
    expect(allHints('g04-t2')).toContain('giúp bạn');
    const missing = getTrackHints('g05-t1', 'age_9_12', 'balance', 'missing').join(' ');
    expect(missing).not.toContain('ẩn số');
    expect(missing).toMatch(/hai đĩa.*bằng nhau/);
  });

  it.each(TRACKS)('TH-S03 permits a shortest path that temporarily moves away from the goal on %s', (ageTrack) => {
    const board: PathBoard = {
      kind: 'path-planning', width: 4, height: 3, start: { x: 0, y: 0 }, goal: { x: 3, y: 0 },
      walls: [{ x: 1, y: 0 }, { x: 1, y: 1 }], waypoints: [], shortestPathOnly: true,
    };
    const path = solvePath(board)!;
    expect(path).toHaveLength(8);
    expect(checkPath(board, path)).toBe(true);
    const distance = (p: { x: number; y: number }) => Math.abs(p.x - board.goal.x) + Math.abs(p.y - board.goal.y);
    expect(path.some((p, i) => i > 0 && distance(p) > distance(path[i - 1]!))).toBe(true);
    const hints = describePathBoard(board, { ageTrack, seed: 'detour' }).hints.join(' ');
    expect(hints).not.toMatch(/mỗi bước.*(gần đích|rút ngắn)|[đĐ]ừng đi vòng|[tT]ránh đi lùi/);
    expect(hints).toMatch(/bước/);
    expect(hints).toMatch(/tường/);
    expect(hints).toMatch(/ít bước nhất/);
  });
});

describe('title diversity without catalog writes', () => {
  it.each(TRACKS)('preserves eight distinct names/type and 730 unique titles with no adjacent-day repeats on %s', (ageTrack) => {
    const names = Object.values(TITLE_NAMES).flat().map((name) => name.text);
    expect(new Set(names).size).toBe(192);
    for (const pool of Object.values(TITLE_NAMES)) expect(pool).toHaveLength(8);
    // Read editorial slot/chapter data, then run the existing title selector in generator order.
    const csv = readFileSync(new URL('../../../docs/research/2026-10-17-daily-thinking-games-365.csv', import.meta.url), 'utf8').trim();
    const rows = csv.split(/\r?\n/).slice(1).map((line) => line.split(','));
    expect(rows).toHaveLength(365);
    const all = new Set<string>();
    let previous = new Set<string>();
    for (const row of rows) {
      const current = new Set<string>();
      for (const offset of [6, 15]) {
        const title = getVariedTitle({
          gameTypeId: row[offset + 1] as GameTypeId, theme: row[4]!, ageTrack,
          slotId: row[offset]!, avoid: new Set([...previous, ...current]),
        });
        expect(title).not.toMatch(/\d/);
        expect(previous.has(title)).toBe(false);
        expect(current.has(title)).toBe(false);
        expect(all.has(title)).toBe(false);
        current.add(title);
        all.add(title);
      }
      previous = current;
    }
    expect(all.size).toBe(730);
  });
});

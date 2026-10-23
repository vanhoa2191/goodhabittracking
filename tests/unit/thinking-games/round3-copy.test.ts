import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  GAME_INVITATIONS,
  GAME_TUTORIALS,
  getNaturalInvitation,
  getNaturalTutorial,
  selectBySeed,
} from '@/lib/thinking-games/content/copy';
import { REMAINING_MECHANICS } from '@/lib/thinking-games/mechanics/remaining';
import { getGameMechanic } from '@/lib/thinking-games/registry';
import { GAME_AGE_TRACKS } from '@/lib/thinking-games/types';
import type { BoardData, GameAgeTrack, GameTypeId } from '@/lib/thinking-games/types';

// JavaScript \b treats Vietnamese letters as non-word characters.
const pressure = /(?<!\p{L})(?:kiểm tra\s+(?:khả năng|sự chú ý|năng lực|trình độ)|chấm điểm|đo lường|đòi hỏi bạn phải|xem ai|ai hơn|nhanh nhất|chậm nhất|thua kém|kém cỏi|đần|ngốc|ganh đua|áp lực|đua top|so bì|IQ)(?!\p{L})/iu;
const hierarchical = /(?<!\p{L})(?:bé|thầy|cô|con(?!\s+(?:số|đường|vật|mèo|chó|ngựa|chuột|ong|cá|thỏ|chim|bướm|châu chấu|robot|đoàn)(?!\p{L})))(?!\p{L})/iu;
const retired = [
  'Thử thách chiếc máy biến đổi hôm nay sẽ kiểm tra khả năng suy đoán của bạn đấy!',
  'Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé.',
  'Thử thách nhớ chuỗi hôm nay xem ai nhớ nhanh và chính xác hơn nào!',
  'Thử thách gom đủ mục tiêu hôm nay sẽ kiểm tra khả năng cộng nhẩm của bạn đấy!',
  'Thử thách tìm điểm khác biệt hôm nay sẽ kiểm tra sự chú ý chi tiết của bạn đấy!',
];

type Candidate = {
  id: string; gameTypeId: GameTypeId; ageTrack: GameAgeTrack;
  dayIndex: number; ruleVariantId: string; boardData: BoardData;
};
const candidates: Candidate[] = [
  'batch-01-days-001-028.json', 'batch-02-days-029-091.json',
  'batch-03-days-092-182.json', 'batch-04-days-183-273.json', 'batch-05-days-274-365.json',
].flatMap((file) => JSON.parse(readFileSync(`content/thinking-games/candidates/365-v2/${file}`, 'utf8')).items);

function catalogSeed(item: Candidate): string {
  const slot = item.id.replace(/-vi(?:68|912)$/, '');
  const variant = item.ruleVariantId.slice(item.gameTypeId.length + 1);
  return `p08-candidates-365-v2|${slot}|${item.ageTrack}|vi|${item.gameTypeId}|${variant}`;
}

function expectSupportive(text: string) {
  expect(text).not.toMatch(pressure);
  expect(text).not.toMatch(hierarchical);
}

describe('round 3 non-punitive invitations', () => {
  it.each(retired)('detects the retired pressure phrase: %s', (text) => {
    expect(text).toMatch(pressure);
  });

  it('detects Vietnamese address words without confusing classifiers', () => {
    for (const text of ['Bé, thử nhé!', 'Cô sẽ giúp.', 'Thầy chờ con.', 'Con chọn nhé.']) {
      expect(text).toMatch(hierarchical);
    }
    for (const text of ['Bạn chọn con số.', 'Mình đi con đường này.', 'công việc', 'béton']) {
      expect(text).not.toMatch(hierarchical);
    }
  });

  it('keeps every selectable invitation supportive', () => {
    for (const [id, pool] of Object.entries(GAME_INVITATIONS)) {
      for (let day = 0; day < pool.length; day += 1) {
        expectSupportive(getNaturalInvitation(id as GameTypeId, day, ''));
      }
    }
  });

  it('generates supportive copy for the actual historical catalog inputs', () => {
    const inventory: { items: { id: string; category: string; actualEvidence: string }[] } = JSON.parse(
      readFileSync('plans/261021-daily-thinking-games/execution/content-review/codex-current-inventory.json', 'utf8'),
    );
    const flagged = inventory.items.filter((item) => item.category === 'pressure_comparison_language');
    expect(flagged.length).toBeGreaterThan(0);
    for (const finding of flagged) expect(finding.actualEvidence).toMatch(pressure);
    for (const item of candidates) {
      const seed = catalogSeed(item);
      const invitation = getNaturalInvitation(item.gameTypeId, item.dayIndex, seed);
      expectSupportive(invitation);
      const finding = flagged.find((entry) => entry.id === item.id);
      if (finding) expect(invitation).not.toBe(finding.actualEvidence);
    }
    for (const finding of flagged) expect(candidates.some((item) => item.id === finding.id)).toBe(true);
  });
});

describe('round 3 final catalog tutorial path', () => {
  it.each(GAME_AGE_TRACKS.flatMap((track) =>
    (['g04-t2', 'g06-t2'] as const).map((id) => [track, id] as const),
  ))('frames symbols and discloses every actual ordering edge on %s / %s', (ageTrack, id) => {
    const mechanic = REMAINING_MECHANICS.find((entry) => entry.gameTypeId === id)!;
    for (const variant of getGameMechanic(id)!.variants) {
      for (let index = 0; index < 40; index += 1) {
        const seed = `r3-${index}`;
        const generated = mechanic.generate({ seed, ageTrack, variant });
        const board = generated.board;
        // Same boardData argument used by buildCandidate, which overwrites generated.tutorial.
        const tutorial = getNaturalTutorial(id, ageTrack, index, seed, board);
        expect(tutorial.length).toBeLessThanOrEqual(240);
        expect(generated.explanation.length).toBeLessThanOrEqual(300);
        if (board.kind === 'reasoning-if-then') {
          expect(tutorial).toContain('Các từ là thẻ ký hiệu.');
          expect(tutorial).toContain('Luật chỉ dùng trong ván này.');
          // Instructions must not reveal the inferred answer.
          expect(` ${tutorial.match(/\p{L}+/gu)!.join(' ')} `).not.toContain(` ${generated.solution} `);
        } else if (board.kind === 'planning-command-order') {
          expect(tutorial).toContain('Luật riêng của ván này');
          expect(tutorial).toContain('→ là làm trước');
          expect(tutorial).toContain('Mọi thứ tự giữ đủ luật đều được.');
          const labels = new Map(board.commands.map((command) => [command.id, command.text]));
          for (const [first, second] of board.before) {
            expect(tutorial).toContain(`${labels.get(first)} → ${labels.get(second)}`);
          }
          // Only disclose the board's edges, not an extra chosen total ordering.
          expect(tutorial.match(/ → /g)).toHaveLength(board.before.length);
        } else throw new Error('unexpected board');
      }
    }
  });

  it('describes a partial order without adding a rice/soup preference', () => {
    const board: Extract<BoardData, { kind: 'planning-command-order' }> = {
      kind: 'planning-command-order',
      commands: [{ id: 'bowl', text: 'Lấy bát' }, { id: 'rice', text: 'Xới cơm' }, { id: 'soup', text: 'Múc canh' }, { id: 'invite', text: 'Mời cả nhà' }],
      before: [['bowl', 'rice'], ['bowl', 'soup'], ['rice', 'invite'], ['soup', 'invite']],
    };
    const tutorial = getNaturalTutorial('g06-t2', 'age_6_8', 6, 'partial-order', board);
    expect(tutorial).toContain('Lấy bát → Xới cơm');
    expect(tutorial).toContain('Lấy bát → Múc canh');
    expect(tutorial).toContain('Xới cơm → Mời cả nhà');
    expect(tutorial).toContain('Múc canh → Mời cả nhà');
    expect(tutorial).not.toContain('Xới cơm → Múc canh');
    expect(tutorial).not.toContain('Múc canh → Xới cơm');
    expect(tutorial).toContain('Mọi thứ tự giữ đủ luật đều được.');
    expect(tutorial.length).toBeLessThanOrEqual(240);
  });

  it('keeps defaults and unrelated boards unchanged', () => {
    const unrelated = candidates.find((item) => item.boardData.kind === 'quantity-target')!.boardData;
    for (const id of Object.keys(GAME_TUTORIALS) as GameTypeId[]) {
      for (const track of GAME_AGE_TRACKS) {
        const group = track === 'age_3_5' || track === 'age_6_8' ? 'age_6_8' : 'age_9_12';
        const expected = selectBySeed(GAME_TUTORIALS[id][group], 'default', 7);
        expect(getNaturalTutorial(id, track, 7, 'default')).toBe(expected);
        expect(getNaturalTutorial(id, track, 7, 'default', null)).toBe(expected);
        if (id === 'g04-t2' || id === 'g06-t2') {
          expect(getNaturalTutorial(id, track, 7, 'default', unrelated)).toBe(expected);
        }
      }
    }
  });

  it('keeps final tutorials inside the schema limit for every persisted board on all tracks', () => {
    for (const item of candidates) {
      for (const track of GAME_AGE_TRACKS) {
        const tutorial = getNaturalTutorial(item.gameTypeId, track, item.dayIndex, catalogSeed(item), item.boardData);
        expect(tutorial.length, item.id).toBeLessThanOrEqual(240);
        expect(tutorial).not.toMatch(/[{}]/);
      }
    }
  });
});

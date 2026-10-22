import { ageRank } from '../age';
import { ruleSequenceBoardSchema } from '../schema';
import { createSeededRandom, pickOne, shuffleDeterministic, stableSeedKey } from '../seeded';
import type { GameAgeTrack, RuleSequenceBoard } from '../types';

export const RULE_SEQUENCE_CHECKER_ID = 'rule-sequence-v1' as const;

export function validateRuleSequenceBoard(board: unknown): RuleSequenceBoard {
  return ruleSequenceBoardSchema.parse(board) as RuleSequenceBoard;
}

function numericValues(sequence: readonly string[]): number[] | null {
  const values = sequence.map((token) => Number(token));
  return values.every((value) => Number.isFinite(value)) ? values : null;
}

// Steps of the two interleaved tracks: `first` = positions 1,3,5..., `second` = positions 2,4,6...
function interleavedSteps(sequence: readonly string[]): { first: number; second: number } | null {
  const values = numericValues(sequence);
  if (!values || values.length < 4) return null;
  const even = values.filter((_, index) => index % 2 === 0);
  const odd = values.filter((_, index) => index % 2 === 1);
  if (even.length < 2 || odd.length < 2) return null;
  const evenStep = even[1]! - even[0]!;
  const oddStep = odd[1]! - odd[0]!;
  if (evenStep <= 0 || oddStep <= 0) return null;
  if (even.some((value, index) => index > 0 && value - even[index - 1]! !== evenStep)) return null;
  if (odd.some((value, index) => index > 0 && value - odd[index - 1]! !== oddStep)) return null;
  return { first: evenStep, second: oddStep };
}

function interleavedStep(sequence: readonly string[]): number | null {
  const steps = interleavedSteps(sequence);
  if (!steps) return null;
  return sequence.length % 2 === 0 ? steps.first : steps.second;
}

function expectedToken(board: RuleSequenceBoard): string | null {
  const { sequence, ruleKind, period } = board;
  if (ruleKind === 'alternating') {
    if (sequence.length < 4) return null;
    const interleaved = interleavedStep(sequence);
    if (interleaved !== null) {
      const previous = Number(sequence[sequence.length - 2]);
      return String(previous + interleaved);
    }
    for (let index = 2; index < sequence.length; index += 1) {
      if (sequence[index] !== sequence[index - 2]) return null;
    }
    return sequence[sequence.length - 2] ?? null;
  }
  if (ruleKind === 'repeat') {
    const block = period ?? 0;
    if (block < 2 || sequence.length < block + 1) return null;
    for (let index = block; index < sequence.length; index += 1) {
      if (sequence[index] !== sequence[index - block]) return null;
    }
    return sequence[sequence.length % block] ?? null;
  }
  const numbers = sequence.map((token) => Number(token));
  if (numbers.some((value) => !Number.isFinite(value))) return null;
  if (numbers.length < 3) return null;
  const step = numbers[1]! - numbers[0]!;
  if (step <= 0) return null;
  for (let index = 2; index < numbers.length; index += 1) {
    if (numbers[index]! - numbers[index - 1]! !== step) return null;
  }
  return String(numbers[numbers.length - 1]! + step);
}

export function solveRuleSequence(board: RuleSequenceBoard): string | null {
  const expected = expectedToken(board);
  if (expected === null) return null;
  return board.options.includes(expected) ? expected : null;
}

export function checkRuleSequence(board: RuleSequenceBoard, answer: unknown): boolean {
  if (typeof answer !== 'string') return false;
  return solveRuleSequence(board) === answer;
}

const TOKENS = ['lá', 'hoa', 'quả', 'nắng', 'mây', 'sao'] as const;

function alternatingBoard(random: () => number, length: number, rank = 0): RuleSequenceBoard {
  const first = pickOne(random, TOKENS);
  const second = pickOne(random, TOKENS.filter((token) => token !== first));
  const sequence = Array.from({ length }, (_, index) => (index % 2 === 0 ? first : second));
  const expected = length % 2 === 0 ? first : second;
  const distractorCount = rank >= 2 ? 3 : 2;
  const distractors = TOKENS.filter((token) => token !== first && token !== second).slice(0, distractorCount);
  return {
    kind: 'rule-sequence',
    sequence,
    options: shuffleDeterministic(random, [expected, ...distractors]),
    ruleKind: 'alternating',
  };
}

function interleavedNumericBoard(random: () => number, length: number): RuleSequenceBoard {
  const startA = 1 + Math.floor(random() * 4);
  const stepA = 1 + Math.floor(random() * 3);
  let startB = 1 + Math.floor(random() * 4);
  let stepB = 1 + Math.floor(random() * 3);
  if (startB === startA && stepB === stepA) startB += stepA + 1;
  if (stepB === stepA) stepB += 1;
  const sequence = Array.from({ length }, (_, index) => (
    index % 2 === 0
      ? String(startA + stepA * Math.floor(index / 2))
      : String(startB + stepB * Math.floor(index / 2))
  ));
  const expected = expectedToken({
    kind: 'rule-sequence',
    sequence,
    options: [],
    ruleKind: 'alternating',
  });
  if (expected === null) return alternatingBoard(random, length);
  const value = Number(expected);
  const candidates = [expected, String(value + 1), String(Math.max(1, value - 1)), String(value + 2)];
  return {
    kind: 'rule-sequence',
    sequence,
    options: shuffleDeterministic(random, [...new Set(candidates)]),
    ruleKind: 'alternating',
  };
}

function repeatBoard(random: () => number, length: number, period: number, rank = 0): RuleSequenceBoard {
  const first = pickOne(random, TOKENS);
  const second = pickOne(random, TOKENS.filter((token) => token !== first));
  const third = pickOne(random, TOKENS.filter((token) => token !== first && token !== second));
  const fourth = pickOne(random, TOKENS.filter((token) => !new Set([first, second, third]).has(token)));
  const block = [first, second, third, fourth].slice(0, period);
  const sequence = Array.from({ length }, (_, index) => block[index % period] as string);
  const expected = block[length % period] as string;
  const distractorCount = rank >= 2 ? 3 : 2;
  const distractors = TOKENS.filter((token) => !block.includes(token)).slice(0, distractorCount);
  return {
    kind: 'rule-sequence',
    sequence,
    options: shuffleDeterministic(random, [expected, ...distractors]),
    ruleKind: 'repeat',
    period,
  };
}

function incrementBoard(random: () => number, length: number, rank: number): RuleSequenceBoard {
  const start = 1 + Math.floor(random() * 4);
  const step = 1 + Math.floor(random() * (rank >= 3 ? 5 : 3));
  const sequence = Array.from({ length }, (_, index) => String(start + step * index));
  const expected = String(start + step * length);
  const candidates = [
    expected,
    String(Number(expected) + 1),
    String(Math.max(1, Number(expected) - step)),
    String(Number(expected) + step),
  ];
  const unique = [...new Set(candidates)];
  return {
    kind: 'rule-sequence',
    sequence,
    options: shuffleDeterministic(random, unique),
    ruleKind: 'increment',
  };
}

export function generateRuleSequencePuzzle(input: {
  seed: string;
  ageTrack: GameAgeTrack;
  variant: string;
}): RuleSequenceBoard {
  const random = createSeededRandom(stableSeedKey([input.seed, input.ageTrack, input.variant, 'g01-t1']));
  const rank = ageRank(input.ageTrack);
  const length = 4 + rank;
  if (input.variant.includes('lặp')) return alternatingBoard(random, length, rank);
  if (input.variant.includes('tăng')) return incrementBoard(random, length, rank);
  if (input.variant.includes('xen')) {
    return rank >= 2 ? interleavedNumericBoard(random, length) : alternatingBoard(random, length, rank);
  }
  if (input.variant.includes('suy ngược')) return repeatBoard(random, length, rank >= 2 ? 4 : 3, rank);
  return repeatBoard(random, length, 3, rank);
}

export function describeRuleSequenceBoard(board: RuleSequenceBoard): {
  hints: readonly [string, string];
  explanation: string;
} {
  const answer = solveRuleSequence(board);
  if (board.ruleKind === 'increment') {
    const numbers = numericValues(board.sequence);
    const step = numbers && numbers.length > 1 ? numbers[1]! - numbers[0]! : 1;
    return {
      hints: [
        'Nhìn xem mỗi số tăng thêm bao nhiêu.',
        'Thử tính khoảng cách giữa hai số liền nhau.',
      ],
      explanation: `Quy luật là mỗi số tăng thêm ${step}. Số tiếp theo là ${answer ?? '?'}.`,
    };
  }
  if (board.ruleKind === 'alternating') {
    const steps = interleavedSteps(board.sequence);
    if (steps !== null) {
      const nextStep = board.sequence.length % 2 === 0 ? steps.first : steps.second;
      const nextTrack = board.sequence.length % 2 === 0 ? 'lẻ' : 'chẵn';
      return {
        hints: [
          'Bạn thử nhìn các số cách nhau một vị trí xem có bước tăng nào quen thuộc không nhé.',
          'Ở đây có hai nhịp số cùng tăng đều đan xen; bạn tìm số tiếp theo của nhịp đang tới nhé.',
        ],
        explanation: `Hai nhịp số đan xen: các số ở vị trí 1, 3, 5... tăng thêm ${steps.first}, các số ở vị trí 2, 4, 6... tăng thêm ${steps.second}. Vị trí tiếp theo thuộc nhịp ${nextTrack}, nên lấy số cùng nhịp liền trước cộng ${nextStep}, ra ${answer ?? '?'}.`,
      };
    }
    return {
      hints: [
        'Nhìn xem các từ lặp lại theo nhịp nào.',
        'Thử đọc to chuỗi theo từng cặp.',
      ],
      explanation: `Phần tiếp theo hợp với nhịp của chuỗi là ${answer ?? '?'}.`,
    };
  }
  return {
    hints: [
      'Nhìn xem nhóm từ nào được lặp lại.',
      'Thử đọc phần đuôi để suy ra nhóm ở đầu.',
    ],
    explanation: `Chuỗi lặp lại theo nhóm ${board.period ?? 0} phần tử nên phần tiếp theo là ${answer ?? '?'}.`,
  };
}

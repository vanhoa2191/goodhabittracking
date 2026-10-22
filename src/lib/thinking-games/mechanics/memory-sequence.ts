import { ageRank } from '../age';
import { getTrackHints, type HintContext } from '../content/hints';
import { memorySequenceBoardSchema } from '../schema';
import { createSeededRandom, shuffleDeterministic, stableSeedKey } from '../seeded';
import type { GameAgeTrack, MemorySequenceBoard } from '../types';

export const MEMORY_SEQUENCE_CHECKER_ID = 'memory-sequence-v1' as const;

const TOKENS = ['táo', 'mèo', 'trăng', 'thuyền', 'cây', 'cá', 'mưa', 'bóng'] as const;

export function validateMemoryBoard(board: unknown): MemorySequenceBoard {
  return memorySequenceBoardSchema.parse(board) as MemorySequenceBoard;
}

export function solveMemorySequence(board: MemorySequenceBoard): string[] {
  if (board.mode === 'missing' && board.missingIndex !== undefined) {
    return [board.sequence[board.missingIndex] as string];
  }
  if (board.mode === 'swapped' && board.swappedIndices) {
    const [first, second] = board.swappedIndices;
    return [board.sequence[first] as string, board.sequence[second] as string];
  }
  return [...board.sequence];
}

export function checkMemorySequence(board: MemorySequenceBoard, answer: unknown): boolean {
  if (!Array.isArray(answer) || answer.some((token) => typeof token !== 'string')) return false;
  const expected = solveMemorySequence(board);
  if (board.mode === 'missing') return answer.length === 1 && answer[0] === expected[0];
  if (board.mode === 'swapped') {
    return answer.length === 2
      && new Set(answer).size === 2
      && new Set([...answer, ...expected]).size === 2;
  }
  if (answer.length !== expected.length) return false;
  return answer.every((token, index) => token === expected[index]);
}

// How many tokens the child has to answer with. The renderer must offer exactly
// this many slots, otherwise a correct answer cannot be submitted.
export function memorySequenceAnswerLength(board: MemorySequenceBoard): number {
  if (board.mode === 'missing') return 1;
  if (board.mode === 'swapped') return 2;
  return board.sequence.length;
}

// Which positions of the sequence the child has to answer with.
export function memorySequenceSlots(board: MemorySequenceBoard): readonly number[] {
  if (board.mode === 'missing' && board.missingIndex !== undefined) return [board.missingIndex];
  if (board.mode === 'swapped' && board.swappedIndices) return [...board.swappedIndices];
  return board.sequence.map((_, index) => index);
}

export function generateMemorySequencePuzzle(input: {
  seed: string;
  ageTrack: GameAgeTrack;
  variant: string;
}): MemorySequenceBoard {
  const random = createSeededRandom(stableSeedKey([input.seed, input.ageTrack, input.variant, 'g03-t1']));
  const rank = ageRank(input.ageTrack);
  const length = 3 + rank;
  const tokens = shuffleDeterministic(random, TOKENS);
  const sequence = tokens.slice(0, length);
  const mode = input.variant.includes('còn thiếu')
    ? 'missing'
    : input.variant.includes('theo nhóm')
      ? 'grouped'
      : input.variant.includes('cặp bị đổi')
        ? 'swapped'
        : 'recall';
  const missingIndex = Math.floor(length / 2);
  const swappedIndices: [number, number] = length >= 4 ? [1, 2] : [0, 1];
  const distractorCount = rank >= 2 ? 1 : 0;
  const distractors = tokens.filter((token) => !sequence.includes(token)).slice(0, distractorCount);
  const options = shuffleDeterministic(random, [...sequence, ...distractors]);
  return {
    kind: 'memory-sequence',
    sequence,
    options,
    displayMs: input.ageTrack === 'age_3_5' ? 1400 : input.ageTrack === 'age_6_8' ? 1200 : input.ageTrack === 'age_9_12' ? 1600 : 1800,
    ...(mode === 'recall' ? {} : { mode }),
    ...(mode === 'grouped' ? { groupSize: rank >= 2 ? 3 : 2 } : {}),
    ...(mode === 'missing' ? { missingIndex } : {}),
    ...(mode === 'swapped' ? { swappedIndices } : {}),
  };
}

function memorySequenceHintMode(board: MemorySequenceBoard): string {
  return board.mode ?? 'recall';
}

function describeMemorySequenceBoardLegacy(board: MemorySequenceBoard): {
  hints: readonly [string, string];
  explanation: string;
} {
  const answer = solveMemorySequence(board);
  if (board.mode === 'missing') {
    const position = (board.missingIndex ?? 0) + 1;
    return {
      hints: [
        'Nhớ lại ô bị bỏ trống nằm ở vị trí nào trong dãy.',
        'Đọc lại các từ xung quanh ô đó để nhớ từ cần điền vào.',
      ],
      explanation: `Ô thứ ${position} trong dãy là ${answer[0] ?? '?'}.`,
    };
  }
  if (board.mode === 'swapped') {
    const [first, second] = board.swappedIndices ?? [0, 1];
    return {
      hints: [
        'Nhớ lại hai ô được đánh dấu nằm ở vị trí nào trong dãy.',
        'Đọc lại các từ xung quanh đó để nhớ đúng hai từ cần điền vào.',
      ],
      explanation: `Hai ô thứ ${first + 1} và ${second + 1} trong dãy là ${answer[0] ?? '?'} và ${answer[1] ?? '?'}.`,
    };
  }
  if (board.mode === 'grouped') {
    return {
      hints: [
        `Chia chuỗi thành các nhóm ${board.groupSize ?? 2} từ.`,
        'Nhớ từng nhóm theo thứ tự rồi ghép lại.',
      ],
      explanation: `Thứ tự đúng theo nhóm là ${answer.join(' → ')}.`,
    };
  }
  return {
    hints: [
      'Nhớ nhóm đầu tiên trước.',
      'Đọc lại theo nhịp, đừng vội.',
    ],
    explanation: `Thứ tự đúng là ${answer.join(' → ')}.`,
  };
}

export function describeMemorySequenceBoard(
  board: MemorySequenceBoard,
  context?: HintContext,
): ReturnType<typeof describeMemorySequenceBoardLegacy> {
  const described = describeMemorySequenceBoardLegacy(board);
  if (!context) return described;
  return { ...described, hints: getTrackHints('g03-t1', context.ageTrack, context.seed, memorySequenceHintMode(board)) };
}

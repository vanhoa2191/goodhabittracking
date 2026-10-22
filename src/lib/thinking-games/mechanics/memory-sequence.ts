import { ageRank } from '../age';
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

export function describeMemorySequenceBoard(board: MemorySequenceBoard): {
  hints: readonly [string, string];
  explanation: string;
} {
  const answer = solveMemorySequence(board);
  if (board.mode === 'missing') {
    return {
      hints: [
        'Nhớ lại chỗ trống nằm ở đâu trong chuỗi.',
        'Đọc lại các từ xung quanh chỗ trống để nhớ từ còn thiếu.',
      ],
      explanation: `Phần còn thiếu trong chuỗi là ${answer[0] ?? '?'}.`,
    };
  }
  if (board.mode === 'swapped') {
    return {
      hints: [
        'So sánh thứ tự lúc đầu với thứ tự đang hiện.',
        'Tìm hai từ đứng cạnh nhau bị đổi chỗ.',
      ],
      explanation: `Cặp bị đổi thứ tự là ${answer[0] ?? '?'} → ${answer[1] ?? '?'}.`,
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

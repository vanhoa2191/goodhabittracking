import { assertFingerprint } from './fingerprint';
import {
  checkMemorySequence,
  solveMemorySequence,
  validateMemoryBoard,
} from './mechanics/memory-sequence';
import { checkPath, solvePath, validatePathBoard } from './mechanics/path-planning';
import {
  checkRuleSequence,
  solveRuleSequence,
  validateRuleSequenceBoard,
} from './mechanics/rule-sequence';
import { REMAINING_MECHANICS, type RemainingMechanic } from './mechanics/remaining';
import { requireAvailable, requireImplemented } from './registry';
import { assertNoAnswerLeak, parsePuzzleItem } from './schema';
import type { BoardData, GameErrorCode, PuzzleItem } from './types';

const REMAINING_BY_GAME = new Map<string, RemainingMechanic>(REMAINING_MECHANICS.map((mechanic) => [mechanic.gameTypeId, mechanic]));

function parseRemainingBoard(mechanic: RemainingMechanic, boardData: unknown): BoardData | null {
  try {
    return mechanic.parseBoard(boardData);
  } catch {
    return null;
  }
}

export type AnswerCheck =
  | { ok: true; correct: boolean }
  | { ok: false; code: 'invalid_answer' };

function isPathAnswerShape(answer: unknown): answer is readonly { x: number; y: number }[] {
  return Array.isArray(answer) && answer.length >= 2 && answer.every((entry) =>
    entry !== null
    && typeof entry === 'object'
    && Number.isInteger((entry as { x?: unknown }).x)
    && Number.isInteger((entry as { y?: unknown }).y));
}

export function checkAnswer(item: PuzzleItem, answer: unknown): AnswerCheck {
  if (item.gameTypeId === 'g01-t1') {
    if (typeof answer !== 'string') return { ok: false, code: 'invalid_answer' };
    const board = validateRuleSequenceBoard(item.boardData);
    return { ok: true, correct: checkRuleSequence(board, answer) };
  }
  if (item.gameTypeId === 'g06-t1') {
    if (!isPathAnswerShape(answer)) return { ok: false, code: 'invalid_answer' };
    const board = validatePathBoard(item.boardData);
    return { ok: true, correct: checkPath(board, answer) };
  }
  if (item.gameTypeId === 'g03-t1') {
    if (!Array.isArray(answer) || !answer.every((entry) => typeof entry === 'string')) {
      return { ok: false, code: 'invalid_answer' };
    }
    const board = validateMemoryBoard(item.boardData);
    return { ok: true, correct: checkMemorySequence(board, answer) };
  }
  const remaining = REMAINING_BY_GAME.get(item.gameTypeId);
  if (remaining) {
    const board = parseRemainingBoard(remaining, item.boardData);
    if (!board) return { ok: false, code: 'invalid_answer' };
    try {
      return { ok: true, correct: remaining.check(board, answer) };
    } catch {
      return { ok: false, code: 'invalid_answer' };
    }
  }
  return { ok: false, code: 'invalid_answer' };
}

export function solvePuzzle(
  item: PuzzleItem,
): { ok: true; solution: unknown } | { ok: false; code: GameErrorCode } {
  const remaining = REMAINING_BY_GAME.get(item.gameTypeId);
  if (remaining) {
    if (!item.boardData) return { ok: false, code: 'format_unavailable' };
    const available = requireAvailable(item.gameTypeId);
    if (!available.ok) return available;
    const board = parseRemainingBoard(remaining, item.boardData);
    if (!board) return { ok: false, code: 'invalid_puzzle' };
    const solution = remaining.solve(board);
    return solution === null || solution === undefined
      ? { ok: false, code: 'invalid_puzzle' }
      : { ok: true, solution };
  }
  const implemented = requireImplemented(item.gameTypeId);
  if (!implemented.ok) return implemented;
  if (item.gameTypeId === 'g01-t1') {
    const solution = solveRuleSequence(validateRuleSequenceBoard(item.boardData));
    return solution === null ? { ok: false, code: 'invalid_puzzle' } : { ok: true, solution };
  }
  if (item.gameTypeId === 'g06-t1') {
    const solution = solvePath(validatePathBoard(item.boardData));
    return solution === null ? { ok: false, code: 'invalid_puzzle' } : { ok: true, solution };
  }
  if (item.gameTypeId === 'g03-t1') {
    return { ok: true, solution: solveMemorySequence(validateMemoryBoard(item.boardData)) };
  }
  return { ok: false, code: 'format_unavailable' };
}

export function validatePuzzle(
  item: PuzzleItem,
): { ok: true } | { ok: false; code: GameErrorCode; details: readonly string[] } {
  try {
    parsePuzzleItem(item);
    assertNoAnswerLeak(item);
    assertFingerprint(item);
  } catch (error) {
    return {
      ok: false,
      code: 'invalid_puzzle',
      details: [error instanceof Error ? error.message : String(error)],
    };
  }
  const implemented = requireAvailable(item.gameTypeId);
  if (!implemented.ok) {
    return { ok: false, code: 'format_unavailable', details: [`${item.gameTypeId} is metadata-only`] };
  }
  const solved = solvePuzzle(item);
  if (!solved.ok) return { ok: false, code: solved.code, details: [`solver failed for ${item.id}`] };
  const checked = checkAnswer(item, item.solution);
  if (!checked.ok) {
    return { ok: false, code: 'invalid_puzzle', details: [`solution has the wrong shape for ${item.id}`] };
  }
  if (!checked.correct) {
    return { ok: false, code: 'invalid_puzzle', details: [`solution does not satisfy the checker for ${item.id}`] };
  }
  if (item.gameTypeId === 'g01-t1') {
    const expected = solveRuleSequence(validateRuleSequenceBoard(item.boardData));
    if (item.solution !== expected) {
      return { ok: false, code: 'invalid_puzzle', details: [`single answer is not unique for ${item.id}`] };
    }
  }
  return { ok: true };
}

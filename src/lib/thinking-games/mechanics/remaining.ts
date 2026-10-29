import { ageRank, candidateQuarter, targetSecondsForAge } from '../age';
import {
  DIRECTION_SHORT_VI,
  getNaturalTutorial,
  VIETNAMESE_COORDINATE,
} from '../content/copy';
import { getTrackHints } from '../content/hints';
import { getGameMechanic } from '../registry';
import {
  ruleErrorBoardSchema,
  ruleTransformBoardSchema,
  spatialSilhouetteBoardSchema,
  spatialRotationBoardSchema,
  spatialSymmetryBoardSchema,
  memoryPositionBoardSchema,
  memoryChangeBoardSchema,
  reasoningEliminationBoardSchema,
  reasoningIfThenBoardSchema,
  reasoningMissingInfoBoardSchema,
  quantityBalanceBoardSchema,
  quantityGroupingBoardSchema,
  quantityTargetBoardSchema,
  planningCommandOrderBoardSchema,
  planningFixStepBoardSchema,
  flexibilityClassifyBoardSchema,
  flexibilityPerspectiveBoardSchema,
  flexibilityAlternativeBoardSchema,
  observationDifferenceBoardSchema,
  observationTwoTraitsBoardSchema,
  observationImplausibleBoardSchema,
} from '../schema';
import { createSeededRandom, shuffleDeterministic, stableSeedKey } from '../seeded';
import { displayQuantityGroupingOptions } from '../display-order';
import { checkPath } from './path-planning';
import type {
  GameAgeTrack,
  BoardData,
  BoardKind,
  CheckerId,
  Direction,
  GameTypeId,
  PathStep,
  RelativeDirection,
  TraitItem,
  TraitMap,
} from '../types';

export type RemainingMechanic = Readonly<{
  gameTypeId: GameTypeId;
  checkerId: CheckerId;
  boardKind: BoardKind;
  parseBoard: (input: unknown) => BoardData;
  solve: (board: BoardData) => unknown | null;
  check: (board: BoardData, answer: unknown) => boolean;
  generate: (input: GenerateInput) => GeneratedPuzzle;
}>;

export type GenerateInput = Readonly<{ seed: string; ageTrack: GameAgeTrack; variant: string }>;

export type GeneratedPuzzle = Readonly<{
  board: BoardData;
  solution: unknown;
  hints: readonly [string, string];
  explanation: string;
  title: string;
  tutorial: string;
  targetSeconds: number;
  praiseKeys: Readonly<Record<string, string>>;
}>;

const PRAISE_KEYS = { correct: 'thinking-games.praise.specific', retry: 'thinking-games.praise.retry' } as const;

function randomFor(input: GenerateInput, salt: string): () => number {
  return createSeededRandom(stableSeedKey([input.seed, input.ageTrack, input.variant, salt]));
}

// Option order is shuffled per item seed so the correct slot is not predictable.
function shuffledOptions<T>(input: GenerateInput, salt: string, options: readonly T[]): T[] {
  return shuffleDeterministic(randomFor(input, `${salt}-option-order`), options);
}

function candidateAnswerSlot(input: GenerateInput, salt: string, count: number): number {
  const match = input.seed.match(/^p08-candidates-365-v2\|D(\d{3})-(?:main|bonus)\|/);
  if (!match) return Math.floor(randomFor(input, `${salt}-answer-slot`)() * count);
  const day = Number(match[1]) - 1;
  // The editorial schedule repeats each variant twice per 96-day cycle.
  // Rotate slots across cycles and across the two slots within each cycle;
  // an independent item shuffle alone can still bias these small strata.
  const occurrence = Math.floor(day / 96) + Math.floor((day % 24) / 12);
  const slots = shuffleDeterministic(createSeededRandom(stableSeedKey([salt, input.ageTrack, input.variant])), Array.from({ length: count }, (_, i) => i));
  return slots[occurrence % count]!;
}

function variantIndex(gameTypeId: GameTypeId, variant: string): number {
  const variants = getGameMechanic(gameTypeId)?.variants ?? [];
  const index = variants.indexOf(variant);
  return index < 0 ? 0 : index;
}

function targetSeconds(ageTrack: GameAgeTrack, seed: string): number {
  return targetSecondsForAge(ageTrack, candidateQuarter(seed));
}

function isPoint(value: unknown): value is PathStep {
  return Boolean(value)
    && typeof value === 'object'
    && Number.isInteger((value as { x?: unknown }).x)
    && Number.isInteger((value as { y?: unknown }).y)
    && Object.keys(value as object).length === 2;
}

function isPointArray(value: unknown): value is readonly PathStep[] {
  return Array.isArray(value) && value.length > 0 && value.every(isPoint);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === 'string');
}

function pointKey(point: PathStep): string {
  return `${point.x},${point.y}`;
}

function sortPoints(points: readonly PathStep[]): PathStep[] {
  return [...points].map((point) => ({ x: point.x, y: point.y })).sort((a, b) => a.x - b.x || a.y - b.y);
}

function uniquePoints(points: readonly PathStep[]): PathStep[] {
  const seen = new Set<string>();
  return sortPoints(points).filter((point) => {
    const key = pointKey(point);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function samePointSet(left: readonly PathStep[], right: readonly PathStep[]): boolean {
  const a = uniquePoints(left).map(pointKey);
  const b = uniquePoints(right).map(pointKey);
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  const a = [...new Set(left)].sort();
  const b = [...new Set(right)].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function parseInteger(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && Number.isInteger(parsed) ? parsed : null;
}

function rotateCells(cells: readonly PathStep[], turn: 'quarter' | 'half' | 'mirror' | 'quarter-mirror', revision: 1 | 2 = 2): PathStep[] {
  const maxX = Math.max(...cells.map((point) => point.x));
  const maxY = Math.max(...cells.map((point) => point.y));
  return uniquePoints(cells.map((point) => {
    if (turn === 'quarter') return { x: maxY - point.y, y: point.x };
    if (turn === 'half') return { x: maxX - point.x, y: maxY - point.y };
    if (turn === 'mirror') return { x: maxX - point.x, y: point.y };
    if (revision === 1) return { x: point.y, y: maxX - point.x };
    // Clockwise quarter turn (maxY-y,x), then left-right reflection.
    return { x: point.y, y: point.x };
  }));
}

function reflectCells(cells: readonly PathStep[], axis: 'vertical' | 'horizontal'): PathStep[] {
  const maxX = Math.max(...cells.map((point) => point.x));
  const maxY = Math.max(...cells.map((point) => point.y));
  return uniquePoints(cells.map((point) => (
    axis === 'vertical' ? { x: maxX - point.x, y: point.y } : { x: point.x, y: maxY - point.y }
  )));
}

function matchesAnyOption(options: readonly { id: string; cells: readonly PathStep[] }[], expected: readonly PathStep[]): string | null {
  const matches = options.filter((option) => samePointSet(option.cells, expected)).map((option) => option.id).sort();
  return matches[0] ?? null;
}

const definitions: RemainingMechanic[] = [];

function ruleErrorSequence(input: GenerateInput, rng: () => number): { sequence: string[]; ruleKind: 'alternating' | 'repeat' | 'increment'; period?: number; errorIndex: number } {
  const rank = ageRank(input.ageTrack);
  const variant = variantIndex('g01-t2', input.variant);
  const ruleKind = variant === 0 ? 'alternating' : variant === 1 ? 'increment' : 'repeat';
  const blockSize = ruleKind === 'repeat' && rank >= 2 ? 3 : 2;
  // Three witnesses per residue make the corrupted slot unambiguous even
  // when it is in the first block; two witnesses alone can be tied.
  const length = Math.max(6 + rank + (variant === 3 ? 1 : 0), 3 * blockSize + rank);
  let sequence: string[];
  let period: number | undefined;
  if (ruleKind === 'alternating') {
    const first = ['lá', 'hoa', 'quả', 'sao'][Math.floor(rng() * 4)] as string;
    const second = ['mây', 'nắng', 'cá', 'mèo'].filter((token) => token !== first)[Math.floor(rng() * 3)] as string;
    sequence = Array.from({ length }, (_, index) => (index % 2 === 0 ? first : second));
  } else if (ruleKind === 'repeat') {
    period = blockSize;
    const block = shuffleDeterministic(rng, ['lá', 'hoa', 'quả', 'sao']).slice(0, blockSize);
    sequence = Array.from({ length }, (_, index) => block[index % blockSize] as string);
  } else {
    const start = 1 + Math.floor(rng() * 4);
    const step = 1 + Math.floor(rng() * 3);
    sequence = Array.from({ length }, (_, index) => String(start + step * index));
  }
  const errorIndex = Math.floor(rng() * length);
  const expected = ruleKind === 'increment'
    ? String(Number(sequence[errorIndex]) + 1 + Math.floor(rng() * 3))
    : (['lá', 'hoa', 'quả', 'sao', 'mây', 'nắng', 'cá', 'mèo'].find((token) => token !== sequence[errorIndex]) as string);
  sequence[errorIndex] = expected;
  return { sequence, ruleKind, period, errorIndex };
}

function ruleErrorRepairs(board: Extract<BoardData, { kind: 'rule-error' }>): number[] {
  const { sequence, ruleKind } = board;
  return sequence.flatMap((token, omitted) => {
    if (ruleKind === 'increment') {
      const values = sequence.map(parseInteger);
      if (values.some((value) => value === null)) return [];
      const indices = values.flatMap((_, i) => i !== omitted ? [i] : []);
      if (indices.length < 3) return [];
      const [a, b] = indices as [number, number, ...number[]];
      const step = (values[b]! - values[a]!) / (b - a);
      const start = values[a]! - a * step;
      return Number.isInteger(step) && step > 0 && values[omitted] !== start + omitted * step
        && indices.every((i) => values[i] === start + i * step) ? [omitted] : [];
    }
    const period = ruleKind === 'alternating' ? 2 : board.period ?? 0;
    if (period < 2) return [];
    const groups = Array.from({ length: period }, (_, residue) => new Set(sequence.filter((_, i) => i !== omitted && i % period === residue)));
    if (!groups.every((group) => group.size === 1) || groups[omitted % period]!.has(token)) return [];
    if (ruleKind === 'alternating' && [...groups[0]!][0] === [...groups[1]!][0]) return [];
    return [omitted];
  });
}

// Historical boards were authored against an anchored first block. Preserve
// that interpretation for the immutable V1/P06/synthetic catalogs only; every
// new generated board opts into the independently repairable revision 2.
function legacyRuleErrorAnswer(board: Extract<BoardData, { kind: 'rule-error' }>): number | null {
  const { sequence, ruleKind, period } = board;
  if (ruleKind === 'increment') {
    const values = sequence.map(parseInteger);
    if (values.some((value) => value === null)) return null;
    const step = values[1]! - values[0]!;
    if (step <= 0) return null;
    const mismatches = values.flatMap((value, index) => index >= 2 && value !== values[0]! + step * index ? [index] : []);
    return mismatches.length === 1 ? mismatches[0]! : null;
  }
  if (ruleKind === 'alternating') {
    const first = sequence[0];
    const second = sequence[1];
    if (first === undefined || second === undefined || first === second) return null;
    const mismatches = sequence.flatMap((token, index) => index >= 2 && token !== (index % 2 === 0 ? first : second) ? [index] : []);
    return mismatches.length === 1 ? mismatches[0]! : null;
  }
  const block = period ?? 0;
  if (block < 2 || sequence.length < block + 1) return null;
  const mismatches = sequence.flatMap((token, index) => index >= block && token !== sequence[index % block] ? [index] : []);
  return mismatches.length === 1 ? mismatches[0]! : null;
}

definitions.push({
  gameTypeId: 'g01-t2',
  checkerId: 'rule-error-v1',
  boardKind: 'rule-error',
  parseBoard: (input) => ruleErrorBoardFrom(input),
  solve: (board) => {
    if (board.kind !== 'rule-error') return null;
    if (board.mechanicRevision !== 2) return legacyRuleErrorAnswer(board);
    const repairs = ruleErrorRepairs(board);
    return repairs.length === 1 ? repairs[0]! : null;
  },
  check: (board, answer) => {
    if (!Number.isInteger(answer)) return false;
    const solved = definitions.find((entry) => entry.gameTypeId === 'g01-t2')?.solve(board);
    return typeof solved === 'number' && solved === answer;
  },
  generate: (input) => {
    const rng = randomFor(input, 'g01-t2');
    const { sequence, ruleKind, period, errorIndex } = ruleErrorSequence(input, rng);
    const board = { kind: 'rule-error' as const, mechanicRevision: 2 as const, sequence, ruleKind, ...(period ? { period } : {}) };
    const errorToken = sequence[errorIndex] ?? '';
    const hints = getTrackHints('g01-t2', input.ageTrack, input.seed, ruleKind);
    return {
      board,
      solution: errorIndex,
      hints,
      explanation: `Vị trí thứ ${errorIndex + 1} (${errorToken}) chưa đúng với quy luật của chuỗi.`,
      title: 'Tìm phần sai',
      tutorial: getNaturalTutorial('g01-t2', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

function ruleErrorBoardFrom(input: unknown): BoardData {
  return ruleErrorBoardSchema.parse(input) as BoardData;
}

function transformValue(transform: 'add' | 'subtract' | 'double' | 'reverse', input: string): string | null {
  if (transform === 'reverse') return [...input].reverse().join('');
  const value = parseInteger(input);
  if (value === null) return null;
  if (transform === 'add') return String(value + 1);
  if (transform === 'subtract') return String(value - 1);
  return String(value * 2);
}

definitions.push({
  gameTypeId: 'g01-t3',
  checkerId: 'rule-transform-v1',
  boardKind: 'rule-transform',
  parseBoard: (input) => ruleTransformBoardSchema.parse(input) as BoardData,
  solve: (board) => {
    if (board.kind !== 'rule-transform') return null;
    const expected = transformValue(board.transform, board.query);
    return expected !== null && board.options.includes(expected) ? expected : null;
  },
  check: (board, answer) => {
    if (typeof answer !== 'string') return false;
    const solved = definitions.find((entry) => entry.gameTypeId === 'g01-t3')?.solve(board);
    return solved === answer;
  },
  generate: (input) => {
    const rng = randomFor(input, 'g01-t3');
    const rank = ageRank(input.ageTrack);
    const transforms = ['add', 'subtract', 'double', 'reverse'] as const;
    const transform = transforms[variantIndex('g01-t3', input.variant) % transforms.length] as typeof transforms[number];
    const base = 100 + Math.floor(rng() * 800);
    const exampleCount = 2 + (rank >= 1 ? 1 : 0) + (rank === 3 ? 1 : 0);
    const examples = Array.from({ length: exampleCount }, (_, index) => {
      const value = String(base + index * 7);
      return { input: value, output: transformValue(transform, value) as string };
    });
    const query = String(base + 31);
    const expected = transformValue(transform, query) as string;
    const numeric = parseInteger(expected);
    const distractors = numeric === null
      ? [transformValue('reverse', expected) as string, `${expected}0`, `${expected}1`]
      : [String(numeric + 1), String(Math.max(0, numeric - 1)), String(numeric + 2), String(numeric + 3)];
    const optionCount = 3 + (rank >= 2 ? 1 : 0) + (rank === 3 ? 1 : 0);
    const options = shuffleDeterministic(rng, [...new Set([expected, ...distractors])]).slice(0, optionCount);
    if (!options.includes(expected)) options[0] = expected;
    const transformDesc = transform === 'add' ? 'cộng thêm 1' : transform === 'subtract' ? 'trừ đi 1' : transform === 'double' ? 'gấp đôi giá trị' : 'đảo ngược thứ tự các chữ số';
    const hints = getTrackHints('g01-t3', input.ageTrack, input.seed);
    return {
      board: { kind: 'rule-transform', examples, query, options, transform },
      solution: expected,
      hints,
      explanation: `Quy tắc biến đổi của máy là ${transformDesc}. Khi đưa số ${query} vào máy, ta thu được kết quả là ${expected}.`,
      title: 'Máy biến đổi',
      tutorial: getNaturalTutorial('g01-t3', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

definitions.push({
  gameTypeId: 'g02-t1',
  checkerId: 'spatial-silhouette-v1',
  boardKind: 'spatial-silhouette',
  parseBoard: (input) => spatialSilhouetteBoardSchema.parse(input) as BoardData,
  solve: (board) => {
    if (board.kind !== 'spatial-silhouette') return null;
    return matchesAnyOption(board.options, board.target);
  },
  check: (board, answer) => {
    if (typeof answer !== 'string' || board.kind !== 'spatial-silhouette') return false;
    const option = board.options.find((entry) => entry.id === answer);
    return Boolean(option && samePointSet(option.cells, board.target));
  },
  generate: (input) => {
    const rng = randomFor(input, 'g02-t1');
    const rank = ageRank(input.ageTrack);
    const cellCount = 3 + rank;
    const target: PathStep[] = [];
    while (target.length < cellCount) {
      const p = { x: Math.floor(rng() * 4), y: Math.floor(rng() * 4) };
      if (!target.some((entry) => entry.x === p.x && entry.y === p.y)) target.push(p);
    }
    const shifted = target.map((point) => ({ x: (point.x + 1) % 4, y: point.y }));
    const rotated = rotateCells(target, 'quarter');
    const missing = target.slice(0, -1);
    const extra = [...target, { x: 3, y: 3 }];
    const allOptions = [
      { id: 'shape-a', cells: target },
      { id: 'shape-b', cells: shifted },
      { id: 'shape-c', cells: rotated },
      { id: 'shape-d', cells: missing },
      { id: 'shape-e', cells: extra },
    ].filter((option, index, list) => list.findIndex((entry) => samePointSet(entry.cells, option.cells)) === index);
    const optionCount = Math.min(allOptions.length, 3 + Math.min(rank, 2));
    const options = shuffledOptions(input, 'g02-t1', allOptions.slice(0, Math.max(2, optionCount)));
    const solution = 'shape-a';
    const targetIdx = options.findIndex((opt) => opt.id === solution);
    const targetLabel = String.fromCharCode(65 + Math.max(0, targetIdx));
    const hints = getTrackHints('g02-t1', input.ageTrack, input.seed);
    return {
      board: { kind: 'spatial-silhouette', target, options },
      solution,
      hints,
      explanation: `Hình có đúng số ô và hình dạng khớp hoàn toàn với bóng mẫu là Hình ${targetLabel}.`,
      title: 'Ghép bóng',
      tutorial: getNaturalTutorial('g02-t1', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

definitions.push({
  gameTypeId: 'g02-t2',
  checkerId: 'spatial-rotation-v1',
  boardKind: 'spatial-rotation',
  parseBoard: (input) => spatialRotationBoardSchema.parse(input) as BoardData,
  solve: (board) => {
    if (board.kind !== 'spatial-rotation') return null;
    const expected = rotateCells(board.shape, board.turn, board.mechanicRevision ?? 1);
    return matchesAnyOption(board.options, expected);
  },
  check: (board, answer) => {
    if (typeof answer !== 'string' || board.kind !== 'spatial-rotation') return false;
    const option = board.options.find((entry) => entry.id === answer);
    return Boolean(option && samePointSet(option.cells, rotateCells(board.shape, board.turn, board.mechanicRevision ?? 1)));
  },
  generate: (input) => {
    const rng = randomFor(input, 'g02-t2');
    const rank = ageRank(input.ageTrack);
    const turns = ['quarter', 'half', 'mirror', 'quarter-mirror'] as const;
    const turn = turns[variantIndex('g02-t2', input.variant) % turns.length] as typeof turns[number];
    const cellCount = 3 + rank;
    const shape: PathStep[] = [];
    while (shape.length < cellCount) {
      const p = { x: Math.floor(rng() * 4), y: Math.floor(rng() * 4) };
      if (!shape.some((entry) => entry.x === p.x && entry.y === p.y)) shape.push(p);
    }
    const expected = rotateCells(shape, turn);
    const allOptions = [
      { id: 'turn-a', cells: expected },
      { id: 'turn-b', cells: rotateCells(shape, turn === 'half' ? 'quarter' : 'half') },
      { id: 'turn-c', cells: reflectCells(shape, 'vertical') },
      { id: 'turn-d', cells: rotateCells(shape, 'quarter-mirror') },
      // The task explicitly asks for left-right reflection. Do not offer a
      // second mirror axis as an apparently valid interpretation of it.
      ...(turn === 'mirror' ? [] : [{ id: 'turn-e', cells: reflectCells(shape, 'horizontal') }]),
      { id: 'turn-f', cells: shape },
    ].filter((option, index, list) => list.findIndex((entry) => samePointSet(entry.cells, option.cells)) === index)
      .filter((option) => turn !== 'mirror' || option.id === 'turn-a' || !samePointSet(option.cells, reflectCells(shape, 'horizontal')));
    const optionCount = Math.min(allOptions.length, 3 + Math.min(rank, 2));
    const options = shuffledOptions(input, 'g02-t2', allOptions.slice(0, Math.max(2, optionCount)));
    const solution = 'turn-a';
    const targetIdx = options.findIndex((opt) => opt.id === solution);
    const targetLabel = String.fromCharCode(65 + Math.max(0, targetIdx));
    const hints = getTrackHints('g02-t2', input.ageTrack, input.seed, turn === 'quarter-mirror' ? 'quarter-mirror' : turn === 'mirror' ? 'flip' : 'rotate');
    return {
      board: { kind: 'spatial-rotation', mechanicRevision: 2, shape, turn, options },
      solution,
      hints,
      explanation: `Làm đúng thao tác biến đổi được chỉ dẫn trên hình mẫu, bạn được Hình ${targetLabel}.`,
      title: 'Xoay hình',
      tutorial: getNaturalTutorial('g02-t2', input.ageTrack, Math.floor(rng() * 100), input.seed, { kind: 'spatial-rotation', shape, turn, options }),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

function symmetryBreakPair(board: Extract<BoardData, { kind: 'spatial-symmetry' }>): [PathStep, PathStep] | null {
  const height = board.grid.length;
  const width = board.grid[0]?.length ?? 0;
  const mirror = (point: PathStep): PathStep => (
    board.axis === 'vertical' ? { x: width - 1 - point.x, y: point.y } : { x: point.x, y: height - 1 - point.y }
  );
  const pairs: [PathStep, PathStep][] = [];
  board.grid.forEach((row, y) => row.forEach((cell, x) => {
    const other = mirror({ x, y });
    if (cell !== board.grid[other.y]?.[other.x] && pointKey({ x, y }) < pointKey(other)) {
      pairs.push([{ x, y }, other]);
    }
  }));
  return pairs.length === 1 ? pairs[0]! : null;
}

function symmetryAnswer(board: Extract<BoardData, { kind: 'spatial-symmetry' }>): PathStep | null {
  if (board.mode === 'fill') {
    const holes: PathStep[] = [];
    board.grid.forEach((row, y) => row.forEach((cell, x) => {
      if (cell === null) holes.push({ x, y });
    }));
    return holes.length === 1 ? holes[0]! : null;
  }
  return symmetryBreakPair(board)?.[0] ?? null;
}

definitions.push({
  gameTypeId: 'g02-t3',
  checkerId: 'spatial-symmetry-v1',
  boardKind: 'spatial-symmetry',
  parseBoard: (input) => spatialSymmetryBoardSchema.parse(input) as BoardData,
  solve: (board) => board.kind === 'spatial-symmetry' ? symmetryAnswer(board) : null,
  check: (board, answer) => {
    if (!isPoint(answer) || board.kind !== 'spatial-symmetry') return false;
    if (board.mode === 'fill') {
      const expected = symmetryAnswer(board);
      return Boolean(expected && expected.x === answer.x && expected.y === answer.y);
    }
    const pair = symmetryBreakPair(board);
    return Boolean(pair && pair.some((point) => point.x === answer.x && point.y === answer.y));
  },
  generate: (input) => {
    const rng = randomFor(input, 'g02-t3');
    const rank = ageRank(input.ageTrack);
    const width = 3 + Math.min(rank, 2);
    const height = width;
    const symbols = ['lá', 'hoa', 'quả', 'sao', 'mây'];
    const mode = variantIndex('g02-t3', input.variant) % 2 === 0 ? 'fill' : 'find-break';
    const axis = variantIndex('g02-t3', input.variant) < 2 ? 'vertical' : 'horizontal';
    const grid: (string | null)[][] = Array.from({ length: height }, () => Array<string | null>(width).fill(null));
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (axis === 'vertical' && x > Math.floor((width - 1) / 2)) continue;
        if (axis === 'horizontal' && y > Math.floor((height - 1) / 2)) continue;
        const symbol = symbols[Math.floor(rng() * symbols.length)] as string;
        grid[y]![x] = symbol;
        const other = axis === 'vertical' ? { x: width - 1 - x, y } : { x, y: height - 1 - y };
        grid[other.y]![other.x] = symbol;
      }
    }
    const candidates = grid.flatMap((row, y) => row.flatMap((_, x) => {
      const other = axis === 'vertical' ? { x: width - 1 - x, y } : { x, y: height - 1 - y };
      return other.x !== x || other.y !== y ? [{ x, y }] : [];
    }));
    const chosen = candidates[Math.floor(rng() * candidates.length)] as PathStep;
    const mirror = axis === 'vertical' ? { x: width - 1 - chosen.x, y: chosen.y } : { x: chosen.x, y: height - 1 - chosen.y };
    let solution: PathStep;
    if (mode === 'fill') {
      // In fill mode, the answer is the hole position (chosen)
      grid[chosen.y]![chosen.x] = null;
      solution = chosen;
    } else {
      // In find-break mode, the answer is the canonical point (smaller pointKey)
      grid[chosen.y]![chosen.x] = symbols.find((symbol) => symbol !== (grid[chosen.y]![chosen.x] as string)) as string;
      solution = pointKey(chosen) < pointKey(mirror) ? chosen : mirror;
    }
    const distractorCount = 2 + (rank >= 2 ? 1 : 0) + (rank === 3 ? 1 : 0);
    // Both cells are equally valid in find-break mode; expose both rather
    // than arbitrarily hiding one half of the broken pair.
    const breakPairKeys = new Set([pointKey(chosen), pointKey(mirror)]);
    const otherCandidates = candidates.filter((point) => !breakPairKeys.has(pointKey(point)));
    const options = shuffleDeterministic(rng, [
      ...(mode === 'find-break' ? [chosen, mirror] : [solution]),
      ...shuffleDeterministic(rng, otherCandidates).slice(0, distractorCount),
    ]);
    const hints = getTrackHints('g02-t3', input.ageTrack, input.seed, mode);
    return {
      board: { kind: 'spatial-symmetry', grid, axis, mode, options },
      solution,
      hints,
      explanation: mode === 'find-break'
        ? `Cặp ô ở ${VIETNAMESE_COORDINATE(chosen)} và ${VIETNAMESE_COORDINATE(mirror)} không giống nhau qua trục đối xứng. Chọn ô nào trong cặp ô này cũng đúng.`
        : `Ô cần chọn nằm ở ${VIETNAMESE_COORDINATE(solution)} để hình hoàn toàn đối xứng.`,
      title: 'Hoàn thành đối xứng',
      tutorial: getNaturalTutorial('g02-t3', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

function memoryPositionAnswer(board: Extract<BoardData, { kind: 'memory-position' }>): PathStep[] {
  if (board.mode === 'recall') return uniquePoints(board.targets);
  const revealed = new Set(board.revealed.map(pointKey));
  return uniquePoints(board.targets.filter((point) => !revealed.has(pointKey(point))));
}

// How many positions the child has to pick. The renderer must count exactly this
// many, otherwise the child cannot submit the answer the checker expects.
export function memoryPositionRequiredCount(board: Extract<BoardData, { kind: 'memory-position' }>): number {
  return memoryPositionAnswer(board).length;
}

definitions.push({
  gameTypeId: 'g03-t2',
  checkerId: 'memory-position-v1',
  boardKind: 'memory-position',
  parseBoard: (input) => memoryPositionBoardSchema.parse(input) as BoardData,
  solve: (board) => board.kind === 'memory-position' ? memoryPositionAnswer(board) : null,
  check: (board, answer) => {
    if (!isPointArray(answer) || board.kind !== 'memory-position') return false;
    return samePointSet(answer, memoryPositionAnswer(board));
  },
  generate: (input) => {
    const rng = randomFor(input, 'g03-t2');
    const rank = ageRank(input.ageTrack);
    const width = 3 + Math.min(rank, 2);
    const height = width;
    const count = 2 + rank;
    const targets: PathStep[] = [];
    while (targets.length < count) {
      const p = { x: Math.floor(rng() * width), y: Math.floor(rng() * height) };
      if (!targets.some((entry) => entry.x === p.x && entry.y === p.y)) targets.push(p);
    }
    const mode: 'missing' | 'recall' = variantIndex('g03-t2', input.variant) >= 2 ? 'missing' : 'recall';
    const revealed = mode === 'missing' ? targets.slice(0, -1) : [];
    const solution = memoryPositionAnswer({ kind: 'memory-position', width, height, targets, revealed, mode, displayMs: 1400, options: [] });
    const allPoints: PathStep[] = [];
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < height; y += 1) {
        if (!targets.some((t) => t.x === x && t.y === y)) allPoints.push({ x, y });
      }
    }
    const optionCount = 3 + rank;
    const distractors = shuffleDeterministic(rng, allPoints).slice(0, Math.max(0, optionCount - targets.length));
    const options = shuffleDeterministic(rng, [...targets, ...distractors]);
    const posVi = solution.map(VIETNAMESE_COORDINATE).join(', ');
    const hints = getTrackHints('g03-t2', input.ageTrack, input.seed, mode);
    const board = { kind: 'memory-position' as const, width, height, targets, revealed, mode, displayMs: input.ageTrack === 'age_6_8' ? 1400 : 1200, options };
    return {
      board,
      solution,
      hints,
      explanation: mode === 'missing'
        ? `Vị trí còn thiếu nằm ở ${posVi}.`
        : `Các vị trí đã xuất hiện nằm ở ${posVi}.`,
      title: 'Nhớ vị trí',
      tutorial: getNaturalTutorial('g03-t2', input.ageTrack, Math.floor(rng() * 100), input.seed, board),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

function memoryChangeAnswer(board: Extract<BoardData, { kind: 'memory-change' }>): string | null {
  if (board.change === 'removed') {
    const missing = board.before.filter((token) => !board.after.includes(token));
    return missing.length === 1 ? missing[0]! : null;
  }
  if (board.change === 'added') {
    const added = board.after.filter((token) => !board.before.includes(token));
    return added.length === 1 ? added[0]! : null;
  }
  if (board.change === 'swapped') {
    const changed = board.before.flatMap((token, index) => token !== board.after[index] ? [token] : []);
    return changed.length === 2 ? [...changed].sort().join('|') : null;
  }
  const changed = board.before.flatMap((token, index) => token !== board.after[index] ? [board.after[index]] : []);
  return changed.length === 1 ? changed[0]! : null;
}

definitions.push({
  gameTypeId: 'g03-t3',
  checkerId: 'memory-change-v1',
  boardKind: 'memory-change',
  parseBoard: (input) => memoryChangeBoardSchema.parse(input) as BoardData,
  solve: (board) => board.kind === 'memory-change' ? memoryChangeAnswer(board) : null,
  check: (board, answer) => {
    if (typeof answer !== 'string' || board.kind !== 'memory-change') return false;
    const expected = memoryChangeAnswer(board);
    if (expected === null) return false;
    if (board.change !== 'swapped') return answer === expected;
    const parsed = answer.split('|').sort().join('|');
    return parsed === expected;
  },
  generate: (input) => {
    const rng = randomFor(input, 'g03-t3');
    const rank = ageRank(input.ageTrack);
    const change = (['removed', 'added', 'swapped', 'property'] as const)[variantIndex('g03-t3', input.variant) % 4] as 'removed' | 'added' | 'swapped' | 'property';
    const baseCount = change === 'removed' || change === 'added' ? 4 : 3;
    const tokenCount = Math.min(6, baseCount + rank);
    const allTokens = ['lá', 'hoa', 'quả', 'sao', 'mây', 'nắng', 'cá', 'mèo'];
    const tokens = shuffleDeterministic(rng, allTokens).slice(0, tokenCount);
    let before: string[];
    let after: string[];
    if (change === 'removed') {
      before = tokens;
      after = before.slice(0, -1);
    } else if (change === 'added') {
      before = tokens.slice(0, -1);
      after = tokens;
    } else if (change === 'swapped') {
      before = tokens;
      after = [...tokens];
      const temp = after[0]!;
      after[0] = after[1]!;
      after[1] = temp;
    } else {
      before = tokens.map((token) => `${token} đỏ`);
      after = [...before];
      after[1] = `${tokens[1]!} xanh`;
    }
    const solution = memoryChangeAnswer({ kind: 'memory-change', before, after, change, options: [] }) as string;
    const extraTokens = allTokens.filter((t) => !tokens.includes(t));
    const optionPool = change === 'swapped'
      ? [
          solution,
          [before[1]!, before[2] ?? before[0]!].sort().join('|'),
          [before[0]!, before[2] ?? before[1]!].sort().join('|'),
          [before[1]!, before[3] ?? before[0]!].sort().join('|'),
          [before[2] ?? before[0]!, before[3] ?? before[1]!].sort().join('|'),
          'không có gì thay đổi',
        ]
      : change === 'property'
        ? [solution, ...shuffleDeterministic(rng, tokens.flatMap((token) => ['đỏ', 'xanh', 'vàng', 'tím'].map((color) => `${token} ${color}`)).filter((token) => token !== solution))]
        : [solution, tokens[0]!, tokens[1] ?? 'lá', ...extraTokens, 'không có gì thay đổi'];
    const optionCount = 3 + rank;
    const trimmed = [...new Set(optionPool)].slice(0, optionCount);
    if (!trimmed.includes(solution)) trimmed[0] = solution;
    const options = shuffledOptions(input, 'g03-t3', trimmed);
    let changeExplanation = `Đã có một sự thay đổi ở cảnh sau: ${solution}.`;
    if (change === 'removed') changeExplanation = `Ở cảnh sau, ${solution} đã biến mất khỏi khung hình.`;
    else if (change === 'added') changeExplanation = `Ở cảnh sau, ${solution} vừa mới được thêm vào.`;
    else if (change === 'swapped') changeExplanation = `Hai bạn ${solution.split('|').join(' và ')} đã đổi chỗ cho nhau.`;
    else if (change === 'property') {
      const changedIndex = before.findIndex((token, index) => token !== after[index]);
      changeExplanation = `Ở cảnh trước là ${before[changedIndex]}; sang cảnh sau, màu đổi thành ${after[changedIndex]}.`;
    }
    const hints = getTrackHints('g03-t3', input.ageTrack, input.seed, change);
    return {
      board: { kind: 'memory-change', before, after, change, options },
      solution,
      hints,
      explanation: changeExplanation,
      title: 'Nhận ra thay đổi',
      tutorial: getNaturalTutorial('g03-t3', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

definitions.push({
  gameTypeId: 'g04-t1',
  checkerId: 'reasoning-elimination-v1',
  boardKind: 'reasoning-elimination',
  parseBoard: (input) => reasoningEliminationBoardSchema.parse(input) as BoardData,
  solve: (board) => {
    if (board.kind !== 'reasoning-elimination') return null;
    const matching = board.candidates.filter((candidate) => board.clues.every((clue) => {
      const value = candidate.traits[clue.trait];
      return clue.negate ? value !== clue.value : value === clue.value;
    }));
    return matching.length === 1 ? matching[0]!.id : null;
  },
  check: (board, answer) => {
    if (typeof answer !== 'string') return false;
    const solved = definitions.find((entry) => entry.gameTypeId === 'g04-t1')?.solve(board);
    return solved === answer;
  },
  generate: (input) => {
    const rng = randomFor(input, 'g04-t1');
    const rank = ageRank(input.ageTrack);
    const variant = variantIndex('g04-t1', input.variant);
    const colors = shuffleDeterministic(rng, ['đỏ', 'xanh', 'vàng', 'tím', 'cam', 'hồng']);
    const shapes = shuffleDeterministic(rng, ['tròn', 'vuông', 'tam giác', 'sao', 'thoi']);
    const sizes = shuffleDeterministic(rng, ['to', 'nhỏ']);
    const targetColor = colors[0]!;
    const targetShape = shapes[0]!;
    const targetSize = sizes[0]!;
    const count = 3 + rank;
    const clueCount = rank === 3 ? 3 : rank >= 1 || variant !== 0 ? 2 : 1;
    const negative = variant === 2;
    const cluePool = [
      { trait: 'màu', value: negative ? colors[1]! : targetColor, negate: negative },
      { trait: 'hình', value: targetShape, negate: false },
      { trait: 'kích cỡ', value: targetSize, negate: false },
    ];
    const clues = shuffleDeterministic(rng, cluePool.slice(0, clueCount));
    const traits: TraitMap[] = [{ màu: targetColor, hình: targetShape, 'kích cỡ': targetSize }];
    if (clueCount === 1) {
      traits.push(
        { màu: colors[1]!, hình: targetShape, 'kích cỡ': targetSize },
        { màu: colors[2]!, hình: shapes[1]!, 'kích cỡ': sizes[1]! },
      );
    } else {
      // Each of the first two decoys violates just one clue. Removing either
      // clue therefore leaves more than one possible answer.
      traits.push(
        { màu: colors[1]!, hình: targetShape, 'kích cỡ': targetSize },
        { màu: targetColor, hình: shapes[1]!, 'kích cỡ': targetSize },
      );
      if (clueCount === 3) traits.push({ màu: targetColor, hình: targetShape, 'kích cỡ': sizes[1]! });
    }
    while (traits.length < count) {
      const index = traits.length;
      traits.push({ màu: colors[(index % (colors.length - 1)) + 1]!, hình: shapes[(index % (shapes.length - 1)) + 1]!, 'kích cỡ': sizes[index % 2]! });
    }
    const candidates: TraitItem[] = traits.map((entry, index) => ({ id: `candidate-${index + 1}`, traits: entry }));
    const options = shuffledOptions(input, 'g04-t1', candidates.map((candidate) => candidate.id));
    const orderedCandidates = options.map((id) => candidates.find((candidate) => candidate.id === id)!);
    const solution = candidates[0]!.id;
    const candIndex = options.indexOf(solution);
    const targetCandidate = candidates.find((candidate) => candidate.id === solution);
    const targetTraitsVi = targetCandidate ? Object.entries(targetCandidate.traits).map(([k, v]) => `${k} ${v}`).join(', ') : '';
    const hints = getTrackHints('g04-t1', input.ageTrack, input.seed);
    return {
      board: { kind: 'reasoning-elimination', candidates: orderedCandidates, clues, options },
      solution,
      hints,
      explanation: `Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ${candIndex + 1} (${targetTraitsVi}).`,
      title: 'Loại trừ theo manh mối',
      tutorial: getNaturalTutorial('g04-t1', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

function ifThenClosure(board: Extract<BoardData, { kind: 'reasoning-if-then' }>): Set<string> {
  const known = new Set(board.facts);
  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of board.rules) {
      if (known.has(rule.if) && !known.has(rule.then)) {
        known.add(rule.then);
        changed = true;
      }
    }
  }
  return known;
}

definitions.push({
  gameTypeId: 'g04-t2',
  checkerId: 'reasoning-if-then-v1',
  boardKind: 'reasoning-if-then',
  parseBoard: (input) => reasoningIfThenBoardSchema.parse(input) as BoardData,
  solve: (board) => {
    if (board.kind !== 'reasoning-if-then') return null;
    const known = new Set(board.facts);
    const closure = ifThenClosure(board);
    const derivable = [...closure].filter((fact) => !known.has(fact));
    // Return the first derivable fact that appears in options (canonical for solver)
    return derivable.find((fact) => board.options.includes(fact)) ?? null;
  },
  check: (board, answer) => {
    if (typeof answer !== 'string' || board.kind !== 'reasoning-if-then') return false;
    const known = new Set(board.facts);
    const closure = ifThenClosure(board);
    // Oracle semantics: accept any option that is derivable and not an initial fact
    if (!board.options.includes(answer)) return false;
    if (known.has(answer)) return false;
    return closure.has(answer);
  },
  generate: (input) => {
    const rng = randomFor(input, 'g04-t2');
    const rank = ageRank(input.ageTrack);
    const pools = [
      ['mây', 'mưa', 'áo mưa', 'ủng', 'ô', 'cầu vồng'],
      ['hạt mầm', 'cây non', 'nụ hoa', 'bông hoa', 'quả ngọt', 'chim hót'],
      ['mặt trời', 'buổi sáng', 'thức dậy', 'đánh răng', 'đi học', 'vào lớp'],
      ['nắng gắt', 'khát nước', 'uống nước', 'mát mẻ', 'vui vẻ', 'mỉm cười'],
    ];
    const words = pools[Math.floor(rng() * pools.length)]!;
    const variant = variantIndex('g04-t2', input.variant);
    const hasExtraRule = variant === 3;
    const maxChain = hasExtraRule ? 3 : 4;
    const chainLength = Math.min(words.length - 2, Math.max(variant >= 2 ? 2 : 1, 1 + rank), maxChain);
    const facts = [words[0]!];
    const rules = Array.from({ length: chainLength }, (_, index) => ({ if: words[index]!, then: words[index + 1]! }));
    if (hasExtraRule) {
      // An unrelated rule provides a distractor without short-circuiting the
      // very two-step inference requested by the variant.
      rules.push({ if: words[4]!, then: words[5]! });
    }
    const closure = ifThenClosure({ kind: 'reasoning-if-then', rules, facts, options: [] });
    const newFacts = [...closure].filter((fact) => !facts.includes(fact));
    // Age progression: for older tracks, the correct answer is the chain end (last derivable fact)
    // For younger tracks, it's the first derivable fact
    const derivableSorted = [...newFacts].sort();
    const solution = rank >= 2 || variant >= 2 ? newFacts[newFacts.length - 1]! : derivableSorted[0]!;
    // Distractors: only words NOT in closure and NOT initial facts
    const distractorPool = pools.flat().filter((w) => !closure.has(w) && !facts.includes(w));
    const distractors = shuffleDeterministic(rng, distractorPool).slice(0, 2 + rank);
    // Options: exactly ONE derivable fact (the solution) + distractors
    const options = shuffleDeterministic(rng, [solution, ...distractors]).slice(0, 3 + rank);
    const hints = getTrackHints('g04-t2', input.ageTrack, input.seed);
    // These associations are arbitrary implications between game symbols, not
    // claims about necessary causes in the world (for example, sun -> morning).
    const symbolRules = rules.map((rule) => `"${rule.if}" → "${rule.then}"`).join('; ');
    const symbolContext = 'Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này';
    return {
      board: { kind: 'reasoning-if-then', rules, facts, options },
      solution,
      hints,
      explanation: `${symbolContext}: ${symbolRules}. Từ thẻ "${facts[0]}", áp dụng luật để suy ra thẻ "${solution}".`,
      title: 'Nếu thì',
      tutorial: `${symbolContext}. ${getNaturalTutorial('g04-t2', input.ageTrack, Math.floor(rng() * 100), input.seed)}`,
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

function missingInfoMatches(board: Extract<BoardData, { kind: 'reasoning-missing-info' }>, extra?: { trait: string; value: string }): TraitItem[] {
  return board.candidates.filter((candidate) => board.known.every((fact) => candidate.traits[fact.trait] === fact.value)
    && (!extra || candidate.traits[extra.trait] === extra.value));
}

definitions.push({
  gameTypeId: 'g04-t3',
  checkerId: 'reasoning-missing-info-v1',
  boardKind: 'reasoning-missing-info',
  parseBoard: (input) => reasoningMissingInfoBoardSchema.parse(input) as BoardData,
  solve: (board) => {
    if (board.kind !== 'reasoning-missing-info') return null;
    const option = board.options.find((entry) => {
      const matches = missingInfoMatches(board, entry);
      return matches.length === 1 && matches[0]!.id === board.targetId;
    });
    return option?.id ?? null;
  },
  check: (board, answer) => {
    if (typeof answer !== 'string' || board.kind !== 'reasoning-missing-info') return false;
    const option = board.options.find((entry) => entry.id === answer);
    if (!option) return false;
    const matches = missingInfoMatches(board, option);
    return matches.length === 1 && matches[0]!.id === board.targetId;
  },
  generate: (input) => {
    const rng = randomFor(input, 'g04-t3');
    const rank = ageRank(input.ageTrack);
    const colors = shuffleDeterministic(rng, ['đỏ', 'xanh', 'vàng', 'tím']);
    const shapes = shuffleDeterministic(rng, ['tròn', 'vuông', 'sao', 'tam giác']);
    const sizes = ['to', 'nhỏ'];
    const count = Math.min(5, 3 + rank);
    const positions = ['trên', 'dưới'] as const;
    const candidates: { id: string; traits: Record<string, string> }[] = Array.from({ length: count }, (_, index) => ({
      id: `candidate-${index + 1}`,
      traits: {
        màu: colors[index % colors.length]!,
        hình: shapes[index % shapes.length]!,
        'kích cỡ': sizes[index % sizes.length]!,
        ...(rank === 3 ? { 'vị trí': positions[index % positions.length]! } : {}),
      },
    }));
    const target = candidates[0]!;
    candidates[1]!.traits['màu'] = target.traits['màu']!;
    candidates[1]!.traits['kích cỡ'] = target.traits['kích cỡ']!;
    candidates[1]!.traits['hình'] = shapes.find((s) => s !== target.traits['hình'])!;
    for (let i = 2; i < count; i += 1) {
      if (candidates[i]!.traits['màu'] === target.traits['màu']) {
        candidates[i]!.traits['màu'] = colors.find((c) => c !== target.traits['màu'])!;
      }
    }
    const known = rank >= 2
      ? [{ trait: 'màu', value: target.traits['màu']! }, { trait: 'kích cỡ', value: target.traits['kích cỡ']! }]
      : [{ trait: 'màu', value: target.traits['màu']! }];
    const questionTrait = 'hình';
    const targetId = target.id;
    const options = [
      { id: 'fact-a', trait: 'hình', value: target.traits['hình']! },
      { id: 'fact-b', trait: 'hình', value: candidates[1]!.traits['hình']! },
      { id: 'fact-c', trait: 'màu', value: colors.find((c) => c !== target.traits['màu'])! },
      ...(rank >= 2 ? [{ id: 'fact-d', trait: 'kích cỡ', value: sizes.find((s) => s !== target.traits['kích cỡ'])! }] : []),
    ];
    const solution = 'fact-a';
    const solOpt = options.find((opt) => opt.id === solution);
    const factDesc = solOpt ? `${solOpt.trait} là ${solOpt.value}` : 'manh mối còn thiếu';
    const hints = getTrackHints('g04-t3', input.ageTrack, input.seed);
    const candidateOrder = shuffleDeterministic(randomFor(input, 'g04-t3-candidate-order'), candidates);
    candidateOrder.splice(candidateOrder.findIndex((candidate) => candidate.id === targetId), 1);
    candidateOrder.splice(candidateAnswerSlot(input, 'g04-t3', candidates.length), 0, target);
    return {
      board: {
        kind: 'reasoning-missing-info',
        scenario: 'Mình cần biết chắc một bạn là ai.',
        candidates: candidateOrder,
        known,
        targetId,
        questionTrait,
        options: shuffleDeterministic(rng, options),
      },
      solution,
      hints,
      explanation: `Manh mối còn thiếu giúp nhận diện chính xác bạn này là: ${factDesc}.`,
      title: 'Thông tin còn thiếu',
      tutorial: getNaturalTutorial('g04-t3', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

function balanceAnswer(board: Extract<BoardData, { kind: 'quantity-balance' }>): number | null {
  const left = board.left.reduce((sum, item) => sum + item.weight, 0);
  const right = board.right.reduce((sum, item) => sum + item.weight, 0);
  if (board.mode === 'compare') return Math.abs(left - right);
  if (board.mode === 'replace') {
    const side = board.left.some((item) => item.id === board.replaceId) ? board.left : board.right;
    const old = side.find((item) => item.id === board.replaceId);
    if (!old) return null;
    const sideSum = side.reduce((sum, item) => sum + item.weight, 0);
    const other = side === board.left ? right : left;
    return other - (sideSum - old.weight);
  }
  if (!board.unknownSide) return null;
  return board.unknownSide === 'left' ? right - left : left - right;
}

// Which weight is swapped out in replace mode. The renderer has to mark it,
// otherwise the child cannot know that the answer replaces a weight instead of
// being added to a pan.
export function quantityBalanceReplaceTarget(
  board: Extract<BoardData, { kind: 'quantity-balance' }>,
): { side: 'left' | 'right'; index: number; weight: number } | null {
  if (board.mode !== 'replace' || !board.replaceId) return null;
  const leftIndex = board.left.findIndex((item) => item.id === board.replaceId);
  if (leftIndex >= 0) return { side: 'left', index: leftIndex, weight: board.left[leftIndex]!.weight };
  const rightIndex = board.right.findIndex((item) => item.id === board.replaceId);
  if (rightIndex >= 0) return { side: 'right', index: rightIndex, weight: board.right[rightIndex]!.weight };
  return null;
}

definitions.push({
  gameTypeId: 'g05-t1',
  checkerId: 'quantity-balance-v1',
  boardKind: 'quantity-balance',
  parseBoard: (input) => quantityBalanceBoardSchema.parse(input) as BoardData,
  solve: (board) => board.kind === 'quantity-balance' ? balanceAnswer(board) : null,
  check: (board, answer) => {
    if (!Number.isInteger(answer) || board.kind !== 'quantity-balance') return false;
    return balanceAnswer(board) === answer;
  },
  generate: (input) => {
    const rng = randomFor(input, 'g05-t1');
    const rank = ageRank(input.ageTrack);
    const mode = (['missing', 'replace', 'compare', 'unknown'] as const)[variantIndex('g05-t1', input.variant) % 4] as 'missing' | 'replace' | 'compare' | 'unknown';
    const leftCount = 1 + Math.min(rank, 2);
    const rightCount = 1 + (rank >= 2 ? 1 : 0);
    const maxW = 3 + rank * 3;
    const expected = 1 + Math.floor(rng() * maxW);
    const left = Array.from({ length: leftCount }, (_, i) => ({
      id: `left-${i + 1}`,
      weight: 1 + Math.floor(rng() * maxW),
    }));
    const leftSum = left.reduce((sum, item) => sum + item.weight, 0);
    const unknownSide = mode === 'missing' || mode === 'unknown' ? 'left' as const : undefined;
    const replaceId = mode === 'replace' ? left[0]!.id : undefined;
    let rightTotal: number;
    if (mode === 'replace') {
      rightTotal = (leftSum - left[0]!.weight) + expected;
    } else if (mode === 'compare') {
      rightTotal = Math.max(1, leftSum - expected);
    } else {
      rightTotal = leftSum + expected;
    }
    const right = Array.from({ length: rightCount }, (_, i) => {
      if (i === rightCount - 1) {
        return { id: `right-${i + 1}`, weight: Math.max(1, rightTotal - (rightCount > 1 ? Math.floor(rightTotal / 2) : 0)) };
      }
      return { id: `right-${i + 1}`, weight: Math.max(1, Math.floor(rightTotal / 2)) };
    });
    const base = { kind: 'quantity-balance' as const, left, right, mode, unknownSide, replaceId, options: [] };
    const answer = balanceAnswer(base) ?? expected;
    const optionCount = 3 + (rank >= 2 ? 1 : 0) + (rank === 3 ? 1 : 0);
    // Consecutive numbers in ascending order; the correct one sits at a seeded slot.
    const answerSlot = Math.min(answer, Math.floor(randomFor(input, 'g05-t1-option-order')() * optionCount));
    const options = Array.from({ length: optionCount }, (_, i) => answer - answerSlot + i);
    const board = { ...base, options };
    const replaceTarget = quantityBalanceReplaceTarget(board);
    const hints = getTrackHints('g05-t1', input.ageTrack, input.seed, mode === 'replace' || mode === 'compare' ? mode : 'missing');
    const explanation = mode === 'replace' && replaceTarget
      ? `Thay quả cân thứ ${replaceTarget.index + 1} ở đĩa ${replaceTarget.side === 'left' ? 'Trái' : 'Phải'} bằng quả cân nặng ${answer} thì hai đĩa cân sẽ cân bằng.`
      : mode === 'compare'
        ? `Cần thêm ${answer} vào đĩa nhẹ hơn để hai đĩa thăng bằng.`
        : `Cần thêm ${answer} để hai bên đĩa cân có cân nặng bằng nhau.`;
    return {
      board,
      solution: answer,
      hints,
      explanation,
      title: 'Cân bằng hai bên',
      tutorial: getNaturalTutorial('g05-t1', input.ageTrack, Math.floor(rng() * 100), input.seed, board),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

function groupingAnswer(board: Extract<BoardData, { kind: 'quantity-grouping' }>): number {
  const groups = Math.floor(board.total / board.groupSize);
  const remainder = board.total % board.groupSize;
  if (board.mode === 'exact') return groups;
  if (board.mode === 'remainder') return remainder;
  if (board.mode === 'floor') return groups;
  return remainder === 0 ? 0 : board.groupSize - remainder;
}

definitions.push({
  gameTypeId: 'g05-t2',
  checkerId: 'quantity-grouping-v1',
  boardKind: 'quantity-grouping',
  parseBoard: (input) => quantityGroupingBoardSchema.parse(input) as BoardData,
  solve: (board) => board.kind === 'quantity-grouping' ? groupingAnswer(board) : null,
  check: (board, answer) => {
    if (!Number.isInteger(answer) || board.kind !== 'quantity-grouping') return false;
    return groupingAnswer(board) === answer;
  },
  generate: (input) => {
    const rng = randomFor(input, 'g05-t2');
    const rank = ageRank(input.ageTrack);
    const quarter = candidateQuarter(input.seed);
    const mode = (['exact', 'remainder', 'floor', 'needed'] as const)[variantIndex('g05-t2', input.variant) % 4] as 'exact' | 'remainder' | 'floor' | 'needed';
    const groupSize = rank === 0
      ? (quarter === 2 ? 3 + Math.floor(rng() * 2) : 2 + Math.min(quarter, 2))
      : Math.min(9, 2 + rank + quarter + Math.floor(rng() * 2));
    const maxGroups = Math.min(rank === 0 ? (mode === 'exact' ? 5 : 4) : 5 + rank + quarter, Math.floor((50 - (mode === 'exact' ? 0 : groupSize - 1)) / groupSize));
    const minGroups = Math.min(maxGroups, rank === 0 ? 2 + quarter : 2 + rank + Math.floor(quarter / 2));
    const groups = minGroups + Math.floor(rng() * (maxGroups - minGroups + 1));
    const total = mode === 'exact' ? groupSize * groups : groupSize * groups + 1 + Math.floor(rng() * (groupSize - 1));
    const base = { kind: 'quantity-grouping' as const, total, groupSize, mode, options: [] };
    const expected = groupingAnswer(base);
    // Identical tiny distractor pools previously produced the same rendered
    // shuffle for every remainder/needed item. Vary the pool by item seed too.
    const optionCount = 3 + rank;
    const distractorRng = randomFor(input, 'g05-t2-distractors');
    const pool = Array.from({ length: Math.max(total + groupSize, optionCount * 3) + 1 }, (_, value) => value).filter((value) => value !== expected);
    const answerSlot = candidateAnswerSlot(input, 'g05-t2', optionCount);
    let options: number[] = [];
    for (let attempt = 0; attempt < 256; attempt += 1) {
      const candidates = [expected, ...shuffleDeterministic(distractorRng, pool).slice(0, optionCount - 1)];
      options = displayQuantityGroupingOptions({ ...base, options: candidates });
      if (options.indexOf(expected) === answerSlot) break;
    }
    if (options.indexOf(expected) !== answerSlot) throw new Error('Could not place grouping answer in its scheduled slot');
    let groupExp = `Chia đều thành các nhóm ${groupSize}, kết quả là ${expected}.`;
    if (mode === 'exact') groupExp = `Chia đều thành các nhóm ${groupSize}, ta được đúng ${expected} nhóm.`;
    else if (mode === 'remainder') groupExp = `Sau khi chia thành các nhóm ${groupSize}, phần còn dư ra là ${expected}.`;
    else if (mode === 'floor') groupExp = `Số nhóm trọn vẹn gom được là ${expected} nhóm.`;
    else if (mode === 'needed') groupExp = `Để gom đủ thêm một nhóm ${groupSize} nữa, ta cần thêm ${expected} phần.`;
    const hints = getTrackHints('g05-t2', input.ageTrack, input.seed, mode === 'remainder' || mode === 'needed' ? mode : 'groups');
    return {
      board: { ...base, options },
      solution: expected,
      hints,
      explanation: groupExp,
      title: 'Chia nhóm',
      tutorial: getNaturalTutorial('g05-t2', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

function targetSubsets(board: Extract<BoardData, { kind: 'quantity-target' }>): string[][] {
  const results: string[][] = [];
  const items = board.items;
  const walk = (index: number, chosen: string[]): void => {
    if (chosen.length > board.maxItems) return;
    if (index === items.length) {
      if (chosen.length > 0) results.push([...chosen]);
      return;
    }
    walk(index + 1, chosen);
    walk(index + 1, [...chosen, items[index]!.id]);
  };
  walk(0, []);
  const sums = results.map((ids) => ids.reduce((total, id) => total + (items.find((item) => item.id === id)?.value ?? 0), 0));
  if (board.mode === 'not-over') {
    const best = Math.max(...sums.filter((sum) => sum <= board.target));
    return results.filter((_, index) => sums[index] === best);
  }
  const valid = results.filter((_, index) => sums[index] === board.target);
  if (board.mode === 'exact-two') return valid.filter((ids) => ids.length === 2);
  if (board.mode === 'fewest') {
    const shortest = Math.min(...valid.map((ids) => ids.length));
    return valid.filter((ids) => ids.length === shortest);
  }
  return valid;
}

// Every selection the checker accepts. The renderer uses it to tell the child
// when the basket already satisfies the rule before submitting.
export function quantityTargetSatisfies(
  board: Extract<BoardData, { kind: 'quantity-target' }>,
  answer: unknown,
): boolean {
  if (!isStringArray(answer)) return false;
  if (new Set(answer).size !== answer.length) return false;
  return targetSubsets(board).some((ids) => sameStringSet(ids, answer));
}

definitions.push({
  gameTypeId: 'g05-t3',
  checkerId: 'quantity-target-v1',
  boardKind: 'quantity-target',
  parseBoard: (input) => quantityTargetBoardSchema.parse(input) as BoardData,
  solve: (board) => {
    if (board.kind !== 'quantity-target') return null;
    const valid = targetSubsets(board).sort((a, b) => a.length - b.length || a.join(',').localeCompare(b.join(',')));
    return valid[0] ?? null;
  },
  check: (board, answer) => {
    if (board.kind !== 'quantity-target') return false;
    return quantityTargetSatisfies(board, answer);
  },
  generate: (input) => {
    const rng = randomFor(input, 'g05-t3');
    const rank = ageRank(input.ageTrack);
    const mode = (['fewest', 'exact-two', 'not-over', 'any'] as const)[variantIndex('g05-t3', input.variant) % 4] as 'fewest' | 'exact-two' | 'not-over' | 'any';
    const itemCount = 3 + rank;
    const values = shuffleDeterministic(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, itemCount);
    const items = values.map((value, index) => ({ id: `item-${index + 1}`, value }));
    const target = mode === 'not-over' ? 5 + rank * 3 : values[0]! + values[1]!;
    const maxItems = mode === 'exact-two' ? 2 : Math.min(4, 2 + (rank >= 2 ? 1 : 0) + (rank === 3 ? 1 : 0));
    const base = { kind: 'quantity-target' as const, items, target, maxItems, mode, options: items.map((item) => item.id) };
    const subsets = targetSubsets(base).sort((a, b) => a.length - b.length || a.join(',').localeCompare(b.join(',')));
    const solution = (subsets[0] ?? [items[0]!.id]) as string[];
    const solValues = solution.map((id) => items.find((item) => item.id === id)?.value).filter((v): v is number => typeof v === 'number');
    const solSum = solValues.reduce((sum, value) => sum + value, 0);
    const hints = getTrackHints('g05-t3', input.ageTrack, input.seed, mode, { target, max: maxItems });
    const explanation = mode === 'fewest'
      ? `Chọn ${solution.length} món (${solValues.join(' và ')}) để đạt tổng đúng bằng ${target} với số món ít nhất.`
      : mode === 'exact-two'
        ? `Chọn đúng hai món (${solValues.join(' và ')}) để đạt tổng đúng bằng ${target}.`
        : mode === 'not-over'
          ? `Gom ${solValues.join(' và ')} để có tổng là ${solSum}, không vượt quá mục tiêu ${target}.`
          : `Chọn các món (${solValues.join(' và ')}) để đạt tổng đúng bằng ${target}.`;
    return {
      board: base,
      solution,
      hints,
      explanation,
      title: 'Đủ mục tiêu',
      tutorial: getNaturalTutorial('g05-t3', input.ageTrack, Math.floor(rng() * 100), input.seed, base),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

function commandOrderValid(board: Extract<BoardData, { kind: 'planning-command-order' }>, order: readonly string[]): boolean {
  if (order.length !== board.commands.length) return false;
  if (!sameStringSet(order, board.commands.map((command) => command.id))) return false;
  const index = new Map(order.map((id, position) => [id, position]));
  return board.before.every(([before, after]) => (index.get(before) ?? -1) < (index.get(after) ?? -1));
}

function solveCommandOrder(board: Extract<BoardData, { kind: 'planning-command-order' }>): string[] | null {
  const remaining = new Map(board.commands.map((command) => [command.id, command.id]));
  const order: string[] = [];
  while (remaining.size > 0) {
    const ready = [...remaining.keys()].filter((id) => board.before.every(([before, after]) => after !== id || !remaining.has(before))).sort();
    const next = ready[0];
    if (!next) return null;
    order.push(next);
    remaining.delete(next);
  }
  return commandOrderValid(board, order) ? order : null;
}

definitions.push({
  gameTypeId: 'g06-t2',
  checkerId: 'planning-command-order-v1',
  boardKind: 'planning-command-order',
  parseBoard: (input) => planningCommandOrderBoardSchema.parse(input) as BoardData,
  solve: (board) => board.kind === 'planning-command-order' ? solveCommandOrder(board) : null,
  check: (board, answer) => isStringArray(answer) && board.kind === 'planning-command-order' && commandOrderValid(board, answer),
  generate: (input) => {
    const rng = randomFor(input, 'g06-t2');
    const rank = ageRank(input.ageTrack);
    const variant = variantIndex('g06-t2', input.variant);
    for (let i = 0; i < variant; i += 1) rng();
    const count = 3 + rank;
    const scenarios = [
      ['Mở hộp', 'Lấy bút', 'Lấy giấy', 'Đóng hộp', 'Cất hộp', 'Dọn bàn'],
      ['Mở túi', 'Lấy khăn', 'Lấy áo', 'Đóng túi', 'Cất túi', 'Dọn chỗ'],
      ['Chuẩn bị khay', 'Lấy hạt', 'Lấy đất', 'Gieo hạt', 'Tưới nước', 'Dọn khay'],
      ['Bật đèn', 'Lấy sách', 'Lấy vở', 'Ngồi vào bàn', 'Mở sách', 'Đọc bài'],
      ['Lấy bát', 'Xới cơm', 'Múc canh', 'Mời cả nhà', 'Ăn cơm', 'Dọn bát'],
      ['Mở hộp màu', 'Lấy cọ', 'Lấy màu', 'Vẽ tranh', 'Rửa cọ', 'Cất cọ'],
    ];
    const scenario = scenarios[Math.floor(rng() * scenarios.length)]!;
    const rawCommands = Array.from({ length: count }, (_, index) => ({
      id: `step-${index + 1}`,
      text: scenario[index] as string,
    }));
    // Fork after the first command. Steps 2 and 3 remain unordered, so the
    // predicate's support for alternative orders is exercised by real items.
    const edges: [string, string][] = [
      [rawCommands[0]!.id, rawCommands[1]!.id],
      [rawCommands[0]!.id, rawCommands[2]!.id],
    ];
    if (count >= 4) edges.push([rawCommands[1]!.id, rawCommands[3]!.id], [rawCommands[2]!.id, rawCommands[3]!.id]);
    if (count >= 5) edges.push([rawCommands[3]!.id, rawCommands[4]!.id]);
    if (count >= 6) edges.push([rawCommands[4]!.id, rawCommands[5]!.id]);
    const before = shuffleDeterministic(randomFor(input, 'g06-t2-rule-order'), edges);
    // Never print even this partial DAG in canonical solution order.
    if (before.every((edge, i) => edge[0] === edges[i]![0] && edge[1] === edges[i]![1])) before.reverse();
    const commands = shuffleDeterministic(rng, rawCommands);
    const board = { kind: 'planning-command-order' as const, commands, before };
    const solution = solveCommandOrder(board) as string[];
    const commandTexts = solution.map((id) => commands.find((cmd) => cmd.id === id)?.text).filter(Boolean);
    const hints = getTrackHints('g06-t2', input.ageTrack, input.seed);
    const orderRules = before.map(([first, second]) => {
      const firstText = commands.find((command) => command.id === first)!.text;
      const secondText = commands.find((command) => command.id === second)!.text;
      return `${firstText} → ${secondText}`;
    }).join('; ');
    const orderContext = `Luật riêng của ván này (→ là làm trước): ${orderRules}.`;
    return {
      board,
      solution,
      hints,
      explanation: `${rank === 3 ? '' : `${orderContext} `}Một thứ tự theo luật của ván này là: ${commandTexts.join(' → ')}.`,
      title: 'Xếp lệnh',
      tutorial: getNaturalTutorial('g06-t2', input.ageTrack, 0, input.seed, board),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

const DIRECTION_VECTORS: Record<Direction, PathStep> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function simulateCommands(
  board: Extract<BoardData, { kind: 'planning-fix-step' }>,
  commands: readonly Direction[],
): PathStep | null {
  const walls = new Set(board.walls.map(pointKey));
  let current = { ...board.start };
  for (const command of commands) {
    const vector = DIRECTION_VECTORS[command];
    const next = { x: current.x + vector.x, y: current.y + vector.y };
    if (next.x < 0 || next.y < 0 || next.x >= board.width || next.y >= board.height || walls.has(pointKey(next))) return null;
    current = next;
  }
  return current;
}

function fixedCommandOptions(board: Extract<BoardData, { kind: 'planning-fix-step' }>): string[] {
  return board.options.filter((option) => {
    const commands = [...board.commands];
    commands[option.index] = option.command;
    const end = simulateCommands(board, commands);
    return Boolean(end && end.x === board.goal.x && end.y === board.goal.y);
  }).map((option) => option.id).sort();
}

definitions.push({
  gameTypeId: 'g06-t3',
  checkerId: 'planning-fix-step-v1',
  boardKind: 'planning-fix-step',
  parseBoard: (input) => planningFixStepBoardSchema.parse(input) as BoardData,
  solve: (board) => board.kind === 'planning-fix-step' ? fixedCommandOptions(board)[0] ?? null : null,
  check: (board, answer) => typeof answer === 'string' && board.kind === 'planning-fix-step' && fixedCommandOptions(board).includes(answer),
  generate: (input) => {
    const rng = randomFor(input, 'g06-t3');
    const rank = ageRank(input.ageTrack);
    const quarter = candidateQuarter(input.seed);
    const width = Math.min(7, 5 + (rank >= 2 ? 1 : 0) + (rank === 3 || quarter >= 2 ? 1 : 0));
    const height = width;
    const start = { x: 0, y: 0 };
    const stepCount = Math.min(8, 4 + rank + (quarter >= 2 ? 1 : 0));
    const goalX = Math.max(1, Math.min(width - 1, Math.floor(stepCount / 2) + Math.floor(rng() * 3) - 1));
    const goalY = stepCount - goalX;
    const goal = { x: goalX, y: goalY };
    const correctCommands: Direction[] = shuffleDeterministic(rng, [
      ...Array.from({ length: goalX }, () => 'right' as const),
      ...Array.from({ length: goalY }, () => 'down' as const),
    ]);
    const protectedCells = new Set([pointKey(start)]);
    let current = { ...start };
    for (const command of correctCommands) {
      const move = DIRECTION_VECTORS[command];
      current = { x: current.x + move.x, y: current.y + move.y };
      protectedCells.add(pointKey(current));
    }
    const wallCandidates: PathStep[] = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!protectedCells.has(`${x},${y}`)) wallCandidates.push({ x, y });
      }
    }
    const walls = shuffleDeterministic(rng, wallCandidates).slice(0, Math.min(rank + quarter, 10));
    const commands = [...correctCommands];
    const errorIndex = 1 + Math.floor(rng() * (commands.length - 2));
    commands[errorIndex] = 'up';
    const options = shuffleDeterministic(rng, [
      { id: 'fix-a', index: errorIndex, command: 'right' as Direction },
      { id: 'fix-b', index: errorIndex, command: 'down' as Direction },
      { id: 'fix-c', index: errorIndex, command: 'left' as Direction },
      { id: 'fix-d', index: errorIndex, command: 'up' as Direction },
    ]).filter((option, index, list) => list.findIndex((entry) => entry.command === option.command) === index);
    const board = { kind: 'planning-fix-step' as const, width, height, start, goal, walls, commands, options };
    const solution = fixedCommandOptions(board)[0] as string;
    const solOption = options.find((entry) => entry.id === solution);
    const dirVi = solOption ? DIRECTION_SHORT_VI[solOption.command] ?? solOption.command : '';
    const stepIndex = solOption ? solOption.index + 1 : 1;
    const hints = getTrackHints('g06-t3', input.ageTrack, input.seed);
    return {
      board,
      solution,
      hints,
      explanation: `Đổi bước ${stepIndex} sang hướng ${dirVi} để robot về đích an toàn.`,
      title: 'Sửa bước sai',
      tutorial: getNaturalTutorial('g06-t3', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

definitions.push({
  gameTypeId: 'g07-t1',
  checkerId: 'flexibility-classify-v1',
  boardKind: 'flexibility-classify',
  parseBoard: (input) => flexibilityClassifyBoardSchema.parse(input) as BoardData,
  solve: (board) => {
    if (board.kind !== 'flexibility-classify') return null;
    const matches = board.items.filter((item) => item.traits[board.rule.trait] === board.rule.value).map((item) => item.id).sort();
    return matches.length > 0 ? matches : null;
  },
  check: (board, answer) => {
    if (!isStringArray(answer) || board.kind !== 'flexibility-classify') return false;
    const expected = board.items.filter((item) => item.traits[board.rule.trait] === board.rule.value).map((item) => item.id);
    return sameStringSet(answer, expected);
  },
  generate: (input) => {
    const rng = randomFor(input, 'g07-t1');
    const rank = ageRank(input.ageTrack);
    const count = Math.min(6, 4 + rank);
    const shapes = shuffleDeterministic(rng, ['tròn', 'vuông', 'sao', 'tam giác', 'thoi']);
    const colors = shuffleDeterministic(rng, ['đỏ', 'xanh', 'vàng', 'tím', 'cam']);
    const sizes = ['to', 'nhỏ'] as const;
    const positions = ['trên', 'dưới'] as const;
    const traits = ['hình', 'màu', 'kích cỡ', 'vị trí'] as const;
    const trait = traits[variantIndex('g07-t1', input.variant) % traits.length] as 'hình' | 'màu' | 'kích cỡ' | 'vị trí';
    const targetValue = trait === 'hình' ? shapes[0]! : trait === 'màu' ? colors[0]! : trait === 'kích cỡ' ? sizes[0]! : positions[0]!;
    const matchCount = Math.max(1, Math.min(count - 1, 1 + Math.floor(rng() * (count - 2))));
    const rawItems: TraitItem[] = Array.from({ length: count }, (_, index) => {
      const isMatch = index < matchCount;
      return {
        id: `item-${index + 1}`,
        traits: {
          hình: trait === 'hình' ? (isMatch ? targetValue : shapes[1 + (index % (shapes.length - 1))]!) : shapes[index % shapes.length]!,
          màu: trait === 'màu' ? (isMatch ? targetValue : colors[1 + (index % (colors.length - 1))]!) : colors[index % colors.length]!,
          ...(rank >= 1 || trait === 'kích cỡ' ? { 'kích cỡ': trait === 'kích cỡ' ? (isMatch ? targetValue : sizes[1]!) : sizes[index % 2]! } : {}),
          ...(rank >= 2 || trait === 'vị trí' ? { 'vị trí': trait === 'vị trí' ? (isMatch ? targetValue : positions[1]!) : positions[index % 2]! } : {}),
          ...(rank === 3 ? { 'trọng lượng': (index % 2 === 0 ? 'nặng' : 'nhẹ')! } : {}),
        },
      };
    });
    const items = shuffleDeterministic(rng, rawItems).map((item, index) => ({
      ...item,
      id: `item-${index + 1}`,
    }));
    const board = { kind: 'flexibility-classify' as const, items, rule: { trait, value: targetValue }, options: items.map((item) => item.id) };
    const solution = items.filter((item) => item.traits[trait] === targetValue).map((item) => item.id).sort();
    const matchingIndices = items
      .map((item, idx) => ({ item, index: idx + 1 }))
      .filter(({ item }) => item.traits[trait] === targetValue)
      .map(({ index }) => `hình ${index}`);
    const hints = getTrackHints('g07-t1', input.ageTrack, input.seed, 'default', { trait });
    return {
      board,
      solution,
      hints,
      explanation: `Theo quy tắc mới (${trait} là "${targetValue}"), các hình phù hợp là: ${matchingIndices.join(', ')}.`,
      title: 'Đổi luật phân loại',
      tutorial: getNaturalTutorial('g07-t1', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

function relativeDirection(board: Extract<BoardData, { kind: 'flexibility-perspective' }>): RelativeDirection | null {
  const dx = board.target.x - board.viewer.x;
  const dy = board.target.y - board.viewer.y;
  if (dx === 0 && dy === 0) return null;
  const forward = board.viewer.facing === 'north' ? { x: 0, y: -1 }
    : board.viewer.facing === 'south' ? { x: 0, y: 1 }
      : board.viewer.facing === 'east' ? { x: 1, y: 0 } : { x: -1, y: 0 };
  const right = { x: -forward.y, y: forward.x };
  const ahead = dx * forward.x + dy * forward.y;
  const side = dx * right.x + dy * right.y;
  if (Math.abs(ahead) >= Math.abs(side)) return ahead >= 0 ? 'ahead' : 'behind';
  return side >= 0 ? 'right' : 'left';
}

definitions.push({
  gameTypeId: 'g07-t2',
  checkerId: 'flexibility-perspective-v1',
  boardKind: 'flexibility-perspective',
  parseBoard: (input) => flexibilityPerspectiveBoardSchema.parse(input) as BoardData,
  solve: (board) => board.kind === 'flexibility-perspective' ? relativeDirection(board) : null,
  check: (board, answer) => typeof answer === 'string' && board.kind === 'flexibility-perspective' && relativeDirection(board) === answer,
  generate: (input) => {
    const rng = randomFor(input, 'g07-t2');
    const rank = ageRank(input.ageTrack);
    const quarter = candidateQuarter(input.seed);
    const width = Math.min(7, 3 + rank + (quarter >= 2 ? 1 : 0));
    const height = width;
    const facings = ['north', 'east', 'south', 'west'] as const;
    const facing = facings[variantIndex('g07-t2', input.variant) % facings.length] as typeof facings[number];
    const distance = Math.min(width - 1, 1 + Math.floor((rank + quarter) / 2));
    const wanted = (['ahead', 'right', 'behind', 'left'] as const)[Math.floor(randomFor(input, 'g07-t2-direction')() * 4)] as RelativeDirection;
    const forward = facing === 'north' ? { x: 0, y: -1 } : facing === 'south' ? { x: 0, y: 1 } : facing === 'east' ? { x: 1, y: 0 } : { x: -1, y: 0 };
    const rightVec = { x: -forward.y, y: forward.x };
    const step = wanted === 'ahead' ? forward
      : wanted === 'behind' ? { x: -forward.x, y: -forward.y }
        : wanted === 'right' ? rightVec : { x: -rightVec.x, y: -rightVec.y };
    const minX = Math.max(0, -step.x * distance);
    const minY = Math.max(0, -step.y * distance);
    const maxX = width - 1 - Math.max(0, step.x * distance);
    const maxY = height - 1 - Math.max(0, step.y * distance);
    const viewer = { x: minX + Math.floor(rng() * (maxX - minX + 1)), y: minY + Math.floor(rng() * (maxY - minY + 1)), facing };
    const target = { x: viewer.x + step.x * distance, y: viewer.y + step.y * distance };
    const board = { kind: 'flexibility-perspective' as const, width, height, viewer, target, options: ['left', 'right', 'ahead', 'behind'] as RelativeDirection[] };
    const solution = relativeDirection(board) as RelativeDirection;
    const solLabel = DIRECTION_SHORT_VI[solution] ?? solution;
    const facingNames: Record<string, string> = {
      north: 'hướng lên trên',
      south: 'hướng xuống dưới',
      east: 'hướng sang phải',
      west: 'hướng sang trái',
    };
    const facingDesc = facingNames[board.viewer.facing] ?? board.viewer.facing;
    const hints = getTrackHints('g07-t2', input.ageTrack, input.seed);
    return {
      board,
      solution,
      hints,
      explanation: `Từ hướng nhìn của nhân vật đang ${facingDesc}, đồ vật nằm ở ${solLabel}.`,
      title: 'Đổi góc nhìn',
      tutorial: getNaturalTutorial('g07-t2', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

function samePath(left: readonly PathStep[], right: readonly PathStep[]): boolean {
  return left.length === right.length && left.every((point, index) => pointKey(point) === pointKey(right[index]!));
}

function simplePaths(width: number, height: number, start: PathStep = { x: 0, y: 0 }, goal: PathStep = { x: width - 1, y: height - 1 }): PathStep[][] {
  const topThenRight = [start, ...Array.from({ length: goal.x - start.x }, (_, index) => ({ x: start.x + index + 1, y: start.y })), ...Array.from({ length: goal.y - start.y }, (_, index) => ({ x: goal.x, y: start.y + index + 1 }))];
  const leftThenBottom = [start, ...Array.from({ length: goal.y - start.y }, (_, index) => ({ x: start.x, y: start.y + index + 1 })), ...Array.from({ length: goal.x - start.x }, (_, index) => ({ x: start.x + index + 1, y: goal.y }))];
  const zigzag = (verticalFirst: boolean): PathStep[] => {
    const path: PathStep[] = [start];
    let x = start.x;
    let y = start.y;
    let vertical = verticalFirst;
    while (x < goal.x || y < goal.y) {
      if (vertical && y < goal.y) y += 1;
      else if (!vertical && x < goal.x) x += 1;
      else if (x < goal.x) x += 1;
      else y += 1;
      path.push({ x, y });
      vertical = !vertical;
    }
    return path;
  };
  return [topThenRight, leftThenBottom, zigzag(false), zigzag(true)];
}

definitions.push({
  gameTypeId: 'g07-t3',
  checkerId: 'flexibility-alternative-v1',
  boardKind: 'flexibility-alternative',
  parseBoard: (input) => flexibilityAlternativeBoardSchema.parse(input) as BoardData,
  solve: (board) => {
    if (board.kind !== 'flexibility-alternative') return null;
    const pathBoard = { kind: 'path-planning' as const, width: board.width, height: board.height, start: board.start, goal: board.goal, walls: board.walls, waypoints: [] };
    return simplePaths(board.width, board.height, board.start, board.goal).find((path) => !samePath(path, board.knownPath) && checkPath(pathBoard, path)) ?? null;
  },
  check: (board, answer) => {
    if (!isPointArray(answer) || board.kind !== 'flexibility-alternative') return false;
    const pathBoard = { kind: 'path-planning' as const, width: board.width, height: board.height, start: board.start, goal: board.goal, walls: board.walls, waypoints: [] };
    return !samePath(answer, board.knownPath) && checkPath(pathBoard, answer);
  },
  generate: (input) => {
    const rng = randomFor(input, 'g07-t3');
    const rank = ageRank(input.ageTrack);
    const quarter = candidateQuarter(input.seed);
    const variant = variantIndex('g07-t3', input.variant);
    for (let i = 0; i < variant; i += 1) rng();
    const width = Math.min(7, 5 + (rank >= 2 ? 1 : 0) + (rank === 3 || quarter >= 2 ? 1 : 0));
    const height = width;
    const variedEndpoints = /\|D\d{3}-(?:main|bonus)/.test(input.seed);
    const start = { x: 0, y: variedEndpoints ? Math.floor(rng() * 2) : 0 };
    const goal = { x: width - 1, y: height - 1 - (variedEndpoints ? Math.floor(rng() * 2) : 0) };
    const paths = simplePaths(width, height, start, goal);
    const basePathIndex = Math.floor(rng() * paths.length);
    const knownPath = paths[(basePathIndex + variant) % paths.length]!;
    const solution = paths.find((path) => !samePath(path, knownPath))!;
    const zigzag = paths[3]!;
    const protectedCells = new Set([...knownPath, ...solution, ...zigzag].map(pointKey));
    const interiorCells: PathStep[] = [];
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        if (!protectedCells.has(pointKey({ x, y }))) {
          interiorCells.push({ x, y });
        }
      }
    }
    const wallCount = 1 + rank + quarter;
    const walls = shuffleDeterministic(rng, interiorCells).slice(0, Math.min(wallCount, interiorCells.length));
    const hints = getTrackHints('g07-t3', input.ageTrack, input.seed);
    return {
      board: { kind: 'flexibility-alternative' as const, width, height, start, goal, walls, knownPath },
      solution,
      hints,
      explanation: `Một lộ trình khác là ${solution.map(VIETNAMESE_COORDINATE).join(' → ')}; lộ trình này tới đích mà không lặp lại đường cũ hay đi qua tường.`,
      title: 'Cách giải khác',
      tutorial: getNaturalTutorial('g07-t3', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

definitions.push({
  gameTypeId: 'g08-t1',
  checkerId: 'observation-difference-v1',
  boardKind: 'observation-difference',
  parseBoard: (input) => observationDifferenceBoardSchema.parse(input) as BoardData,
  solve: (board) => {
    if (board.kind !== 'observation-difference') return null;
    const differences = board.left.flatMap((row, y) => row.flatMap((cell, x) => cell !== board.right[y]?.[x] ? [{ x, y }] : []));
    return differences.length > 0 ? differences : null;
  },
  check: (board, answer) => {
    if (!isPointArray(answer) || board.kind !== 'observation-difference') return false;
    const differences = board.left.flatMap((row, y) => row.flatMap((cell, x) => cell !== board.right[y]?.[x] ? [{ x, y }] : []));
    return samePointSet(answer, differences);
  },
  generate: (input) => {
    const rng = randomFor(input, 'g08-t1');
    const rank = ageRank(input.ageTrack);
    const width = 4 + (rank >= 2 ? 1 : 0) + (rank === 3 ? 1 : 0);
    const symbols = ['lá', 'hoa', 'quả', 'sao', 'mây', 'nấm', 'cỏ'];
    const left = Array.from({ length: width }, () => Array.from({ length: width }, () => symbols[Math.floor(rng() * symbols.length)] as string));
    const right = left.map((row) => [...row]);
    const count = 1 + rank;
    const changed: PathStep[] = [];
    while (changed.length < count) {
      const point = { x: Math.floor(rng() * width), y: Math.floor(rng() * width) };
      if (changed.some((entry) => pointKey(entry) === pointKey(point))) continue;
      const current = right[point.y]![point.x] as string;
      right[point.y]![point.x] = symbols.find((symbol) => symbol !== current) as string;
      changed.push(point);
    }
    const optionCount = 4 + rank;
    const distractorCandidates: PathStep[] = [];
    for (let y = 0; y < width; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!changed.some((entry) => entry.x === x && entry.y === y)) {
          distractorCandidates.push({ x, y });
        }
      }
    }
    const distractors = shuffleDeterministic(rng, distractorCandidates).slice(0, Math.max(0, optionCount - changed.length));
    const options = uniquePoints(shuffleDeterministic(rng, [...changed, ...distractors]));
    const diffCoords = changed.map((pt) => VIETNAMESE_COORDINATE(pt)).join(' và ');
    const hints = getTrackHints('g08-t1', input.ageTrack, input.seed);
    return {
      board: { kind: 'observation-difference', left, right, options },
      solution: changed,
      hints,
      explanation: `Điểm khác nhau giữa hai hình nằm ở ${diffCoords}.`,
      title: 'Điểm khác biệt',
      tutorial: getNaturalTutorial('g08-t1', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

definitions.push({
  gameTypeId: 'g08-t2',
  checkerId: 'observation-two-traits-v1',
  boardKind: 'observation-two-traits',
  parseBoard: (input) => observationTwoTraitsBoardSchema.parse(input) as BoardData,
  solve: (board) => {
    if (board.kind !== 'observation-two-traits') return null;
    const matches = board.items.filter((item) => board.criteria.every((criterion) => item.traits[criterion.trait] === criterion.value)).map((item) => item.id).sort();
    return matches.length > 0 ? matches : null;
  },
  check: (board, answer) => {
    if (!isStringArray(answer) || board.kind !== 'observation-two-traits') return false;
    const expected = board.items.filter((item) => board.criteria.every((criterion) => item.traits[criterion.trait] === criterion.value)).map((item) => item.id);
    return sameStringSet(answer, expected);
  },
  generate: (input) => {
    const rng = randomFor(input, 'g08-t2');
    const rank = ageRank(input.ageTrack);
    const count = Math.min(6, 4 + rank);
    const shapes = shuffleDeterministic(rng, ['tròn', 'vuông', 'sao', 'tam giác', 'thoi']);
    const colors = shuffleDeterministic(rng, ['đỏ', 'xanh', 'vàng', 'tím', 'cam']);
    const sizes = ['to', 'nhỏ'] as const;
    const positions = ['trên', 'dưới'] as const;
    const traitPairs: [
      { trait: 'hình'; value: string },
      { trait: 'màu' | 'kích cỡ' | 'vị trí'; value: string }
    ][] = [
      [{ trait: 'hình', value: shapes[0]! }, { trait: 'kích cỡ', value: sizes[0]! }],
      [{ trait: 'hình', value: shapes[0]! }, { trait: 'màu', value: colors[0]! }],
      [{ trait: 'hình', value: shapes[0]! }, { trait: 'vị trí', value: positions[0]! }],
      [{ trait: 'hình', value: shapes[1]! }, { trait: 'màu', value: colors[1]! }],
    ];
    const criteria = traitPairs[variantIndex('g08-t2', input.variant) % traitPairs.length]!;
    const matchCount = Math.max(1, Math.min(count - 1, 1 + Math.floor(rng() * (count - 2))));
    const rawItems: TraitItem[] = Array.from({ length: count }, (_, index) => {
      const isMatch = index < matchCount;
      return {
        id: `item-${index + 1}`,
        traits: {
          hình: isMatch ? criteria[0].value : shapes[1 + (index % (shapes.length - 1))]!,
          màu: isMatch && criteria[1].trait === 'màu' ? criteria[1].value : colors[(index + 1) % colors.length]!,
          'kích cỡ': isMatch && criteria[1].trait === 'kích cỡ' ? criteria[1].value : sizes[(index + 1) % 2]!,
          ...(rank >= 1 || criteria[1].trait === 'vị trí' ? { 'vị trí': isMatch && criteria[1].trait === 'vị trí' ? criteria[1].value : positions[(index + 1) % 2]! } : {}),
          ...(rank === 3 ? { 'trọng lượng': (index % 2 === 0 ? 'nặng' : 'nhẹ')! } : {}),
        },
      };
    });
    const items = shuffleDeterministic(rng, rawItems).map((item, index) => ({
      ...item,
      id: `item-${index + 1}`,
    }));
    const board = { kind: 'observation-two-traits' as const, items, criteria, options: items.map((item) => item.id) };
    const solution = items.filter((item) => criteria.every((criterion) => item.traits[criterion.trait] === criterion.value)).map((item) => item.id).sort();
    const matchingIndices = items
      .map((item, idx) => ({ item, index: idx + 1 }))
      .filter(({ item }) => criteria.every((criterion) => item.traits[criterion.trait] === criterion.value))
      .map(({ index }) => `hình ${index}`);
    const critDesc = criteria.map((c) => `${c.trait} là ${c.value}`).join(' và ');
    const hints = getTrackHints('g08-t2', input.ageTrack, input.seed);
    return {
      board,
      solution,
      hints,
      explanation: `Các hình có đủ cả hai đặc điểm (${critDesc}) là: ${matchingIndices.join(', ')}.`,
      title: 'Hai đặc điểm',
      tutorial: getNaturalTutorial('g08-t2', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

definitions.push({
  gameTypeId: 'g08-t3',
  checkerId: 'observation-implausible-v1',
  boardKind: 'observation-implausible',
  parseBoard: (input) => observationImplausibleBoardSchema.parse(input) as BoardData,
  solve: (board) => {
    if (board.kind !== 'observation-implausible') return null;
    const bad = board.scene.filter((entry) => entry.traits[board.rule.trait] !== board.rule.value).map((entry) => entry.id);
    return bad.length === 1 ? bad[0]! : null;
  },
  check: (board, answer) => {
    if (typeof answer !== 'string' || board.kind !== 'observation-implausible') return false;
    const solved = definitions.find((entry) => entry.gameTypeId === 'g08-t3')?.solve(board);
    return solved === answer;
  },
  generate: (input) => {
    const rng = randomFor(input, 'g08-t3');
    const rank = ageRank(input.ageTrack);
    const index = variantIndex('g08-t3', input.variant);
    const count = 3 + rank;
    const ruleTrait = index % 2 === 0 ? 'nhóm' : 'bước';
    const ruleValue = (index === 0 ? 'đồ chơi' : index === 1 ? 'đi đúng hướng' : index === 2 ? 'đồ dùng học tập' : 'đi đúng vạch') as string;
    const flipIndex = Math.floor(rng() * count);

    const toyTexts = [
      'Bạn đang xếp các khối gỗ lâu đài',
      'Bạn đang lái ô tô đồ chơi trên sàn',
      'Bạn đang chơi gấu bông trên thảm',
      'Bạn đang lắp ráp mô hình tàu bay',
      'Bạn đang xếp các thanh gỗ domino',
      'Bạn đang ghép tranh đồ chơi vườn thú',
    ];
    const studyTexts = [
      'Bạn đang nắn nót viết bài vào vở ô ly',
      'Bạn đang dùng thước kẻ vẽ hình chữ nhật',
      'Bạn đang chuẩn bị hộp bút màu để vẽ',
      'Bạn đang mở sách toán làm bài tập',
      'Bạn đang đọc sách khoa học vui',
      'Bạn đang cất compa và tẩy vào hộp bút',
    ];
    const directionTexts = [
      'Bạn xếp hàng theo mũi tên vào khu vui chơi',
      'Bạn đi men theo hành lang bên tay phải',
      'Bạn bước theo lối đi một chiều chỉ dẫn',
      'Bạn đi theo chiều di chuyển của cả lớp',
      'Bạn tiến về phía trước theo vạch hướng dẫn',
      'Bạn đi vòng theo chiều kim đồng hồ',
    ];
    const lineTexts = [
      'Bạn bước trên vạch kẻ trắng dành cho người đi bộ',
      'Bạn đi ngay ngắn trong làn đường quy định',
      'Bạn dừng chân đúng phía trước vạch giới hạn',
      'Bạn bước vào đúng các ô số trên sân chơi',
      'Bạn đi theo đường vạch liền kẻ trên sàn',
      'Bạn xếp hàng ngay ngắn phía sau vạch sơn',
    ];

    const badToyText = 'Bạn mang bánh ngọt và nước có ga vào chơi';
    const badStudyText = 'Bạn đặt cốc trà sữa kem phô mai lên tập vở';
    const badDirectionText = 'Bạn chạy ngược chiều dòng người đang bước tới';
    const badLineText = 'Bạn chạy băng qua bên ngoài vạch kẻ an toàn';

    const pool = index === 0 ? toyTexts : index === 1 ? directionTexts : index === 2 ? studyTexts : lineTexts;
    const badText = index === 0 ? badToyText : index === 1 ? badDirectionText : index === 2 ? badStudyText : badLineText;
    const selectedTexts = shuffleDeterministic(rng, pool);

    const scene: { id: string; text: string; traits: TraitMap }[] = Array.from({ length: count }, (_, sceneIndex) => {
      const isBad = sceneIndex === flipIndex;
      const text = isBad ? badText : selectedTexts[sceneIndex % selectedTexts.length]!;
      return {
        id: `scene-${sceneIndex + 1}`,
        text,
        traits: {
          nhóm: ruleTrait === 'nhóm' && isBad ? 'đồ ăn' : (index === 2 ? 'đồ dùng học tập' : 'đồ chơi'),
          bước: ruleTrait === 'bước' && isBad ? (index === 3 ? 'đi ngoài vạch' : 'đi sai hướng') : (index === 3 ? 'đi đúng vạch' : 'đi đúng hướng'),
        },
      };
    });
    const options = shuffleDeterministic(rng, scene.map((entry) => entry.id));
    const board = { kind: 'observation-implausible' as const, scene, rule: { trait: ruleTrait, value: ruleValue }, options };
    const solution = scene.find((entry) => entry.traits[ruleTrait] !== ruleValue)?.id as string;
    const badIdx = scene.findIndex((entry) => entry.id === solution);
    const badNum = badIdx >= 0 ? badIdx + 1 : 1;
    const badTraitVal = scene[badIdx]?.traits[ruleTrait] ?? '';
    const hints = getTrackHints('g08-t3', input.ageTrack, input.seed);
    return {
      board,
      solution,
      hints,
      explanation: `Tình huống ${badNum}: "${scene[badIdx]!.text}" có đặc điểm "${badTraitVal}", trong khi luật của ván này yêu cầu "${ruleValue}".`,
      title: 'Chi tiết bất hợp lý',
      tutorial: getNaturalTutorial('g08-t3', input.ageTrack, Math.floor(rng() * 100), input.seed),
      targetSeconds: targetSeconds(input.ageTrack, input.seed),
      praiseKeys: PRAISE_KEYS,
    };
  },
});

export const REMAINING_MECHANICS: readonly RemainingMechanic[] = definitions;

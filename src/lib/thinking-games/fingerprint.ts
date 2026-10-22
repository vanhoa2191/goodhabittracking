import type { BoardData, PathBoard, PathStep, PuzzleItem } from './types';

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalValue[]
  | { readonly [key: string]: CanonicalValue };

export function stableStringify(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'bigint') return JSON.stringify(value.toString());
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(String(value));
}

export function stableHash64(input: string): string {
  let hash = BigInt('0xcbf29ce484222325');
  const prime = BigInt('0x100000001b3');
  const mask = BigInt('0xffffffffffffffff');
  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, '0');
}

function sortedSteps(steps: readonly PathStep[]): PathStep[] {
  return [...steps]
    .map((step) => ({ x: step.x, y: step.y }))
    .sort((a, b) => a.x - b.x || a.y - b.y);
}

function transformPoint(step: PathStep, width: number, height: number, transform: number): PathStep {
  switch (transform) {
    case 1:
      return { x: height - 1 - step.y, y: step.x };
    case 2:
      return { x: width - 1 - step.x, y: height - 1 - step.y };
    case 3:
      return { x: step.y, y: width - 1 - step.x };
    case 4:
      return { x: width - 1 - step.x, y: step.y };
    case 5:
      return { x: step.x, y: height - 1 - step.y };
    case 6:
      return { x: step.y, y: step.x };
    case 7:
      return { x: height - 1 - step.y, y: width - 1 - step.x };
    default:
      return { x: step.x, y: step.y };
  }
}

function transformPathBoard(board: PathBoard, transform: number): PathBoard {
  const swapsDimensions = transform === 1 || transform === 3 || transform === 6 || transform === 7;
  const width = swapsDimensions ? board.height : board.width;
  const height = swapsDimensions ? board.width : board.height;
  return {
    kind: 'path-planning',
    width,
    height,
    start: transformPoint(board.start, board.width, board.height, transform),
    goal: transformPoint(board.goal, board.width, board.height, transform),
    walls: sortedSteps(board.walls.map((step) => transformPoint(step, board.width, board.height, transform))),
    waypoints: [...board.waypoints]
      .map((waypoint) => ({
        id: waypoint.id,
        ...transformPoint(waypoint, board.width, board.height, transform),
      }))
      .sort((a, b) => a.id.localeCompare(b.id) || a.x - b.x || a.y - b.y),
    waypointOrder: board.waypointOrder,
    shortestPathOnly: board.shortestPathOnly,
  };
}

const REMAINING_BOARD_KINDS = new Set<BoardData['kind']>([
  'rule-error',
  'rule-transform',
  'spatial-silhouette',
  'spatial-rotation',
  'spatial-symmetry',
  'memory-position',
  'memory-change',
  'reasoning-elimination',
  'reasoning-if-then',
  'reasoning-missing-info',
  'quantity-balance',
  'quantity-grouping',
  'quantity-target',
  'planning-command-order',
  'planning-fix-step',
  'flexibility-classify',
  'flexibility-perspective',
  'flexibility-alternative',
  'observation-difference',
  'observation-two-traits',
  'observation-implausible',
]);

export function canonicalizeBoard(gameTypeId: string, boardData: unknown): CanonicalValue {
  if (!boardData || typeof boardData !== 'object') throw new Error('boardData must be an object');
  const board = boardData as BoardData;
  if (gameTypeId === 'g01-t1' && board.kind === 'rule-sequence') {
    return {
      kind: board.kind,
      sequence: [...board.sequence],
      options: [...board.options].sort(),
      ruleKind: board.ruleKind,
      period: board.period ?? null,
    };
  }
  if (gameTypeId === 'g03-t1' && board.kind === 'memory-sequence') {
    return {
      kind: board.kind,
      sequence: [...board.sequence],
      options: [...board.options].sort(),
      displayMs: board.displayMs,
      ...(board.mode === undefined ? {} : { mode: board.mode }),
      ...(board.groupSize === undefined ? {} : { groupSize: board.groupSize }),
      ...(board.missingIndex === undefined ? {} : { missingIndex: board.missingIndex }),
      ...(board.swappedIndices === undefined ? {} : { swappedIndices: [...board.swappedIndices] }),
    };
  }
  if (gameTypeId === 'g06-t1' && board.kind === 'path-planning') {
    let smallest: string | null = null;
    for (let transform = 0; transform < 8; transform += 1) {
      const candidate = stableStringify(transformPathBoard(board, transform));
      if (smallest === null || candidate < smallest) smallest = candidate;
    }
    return JSON.parse(smallest as string) as CanonicalValue;
  }
  if (REMAINING_BOARD_KINDS.has(board.kind)) {
    return JSON.parse(stableStringify(board)) as CanonicalValue;
  }
  throw new Error(`Unsupported board for ${gameTypeId}`);
}

export function puzzleFingerprint(gameTypeId: string, boardData: unknown): string {
  return stableHash64(stableStringify(canonicalizeBoard(gameTypeId, boardData)));
}

export function assertFingerprint(item: PuzzleItem): void {
  const expected = puzzleFingerprint(item.gameTypeId, item.boardData);
  if (expected !== item.fingerprint) {
    throw new Error(`fingerprint mismatch for ${item.id}: expected ${expected}, got ${item.fingerprint}`);
  }
}

export function fingerprintsEqual(a: string, b: string): boolean {
  return a === b;
}

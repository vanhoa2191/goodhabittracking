import { ageRank } from '../age';
import { getTrackHints, type HintContext } from '../content/hints';
import { pathBoardSchema } from '../schema';
import { createSeededRandom, shuffleDeterministic, stableSeedKey } from '../seeded';
import type { GameAgeTrack, PathBoard, PathStep } from '../types';

export const PATH_PLANNING_CHECKER_ID = 'path-planning-v1' as const;

const DIRECTIONS: readonly PathStep[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

// BigInt constants (computed once; literals like `1n`/`0n` are unavailable under ES2017 target).
const BIGINT_ONE = BigInt(1);
const BIGINT_ZERO = BigInt(0);

export function validatePathBoard(board: unknown): PathBoard {
  return pathBoardSchema.parse(board) as PathBoard;
}

function cellKey(point: PathStep): string {
  return `${point.x},${point.y}`;
}

function waypointMask(board: PathBoard, point: PathStep): number {
  let mask = 0;
  board.waypoints.forEach((waypoint, index) => {
    if (waypoint.x === point.x && waypoint.y === point.y) mask |= 1 << index;
  });
  return mask;
}

function stateAtStart(board: PathBoard): string {
  if (board.waypointOrder === 'ordered') {
    const first = board.waypoints[0];
    return first && first.x === board.start.x && first.y === board.start.y ? '1' : '0';
  }
  return String(waypointMask(board, board.start));
}

function advanceState(board: PathBoard, point: PathStep, state: string): string {
  if (board.waypointOrder === 'ordered') {
    const progress = Number(state);
    const next = board.waypoints[progress];
    if (next && next.x === point.x && next.y === point.y) return String(progress + 1);
    return state;
  }
  return String(Number(state) | waypointMask(board, point));
}

function stateComplete(board: PathBoard, state: string): boolean {
  if (board.waypointOrder === 'ordered') return Number(state) === board.waypoints.length;
  return Number(state) === (1 << board.waypoints.length) - 1;
}

export function solvePath(board: PathBoard): PathStep[] | null {
  const w = board.width;
  const h = board.height;
  const wallSet = new Set(board.walls.map(cellKey));

  const cellIndex = (p: PathStep) => p.y * w + p.x;
  const cellBit = (p: PathStep) => BIGINT_ONE << BigInt(cellIndex(p));

  const startState = stateAtStart(board);
  const startMask = cellBit(board.start);

  const queue: { point: PathStep; state: string; mask: bigint; path: PathStep[] }[] = [
    { point: board.start, state: startState, mask: startMask, path: [board.start] },
  ];

  const seenMasks = new Map<string, bigint[]>();
  seenMasks.set(`${cellKey(board.start)},${startState}`, [startMask]);

  let steps = 0;
  const MAX_STEPS = 50000;

  for (let index = 0; index < queue.length && steps++ < MAX_STEPS; index += 1) {
    const current = queue[index];
    if (!current) break;
    if (current.point.x === board.goal.x && current.point.y === board.goal.y && stateComplete(board, current.state)) {
      return current.path;
    }
    for (const direction of DIRECTIONS) {
      const next = { x: current.point.x + direction.x, y: current.point.y + direction.y };
      if (next.x < 0 || next.y < 0 || next.x >= w || next.y >= h) continue;
      if (wallSet.has(cellKey(next))) continue;

      const nextBit = cellBit(next);
      if ((current.mask & nextBit) !== BIGINT_ZERO) continue;

      const nextMask = current.mask | nextBit;
      const nextState = advanceState(board, next, current.state);
      const stateKey = `${cellKey(next)},${nextState}`;

      const existing = seenMasks.get(stateKey);
      if (existing) {
        let dominated = false;
        for (const m of existing) {
          if ((m & ~nextMask) === BIGINT_ZERO) {
            dominated = true;
            break;
          }
        }
        if (dominated) continue;
        existing.push(nextMask);
      } else {
        seenMasks.set(stateKey, [nextMask]);
      }

      queue.push({ point: next, state: nextState, mask: nextMask, path: [...current.path, next] });
    }
  }
  return null;
}

function validPathShape(board: PathBoard, answer: unknown): PathStep[] | null {
  if (!Array.isArray(answer)) return null;
  if (answer.length < 2 || answer.length > board.width * board.height) return null;
  const wallSet = new Set(board.walls.map(cellKey));
  const visited = new Set<string>();
  const path: PathStep[] = [];
  for (const raw of answer) {
    if (!raw || typeof raw !== 'object') return null;
    const point = raw as { x?: unknown; y?: unknown };
    if (typeof point.x !== 'number' || typeof point.y !== 'number') return null;
    if (!Number.isInteger(point.x) || !Number.isInteger(point.y)) return null;
    if (point.x < 0 || point.y < 0 || point.x >= board.width || point.y >= board.height) return null;
    if (wallSet.has(cellKey({ x: point.x, y: point.y }))) return null;
    const key = cellKey({ x: point.x, y: point.y });
    if (visited.has(key)) return null;
    visited.add(key);
    path.push({ x: point.x, y: point.y });
  }
  const first = path[0];
  const last = path[path.length - 1];
  if (!first || !last) return null;
  if (first.x !== board.start.x || first.y !== board.start.y) return null;
  if (last.x !== board.goal.x || last.y !== board.goal.y) return null;
  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const current = path[index];
    if (!previous || !current) return null;
    if (Math.abs(previous.x - current.x) + Math.abs(previous.y - current.y) !== 1) return null;
  }
  if (board.waypointOrder === 'ordered') {
    let progress = 0;
    for (const point of path) {
      const next = board.waypoints[progress];
      if (next && next.x === point.x && next.y === point.y) progress += 1;
    }
    if (progress !== board.waypoints.length) return null;
  } else {
    for (const waypoint of board.waypoints) {
      if (!visited.has(cellKey(waypoint))) return null;
    }
  }
  return path;
}

export function checkPath(board: PathBoard, answer: unknown): boolean {
  const path = validPathShape(board, answer);
  if (!path) return false;
  if (board.shortestPathOnly === true) {
    const shortest = solvePath(board);
    return Boolean(shortest && path.length === shortest.length);
  }
  return true;
}

function buildBoard(
  random: () => number,
  width: number,
  height: number,
  wallCount: number,
  waypoints: PathBoard['waypoints'],
  extra: Pick<PathBoard, 'waypointOrder' | 'shortestPathOnly'> = {},
): PathBoard {
  const start = { x: 0, y: 0 };
  const goal = { x: width - 1, y: height - 1 };
  const reserved = new Set([cellKey(start), cellKey(goal), ...waypoints.map(cellKey)]);
  const candidates: PathStep[] = [];
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      if (!reserved.has(`${x},${y}`)) candidates.push({ x, y });
    }
  }
  const walls = shuffleDeterministic(random, candidates).slice(0, wallCount);
  return {
    kind: 'path-planning',
    width,
    height,
    start,
    goal,
    walls,
    waypoints,
    ...extra,
  };
}

type PathVariant = 'reach' | 'waypoint' | 'ordered' | 'shortest';

function pathVariant(variant: string): PathVariant {
  if (variant.includes('đi qua')) return 'waypoint';
  if (variant.includes('lấy chìa')) return 'ordered';
  if (variant.includes('ít bước')) return 'shortest';
  return 'reach';
}

export function generatePathPuzzle(input: {
  seed: string;
  ageTrack: GameAgeTrack;
  variant: string;
}): PathBoard {
  const random = createSeededRandom(stableSeedKey([input.seed, input.ageTrack, input.variant, 'g06-t1']));
  const rank = ageRank(input.ageTrack);
  const variant = pathVariant(input.variant);
  const width = rank >= 2 ? (rank === 3 ? 8 : 7) : 5;
  const wallCount = input.ageTrack === 'age_3_5' ? 0 : input.ageTrack === 'age_6_8' ? 1 : rank === 2 ? 4 : 6;
  let waypoints: PathBoard['waypoints'] = [];
  if (variant === 'waypoint') {
    waypoints = [{ id: 'w1', x: width === 5 ? 2 : 3, y: width === 5 ? 2 : 3 }];
  }
  if (variant === 'ordered') {
    waypoints = [
      { id: 'key', x: width === 5 ? 1 : 2, y: width === 5 ? 1 : 2 },
      { id: 'door', x: width === 5 ? 3 : 4, y: width === 5 ? 3 : 4 },
    ];
  }
  const extra: Pick<PathBoard, 'waypointOrder' | 'shortestPathOnly'> = variant === 'ordered'
    ? { waypointOrder: 'ordered' }
    : variant === 'shortest'
      ? { shortestPathOnly: true }
      : {};
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const board = buildBoard(random, width, width, wallCount, waypoints, extra);
    if (solvePath(board)) return board;
  }
  return buildBoard(random, width, width, 0, waypoints, extra);
}

function pathHintMode(board: PathBoard): string {
  if (board.shortestPathOnly === true) return 'shortest';
  if (board.waypointOrder === 'ordered') return 'ordered';
  return board.waypoints.length > 0 ? 'waypoint' : 'reach';
}

function describePathBoardLegacy(board: PathBoard): {
  hints: readonly [string, string];
  explanation: string;
} {
  const path = solvePath(board);
  const steps = Math.max(1, (path?.length ?? 1) - 1);
  if (board.shortestPathOnly === true) {
    return {
      hints: [
        'Bạn đếm số bước của từng ngả đường để so sánh nhé.',
        'Đường ngắn nhất không đi vòng qua những ô thừa, mỗi bước đều tiến gần đích hơn.',
      ],
      explanation: `Đường ngắn nhất đưa bạn nhỏ về đích cần đúng ${steps} bước di chuyển an toàn.`,
    };
  }
  if (board.waypointOrder === 'ordered') {
    return {
      hints: [
        'Bạn nhìn xem trên bảng có hai ngôi sao đánh số 1 và 2, cần ghé theo đúng số thứ tự nhé.',
        'Hãy tìm đường ghé ngôi sao số 1 trước, rồi ngôi sao số 2, sau đó mới về đích nhé.',
      ],
      explanation: 'Đường đi đúng ghé ngôi sao số 1 trước, rồi ngôi sao số 2, sau đó mới về đích mà không chạm tường.',
    };
  }
  if (board.waypoints.length > 0) {
    return {
      hints: [
        'Bạn hãy đi từng bước một cẩn thận và tránh xa các bức tường nhé.',
        'Nhớ đi qua ngôi sao trước khi tiến về ô đích nha.',
      ],
      explanation: 'Đường đi đúng ghé qua ngôi sao trên bảng rồi mới về đích, không chạm tường.',
    };
  }
  return {
    hints: [
      'Bạn hãy đi từng bước một cẩn thận và tránh xa các bức tường nhé.',
      'Thử đi theo một hướng trước, nếu gặp chướng ngại thì rẽ sang lối thoáng hơn.',
    ],
    explanation: 'Một đường đi hợp lệ giúp bạn di chuyển an toàn từ ô xuất phát về đích mà không chạm tường.',
  };
}

export function describePathBoard(
  board: PathBoard,
  context?: HintContext,
): ReturnType<typeof describePathBoardLegacy> {
  const described = describePathBoardLegacy(board);
  if (!context) return described;
  return { ...described, hints: getTrackHints('g06-t1', context.ageTrack, context.seed, pathHintMode(board)) };
}

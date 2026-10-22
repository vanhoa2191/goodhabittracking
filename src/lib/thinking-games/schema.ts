import { z } from 'zod';

import { boardMatchesRuleVariant, getGameMechanic, isRuleVariantForGame } from './registry';
import {
  CHECKER_IDS,
  GAME_AGE_TRACKS,
  GAME_TYPE_IDS,
  type GradingData,
  type PublicPuzzle,
  type PuzzleItem,
  type ThinkingGamesManifest,
} from './types';

export const slotTypeSchema = z.enum(['main', 'bonus']);
export const ageTrackSchema = z.enum(GAME_AGE_TRACKS);
export const localeSchema = z.literal('vi');
export const skillGroupSchema = z.enum([
  'rule',
  'spatial',
  'memory',
  'reasoning',
  'quantity',
  'planning',
  'flexibility',
  'observation',
]);
export const puzzleStatusSchema = z.enum(['design_only', 'reviewed', 'approved', 'retired']);
export const checkerIdSchema = z.enum(CHECKER_IDS);
export const gameTypeIdSchema = z.enum(GAME_TYPE_IDS);

const pointSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
}).strict();

export const ruleSequenceBoardSchema = z.object({
  kind: z.literal('rule-sequence'),
  sequence: z.array(z.string().min(1)).min(3).max(8),
  options: z.array(z.string().min(1)).min(2).max(8),
  ruleKind: z.enum(['alternating', 'repeat', 'increment']),
  period: z.number().int().min(2).max(4).optional(),
}).strict().superRefine((board, ctx) => {
  if (new Set(board.options).size !== board.options.length) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
  }
  if (board.ruleKind === 'repeat' && !board.period) {
    ctx.addIssue({ code: 'custom', path: ['period'], message: 'repeat requires a period' });
  }
  if (board.ruleKind !== 'repeat' && board.period !== undefined) {
    ctx.addIssue({ code: 'custom', path: ['period'], message: 'period is only valid for repeat' });
  }
});

export const pathBoardSchema = z.object({
  kind: z.literal('path-planning'),
  width: z.number().int().min(5).max(9),
  height: z.number().int().min(5).max(9),
  start: pointSchema,
  goal: pointSchema,
  walls: z.array(pointSchema).max(12),
  waypoints: z.array(z.object({
    id: z.string().min(1),
    x: z.number().int().min(0),
    y: z.number().int().min(0),
  }).strict()).max(3),
  waypointOrder: z.enum(['any', 'ordered']).optional(),
  shortestPathOnly: z.boolean().optional(),
}).strict().superRefine((board, ctx) => {
  const inside = (point: { x: number; y: number }) =>
    point.x >= 0 && point.y >= 0 && point.x < board.width && point.y < board.height;
  const key = (point: { x: number; y: number }) => `${point.x},${point.y}`;
  const blocked = new Set(board.walls.map(key));
  if (!inside(board.start)) ctx.addIssue({ code: 'custom', path: ['start'], message: 'start out of bounds' });
  if (!inside(board.goal)) ctx.addIssue({ code: 'custom', path: ['goal'], message: 'goal out of bounds' });
  if (key(board.start) === key(board.goal)) {
    ctx.addIssue({ code: 'custom', path: ['goal'], message: 'start and goal must differ' });
  }
  for (const wall of board.walls) {
    if (!inside(wall)) ctx.addIssue({ code: 'custom', path: ['walls'], message: 'wall out of bounds' });
    if (key(wall) === key(board.start) || key(wall) === key(board.goal)) {
      ctx.addIssue({ code: 'custom', path: ['walls'], message: 'wall cannot cover start or goal' });
    }
  }
  if (blocked.size !== board.walls.length) {
    ctx.addIssue({ code: 'custom', path: ['walls'], message: 'walls must be unique' });
  }
  const waypointIds = new Set<string>();
  const waypointKeys = new Set<string>();
  for (const waypoint of board.waypoints) {
    if (!inside(waypoint)) ctx.addIssue({ code: 'custom', path: ['waypoints'], message: 'waypoint out of bounds' });
    if (waypointIds.has(waypoint.id)) {
      ctx.addIssue({ code: 'custom', path: ['waypoints'], message: 'waypoint ids must be unique' });
    }
    if (waypointKeys.has(key(waypoint))) {
      ctx.addIssue({ code: 'custom', path: ['waypoints'], message: 'waypoint positions must be unique' });
    }
    if (blocked.has(key(waypoint))) {
      ctx.addIssue({ code: 'custom', path: ['waypoints'], message: 'waypoint cannot be a wall' });
    }
    waypointIds.add(waypoint.id);
    waypointKeys.add(key(waypoint));
  }
  if (board.waypointOrder === 'ordered' && board.waypoints.length < 2) {
    ctx.addIssue({ code: 'custom', path: ['waypointOrder'], message: 'ordered waypoints require at least two waypoints' });
  }
  if (board.shortestPathOnly === true && board.waypointOrder === 'ordered') {
    ctx.addIssue({ code: 'custom', path: ['shortestPathOnly'], message: 'ordered waypoints and shortest-path mode cannot be combined' });
  }
});

export const memorySequenceBoardSchema = z.object({
  kind: z.literal('memory-sequence'),
  sequence: z.array(z.string().min(1)).min(3).max(6),
  options: z.array(z.string().min(1)).min(3).max(7),
  displayMs: z.number().int().min(1000).max(2000),
  mode: z.enum(['recall', 'missing', 'grouped', 'swapped']).optional(),
  groupSize: z.number().int().min(2).max(3).optional(),
  missingIndex: z.number().int().min(0).max(5).optional(),
  swappedIndices: z.tuple([z.number().int().min(0).max(5), z.number().int().min(0).max(5)]).optional(),
}).strict().superRefine((board, ctx) => {
  if (new Set(board.options).size !== board.options.length) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
  }
  const optionSet = new Set(board.options);
  for (const token of board.sequence) {
    if (!optionSet.has(token)) {
      ctx.addIssue({ code: 'custom', path: ['sequence'], message: `missing option for ${token}` });
    }
  }
  if (board.mode === 'missing') {
    if (board.missingIndex === undefined || board.missingIndex >= board.sequence.length) {
      ctx.addIssue({ code: 'custom', path: ['missingIndex'], message: 'missing mode requires an in-range missingIndex' });
    }
  } else if (board.missingIndex !== undefined) {
    ctx.addIssue({ code: 'custom', path: ['missingIndex'], message: 'missingIndex requires missing mode' });
  }
  if (board.mode === 'grouped') {
    if (board.groupSize === undefined) {
      ctx.addIssue({ code: 'custom', path: ['groupSize'], message: 'grouped mode requires groupSize' });
    }
  } else if (board.groupSize !== undefined) {
    ctx.addIssue({ code: 'custom', path: ['groupSize'], message: 'groupSize requires grouped mode' });
  }
  if (board.mode === 'swapped') {
    const indices = board.swappedIndices;
    if (!indices || indices[0] === indices[1] || indices[0] >= board.sequence.length || indices[1] >= board.sequence.length) {
      ctx.addIssue({ code: 'custom', path: ['swappedIndices'], message: 'swapped mode requires two in-range, distinct indices' });
    }
  } else if (board.swappedIndices !== undefined) {
    ctx.addIssue({ code: 'custom', path: ['swappedIndices'], message: 'swappedIndices requires swapped mode' });
  }
});

const directionSchema = z.enum(['up', 'down', 'left', 'right']);
const facingSchema = z.enum(['north', 'south', 'east', 'west']);
const relativeDirectionSchema = z.enum(['left', 'right', 'ahead', 'behind']);
const traitMapSchema = z.record(z.string(), z.string().min(1));
const traitItemSchema = z.object({ id: z.string().min(1), traits: traitMapSchema }).strict();
const spatialOptionSchema = z.object({
  id: z.string().min(1),
  cells: z.array(pointSchema).min(1),
}).strict();
const optionListSchema = z.array(z.string().min(1)).min(2).max(8);

function uniquePoints(points: readonly { x: number; y: number }[]): boolean {
  return new Set(points.map((point) => `${point.x},${point.y}`)).size === points.length;
}

function rectangularGrid(grid: readonly (readonly unknown[])[]): boolean {
  return grid.length > 0 && grid.every((row) => row.length === grid[0]?.length);
}

const symbolGridSchema = z.array(z.array(z.string().min(1)).min(1)).min(1).max(7).superRefine((grid, ctx) => {
  if (!rectangularGrid(grid)) ctx.addIssue({ code: 'custom', path: [], message: 'grid must be rectangular' });
});

const nullableSymbolGridSchema = z.array(z.array(z.string().min(1).nullable()).min(1)).min(1).max(7)
  .superRefine((grid, ctx) => {
    if (!rectangularGrid(grid)) ctx.addIssue({ code: 'custom', path: [], message: 'grid must be rectangular' });
  });

export const ruleErrorBoardSchema = z.object({
  kind: z.literal('rule-error'),
  sequence: z.array(z.string().min(1)).min(4).max(8),
  ruleKind: z.enum(['alternating', 'repeat', 'increment']),
  period: z.number().int().min(2).max(4).optional(),
}).strict().superRefine((board, ctx) => {
  if (board.ruleKind === 'repeat' && !board.period) {
    ctx.addIssue({ code: 'custom', path: ['period'], message: 'repeat requires a period' });
  }
  if (board.ruleKind !== 'repeat' && board.period !== undefined) {
    ctx.addIssue({ code: 'custom', path: ['period'], message: 'period is only valid for repeat' });
  }
});

export const ruleTransformBoardSchema = z.object({
  kind: z.literal('rule-transform'),
  examples: z.array(z.object({ input: z.string().min(1), output: z.string().min(1) }).strict()).min(2).max(4),
  query: z.string().min(1),
  options: optionListSchema,
  transform: z.enum(['add', 'subtract', 'double', 'reverse']),
}).strict().superRefine((board, ctx) => {
  if (new Set(board.options).size !== board.options.length) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
  }
});

export const spatialSilhouetteBoardSchema = z.object({
  kind: z.literal('spatial-silhouette'),
  target: z.array(pointSchema).min(1).max(12),
  options: z.array(spatialOptionSchema).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  if (!uniquePoints(board.target)) ctx.addIssue({ code: 'custom', path: ['target'], message: 'target cells must be unique' });
  if (new Set(board.options.map((option) => option.id)).size !== board.options.length) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'option ids must be unique' });
  }
  for (const option of board.options) {
    if (!uniquePoints(option.cells)) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: `duplicate cells in ${option.id}` });
    }
  }
});

export const spatialRotationBoardSchema = z.object({
  kind: z.literal('spatial-rotation'),
  shape: z.array(pointSchema).min(1).max(12),
  turn: z.enum(['quarter', 'half', 'mirror', 'quarter-mirror']),
  options: z.array(spatialOptionSchema).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  if (!uniquePoints(board.shape)) ctx.addIssue({ code: 'custom', path: ['shape'], message: 'shape cells must be unique' });
  if (new Set(board.options.map((option) => option.id)).size !== board.options.length) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'option ids must be unique' });
  }
  for (const option of board.options) {
    if (!uniquePoints(option.cells)) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: `duplicate cells in ${option.id}` });
    }
  }
});

export const spatialSymmetryBoardSchema = z.object({
  kind: z.literal('spatial-symmetry'),
  grid: nullableSymbolGridSchema,
  axis: z.enum(['vertical', 'horizontal']),
  mode: z.enum(['fill', 'find-break']),
  options: z.array(pointSchema).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  if (!uniquePoints(board.options)) ctx.addIssue({ code: 'custom', path: ['options'], message: 'option cells must be unique' });
  const holes = board.grid.flatMap((row, y) => row.flatMap((cell, x) => (cell === null ? [{ x, y }] : [])));
  if (board.mode === 'fill' && holes.length !== 1) {
    ctx.addIssue({ code: 'custom', path: ['grid'], message: 'fill mode requires exactly one empty cell' });
  }
  if (board.mode === 'find-break' && holes.length > 0) {
    ctx.addIssue({ code: 'custom', path: ['grid'], message: 'find-break mode cannot contain empty cells' });
  }
});

export const memoryPositionBoardSchema = z.object({
  kind: z.literal('memory-position'),
  width: z.number().int().min(3).max(6),
  height: z.number().int().min(3).max(6),
  targets: z.array(pointSchema).min(1).max(5),
  revealed: z.array(pointSchema).max(4),
  mode: z.enum(['recall', 'missing']),
  displayMs: z.number().int().min(1000).max(2000),
  options: z.array(pointSchema).min(2).max(8),
}).strict().superRefine((board, ctx) => {
  const inside = (point: { x: number; y: number }) => point.x < board.width && point.y < board.height;
  for (const point of [...board.targets, ...board.revealed, ...board.options]) {
    if (!inside(point)) ctx.addIssue({ code: 'custom', path: [], message: 'position out of bounds' });
  }
  if (!uniquePoints(board.targets)) ctx.addIssue({ code: 'custom', path: ['targets'], message: 'targets must be unique' });
  if (!uniquePoints(board.revealed)) ctx.addIssue({ code: 'custom', path: ['revealed'], message: 'revealed must be unique' });
  if (!uniquePoints(board.options)) ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
  if (board.mode === 'missing' && board.revealed.length >= board.targets.length) {
    ctx.addIssue({ code: 'custom', path: ['revealed'], message: 'missing mode requires at least one hidden target' });
  }
});

export const memoryChangeBoardSchema = z.object({
  kind: z.literal('memory-change'),
  before: z.array(z.string().min(1)).min(3).max(6),
  after: z.array(z.string().min(1)).min(3).max(6),
  change: z.enum(['removed', 'added', 'swapped', 'property']),
  options: z.array(z.string().min(1)).min(2).max(8),
}).strict().superRefine((board, ctx) => {
  if (new Set(board.options).size !== board.options.length) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
  }
});

export const reasoningEliminationBoardSchema = z.object({
  kind: z.literal('reasoning-elimination'),
  candidates: z.array(traitItemSchema).min(3).max(6),
  clues: z.array(z.object({
    trait: z.string().min(1),
    value: z.string().min(1),
    negate: z.boolean(),
  }).strict()).min(1).max(4),
  options: z.array(z.string().min(1)).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  const ids = new Set(board.candidates.map((candidate) => candidate.id));
  if (ids.size !== board.candidates.length) ctx.addIssue({ code: 'custom', path: ['candidates'], message: 'candidate ids must be unique' });
  if (new Set(board.options).size !== board.options.length) ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
  for (const option of board.options) {
    if (!ids.has(option)) ctx.addIssue({ code: 'custom', path: ['options'], message: `unknown candidate ${option}` });
  }
});

export const reasoningIfThenBoardSchema = z.object({
  kind: z.literal('reasoning-if-then'),
  rules: z.array(z.object({ if: z.string().min(1), then: z.string().min(1) }).strict()).min(1).max(4),
  facts: z.array(z.string().min(1)).min(1).max(4),
  options: z.array(z.string().min(1)).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  if (new Set(board.options).size !== board.options.length) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
  }
});

export const reasoningMissingInfoBoardSchema = z.object({
  kind: z.literal('reasoning-missing-info'),
  scenario: z.string().min(1),
  candidates: z.array(traitItemSchema).min(3).max(5),
  known: z.array(z.object({
    trait: z.string().min(1),
    value: z.string().min(1),
  }).strict()).min(1).max(4),
  targetId: z.string().min(1),
  questionTrait: z.string().min(1),
  options: z.array(z.object({
    id: z.string().min(1),
    trait: z.string().min(1),
    value: z.string().min(1),
  }).strict()).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  const ids = new Set(board.candidates.map((candidate) => candidate.id));
  if (!ids.has(board.targetId)) ctx.addIssue({ code: 'custom', path: ['targetId'], message: 'unknown target candidate' });
  if (new Set(board.options.map((option) => option.id)).size !== board.options.length) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'option ids must be unique' });
  }
});

export const quantityBalanceBoardSchema = z.object({
  kind: z.literal('quantity-balance'),
  left: z.array(z.object({ id: z.string().min(1), weight: z.number().int().min(1).max(20) }).strict()).min(1).max(5),
  right: z.array(z.object({ id: z.string().min(1), weight: z.number().int().min(1).max(20) }).strict()).min(1).max(5),
  mode: z.enum(['missing', 'replace', 'compare', 'unknown']),
  unknownSide: z.enum(['left', 'right']).optional(),
  replaceId: z.string().min(1).optional(),
  options: z.array(z.number().int().min(0).max(50)).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  if (new Set(board.options).size !== board.options.length) ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
  if ((board.mode === 'missing' || board.mode === 'unknown') && !board.unknownSide) {
    ctx.addIssue({ code: 'custom', path: ['unknownSide'], message: 'missing/unknown mode requires a side' });
  }
  if (board.mode === 'replace' && !board.replaceId) {
    ctx.addIssue({ code: 'custom', path: ['replaceId'], message: 'replace mode requires replaceId' });
  }
});

export const quantityGroupingBoardSchema = z.object({
  kind: z.literal('quantity-grouping'),
  total: z.number().int().min(1).max(50),
  groupSize: z.number().int().min(2).max(10),
  mode: z.enum(['exact', 'remainder', 'floor', 'needed']),
  options: z.array(z.number().int().min(0).max(50)).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  if (new Set(board.options).size !== board.options.length) ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
});

export const quantityTargetBoardSchema = z.object({
  kind: z.literal('quantity-target'),
  items: z.array(z.object({ id: z.string().min(1), value: z.number().int().min(1).max(20) }).strict()).min(3).max(6),
  target: z.number().int().min(1).max(50),
  maxItems: z.number().int().min(1).max(4),
  mode: z.enum(['fewest', 'exact-two', 'not-over', 'any']),
  options: z.array(z.string().min(1)).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  if (new Set(board.items.map((item) => item.id)).size !== board.items.length) {
    ctx.addIssue({ code: 'custom', path: ['items'], message: 'item ids must be unique' });
  }
  if (new Set(board.options).size !== board.options.length) ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
});

export const planningCommandOrderBoardSchema = z.object({
  kind: z.literal('planning-command-order'),
  commands: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) }).strict()).min(3).max(5),
  before: z.array(z.tuple([z.string().min(1), z.string().min(1)])).min(1).max(5),
}).strict().superRefine((board, ctx) => {
  const ids = new Set(board.commands.map((command) => command.id));
  if (ids.size !== board.commands.length) ctx.addIssue({ code: 'custom', path: ['commands'], message: 'command ids must be unique' });
  for (const [before, after] of board.before) {
    if (!ids.has(before) || !ids.has(after)) ctx.addIssue({ code: 'custom', path: ['before'], message: 'unknown command in precedence' });
    if (before === after) ctx.addIssue({ code: 'custom', path: ['before'], message: 'command cannot precede itself' });
  }
});

export const planningFixStepBoardSchema = z.object({
  kind: z.literal('planning-fix-step'),
  width: z.number().int().min(5).max(7),
  height: z.number().int().min(5).max(7),
  start: pointSchema,
  goal: pointSchema,
  walls: z.array(pointSchema).max(10),
  commands: z.array(directionSchema).min(3).max(8),
  options: z.array(z.object({
    id: z.string().min(1),
    index: z.number().int().min(0).max(7),
    command: directionSchema,
  }).strict()).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  const inside = (point: { x: number; y: number }) => point.x < board.width && point.y < board.height;
  if (!inside(board.start)) ctx.addIssue({ code: 'custom', path: ['start'], message: 'start out of bounds' });
  if (!inside(board.goal)) ctx.addIssue({ code: 'custom', path: ['goal'], message: 'goal out of bounds' });
  if (!uniquePoints(board.walls)) ctx.addIssue({ code: 'custom', path: ['walls'], message: 'walls must be unique' });
  if (new Set(board.options.map((option) => option.id)).size !== board.options.length) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'option ids must be unique' });
  }
  for (const option of board.options) {
    if (option.index >= board.commands.length) ctx.addIssue({ code: 'custom', path: ['options'], message: 'option index out of range' });
  }
});

export const flexibilityClassifyBoardSchema = z.object({
  kind: z.literal('flexibility-classify'),
  items: z.array(traitItemSchema).min(4).max(6),
  rule: z.object({ trait: z.string().min(1), value: z.string().min(1) }).strict(),
  options: z.array(z.string().min(1)).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  const ids = new Set(board.items.map((item) => item.id));
  if (ids.size !== board.items.length) ctx.addIssue({ code: 'custom', path: ['items'], message: 'item ids must be unique' });
  if (new Set(board.options).size !== board.options.length) ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
});

export const flexibilityPerspectiveBoardSchema = z.object({
  kind: z.literal('flexibility-perspective'),
  width: z.number().int().min(3).max(7),
  height: z.number().int().min(3).max(7),
  viewer: z.object({ x: z.number().int().min(0), y: z.number().int().min(0), facing: facingSchema }).strict(),
  target: pointSchema,
  options: z.array(relativeDirectionSchema).min(2).max(4),
}).strict().superRefine((board, ctx) => {
  const inside = (point: { x: number; y: number }) => point.x < board.width && point.y < board.height;
  if (!inside(board.viewer) || !inside(board.target)) ctx.addIssue({ code: 'custom', path: [], message: 'position out of bounds' });
  if (new Set(board.options).size !== board.options.length) ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
});

export const flexibilityAlternativeBoardSchema = z.object({
  kind: z.literal('flexibility-alternative'),
  width: z.number().int().min(5).max(7),
  height: z.number().int().min(5).max(7),
  start: pointSchema,
  goal: pointSchema,
  walls: z.array(pointSchema).max(10),
  knownPath: z.array(pointSchema).min(2).max(40),
}).strict().superRefine((board, ctx) => {
  const inside = (point: { x: number; y: number }) => point.x < board.width && point.y < board.height;
  if (!inside(board.start) || !inside(board.goal)) ctx.addIssue({ code: 'custom', path: [], message: 'position out of bounds' });
  if (!uniquePoints(board.walls)) ctx.addIssue({ code: 'custom', path: ['walls'], message: 'walls must be unique' });
  for (const point of board.knownPath) {
    if (!inside(point)) ctx.addIssue({ code: 'custom', path: ['knownPath'], message: 'known path out of bounds' });
  }
});

export const observationDifferenceBoardSchema = z.object({
  kind: z.literal('observation-difference'),
  left: symbolGridSchema,
  right: symbolGridSchema,
  options: z.array(pointSchema).min(1).max(8),
}).strict().superRefine((board, ctx) => {
  if (board.left.length !== board.right.length || board.left.some((row, y) => row.length !== board.right[y]?.length)) {
    ctx.addIssue({ code: 'custom', path: ['right'], message: 'left and right grids must match' });
  }
  if (!uniquePoints(board.options)) ctx.addIssue({ code: 'custom', path: ['options'], message: 'option cells must be unique' });
});

export const observationTwoTraitsBoardSchema = z.object({
  kind: z.literal('observation-two-traits'),
  items: z.array(traitItemSchema).min(4).max(6),
  criteria: z.array(z.object({ trait: z.string().min(1), value: z.string().min(1) }).strict()).min(2).max(3),
  options: z.array(z.string().min(1)).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  const ids = new Set(board.items.map((item) => item.id));
  if (ids.size !== board.items.length) ctx.addIssue({ code: 'custom', path: ['items'], message: 'item ids must be unique' });
  if (new Set(board.options).size !== board.options.length) ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
});

export const observationImplausibleBoardSchema = z.object({
  kind: z.literal('observation-implausible'),
  scene: z.array(z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    traits: traitMapSchema,
  }).strict()).min(3).max(6),
  rule: z.object({ trait: z.string().min(1), value: z.string().min(1) }).strict(),
  options: z.array(z.string().min(1)).min(2).max(6),
}).strict().superRefine((board, ctx) => {
  if (new Set(board.scene.map((entry) => entry.id)).size !== board.scene.length) {
    ctx.addIssue({ code: 'custom', path: ['scene'], message: 'scene ids must be unique' });
  }
  if (new Set(board.options).size !== board.options.length) ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
});

export const boardDataSchema = z.discriminatedUnion('kind', [
  ruleSequenceBoardSchema,
  pathBoardSchema,
  memorySequenceBoardSchema,
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
]);

export const sourceSchema = z.object({
  repo: z.string().min(1),
  url: z.string().url(),
  commit: z.string().min(1),
  license: z.string().min(1),
  path: z.string().min(1),
}).strict();

export const editorialSchema = z.object({
  reviewedBy: z.string().min(1),
  reviewedAt: z.string().min(1),
  ageReviewedBy: z.string().min(1),
  ageReviewedAt: z.string().min(1),
}).strict();

export const spacingExceptionSchema = z.object({
  reason: z.string().min(1),
  approvedBy: z.string().min(1),
  approvedAt: z.string().min(1),
  appliesTo: z.literal('pilot-only'),
  productionManifestRequired: z.literal(true),
}).strict();

export function textContainsAnswer(text: string, answer: string): boolean {
  const trimmed = answer.trim();
  if (trimmed.length === 0) return false;
  const normalizedText = text.toLocaleLowerCase('vi');
  const normalizedAnswer = trimmed.toLocaleLowerCase('vi');
  const escaped = normalizedAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startsWithWord = /^[\p{L}\p{N}]/u.test(normalizedAnswer);
  const endsWithWord = /[\p{L}\p{N}]$/u.test(normalizedAnswer);
  const pattern = `${startsWithWord ? '(?<![\\p{L}\\p{N}])' : ''}${escaped}${endsWithWord ? '(?![\\p{L}\\p{N}])' : ''}`;
  const regex = new RegExp(pattern, 'u');
  return regex.test(normalizedText);
}

function answerText(solution: unknown): string {
  if (typeof solution === 'string') return solution;
  if (Array.isArray(solution)) {
    if (solution.every((entry) => entry && typeof entry === 'object' && 'x' in entry && 'y' in entry)) {
      return solution
        .map((entry) => `${(entry as { x: number; y: number }).x},${(entry as { x: number; y: number }).y}`)
        .join(' ');
    }
    return solution.map((entry) => String(entry)).join(' → ');
  }
  return JSON.stringify(solution);
}

export const puzzleItemSchema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  id: z.string().regex(/^[A-Z]\d{3}-(main|bonus)(?:-[a-z0-9]+)?$/),
  dayIndex: z.number().int().min(1).max(365),
  slotType: slotTypeSchema,
  skillGroup: skillGroupSchema,
  gameTypeId: gameTypeIdSchema,
  ruleVariantId: z.string().min(1),
  ageTrack: ageTrackSchema,
  locale: localeSchema,
  title: z.string().min(1).max(120),
  invitation: z.string().min(1).max(240),
  tutorial: z.string().min(1).max(240),
  explanation: z.string().min(1).max(300),
  boardData: boardDataSchema,
  solution: z.unknown().refine((value) => value !== undefined, 'solution is required'),
  validSolutionPredicate: checkerIdSchema,
  hints: z.tuple([z.string().min(1).max(180), z.string().min(1).max(180)]),
  praiseKeys: z.record(z.string(), z.string().min(1)).refine((keys) => Object.keys(keys).length > 0, 'praiseKeys required'),
  targetSeconds: z.number().int().min(60).max(120),
  status: puzzleStatusSchema,
  fingerprint: z.string().regex(/^[0-9a-f]{16}$/),
  source: sourceSchema.nullable(),
  editorial: editorialSchema.nullable(),
}).strict().superRefine((item, ctx) => {
  const mechanic = getGameMechanic(item.gameTypeId);
  if (!mechanic) {
    ctx.addIssue({ code: 'custom', path: ['gameTypeId'], message: 'unknown game type' });
    return;
  }
  if (!isRuleVariantForGame(item.gameTypeId, item.ruleVariantId)) {
    ctx.addIssue({ code: 'custom', path: ['ruleVariantId'], message: 'rule variant does not belong to game type' });
  }
  if (item.skillGroup !== mechanic.skillGroup) {
    ctx.addIssue({ code: 'custom', path: ['skillGroup'], message: 'skill group does not match registry' });
  }
  if (mechanic.available) {
    if (item.validSolutionPredicate !== mechanic.checkerId) {
      ctx.addIssue({ code: 'custom', path: ['validSolutionPredicate'], message: 'checker does not match registry' });
    }
    if (item.boardData.kind !== mechanic.boardKind) {
      ctx.addIssue({ code: 'custom', path: ['boardData', 'kind'], message: 'board kind does not match registry' });
    }
    if (!boardMatchesRuleVariant(item.gameTypeId, item.ruleVariantId, item.boardData)) {
      ctx.addIssue({ code: 'custom', path: ['ruleVariantId'], message: 'board does not implement the declared rule variant' });
    }
  }
  if (item.status === 'approved' && item.editorial === null) {
    ctx.addIssue({ code: 'custom', path: ['editorial'], message: 'approved items require editorial review' });
  }
  const answer = answerText(item.solution);
  for (const [index, hint] of item.hints.entries()) {
    if (textContainsAnswer(hint, answer)) {
      ctx.addIssue({ code: 'custom', path: ['hints', index], message: 'hint leaks the full answer' });
    }
  }
});

export const manifestSchema = z.object({
  manifestVersion: z.string().min(1),
  schemaVersion: z.literal(1),
  generatedAt: z.string().min(1),
  isPilotFixture: z.boolean(),
  minFormatSpacingDays: z.number().int().min(1),
  spacingException: spacingExceptionSchema.nullable().optional(),
  locales: z.array(localeSchema).min(1),
  ageTracks: z.array(ageTrackSchema).min(1),
  items: z.array(puzzleItemSchema),
  coverage: z.object({
    dayCount: z.number().int().min(1),
    slotsPerDay: z.number().int().min(1),
    typeIds: z.number().int().min(1),
    variantPairs: z.number().int().min(1),
  }).strict().optional(),
  editorialApproval: z.unknown().optional(),
  fingerprintIndexVersion: z.string().optional(),
  status: z.string().optional(),
}).strict().superRefine((manifest, ctx) => {
  if (manifest.isPilotFixture && !manifest.spacingException) {
    ctx.addIssue({ code: 'custom', path: ['spacingException'], message: 'pilot manifests require an explicit exception' });
  }
  if (!manifest.isPilotFixture && manifest.spacingException) {
    ctx.addIssue({ code: 'custom', path: ['spacingException'], message: 'release manifests cannot use a pilot exception' });
  }
});

export function parsePuzzleItem(input: unknown): PuzzleItem {
  return puzzleItemSchema.parse(input) as PuzzleItem;
}

export function parseManifest(input: unknown): ThinkingGamesManifest {
  return manifestSchema.parse(input) as ThinkingGamesManifest;
}

export function toPublicPuzzle(item: PuzzleItem): PublicPuzzle {
  return {
    schemaVersion: item.schemaVersion,
    contentVersion: item.contentVersion,
    id: item.id,
    dayIndex: item.dayIndex,
    slotType: item.slotType,
    skillGroup: item.skillGroup,
    gameTypeId: item.gameTypeId,
    ruleVariantId: item.ruleVariantId,
    ageTrack: item.ageTrack as PublicPuzzle['ageTrack'],
    locale: item.locale,
    title: item.title,
    invitation: item.invitation,
    tutorial: item.tutorial,
    boardData: item.boardData,
    hints: [item.hints[0], item.hints[1]],
    praiseKeys: { ...item.praiseKeys },
    targetSeconds: item.targetSeconds,
    fingerprint: item.fingerprint,
  };
}

export function toGradingData(item: PuzzleItem): GradingData {
  return {
    solution: item.solution,
    validSolutionPredicate: item.validSolutionPredicate,
    explanation: item.explanation,
  };
}

export function assertNoAnswerLeak(item: PuzzleItem): void {
  const answer = answerText(item.solution);
  for (const hint of item.hints) {
    if (textContainsAnswer(hint, answer)) {
      throw new Error(`hint leaks the full answer for ${item.id}`);
    }
  }
}

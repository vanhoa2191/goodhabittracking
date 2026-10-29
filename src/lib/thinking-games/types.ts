export const GAME_TYPE_IDS = [
  'g01-t1', 'g01-t2', 'g01-t3',
  'g02-t1', 'g02-t2', 'g02-t3',
  'g03-t1', 'g03-t2', 'g03-t3',
  'g04-t1', 'g04-t2', 'g04-t3',
  'g05-t1', 'g05-t2', 'g05-t3',
  'g06-t1', 'g06-t2', 'g06-t3',
  'g07-t1', 'g07-t2', 'g07-t3',
  'g08-t1', 'g08-t2', 'g08-t3',
] as const;

export type GameTypeId = (typeof GAME_TYPE_IDS)[number];
export type SlotType = 'main' | 'bonus';
export const GAME_AGE_TRACKS = ['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus'] as const;
export const ADVERTISED_AGE_TRACKS = ['age_6_8', 'age_9_12'] as const;
export type GameAgeTrack = (typeof GAME_AGE_TRACKS)[number];
export type AgeTrack = (typeof ADVERTISED_AGE_TRACKS)[number];
export type Locale = 'vi';
export type PuzzleStatus = 'design_only' | 'reviewed' | 'approved' | 'retired';
export type SkillGroup =
  | 'rule'
  | 'spatial'
  | 'memory'
  | 'reasoning'
  | 'quantity'
  | 'planning'
  | 'flexibility'
  | 'observation';
export type RuleVariantId = string;

export const CHECKER_IDS = [
  'rule-sequence-v1',
  'path-planning-v1',
  'memory-sequence-v1',
  'rule-error-v1',
  'rule-transform-v1',
  'spatial-silhouette-v1',
  'spatial-rotation-v1',
  'spatial-symmetry-v1',
  'memory-position-v1',
  'memory-change-v1',
  'reasoning-elimination-v1',
  'reasoning-if-then-v1',
  'reasoning-missing-info-v1',
  'quantity-balance-v1',
  'quantity-grouping-v1',
  'quantity-target-v1',
  'planning-command-order-v1',
  'planning-fix-step-v1',
  'flexibility-classify-v1',
  'flexibility-perspective-v1',
  'flexibility-alternative-v1',
  'observation-difference-v1',
  'observation-two-traits-v1',
  'observation-implausible-v1',
] as const;

export type CheckerId = (typeof CHECKER_IDS)[number];

export type GameErrorCode =
  | 'feature_off'
  | 'settings_required'
  | 'timezone_required'
  | 'timezone_invalid'
  | 'age_track_unavailable'
  | 'locale_unavailable'
  | 'content_unavailable'
  | 'content_not_approved'
  | 'format_unavailable'
  | 'invalid_answer'
  | 'invalid_puzzle'
  | 'manifest_invalid'
  | 'bedtime'
  | 'outside_play_window'
  | 'paused'
  | 'day_changed'
  | 'attempt_expired'
  | 'not_found'
  | 'journey_complete'
  | 'already_finished'
  | 'offline_no_entitlement'
  | 'session_invalid'
  | 'rate_limited'
  | 'internal';

export type RuleSequenceBoard = Readonly<{
  kind: 'rule-sequence';
  sequence: readonly string[];
  options: readonly string[];
  ruleKind: 'alternating' | 'repeat' | 'increment';
  period?: number;
}>;

export type PathStep = Readonly<{ x: number; y: number }>;
export type PathWaypoint = Readonly<{ id: string; x: number; y: number }>;

export type PathBoard = Readonly<{
  kind: 'path-planning';
  width: number;
  height: number;
  start: PathStep;
  goal: PathStep;
  walls: readonly PathStep[];
  waypoints: readonly PathWaypoint[];
  waypointOrder?: 'any' | 'ordered';
  shortestPathOnly?: boolean;
}>;

export type MemorySequenceMode = 'recall' | 'missing' | 'grouped' | 'swapped';

export type MemorySequenceBoard = Readonly<{
  kind: 'memory-sequence';
  sequence: readonly string[];
  options: readonly string[];
  displayMs: number;
  mode?: MemorySequenceMode;
  groupSize?: number;
  missingIndex?: number;
  swappedIndices?: readonly [number, number];
}>;

export type TraitMap = Readonly<Record<string, string>>;
export type SpatialOption = Readonly<{ id: string; cells: readonly PathStep[] }>;
export type TraitItem = Readonly<{ id: string; traits: TraitMap }>;
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Facing = 'north' | 'south' | 'east' | 'west';
export type RelativeDirection = 'left' | 'right' | 'ahead' | 'behind';

export type RuleErrorBoard = Readonly<{
  kind: 'rule-error';
  mechanicRevision?: 2;
  sequence: readonly string[];
  ruleKind: 'alternating' | 'repeat' | 'increment';
  period?: number;
}>;

export type RuleTransformBoard = Readonly<{
  kind: 'rule-transform';
  examples: readonly Readonly<{ input: string; output: string }>[];
  query: string;
  options: readonly string[];
  transform: 'add' | 'subtract' | 'double' | 'reverse';
}>;

export type SpatialSilhouetteBoard = Readonly<{
  kind: 'spatial-silhouette';
  target: readonly PathStep[];
  options: readonly SpatialOption[];
}>;

export type SpatialRotationBoard = Readonly<{
  kind: 'spatial-rotation';
  mechanicRevision?: 2;
  shape: readonly PathStep[];
  turn: 'quarter' | 'half' | 'mirror' | 'quarter-mirror';
  options: readonly SpatialOption[];
}>;

export type SpatialSymmetryBoard = Readonly<{
  kind: 'spatial-symmetry';
  grid: readonly (readonly (string | null)[])[];
  axis: 'vertical' | 'horizontal';
  mode: 'fill' | 'find-break';
  options: readonly PathStep[];
}>;

export type MemoryPositionBoard = Readonly<{
  kind: 'memory-position';
  width: number;
  height: number;
  targets: readonly PathStep[];
  revealed: readonly PathStep[];
  mode: 'recall' | 'missing';
  displayMs: number;
  options: readonly PathStep[];
}>;

export type MemoryChangeBoard = Readonly<{
  kind: 'memory-change';
  before: readonly string[];
  after: readonly string[];
  change: 'removed' | 'added' | 'swapped' | 'property';
  options: readonly string[];
}>;

export type ReasoningEliminationBoard = Readonly<{
  kind: 'reasoning-elimination';
  candidates: readonly TraitItem[];
  clues: readonly Readonly<{ trait: string; value: string; negate: boolean }>[];
  options: readonly string[];
}>;

export type ReasoningIfThenBoard = Readonly<{
  kind: 'reasoning-if-then';
  rules: readonly Readonly<{ if: string; then: string }>[];
  facts: readonly string[];
  options: readonly string[];
}>;

export type ReasoningMissingInfoBoard = Readonly<{
  kind: 'reasoning-missing-info';
  scenario: string;
  candidates: readonly TraitItem[];
  known: readonly Readonly<{ trait: string; value: string }>[];
  targetId: string;
  questionTrait: string;
  options: readonly Readonly<{ id: string; trait: string; value: string }>[];
}>;

export type QuantityBalanceBoard = Readonly<{
  kind: 'quantity-balance';
  left: readonly Readonly<{ id: string; weight: number }>[];
  right: readonly Readonly<{ id: string; weight: number }>[];
  mode: 'missing' | 'replace' | 'compare' | 'unknown';
  unknownSide?: 'left' | 'right';
  replaceId?: string;
  options: readonly number[];
}>;

export type QuantityGroupingBoard = Readonly<{
  kind: 'quantity-grouping';
  total: number;
  groupSize: number;
  mode: 'exact' | 'remainder' | 'floor' | 'needed';
  options: readonly number[];
}>;

export type QuantityTargetBoard = Readonly<{
  kind: 'quantity-target';
  items: readonly Readonly<{ id: string; value: number }>[];
  target: number;
  maxItems: number;
  mode: 'fewest' | 'exact-two' | 'not-over' | 'any';
  options: readonly string[];
}>;

export type PlanningCommandOrderBoard = Readonly<{
  kind: 'planning-command-order';
  commands: readonly Readonly<{ id: string; text: string }>[];
  before: readonly (readonly [string, string])[];
}>;

export type PlanningFixStepBoard = Readonly<{
  kind: 'planning-fix-step';
  width: number;
  height: number;
  start: PathStep;
  goal: PathStep;
  walls: readonly PathStep[];
  commands: readonly Direction[];
  options: readonly Readonly<{ id: string; index: number; command: Direction }>[];
}>;

export type FlexibilityClassifyBoard = Readonly<{
  kind: 'flexibility-classify';
  items: readonly TraitItem[];
  rule: Readonly<{ trait: string; value: string }>;
  options: readonly string[];
}>;

export type FlexibilityPerspectiveBoard = Readonly<{
  kind: 'flexibility-perspective';
  width: number;
  height: number;
  viewer: Readonly<{ x: number; y: number; facing: Facing }>;
  target: PathStep;
  options: readonly RelativeDirection[];
}>;

export type FlexibilityAlternativeBoard = Readonly<{
  kind: 'flexibility-alternative';
  width: number;
  height: number;
  start: PathStep;
  goal: PathStep;
  walls: readonly PathStep[];
  knownPath: readonly PathStep[];
}>;

export type ObservationDifferenceBoard = Readonly<{
  kind: 'observation-difference';
  left: readonly (readonly string[])[];
  right: readonly (readonly string[])[];
  options: readonly PathStep[];
}>;

export type ObservationTwoTraitsBoard = Readonly<{
  kind: 'observation-two-traits';
  items: readonly TraitItem[];
  criteria: readonly Readonly<{ trait: string; value: string }>[];
  options: readonly string[];
}>;

export type ObservationImplausibleBoard = Readonly<{
  kind: 'observation-implausible';
  scene: readonly Readonly<{ id: string; text: string; traits: TraitMap }>[];
  rule: Readonly<{ trait: string; value: string }>;
  options: readonly string[];
}>;

export type BoardData =
  | RuleSequenceBoard
  | PathBoard
  | MemorySequenceBoard
  | RuleErrorBoard
  | RuleTransformBoard
  | SpatialSilhouetteBoard
  | SpatialRotationBoard
  | SpatialSymmetryBoard
  | MemoryPositionBoard
  | MemoryChangeBoard
  | ReasoningEliminationBoard
  | ReasoningIfThenBoard
  | ReasoningMissingInfoBoard
  | QuantityBalanceBoard
  | QuantityGroupingBoard
  | QuantityTargetBoard
  | PlanningCommandOrderBoard
  | PlanningFixStepBoard
  | FlexibilityClassifyBoard
  | FlexibilityPerspectiveBoard
  | FlexibilityAlternativeBoard
  | ObservationDifferenceBoard
  | ObservationTwoTraitsBoard
  | ObservationImplausibleBoard;

export type BoardKind = BoardData['kind'];

export type PuzzleSource = Readonly<{
  repo: string;
  url: string;
  commit: string;
  license: string;
  path: string;
}>;

export type PuzzleEditorial = Readonly<{
  reviewedBy: string;
  reviewedAt: string;
  ageReviewedBy: string;
  ageReviewedAt: string;
}>;

export type PuzzleItem = Readonly<{
  schemaVersion: 1;
  contentVersion: string;
  id: string;
  dayIndex: number;
  slotType: SlotType;
  skillGroup: SkillGroup;
  gameTypeId: GameTypeId;
  ruleVariantId: RuleVariantId;
  ageTrack: GameAgeTrack;
  locale: Locale;
  title: string;
  invitation: string;
  tutorial: string;
  explanation: string;
  boardData: BoardData;
  solution: unknown;
  validSolutionPredicate: CheckerId;
  hints: readonly [string, string];
  praiseKeys: Readonly<Record<string, string>>;
  targetSeconds: number;
  status: PuzzleStatus;
  fingerprint: string;
  source: PuzzleSource | null;
  editorial: PuzzleEditorial | null;
}>;

export type PublicPuzzle = Readonly<{
  schemaVersion: 1;
  contentVersion: string;
  id: string;
  dayIndex: number;
  slotType: SlotType;
  skillGroup: SkillGroup;
  gameTypeId: GameTypeId;
  ruleVariantId: RuleVariantId;
  ageTrack: AgeTrack;
  locale: Locale;
  title: string;
  invitation: string;
  tutorial: string;
  boardData: BoardData;
  hints: readonly [string, string];
  praiseKeys: Readonly<Record<string, string>>;
  targetSeconds: number;
  fingerprint: string;
}>;

export type GradingData = Readonly<{
  solution: unknown;
  validSolutionPredicate: CheckerId;
  explanation: string;
}>;

export type AttemptContentPin = Readonly<{
  contentVersion: string;
  itemId: string;
  fingerprint: string;
}>;

export type SpacingException = Readonly<{
  reason: string;
  approvedBy: string;
  approvedAt: string;
  appliesTo: 'pilot-only';
  productionManifestRequired: true;
}>;

export type ManifestCoverage = Readonly<{
  dayCount: number;
  slotsPerDay: number;
  typeIds: number;
  variantPairs: number;
}>;

export type ThinkingGamesManifest = Readonly<{
  manifestVersion: string;
  schemaVersion: 1;
  generatedAt: string;
  isPilotFixture: boolean;
  minFormatSpacingDays: number;
  spacingException?: SpacingException | null;
  locales: readonly Locale[];
  ageTracks: readonly GameAgeTrack[];
  items: readonly PuzzleItem[];
  coverage?: ManifestCoverage;
  editorialApproval?: unknown;
  fingerprintIndexVersion?: string;
  status?: string;
}>;

export type CatalogValidationMetrics = Readonly<{
  coverageKind: 'pilot' | 'release' | 'editorial';
  dayCount: number;
  slotCount: number;
  typeIds: number;
  variantPairs: number;
  skillCount: number;
  equalSkillDays: number;
  rollingEightDayWindows: number;
  rollingEightDayCovered: number;
  minFormatSpacingDays: number;
  itemCount: number;
}>;

export type CatalogValidationError = Readonly<{
  code: string;
  path: string;
  message: string;
}>;

export type CatalogValidationResult =
  | { ok: true; metrics: CatalogValidationMetrics }
  | { ok: false; errors: readonly CatalogValidationError[]; metrics: CatalogValidationMetrics };

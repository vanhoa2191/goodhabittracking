import type { AgeTrack, BoardKind, GameTypeId, PathStep, PublicPuzzle } from './types';

export type RendererPuzzle = PublicPuzzle & { readonly boardData: PublicPuzzle['boardData'] };

export type RendererAction =
  | { type: 'select'; value: string | number }
  | { type: 'move'; step: PathStep }
  | { type: 'reorder'; value: readonly string[] }
  | { type: 'submit'; answer: unknown }
  | { type: 'hint'; index: 0 | 1 }
  | { type: 'pause' }
  | { type: 'resume' };

export type RendererFeedback =
  | { type: 'wrong'; messageKey: string }
  | { type: 'correct'; explanationKey: string; praiseKey: string }
  | { type: 'hint'; text: string }
  | { type: 'paused' }
  | { type: 'finished'; result: unknown };

export type ThinkingGameRendererProps = Readonly<{
  puzzle: RendererPuzzle;
  ageTrack: AgeTrack;
  reducedMotion: boolean;
  muted: boolean;
  onAction: (action: RendererAction) => void;
}>;

export type InteractionDescriptor = Readonly<{
  boardKind: BoardKind;
  selection: 'single' | 'multi' | 'ordered' | 'number' | 'index' | 'point' | 'cells' | 'path';
  answerType: 'string' | 'number' | 'string-array' | 'point' | 'point-array';
  optionsFrom: 'board.options' | 'board.sequence' | 'board.items' | 'board.commands' | 'none';
}>;

export const GAME_INTERACTIONS: Readonly<Record<GameTypeId, InteractionDescriptor>> = {
  'g01-t1': { boardKind: 'rule-sequence', selection: 'single', answerType: 'string', optionsFrom: 'board.options' },
  'g01-t2': { boardKind: 'rule-error', selection: 'index', answerType: 'number', optionsFrom: 'board.sequence' },
  'g01-t3': { boardKind: 'rule-transform', selection: 'single', answerType: 'string', optionsFrom: 'board.options' },
  'g02-t1': { boardKind: 'spatial-silhouette', selection: 'single', answerType: 'string', optionsFrom: 'board.options' },
  'g02-t2': { boardKind: 'spatial-rotation', selection: 'single', answerType: 'string', optionsFrom: 'board.options' },
  'g02-t3': { boardKind: 'spatial-symmetry', selection: 'point', answerType: 'point', optionsFrom: 'board.options' },
  'g03-t1': { boardKind: 'memory-sequence', selection: 'ordered', answerType: 'string-array', optionsFrom: 'board.options' },
  'g03-t2': { boardKind: 'memory-position', selection: 'cells', answerType: 'point-array', optionsFrom: 'board.options' },
  'g03-t3': { boardKind: 'memory-change', selection: 'single', answerType: 'string', optionsFrom: 'board.options' },
  'g04-t1': { boardKind: 'reasoning-elimination', selection: 'single', answerType: 'string', optionsFrom: 'board.options' },
  'g04-t2': { boardKind: 'reasoning-if-then', selection: 'single', answerType: 'string', optionsFrom: 'board.options' },
  'g04-t3': { boardKind: 'reasoning-missing-info', selection: 'single', answerType: 'string', optionsFrom: 'board.options' },
  'g05-t1': { boardKind: 'quantity-balance', selection: 'number', answerType: 'number', optionsFrom: 'board.options' },
  'g05-t2': { boardKind: 'quantity-grouping', selection: 'number', answerType: 'number', optionsFrom: 'board.options' },
  'g05-t3': { boardKind: 'quantity-target', selection: 'multi', answerType: 'string-array', optionsFrom: 'board.options' },
  'g06-t1': { boardKind: 'path-planning', selection: 'path', answerType: 'point-array', optionsFrom: 'none' },
  'g06-t2': { boardKind: 'planning-command-order', selection: 'ordered', answerType: 'string-array', optionsFrom: 'board.commands' },
  'g06-t3': { boardKind: 'planning-fix-step', selection: 'single', answerType: 'string', optionsFrom: 'board.options' },
  'g07-t1': { boardKind: 'flexibility-classify', selection: 'multi', answerType: 'string-array', optionsFrom: 'board.options' },
  'g07-t2': { boardKind: 'flexibility-perspective', selection: 'single', answerType: 'string', optionsFrom: 'board.options' },
  'g07-t3': { boardKind: 'flexibility-alternative', selection: 'path', answerType: 'point-array', optionsFrom: 'none' },
  'g08-t1': { boardKind: 'observation-difference', selection: 'cells', answerType: 'point-array', optionsFrom: 'board.options' },
  'g08-t2': { boardKind: 'observation-two-traits', selection: 'multi', answerType: 'string-array', optionsFrom: 'board.options' },
  'g08-t3': { boardKind: 'observation-implausible', selection: 'single', answerType: 'string', optionsFrom: 'board.options' },
};

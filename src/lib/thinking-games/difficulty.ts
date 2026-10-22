import type { BoardData } from './types';

// Difficulty score of one board, built only from the knobs that make that mechanic
// harder for a child (sequence length, grid size, options, extra rule steps, tighter
// limits). Scores are comparable between age tracks of the same game type and rule
// variant (same day and slot); they are not comparable across game types.

function digits(value: string): number {
  return value.replace(/\D/g, '').length;
}

function traitCount(items: readonly { traits: Readonly<Record<string, string>> }[]): number {
  return new Set(items.flatMap((item) => Object.keys(item.traits))).size;
}

export function difficultyScore(board: BoardData): number {
  switch (board.kind) {
    case 'rule-sequence': {
      const numeric = board.sequence.every((token) => Number.isFinite(Number(token)));
      return board.sequence.length + 0.5 * board.options.length + 0.5 * (board.period ?? 0)
        + (board.ruleKind === 'alternating' && numeric ? 2 : 0);
    }
    case 'rule-error':
      return board.sequence.length + 0.5 * (board.period ?? 0);
    case 'rule-transform':
      return board.options.length + digits(board.query);
    case 'spatial-silhouette':
      return board.target.length + 0.75 * board.options.length;
    case 'spatial-rotation':
      return board.shape.length + 0.75 * board.options.length;
    case 'spatial-symmetry':
      return (board.grid.length * (board.grid[0]?.length ?? 0)) / 3 + 0.5 * board.options.length;
    case 'memory-position':
      return 1.5 * board.targets.length + (board.width * board.height) / 4 + 0.5 * board.options.length
        + (2000 - board.displayMs) / 500;
    case 'memory-change':
      return board.before.length + 0.5 * board.options.length;
    case 'reasoning-elimination':
      return board.candidates.length + board.clues.length;
    case 'reasoning-if-then':
      return 1.5 * board.rules.length + 0.5 * board.options.length;
    case 'reasoning-missing-info':
      return board.candidates.length + 0.5 * board.options.length + 0.5 * traitCount(board.candidates)
        - 0.5 * board.known.length;
    case 'quantity-balance':
      return board.left.length + board.right.length + 0.5 * board.options.length;
    case 'quantity-grouping':
      return board.groupSize + board.total / 4 + 0.5 * board.options.length;
    case 'quantity-target':
      return board.items.length + 0.5 * board.maxItems;
    case 'planning-command-order':
      return board.commands.length + 0.5 * board.before.length;
    case 'planning-fix-step':
      return board.commands.length + (board.width * board.height) / 10 + 0.5 * board.walls.length;
    case 'flexibility-classify':
      return board.items.length + 0.5 * traitCount(board.items);
    case 'flexibility-perspective': {
      const distance = Math.abs(board.target.x - board.viewer.x) + Math.abs(board.target.y - board.viewer.y);
      return board.width + distance;
    }
    case 'flexibility-alternative':
      return board.width + 0.5 * board.walls.length;
    case 'observation-difference': {
      const differences = board.left.reduce((total, row, y) => total + row.filter((cell, x) => cell !== board.right[y]?.[x]).length, 0);
      return (board.left.length * (board.left[0]?.length ?? 0)) / 3 + differences + 0.25 * board.options.length;
    }
    case 'observation-two-traits':
      return board.items.length + 0.5 * traitCount(board.items);
    case 'observation-implausible':
      return board.scene.length;
    case 'path-planning':
      return (board.width * board.height) / 4 + 0.75 * board.walls.length + 1.5 * board.waypoints.length
        + (board.waypointOrder === 'ordered' ? 1.5 : 0) + (board.shortestPathOnly ? 2 : 0);
    case 'memory-sequence':
      return board.sequence.length + 0.5 * (board.options.length - board.sequence.length)
        + (board.groupSize ? 0.5 * board.groupSize : 0);
    default: {
      const exhaustive: never = board;
      return exhaustive;
    }
  }
}

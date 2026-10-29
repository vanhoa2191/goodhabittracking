import { createSeededRandom, shuffleDeterministic, stableSeedKey } from './seeded';
import type { BoardData } from './types';

/** The renderer and catalog audits share the same stable grouping-option order. */
export function displayQuantityGroupingOptions(
  board: Extract<BoardData, { kind: 'quantity-grouping' }>,
): number[] {
  const options = [...board.options].sort((left, right) => left - right);
  const seed = stableSeedKey(['g05-t2-display-order', board.total, board.groupSize, board.mode, ...options]);
  return shuffleDeterministic(createSeededRandom(seed), options);
}

export function displayReasoningEliminationExplanation(
  board: Extract<BoardData, { kind: 'reasoning-elimination' }>,
  text: string | undefined,
): string | undefined {
  if (text === undefined) return text;
  const matching = board.candidates.filter((candidate) => board.clues.every((clue) => {
    const value = candidate.traits[clue.trait];
    return clue.negate ? value !== clue.value : value === clue.value;
  }));
  if (matching.length !== 1) return text;
  const answerIndex = board.options.indexOf(matching[0]!.id);
  return answerIndex < 0 ? text : text.replace(/Bạn số \d+/, `Bạn số ${answerIndex + 1}`);
}

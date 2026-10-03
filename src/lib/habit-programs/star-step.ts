export const STAR_STEPS = [100, 50, 20] as const;
export type StarStep = (typeof STAR_STEPS)[number];

export type StarChange = {
  readonly step: StarStep;
  /** Stars a task is worth after the change. */
  readonly points: number;
  /** Stars it was worth before any step down; null once restored. */
  readonly basePoints: number | null;
};

const pointsFor = (base: number, step: StarStep): number => Math.max(1, Math.round((base * step) / 100));

/** Where a task stands: the full stars, or half, or a fifth of what it was first worth. */
export function currentStarStep(points: number, basePoints: number | null | undefined): StarStep {
  if (!basePoints) return 100;
  if (points === pointsFor(basePoints, 20)) return 20;
  if (points === pointsFor(basePoints, 50)) return 50;
  return 100;
}

/** The next step down in stars, or null when there is nothing lower to offer. Only a suggestion for the parent to accept. */
export function nextLowerStarStep(points: number, basePoints: number | null | undefined): StarChange | null {
  const base = basePoints ?? points;
  const current = currentStarStep(points, basePoints);
  const lower = STAR_STEPS.find((step) => step < current && pointsFor(base, step) < points);
  return lower === undefined ? null : { step: lower, points: pointsFor(base, lower), basePoints: base };
}

/** Back to what the task was first worth. */
export function restoreStarStep(points: number, basePoints: number | null | undefined): StarChange | null {
  return basePoints && basePoints !== points ? { step: 100, points: basePoints, basePoints: null } : null;
}

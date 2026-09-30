import scienceData from '@/data/science-content.json';

export type ScienceSource = {
  readonly id: string;
  readonly citation: string;
  readonly doi?: string;
};

export type SciencePrinciple = {
  readonly id: string;
  readonly title: string;
  /** What the research says, without figures the sources do not support. */
  readonly evidence: string;
  readonly action: string;
  /** Where the evidence stops. Always present. */
  readonly limit: string;
  readonly sourceIds: readonly string[];
};

// The same file feeds the static marketing site, so the wording lives in one place.
export const SCIENCE_SOURCES: readonly ScienceSource[] = scienceData.sources;
export const SCIENCE_PRINCIPLES: readonly SciencePrinciple[] = scienceData.principles;
export const SCIENCE_UNKNOWNS: readonly string[] = scienceData.unknowns;

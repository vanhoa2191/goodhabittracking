import { z } from 'zod';

export const defaultExperienceFlags = {
  dailyMascotLetter: process.env.NEXT_PUBLIC_DAILY_MASCOT_LETTER === 'true',
  questCards: false,
  secretQuest: false,
  parentInformationArchitecture: false,
  journeyMap: false,
  landingSafe: false,
  dreamCity: process.env.NEXT_PUBLIC_DREAM_CITY === 'true',
  dailyJournal: process.env.NEXT_PUBLIC_DAILY_JOURNAL === 'true',
  parentReengagement: false,
} as const;

export type ExperienceFlag = keyof typeof defaultExperienceFlags;
export type ExperienceFlags = Readonly<Record<ExperienceFlag, boolean>>;

const experienceFlagOverridesSchema = z.object({
  dailyMascotLetter: z.boolean().optional(),
  questCards: z.boolean().optional(),
  secretQuest: z.boolean().optional(),
  parentInformationArchitecture: z.boolean().optional(),
  journeyMap: z.boolean().optional(),
  landingSafe: z.boolean().optional(),
  dreamCity: z.boolean().optional(),
  dailyJournal: z.boolean().optional(),
  parentReengagement: z.boolean().optional(),
});

export function resolveExperienceFlags(input: unknown): ExperienceFlags {
  return {
    ...defaultExperienceFlags,
    ...experienceFlagOverridesSchema.parse(input),
  };
}

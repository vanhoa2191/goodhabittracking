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
  parentReengagement: process.env.NEXT_PUBLIC_PARENT_REENGAGEMENT === 'true',
  habitPrograms: process.env.NEXT_PUBLIC_HABIT_PROGRAMS === 'true',
  emailCodeLogin: process.env.NEXT_PUBLIC_EMAIL_CODE_LOGIN === 'true',
  ageTheme: process.env.NEXT_PUBLIC_AGE_THEME === 'true',
  dailyEase: process.env.NEXT_PUBLIC_DAILY_EASE === 'true',
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
  habitPrograms: z.boolean().optional(),
  emailCodeLogin: z.boolean().optional(),
  ageTheme: z.boolean().optional(),
  dailyEase: z.boolean().optional(),
});

export function resolveExperienceFlags(input: unknown): ExperienceFlags {
  return {
    ...defaultExperienceFlags,
    ...experienceFlagOverridesSchema.parse(input),
  };
}

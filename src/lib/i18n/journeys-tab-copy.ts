import type { Language } from '@/types';

export type JourneysTabCopy = {
  readonly ageGroup: string;
  readonly ageSuffix: string;
  readonly stepNote: string;
};

const COPY: Record<Language, JourneysTabCopy> = {
  vi: {
    ageGroup: 'Độ tuổi',
    ageSuffix: ' tuổi',
    stepNote: 'Mỗi bước thêm một thói quen và giữ các thói quen trước; ở lại một bước bao lâu tùy nhịp của bé.',
  },
  en: {
    ageGroup: 'Age stage',
    ageSuffix: ' years',
    stepNote: 'Each step adds one habit and keeps the earlier ones; stay on a step as long as your child needs.',
  },
  fr: {
    ageGroup: 'Age stage',
    ageSuffix: ' years',
    stepNote: 'Each step adds one habit and keeps the earlier ones; stay on a step as long as your child needs.',
  },
  de: {
    ageGroup: 'Age stage',
    ageSuffix: ' years',
    stepNote: 'Each step adds one habit and keeps the earlier ones; stay on a step as long as your child needs.',
  },
  it: {
    ageGroup: 'Age stage',
    ageSuffix: ' years',
    stepNote: 'Each step adds one habit and keeps the earlier ones; stay on a step as long as your child needs.',
  },
  es: {
    ageGroup: 'Age stage',
    ageSuffix: ' years',
    stepNote: 'Each step adds one habit and keeps the earlier ones; stay on a step as long as your child needs.',
  },
  zh: {
    ageGroup: 'Age stage',
    ageSuffix: ' years',
    stepNote: 'Each step adds one habit and keeps the earlier ones; stay on a step as long as your child needs.',
  },
  ja: {
    ageGroup: 'Age stage',
    ageSuffix: ' years',
    stepNote: 'Each step adds one habit and keeps the earlier ones; stay on a step as long as your child needs.',
  },
  ko: {
    ageGroup: 'Age stage',
    ageSuffix: ' years',
    stepNote: 'Each step adds one habit and keeps the earlier ones; stay on a step as long as your child needs.',
  },
};

export function getJourneysTabCopy(language: Language): JourneysTabCopy {
  return COPY[language] ?? COPY.en;
}

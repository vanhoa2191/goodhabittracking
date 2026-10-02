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
    ageGroup: 'Tranche d’âge',
    ageSuffix: ' ans',
    stepNote: 'Chaque étape ajoute une habitude et conserve les précédentes ; restez sur une étape aussi longtemps que votre enfant en a besoin.',
  },
  de: {
    ageGroup: 'Altersstufe',
    ageSuffix: ' Jahre',
    stepNote: 'Jeder Schritt fügt eine Gewohnheit hinzu und behält die früheren bei; bleib so lange auf einer Stufe, wie dein Kind es braucht.',
  },
  it: {
    ageGroup: 'Fascia d’età',
    ageSuffix: ' anni',
    stepNote: 'Ogni passo aggiunge un’abitudine e mantiene le precedenti; resta su un passo finché il bambino ne ha bisogno.',
  },
  es: {
    ageGroup: 'Etapa de edad',
    ageSuffix: ' años',
    stepNote: 'Cada paso añade un hábito y conserva los anteriores; quédate en un paso el tiempo que tu hijo lo necesite.',
  },
  zh: {
    ageGroup: '年龄段',
    ageSuffix: ' 岁',
    stepNote: '每一步增加一个习惯并保留之前的习惯；在每一步停留多久，取决于孩子的节奏。',
  },
  ja: {
    ageGroup: '年齢の段階',
    ageSuffix: ' 歳',
    stepNote: '各ステップで習慣を1つ増やし、前の習慣は続けます。どのステップにどれだけ留まるかは、お子さんのペースしだいです。',
  },
  ko: {
    ageGroup: '나이 단계',
    ageSuffix: '세',
    stepNote: '단계마다 습관을 하나씩 더하고 이전 습관은 이어가요. 한 단계에 얼마나 머물지는 아이의 속도에 맞춰 주세요.',
  },
};

export function getJourneysTabCopy(language: Language): JourneysTabCopy {
  return COPY[language] ?? COPY.en;
}

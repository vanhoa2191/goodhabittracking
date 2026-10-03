import type { Language } from '@/types';

export type TaskDetailsCopy = {
  readonly title: string;
  readonly meaning: string;
  readonly description: string;
  readonly instructions: string;
  readonly duration: (minutes: number) => string;
};

export const COPY: Record<Language, TaskDetailsCopy> = {
  vi: { title: 'Chi tiết nhiệm vụ', meaning: 'Ý nghĩa', description: 'Thói quen nhỏ này giúp con tự lập và tiến bộ mỗi ngày.', instructions: 'Cách làm', duration: (minutes) => `${minutes} phút` },
  en: { title: 'Task details', meaning: 'Why it matters', description: 'This small habit supports steady growth and independence.', instructions: 'How to do it', duration: (minutes) => `${minutes} min` },
  fr: { title: 'Détails de la tâche', meaning: 'Pourquoi c’est important', description: 'Cette petite habitude aide votre enfant à gagner en autonomie et à progresser chaque jour.', instructions: 'Comment faire', duration: (minutes) => `${minutes} min` },
  de: { title: 'Aufgabendetails', meaning: 'Warum es wichtig ist', description: 'Diese kleine Gewohnheit hilft deinem Kind, selbstständiger zu werden und jeden Tag Fortschritte zu machen.', instructions: 'So geht’s', duration: (minutes) => `${minutes} Min.` },
  it: { title: 'Dettagli dell’attività', meaning: 'Perché è importante', description: 'Questa piccola abitudine aiuta tuo figlio a diventare autonomo e a progredire ogni giorno.', instructions: 'Come fare', duration: (minutes) => `${minutes} min` },
  es: { title: 'Detalles de la tarea', meaning: 'Por qué importa', description: 'Este pequeño hábito ayuda a tu hijo a ganar autonomía y a progresar cada día.', instructions: 'Cómo hacerlo', duration: (minutes) => `${minutes} min` },
  zh: { title: '任务详情', meaning: '为什么重要', description: '这个小习惯帮助孩子更加独立，每天进步。', instructions: '怎么做', duration: (minutes) => `${minutes} 分钟` },
  ja: { title: 'ミッションの詳細', meaning: '大切な理由', description: 'この小さな習慣が子どもの自立と日々の成長を支えます。', instructions: 'やり方', duration: (minutes) => `${minutes} 分` },
  ko: { title: '할 일 상세', meaning: '중요한 이유', description: '이 작은 습관은 아이가 자립하고 매일 성장하도록 도와줘요.', instructions: '실천 방법', duration: (minutes) => `${minutes}분` },
};

export function getTaskDetailsCopy(language: Language): TaskDetailsCopy { return COPY[language]; }

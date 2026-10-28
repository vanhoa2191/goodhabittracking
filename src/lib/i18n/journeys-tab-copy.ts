import type { Language } from '@/types';

export type JourneysTabCopy = {
  readonly ageGroup: string;
  readonly ageSuffix: string;
  readonly stepNote: string;
  readonly programsNote: string;
};

const COPY: Record<Language, JourneysTabCopy> = {
  vi: {
    ageGroup: 'Độ tuổi',
    ageSuffix: ' tuổi',
    stepNote: 'Mỗi bước thêm một thói quen và giữ các thói quen trước; ở lại một bước bao lâu tùy nhịp của bé.',
    programsNote: 'Lộ trình này gợi ý thứ tự thêm thói quen theo độ tuổi. Chương trình đi theo nhịp riêng của từng bé nằm ở Thiết kế › Quản lý việc › Chương trình.',
  },
  en: {
    ageGroup: 'Age stage',
    ageSuffix: ' years',
    stepNote: 'Each step adds one habit and keeps the earlier ones; stay on a step as long as your child needs.',
    programsNote: 'This roadmap suggests when to add habits by age. Programs that follow each child’s pace are under Design › Manage tasks › Programs.',
  },
  fr: {
    ageGroup: 'Tranche d’âge',
    ageSuffix: ' ans',
    stepNote: 'Chaque étape ajoute une habitude et conserve les précédentes ; restez sur une étape aussi longtemps que votre enfant en a besoin.',
    programsNote: 'Ce parcours suggère l’ordre d’ajout des habitudes selon l’âge. Les programmes adaptés au rythme de chaque enfant se trouvent dans Conception › Gestion des tâches › Programmes.',
  },
  de: {
    ageGroup: 'Altersstufe',
    ageSuffix: ' Jahre',
    stepNote: 'Jeder Schritt fügt eine Gewohnheit hinzu und behält die früheren bei; bleib so lange auf einer Stufe, wie dein Kind es braucht.',
    programsNote: 'Dieser Wegweiser schlägt vor, wann Gewohnheiten je nach Alter hinzukommen. Programme im Tempo Ihres Kindes finden Sie unter Gestaltung › Aufgaben verwalten › Programme.',
  },
  it: {
    ageGroup: 'Fascia d’età',
    ageSuffix: ' anni',
    stepNote: 'Ogni passo aggiunge un’abitudine e mantiene le precedenti; resta su un passo finché il bambino ne ha bisogno.',
    programsNote: 'Questo percorso suggerisce quando aggiungere abitudini in base all’età. I programmi che seguono il ritmo di ogni bambino si trovano in Progettazione › Gestisci attività › Programmi.',
  },
  es: {
    ageGroup: 'Etapa de edad',
    ageSuffix: ' años',
    stepNote: 'Cada paso añade un hábito y conserva los anteriores; quédate en un paso el tiempo que tu hijo lo necesite.',
    programsNote: 'Esta ruta sugiere cuándo añadir hábitos según la edad. Los programas que siguen el ritmo de cada niño están en Diseño › Gestionar tareas › Programas.',
  },
  zh: {
    ageGroup: '年龄段',
    ageSuffix: ' 岁',
    stepNote: '每一步增加一个习惯并保留之前的习惯；在每一步停留多久，取决于孩子的节奏。',
    programsNote: '此路线图按年龄建议添加习惯的顺序。适合每个孩子节奏的计划位于“设计 › 管理任务 › 计划”。',
  },
  ja: {
    ageGroup: '年齢の段階',
    ageSuffix: ' 歳',
    stepNote: '各ステップで習慣を1つ増やし、前の習慣は続けます。どのステップにどれだけ留まるかは、お子さんのペースしだいです。',
    programsNote: 'このロードマップは年齢に応じた習慣の追加順を示します。お子さまのペースに合わせるプログラムは「設計 › タスク管理 › プログラム」にあります。',
  },
  ko: {
    ageGroup: '나이 단계',
    ageSuffix: '세',
    stepNote: '단계마다 습관을 하나씩 더하고 이전 습관은 이어가요. 한 단계에 얼마나 머물지는 아이의 속도에 맞춰 주세요.',
    programsNote: '이 로드맵은 나이에 따른 습관 추가 순서를 제안합니다. 아이의 속도에 맞는 프로그램은 설계 › 할 일 관리 › 프로그램에서 볼 수 있습니다.',
  },
};

export function getJourneysTabCopy(language: Language): JourneysTabCopy {
  return COPY[language] ?? COPY.en;
}

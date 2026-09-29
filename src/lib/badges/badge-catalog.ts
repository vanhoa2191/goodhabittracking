import type { Badge, Language } from '@/types';

type Localized = Record<Language, string>;

export const PORTRAIT_BADGE_TARGET = 10;
export const SUMMIT_PORTRAIT_ID = 'CD-16';

// CD-01…CD-15 are earned through habits; CD-16 (the summit) is earned by holding them all.
const PORTRAIT_ICONS: Readonly<Record<string, string>> = {
  'CD-01': '📚', 'CD-02': '😊', 'CD-03': '🧭', 'CD-04': '💎', 'CD-05': '🚀',
  'CD-06': '🤸', 'CD-07': '💪', 'CD-08': '📣', 'CD-09': '💬', 'CD-10': '🛡️',
  'CD-11': '🔭', 'CD-12': '🌏', 'CD-13': '🤝', 'CD-14': '🌸', 'CD-15': '🍀',
  'CD-16': '🏔️',
};

const PORTRAIT_NAMES: Readonly<Record<string, Localized>> = {
  'CD-01': { vi: 'Trí Tuệ Học Giả', en: 'Scholar’s Wisdom', fr: 'Sagesse du savant', de: 'Gelehrte Weisheit', it: 'Saggezza dello studioso', es: 'Sabiduría del erudito', zh: '学者智慧', ja: '学者の知恵', ko: '학자의 지혜' },
  'CD-02': { vi: 'Tâm Thái An Vui', en: 'Joyful Mind', fr: 'Esprit joyeux', de: 'Fröhliche Gesinnung', it: 'Mente serena', es: 'Mente alegre', zh: '平和喜悦', ja: '穏やかな心', ko: '즐거운 마음' },
  'CD-03': { vi: 'Nhân Cách Kiện Toàn', en: 'Whole Character', fr: 'Caractère accompli', de: 'Vollendeter Charakter', it: 'Carattere integro', es: 'Carácter íntegro', zh: '品格完整', ja: '円満な人格', ko: '온전한 인격' },
  'CD-04': { vi: 'Phẩm Chất Ưu Tú', en: 'Excellent Qualities', fr: 'Qualités d’excellence', de: 'Hervorragende Eigenschaften', it: 'Qualità eccellenti', es: 'Cualidades excelentes', zh: '卓越品质', ja: '優れた資質', ko: '뛰어난 자질' },
  'CD-05': { vi: 'Năng Lực Xuất Chúng', en: 'Outstanding Ability', fr: 'Capacités remarquables', de: 'Herausragende Fähigkeiten', it: 'Capacità straordinarie', es: 'Capacidad sobresaliente', zh: '出众能力', ja: '卓越した能力', ko: '탁월한 능력' },
  'CD-06': { vi: 'Thân Hình Người Mẫu', en: 'Graceful Body', fr: 'Corps harmonieux', de: 'Harmonischer Körper', it: 'Corpo armonioso', es: 'Cuerpo armonioso', zh: '优雅体态', ja: 'しなやかな体', ko: '균형 잡힌 몸' },
  'CD-07': { vi: 'Sức Khỏe Người Sắt', en: 'Iron Health', fr: 'Santé de fer', de: 'Eiserne Gesundheit', it: 'Salute di ferro', es: 'Salud de hierro', zh: '钢铁健康', ja: '鉄の健康', ko: '강철 건강' },
  'CD-08': { vi: 'Quảng Bá Siêu Phàm', en: 'Extraordinary Outreach', fr: 'Rayonnement hors du commun', de: 'Außergewöhnliche Ausstrahlung', it: 'Diffusione straordinaria', es: 'Alcance extraordinario', zh: '非凡影响力', ja: '非凡な発信力', ko: '비범한 영향력' },
  'CD-09': { vi: 'Giao Tiếp Thông Thái', en: 'Wise Communication', fr: 'Communication avisée', de: 'Kluge Kommunikation', it: 'Comunicazione saggia', es: 'Comunicación sabia', zh: '睿智沟通', ja: '賢いコミュニケーション', ko: '현명한 소통' },
  'CD-10': { vi: 'Luật Sắt Bản Thân', en: 'Iron Self-Discipline', fr: 'Discipline de fer', de: 'Eiserne Selbstdisziplin', it: 'Disciplina di ferro', es: 'Disciplina de hierro', zh: '铁律自律', ja: '鉄の自己規律', ko: '철저한 자기 절제' },
  'CD-11': { vi: 'Tầm Nhìn Thấu Suốt', en: 'Clear Vision', fr: 'Vision claire', de: 'Klarer Weitblick', it: 'Visione chiara', es: 'Visión clara', zh: '清晰远见', ja: '澄んだ展望', ko: '또렷한 비전' },
  'CD-12': { vi: 'Thấu Hiểu Nhân Sinh', en: 'Insight into Life', fr: 'Compréhension de la vie', de: 'Lebensverständnis', it: 'Comprensione della vita', es: 'Comprensión de la vida', zh: '洞察人生', ja: '人生への洞察', ko: '삶에 대한 통찰' },
  'CD-13': { vi: 'Bác Ái Lĩnh Chúng', en: 'Leading with Kindness', fr: 'Leadership bienveillant', de: 'Führen mit Güte', it: 'Guida gentile', es: 'Liderazgo con bondad', zh: '仁爱领袖', ja: '思いやりのリーダー', ko: '따뜻한 리더십' },
  'CD-14': { vi: 'Đức Hành Thiên Hạ', en: 'Virtue in Action', fr: 'Vertu en action', de: 'Tugend im Handeln', it: 'Virtù in azione', es: 'Virtud en acción', zh: '德行天下', ja: '徳の実践', ko: '실천하는 덕' },
  'CD-15': { vi: 'Lục Lộc Đại Thuận', en: 'Prosperous Harmony', fr: 'Prospérité harmonieuse', de: 'Blühende Harmonie', it: 'Prosperità armoniosa', es: 'Prosperidad armoniosa', zh: '六禄顺遂', ja: '調和と繁栄', ko: '조화로운 번영' },
  'CD-16': { vi: 'Làm Người Thành Công', en: 'A Successful Person', fr: 'Une personne qui réussit', de: 'Ein erfolgreicher Mensch', it: 'Una persona di successo', es: 'Una persona de éxito', zh: '成功之人', ja: '成功する人', ko: '성공한 사람' },
};

type Templates = {
  readonly streakName: (n: number) => string;
  readonly streakDescription: (n: number) => string;
  readonly tasksName: (n: number) => string;
  readonly tasksDescription: (n: number) => string;
  readonly pointsName: (n: number) => string;
  readonly pointsDescription: (n: number) => string;
  readonly portraitDescription: (name: string, n: number) => string;
  readonly summitDescription: (n: number) => string;
};

const TEMPLATES: Readonly<Record<Language, Templates>> = {
  vi: {
    streakName: (n) => `Chuỗi ${n} ngày`, streakDescription: (n) => `Duy trì thói quen ${n} ngày liên tục`,
    tasksName: (n) => `${n} nhiệm vụ`, tasksDescription: (n) => `Hoàn thành ${n} nhiệm vụ`,
    pointsName: (n) => `${n} sao`, pointsDescription: (n) => `Tích lũy ${n} sao`,
    portraitDescription: (name, n) => `Hoàn thành ${n} thói quen của chân dung “${name}”`,
    summitDescription: (n) => `Thu thập đủ ${n} huy hiệu chân dung`,
  },
  en: {
    streakName: (n) => `${n}-Day Streak`, streakDescription: (n) => `Keep a ${n}-day completion streak`,
    tasksName: (n) => `${n} Quests`, tasksDescription: (n) => `Complete ${n} quests`,
    pointsName: (n) => `${n} Stars`, pointsDescription: (n) => `Earn ${n} stars in total`,
    portraitDescription: (name, n) => `Complete ${n} habits from the “${name}” portrait`,
    summitDescription: (n) => `Collect all ${n} portrait badges`,
  },
  fr: {
    streakName: (n) => `Série de ${n} jours`, streakDescription: (n) => `Tiens une série de ${n} jours`,
    tasksName: (n) => `${n} missions`, tasksDescription: (n) => `Accomplis ${n} missions`,
    pointsName: (n) => `${n} étoiles`, pointsDescription: (n) => `Gagne ${n} étoiles au total`,
    portraitDescription: (name, n) => `Accomplis ${n} habitudes du portrait « ${name} »`,
    summitDescription: (n) => `Rassemble les ${n} badges de portrait`,
  },
  de: {
    streakName: (n) => `${n}-Tage-Serie`, streakDescription: (n) => `Halte eine ${n}-Tage-Serie`,
    tasksName: (n) => `${n} Aufgaben`, tasksDescription: (n) => `Schließe ${n} Aufgaben ab`,
    pointsName: (n) => `${n} Sterne`, pointsDescription: (n) => `Sammle insgesamt ${n} Sterne`,
    portraitDescription: (name, n) => `Schließe ${n} Gewohnheiten des Porträts „${name}“ ab`,
    summitDescription: (n) => `Sammle alle ${n} Porträt-Abzeichen`,
  },
  it: {
    streakName: (n) => `Serie di ${n} giorni`, streakDescription: (n) => `Mantieni una serie di ${n} giorni`,
    tasksName: (n) => `${n} missioni`, tasksDescription: (n) => `Completa ${n} missioni`,
    pointsName: (n) => `${n} stelle`, pointsDescription: (n) => `Guadagna ${n} stelle in totale`,
    portraitDescription: (name, n) => `Completa ${n} abitudini del ritratto «${name}»`,
    summitDescription: (n) => `Raccogli tutti i ${n} badge dei ritratti`,
  },
  es: {
    streakName: (n) => `Racha de ${n} días`, streakDescription: (n) => `Mantén una racha de ${n} días`,
    tasksName: (n) => `${n} misiones`, tasksDescription: (n) => `Completa ${n} misiones`,
    pointsName: (n) => `${n} estrellas`, pointsDescription: (n) => `Gana ${n} estrellas en total`,
    portraitDescription: (name, n) => `Completa ${n} hábitos del retrato «${name}»`,
    summitDescription: (n) => `Reúne las ${n} insignias de retratos`,
  },
  zh: {
    streakName: (n) => `连续${n}天`, streakDescription: (n) => `连续${n}天完成习惯打卡`,
    tasksName: (n) => `${n}个任务`, tasksDescription: (n) => `累计完成${n}个任务`,
    pointsName: (n) => `${n}颗星`, pointsDescription: (n) => `累计获得${n}颗星`,
    portraitDescription: (name, n) => `完成“${name}”画像的${n}个习惯`,
    summitDescription: (n) => `集齐全部${n}枚画像徽章`,
  },
  ja: {
    streakName: (n) => `${n}日連続`, streakDescription: (n) => `${n}日連続でミッションを達成`,
    tasksName: (n) => `${n}ミッション`, tasksDescription: (n) => `合計${n}個のミッションを達成`,
    pointsName: (n) => `${n}スター`, pointsDescription: (n) => `合計${n}スターを獲得`,
    portraitDescription: (name, n) => `「${name}」の習慣を${n}回達成`,
    summitDescription: (n) => `${n}種類の人物像バッジをすべて集める`,
  },
  ko: {
    streakName: (n) => `${n}일 연속`, streakDescription: (n) => `${n}일 연속으로 미션을 달성하세요`,
    tasksName: (n) => `미션 ${n}개`, tasksDescription: (n) => `미션 ${n}개를 완료하세요`,
    pointsName: (n) => `별 ${n}개`, pointsDescription: (n) => `총 별 ${n}개를 모으세요`,
    portraitDescription: (name, n) => `“${name}” 인물상 습관을 ${n}번 완료하세요`,
    summitDescription: (n) => `인물상 배지 ${n}개를 모두 모으세요`,
  },
};

const LANGUAGES = Object.keys(TEMPLATES) as Language[];

function localize(build: (language: Language, templates: Templates) => string): Record<Language, string> {
  return Object.fromEntries(
    LANGUAGES.map((language) => [language, build(language, TEMPLATES[language])]),
  ) as Record<Language, string>;
}

// The first-step, 3/7-day, 20-quest and 100-star badges live in constants.ts; these extend them.
const STREAK_TIERS: readonly (readonly [number, string])[] = [[14, '🚀'], [30, '🏆'], [60, '💎'], [100, '👑']];
const TASK_TIERS: readonly (readonly [number, string])[] = [[10, '⭐'], [50, '🎯'], [100, '💯'], [250, '🥇'], [500, '🏅'], [1000, '🌟']];
const POINT_TIERS: readonly (readonly [number, string])[] = [[250, '🪙'], [500, '💰'], [1000, '🎖️'], [2500, '🏰'], [5000, '🌈']];

const PORTRAIT_IDS = Object.keys(PORTRAIT_NAMES).filter((id) => id !== SUMMIT_PORTRAIT_ID);

export const PORTRAIT_BADGE_COUNT = PORTRAIT_IDS.length;

export const EXTRA_BADGES: readonly Badge[] = [
  ...STREAK_TIERS.map(([n, icon]): Badge => ({
    id: `badge-streak-${n}`,
    code: 'streak',
    icon,
    name: localize((_, t) => t.streakName(n)),
    description: localize((_, t) => t.streakDescription(n)),
    criteriaType: 'streak',
    criteriaValue: n,
  })),
  ...TASK_TIERS.map(([n, icon]): Badge => ({
    id: `badge-tasks-${n}`,
    code: 'totalTasks',
    icon,
    name: localize((_, t) => t.tasksName(n)),
    description: localize((_, t) => t.tasksDescription(n)),
    criteriaType: 'totalTasks',
    criteriaValue: n,
  })),
  ...POINT_TIERS.map(([n, icon]): Badge => ({
    id: `badge-points-${n}`,
    code: 'totalPoints',
    icon,
    name: localize((_, t) => t.pointsName(n)),
    description: localize((_, t) => t.pointsDescription(n)),
    criteriaType: 'totalPoints',
    criteriaValue: n,
  })),
  ...PORTRAIT_IDS.map((portraitId): Badge => ({
    id: `badge-portrait-${portraitId.toLowerCase()}`,
    code: 'portrait',
    icon: PORTRAIT_ICONS[portraitId],
    name: localize((language) => PORTRAIT_NAMES[portraitId][language]),
    description: localize((language, t) => t.portraitDescription(PORTRAIT_NAMES[portraitId][language], PORTRAIT_BADGE_TARGET)),
    criteriaType: 'portrait',
    criteriaValue: PORTRAIT_BADGE_TARGET,
    portraitId,
  })),
  {
    id: `badge-portrait-${SUMMIT_PORTRAIT_ID.toLowerCase()}`,
    code: 'portraitCollection',
    icon: PORTRAIT_ICONS[SUMMIT_PORTRAIT_ID],
    name: localize((language) => PORTRAIT_NAMES[SUMMIT_PORTRAIT_ID][language]),
    description: localize((_, t) => t.summitDescription(PORTRAIT_BADGE_COUNT)),
    criteriaType: 'portraitCollection',
    criteriaValue: PORTRAIT_BADGE_COUNT,
    portraitId: SUMMIT_PORTRAIT_ID,
  },
];

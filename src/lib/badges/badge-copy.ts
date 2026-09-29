import type { Language } from '@/types';

type BadgeCopy = {
  readonly congratsTitle: string;
  readonly earnedLine: (childName: string) => string;
  readonly awesome: string;
  readonly viewBadges: string;
  readonly nextBadges: (count: number) => string;
  readonly collected: (held: number, total: number) => string;
  readonly groups: Readonly<Record<'start' | 'streak' | 'quests' | 'stars' | 'portraits', string>>;
};

const COPY: Readonly<Record<Language, BadgeCopy>> = {
  vi: {
    congratsTitle: 'Chúc mừng! Huy hiệu mới!',
    earnedLine: (name) => `${name} vừa đạt được huy hiệu`,
    awesome: 'Tuyệt vời!',
    viewBadges: 'Xem bộ sưu tập',
    nextBadges: (count) => `Còn ${count} huy hiệu nữa đang chờ`,
    collected: (held, total) => `Đã sưu tầm ${held}/${total}`,
    groups: { start: 'Khởi đầu', streak: 'Chuỗi ngày', quests: 'Nhiệm vụ', stars: 'Ngôi sao', portraits: 'Chân dung' },
  },
  en: {
    congratsTitle: 'Congratulations! New badge!',
    earnedLine: (name) => `${name} just earned the badge`,
    awesome: 'Awesome!',
    viewBadges: 'See collection',
    nextBadges: (count) => `${count} more badges are waiting`,
    collected: (held, total) => `Collected ${held}/${total}`,
    groups: { start: 'Getting started', streak: 'Streaks', quests: 'Quests', stars: 'Stars', portraits: 'Portraits' },
  },
  fr: {
    congratsTitle: 'Bravo ! Nouveau badge !',
    earnedLine: (name) => `${name} vient d’obtenir le badge`,
    awesome: 'Génial !',
    viewBadges: 'Voir la collection',
    nextBadges: (count) => `${count} autres badges t’attendent`,
    collected: (held, total) => `${held}/${total} collectés`,
    groups: { start: 'Débuts', streak: 'Séries', quests: 'Missions', stars: 'Étoiles', portraits: 'Portraits' },
  },
  de: {
    congratsTitle: 'Glückwunsch! Neues Abzeichen!',
    earnedLine: (name) => `${name} hat gerade das Abzeichen erhalten`,
    awesome: 'Super!',
    viewBadges: 'Sammlung ansehen',
    nextBadges: (count) => `${count} weitere Abzeichen warten`,
    collected: (held, total) => `${held}/${total} gesammelt`,
    groups: { start: 'Start', streak: 'Serien', quests: 'Aufgaben', stars: 'Sterne', portraits: 'Porträts' },
  },
  it: {
    congratsTitle: 'Complimenti! Nuovo badge!',
    earnedLine: (name) => `${name} ha appena ottenuto il badge`,
    awesome: 'Fantastico!',
    viewBadges: 'Vedi la collezione',
    nextBadges: (count) => `Altri ${count} badge ti aspettano`,
    collected: (held, total) => `${held}/${total} raccolti`,
    groups: { start: 'Inizio', streak: 'Serie', quests: 'Missioni', stars: 'Stelle', portraits: 'Ritratti' },
  },
  es: {
    congratsTitle: '¡Felicidades! ¡Nueva insignia!',
    earnedLine: (name) => `${name} acaba de conseguir la insignia`,
    awesome: '¡Genial!',
    viewBadges: 'Ver colección',
    nextBadges: (count) => `Te esperan ${count} insignias más`,
    collected: (held, total) => `${held}/${total} conseguidas`,
    groups: { start: 'Inicio', streak: 'Rachas', quests: 'Misiones', stars: 'Estrellas', portraits: 'Retratos' },
  },
  zh: {
    congratsTitle: '恭喜！获得新徽章！',
    earnedLine: (name) => `${name}刚刚获得了徽章`,
    awesome: '太棒了！',
    viewBadges: '查看徽章收藏',
    nextBadges: (count) => `还有 ${count} 枚徽章等着你`,
    collected: (held, total) => `已收集 ${held}/${total}`,
    groups: { start: '起步', streak: '连续打卡', quests: '任务', stars: '星星', portraits: '人物画像' },
  },
  ja: {
    congratsTitle: 'おめでとう！新しいバッジ！',
    earnedLine: (name) => `${name}が新しいバッジを獲得しました`,
    awesome: 'やったね！',
    viewBadges: 'コレクションを見る',
    nextBadges: (count) => `あと${count}個のバッジが待っています`,
    collected: (held, total) => `${held}/${total} 集めました`,
    groups: { start: 'はじめの一歩', streak: '連続記録', quests: 'ミッション', stars: 'スター', portraits: '人物像' },
  },
  ko: {
    congratsTitle: '축하해요! 새 배지!',
    earnedLine: (name) => `${name}이(가) 방금 배지를 받았어요`,
    awesome: '멋져요!',
    viewBadges: '컬렉션 보기',
    nextBadges: (count) => `배지 ${count}개가 더 기다리고 있어요`,
    collected: (held, total) => `${held}/${total} 수집`,
    groups: { start: '시작', streak: '연속 기록', quests: '미션', stars: '별', portraits: '인물상' },
  },
};

export function getBadgeCopy(language: Language): BadgeCopy {
  return COPY[language];
}

export type BadgeGroupKey = keyof BadgeCopy['groups'];

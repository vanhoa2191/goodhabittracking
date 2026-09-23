import type { Language } from '@/types';

type HabitFireCopy = {
  readonly active: (days: number) => string;
  readonly resting: (days: number) => string;
  readonly cold: string;
  readonly pending: string;
};

const copy: Record<Language, HabitFireCopy> = {
  vi: { active: (n) => `Đang duy trì ${n} ngày liên tiếp`, resting: (n) => `${n} ngày liên tiếp, sẵn sàng hôm nay`, cold: 'Bắt đầu hôm nay', pending: 'Chờ bố mẹ duyệt' },
  en: { active: (n) => `Going strong for ${n} ${n === 1 ? 'day' : 'days'}`, resting: (n) => `${n}-day run, ready for today`, cold: 'Start today', pending: 'Waiting for parent approval' },
  fr: { active: (n) => `${n} ${n === 1 ? 'jour' : 'jours'} de suite`, resting: (n) => `${n} ${n === 1 ? 'jour' : 'jours'} de suite, prêt pour aujourd’hui`, cold: 'Commencer aujourd’hui', pending: 'En attente des parents' },
  de: { active: (n) => `${n} ${n === 1 ? 'Tag' : 'Tage'} in Folge`, resting: (n) => `${n} ${n === 1 ? 'Tag' : 'Tage'} in Folge, bereit für heute`, cold: 'Heute anfangen', pending: 'Wartet auf die Eltern' },
  it: { active: (n) => `${n} ${n === 1 ? 'giorno' : 'giorni'} di seguito`, resting: (n) => `${n} ${n === 1 ? 'giorno' : 'giorni'} di seguito, pronto per oggi`, cold: 'Inizia oggi', pending: 'In attesa dei genitori' },
  es: { active: (n) => `${n} ${n === 1 ? 'día' : 'días'} seguidos`, resting: (n) => `${n} ${n === 1 ? 'día' : 'días'} seguidos, listo para hoy`, cold: 'Empieza hoy', pending: 'Esperando a tus padres' },
  zh: { active: (n) => `已连续完成 ${n} 天`, resting: (n) => `已连续 ${n} 天，今天继续加油`, cold: '今天开始', pending: '等待家长确认' },
  ja: { active: (n) => `${n}日連続でできたよ`, resting: (n) => `${n}日連続、今日もできるよ`, cold: '今日から始めよう', pending: '保護者の確認待ち' },
  ko: { active: (n) => `${n}일 연속 실천했어요`, resting: (n) => `${n}일 연속, 오늘도 준비됐어요`, cold: '오늘 시작해요', pending: '보호자 확인 대기 중' },
};

export function getHabitFireCopy(language: Language): HabitFireCopy {
  return copy[language];
}

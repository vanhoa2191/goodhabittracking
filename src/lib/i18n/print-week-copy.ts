import type { Language } from '@/types';

type PrintWeekCopy = {
  readonly printChart: string;
  readonly printReport: string;
  readonly chartTitle: string;
  readonly reportTitle: string;
  readonly habit: string;
  readonly points: string;
  readonly noHabits: string;
  readonly weekOf: (start: string, end: string) => string;
  readonly summary: (done: number, total: number, points: number) => string;
  readonly footer: string;
};

const COPY: Readonly<Record<Language, PrintWeekCopy>> = {
  vi: {
    printChart: 'In bảng thói quen tuần', printReport: 'In báo cáo tuần',
    chartTitle: 'Bảng thói quen tuần', reportTitle: 'Báo cáo tuần', habit: 'Thói quen', points: 'Điểm',
    noHabits: 'Chưa có thói quen nào cho bé.',
    weekOf: (start, end) => `Tuần ${start} – ${end}`,
    summary: (done, total, points) => `Đã làm ${done}/${total} lượt trong tuần · ${points} điểm`,
    footer: 'Tạo bởi KidHabit Hero · kidhabithero.com',
  },
  en: {
    printChart: 'Print weekly habit chart', printReport: 'Print weekly report',
    chartTitle: 'Weekly habit chart', reportTitle: 'Weekly report', habit: 'Habit', points: 'Points',
    noHabits: 'No habits yet for this child.',
    weekOf: (start, end) => `Week of ${start} – ${end}`,
    summary: (done, total, points) => `${done} of ${total} done this week · ${points} points`,
    footer: 'Made with KidHabit Hero · kidhabithero.com',
  },
  fr: {
    printChart: 'Imprimer le tableau de la semaine', printReport: 'Imprimer le bilan de la semaine',
    chartTitle: 'Tableau des habitudes de la semaine', reportTitle: 'Bilan de la semaine', habit: 'Habitude', points: 'Points',
    noHabits: 'Aucune habitude pour cet enfant pour l’instant.',
    weekOf: (start, end) => `Semaine du ${start} au ${end}`,
    summary: (done, total, points) => `${done} sur ${total} faites cette semaine · ${points} points`,
    footer: 'Créé avec KidHabit Hero · kidhabithero.com',
  },
  de: {
    printChart: 'Wochenplan drucken', printReport: 'Wochenbericht drucken',
    chartTitle: 'Wochenplan der Gewohnheiten', reportTitle: 'Wochenbericht', habit: 'Gewohnheit', points: 'Punkte',
    noHabits: 'Für dieses Kind gibt es noch keine Gewohnheiten.',
    weekOf: (start, end) => `Woche vom ${start} bis ${end}`,
    summary: (done, total, points) => `${done} von ${total} diese Woche erledigt · ${points} Punkte`,
    footer: 'Erstellt mit KidHabit Hero · kidhabithero.com',
  },
  it: {
    printChart: 'Stampa la tabella settimanale', printReport: 'Stampa il resoconto settimanale',
    chartTitle: 'Tabella delle abitudini della settimana', reportTitle: 'Resoconto settimanale', habit: 'Abitudine', points: 'Punti',
    noHabits: 'Nessuna abitudine per questo bambino, per ora.',
    weekOf: (start, end) => `Settimana dal ${start} al ${end}`,
    summary: (done, total, points) => `${done} su ${total} fatte questa settimana · ${points} punti`,
    footer: 'Creato con KidHabit Hero · kidhabithero.com',
  },
  es: {
    printChart: 'Imprimir el cuadro semanal', printReport: 'Imprimir el informe semanal',
    chartTitle: 'Cuadro semanal de hábitos', reportTitle: 'Informe semanal', habit: 'Hábito', points: 'Puntos',
    noHabits: 'Todavía no hay hábitos para este niño.',
    weekOf: (start, end) => `Semana del ${start} al ${end}`,
    summary: (done, total, points) => `${done} de ${total} hechos esta semana · ${points} puntos`,
    footer: 'Creado con KidHabit Hero · kidhabithero.com',
  },
  zh: {
    printChart: '打印每周习惯表', printReport: '打印每周报告',
    chartTitle: '每周习惯表', reportTitle: '每周报告', habit: '习惯', points: '积分',
    noHabits: '这个孩子还没有习惯。',
    weekOf: (start, end) => `${start} – ${end} 这一周`,
    summary: (done, total, points) => `本周已完成 ${done}/${total} 次 · ${points} 分`,
    footer: '由 KidHabit Hero 制作 · kidhabithero.com',
  },
  ja: {
    printChart: '週の習慣表を印刷', printReport: '週のレポートを印刷',
    chartTitle: '週の習慣表', reportTitle: '週のレポート', habit: '習慣', points: 'ポイント',
    noHabits: 'このお子さまの習慣はまだありません。',
    weekOf: (start, end) => `${start} – ${end} の週`,
    summary: (done, total, points) => `今週は ${total} 回中 ${done} 回できました · ${points} ポイント`,
    footer: 'KidHabit Hero で作成 · kidhabithero.com',
  },
  ko: {
    printChart: '주간 습관표 인쇄', printReport: '주간 리포트 인쇄',
    chartTitle: '주간 습관표', reportTitle: '주간 리포트', habit: '습관', points: '포인트',
    noHabits: '이 아이의 습관이 아직 없어요.',
    weekOf: (start, end) => `${start} – ${end} 주`,
    summary: (done, total, points) => `이번 주 ${total}회 중 ${done}회 완료 · ${points}포인트`,
    footer: 'KidHabit Hero로 만듦 · kidhabithero.com',
  },
};

export function getPrintWeekCopy(language: Language): PrintWeekCopy {
  return COPY[language];
}

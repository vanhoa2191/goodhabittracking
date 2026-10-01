import type { Language } from '@/types';

type JourneyCopy = {
  description: string;
  includesHabits: (count: number) => string;
  applyQuestion: (count: number) => string;
  applyTo: string;
  confirmApply: string;
  details: string;
  habitsPerDay: (count: number) => string;
  focusTasks: string;
  minutes: (count: number) => string;
  period: (from: number, to: number) => string;
};

export const journeyCopy: Record<Language, JourneyCopy> = {
  vi: { description: 'Lộ trình khoảng 12 tuần theo từng độ tuổi, mỗi bước chỉ thêm một thói quen. Có thể chỉnh sau khi áp dụng.', includesHabits: (n) => `Bao gồm ${n} thói quen:`, applyQuestion: (n) => `Áp dụng ${n} thói quen này vào lịch hằng ngày? Bạn có thể chỉnh sửa sau trong mục Quản lý việc.`, applyTo: 'Áp dụng cho bé nào?', confirmApply: 'Xác nhận áp dụng', details: 'Xem chi tiết', habitsPerDay: (n) => `${n} việc tốt/ngày`, focusTasks: 'Nhiệm vụ trọng tâm:', minutes: (n) => `${n} phút`, period: (from, to) => `Tuần ${from}–${to}` },
  en: { description: 'Roughly 12-week roadmaps by age, each step adding just one habit. Fully editable after applying.', includesHabits: (n) => `Includes ${n} habits:`, applyQuestion: (n) => `Add these ${n} habits to the daily schedule? You can edit them later under Habits.`, applyTo: 'Apply to which child?', confirmApply: 'Confirm and apply', details: 'View details', habitsPerDay: (n) => `${n} habits/day`, focusTasks: 'Focus tasks:', minutes: (n) => `${n} min`, period: (from, to) => `Weeks ${from}–${to}` },
  fr: { description: 'Des parcours d’environ 12 semaines par âge, chaque étape n’ajoutant qu’une habitude. Modifiables après application.', includesHabits: (n) => `Comprend ${n} habitudes :`, applyQuestion: (n) => `Ajouter ces ${n} habitudes au programme quotidien ? Vous pourrez les modifier ensuite dans Habitudes.`, applyTo: 'Appliquer à quel enfant ?', confirmApply: 'Confirmer et appliquer', details: 'Voir les détails', habitsPerDay: (n) => `${n} habitudes/jour`, focusTasks: 'Tâches principales :', minutes: (n) => `${n} min`, period: (from, to) => `Semaines ${from}–${to}` },
  de: { description: 'Pläne von etwa 12 Wochen je Altersstufe, jeder Schritt fügt nur eine Gewohnheit hinzu. Nach dem Anwenden bearbeitbar.', includesHabits: (n) => `Enthält ${n} Gewohnheiten:`, applyQuestion: (n) => `Diese ${n} Gewohnheiten zum Tagesplan hinzufügen? Sie können später unter Gewohnheiten bearbeitet werden.`, applyTo: 'Für welches Kind anwenden?', confirmApply: 'Bestätigen und anwenden', details: 'Details ansehen', habitsPerDay: (n) => `${n} Gewohnheiten/Tag`, focusTasks: 'Schwerpunkte:', minutes: (n) => `${n} Min.`, period: (from, to) => `Wochen ${from}–${to}` },
  it: { description: 'Percorsi di circa 12 settimane per età, ogni passo aggiunge una sola abitudine. Modificabili dopo l’applicazione.', includesHabits: (n) => `Include ${n} abitudini:`, applyQuestion: (n) => `Aggiungere queste ${n} abitudini al programma giornaliero? Potrai modificarle in seguito in Abitudini.`, applyTo: 'A quale bambino applicarlo?', confirmApply: 'Conferma e applica', details: 'Vedi dettagli', habitsPerDay: (n) => `${n} abitudini/giorno`, focusTasks: 'Attività principali:', minutes: (n) => `${n} min`, period: (from, to) => `Settimane ${from}–${to}` },
  es: { description: 'Rutas de unas 12 semanas por edad; cada paso añade un solo hábito. Se pueden editar tras aplicarlas.', includesHabits: (n) => `Incluye ${n} hábitos:`, applyQuestion: (n) => `¿Añadir estos ${n} hábitos al horario diario? Podrás editarlos después en Hábitos.`, applyTo: '¿A qué niño se aplica?', confirmApply: 'Confirmar y aplicar', details: 'Ver detalles', habitsPerDay: (n) => `${n} hábitos/día`, focusTasks: 'Tareas principales:', minutes: (n) => `${n} min`, period: (from, to) => `Semanas ${from}–${to}` },
  zh: { description: '按年龄段设计、约 12 周的成长路线，每一步只增加一个习惯，应用后仍可自由调整。', includesHabits: (n) => `包含 ${n} 个习惯：`, applyQuestion: (n) => `将这 ${n} 个习惯加入每日计划吗？之后可在“习惯管理”中修改。`, applyTo: '应用给哪个孩子？', confirmApply: '确认并应用', details: '查看详情', habitsPerDay: (n) => `每天 ${n} 个习惯`, focusTasks: '重点任务：', minutes: (n) => `${n} 分钟`, period: (from, to) => `第${from}–${to}周` },
  ja: { description: '年齢別・約12週間のプラン。各ステップで増やす習慣は1つだけ。適用後も自由に編集できます。', includesHabits: (n) => `${n}個の習慣：`, applyQuestion: (n) => `この${n}個の習慣を毎日の予定に追加しますか？後で「習慣管理」から編集できます。`, applyTo: 'どの子に適用しますか？', confirmApply: '確認して適用', details: '詳細を見る', habitsPerDay: (n) => `1日${n}個`, focusTasks: '重点タスク：', minutes: (n) => `${n}分`, period: (from, to) => `${from}〜${to}週目` },
  ko: { description: '연령대별 약 12주 과정으로, 각 단계에서 습관을 하나씩만 추가합니다. 적용 후에도 수정할 수 있습니다.', includesHabits: (n) => `${n}개 습관 포함:`, applyQuestion: (n) => `이 ${n}개 습관을 매일 일정에 추가할까요? 나중에 습관 관리에서 수정할 수 있습니다.`, applyTo: '어느 아이에게 적용할까요?', confirmApply: '확인 후 적용', details: '자세히 보기', habitsPerDay: (n) => `하루 ${n}개`, focusTasks: '핵심 과제:', minutes: (n) => `${n}분`, period: (from, to) => `${from}–${to}주차` },
};

export function getJourneyPeriodLabel(language: Language, weeks: readonly [number, number]) {
  return journeyCopy[language].period(weeks[0], weeks[1]);
}

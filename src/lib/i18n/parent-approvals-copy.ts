import type { Language } from '@/types';

type ApprovalsCopy = {
  stars: string;
  days: string;
  todayDone: (count: number) => string;
  pendingTasks: string;
  noPendingTasks: string;
  rewardCompleted: (points: number, date: string) => string;
  pendingRewards: string;
  noPendingRewards: string;
  redemptionRequested: (points: number, time: string) => string;
};

export const parentApprovalsCopy: Record<Language, ApprovalsCopy> = {
  vi: {
    stars: 'sao', days: 'ngày', todayDone: (count) => `Hôm nay: ${count} việc đã xong`,
    pendingTasks: 'Nhiệm vụ chờ bố mẹ duyệt', noPendingTasks: 'Hiện không có nhiệm vụ nào cần phê duyệt.',
    rewardCompleted: (points, date) => `Thưởng: +${points} ⭐ • Hoàn thành ngày ${date}`,
    pendingRewards: 'Yêu cầu đổi quà từ các con', noPendingRewards: 'Không có yêu cầu đổi quà nào đang chờ.',
    redemptionRequested: (points, time) => `Đã trừ ${points} ⭐ • Yêu cầu lúc ${time}`,
  },
  en: {
    stars: 'stars', days: 'days', todayDone: (count) => `Today: ${count} tasks completed`,
    pendingTasks: 'Tasks awaiting parent approval', noPendingTasks: 'No tasks currently need approval.',
    rewardCompleted: (points, date) => `Reward: +${points} ⭐ • Completed on ${date}`,
    pendingRewards: 'Reward requests from children', noPendingRewards: 'No reward requests are waiting.',
    redemptionRequested: (points, time) => `${points} ⭐ deducted • Requested at ${time}`,
  },
  fr: {
    stars: 'étoiles', days: 'jours', todayDone: (count) => `Aujourd’hui : ${count} tâches terminées`,
    pendingTasks: 'Tâches en attente de validation', noPendingTasks: 'Aucune tâche ne nécessite de validation.',
    rewardCompleted: (points, date) => `Récompense : +${points} ⭐ • Terminée le ${date}`,
    pendingRewards: 'Demandes de récompense des enfants', noPendingRewards: 'Aucune demande de récompense en attente.',
    redemptionRequested: (points, time) => `${points} ⭐ déduites • Demandée à ${time}`,
  },
  de: {
    stars: 'Sterne', days: 'Tage', todayDone: (count) => `Heute: ${count} Aufgaben erledigt`,
    pendingTasks: 'Aufgaben warten auf Bestätigung', noPendingTasks: 'Keine Aufgabe muss derzeit bestätigt werden.',
    rewardCompleted: (points, date) => `Belohnung: +${points} ⭐ • Erledigt am ${date}`,
    pendingRewards: 'Belohnungswünsche der Kinder', noPendingRewards: 'Keine Belohnungswünsche offen.',
    redemptionRequested: (points, time) => `${points} ⭐ abgezogen • Angefragt um ${time}`,
  },
  it: {
    stars: 'stelle', days: 'giorni', todayDone: (count) => `Oggi: ${count} attività completate`,
    pendingTasks: 'Attività in attesa di approvazione', noPendingTasks: 'Nessuna attività richiede approvazione.',
    rewardCompleted: (points, date) => `Premio: +${points} ⭐ • Completata il ${date}`,
    pendingRewards: 'Richieste premio dei bambini', noPendingRewards: 'Nessuna richiesta premio in attesa.',
    redemptionRequested: (points, time) => `${points} ⭐ detratte • Richiesta alle ${time}`,
  },
  es: {
    stars: 'estrellas', days: 'días', todayDone: (count) => `Hoy: ${count} tareas completadas`,
    pendingTasks: 'Tareas pendientes de aprobación', noPendingTasks: 'No hay tareas que requieran aprobación.',
    rewardCompleted: (points, date) => `Premio: +${points} ⭐ • Completada el ${date}`,
    pendingRewards: 'Solicitudes de premios de los niños', noPendingRewards: 'No hay solicitudes de premios pendientes.',
    redemptionRequested: (points, time) => `${points} ⭐ descontadas • Solicitado a las ${time}`,
  },
  zh: {
    stars: '星', days: '天', todayDone: (count) => `今天：已完成 ${count} 项任务`,
    pendingTasks: '等待家长确认的任务', noPendingTasks: '目前没有需要确认的任务。',
    rewardCompleted: (points, date) => `奖励：+${points} ⭐ • 完成于 ${date}`,
    pendingRewards: '孩子的奖励兑换申请', noPendingRewards: '目前没有待处理的奖励申请。',
    redemptionRequested: (points, time) => `已扣除 ${points} ⭐ • 申请时间 ${time}`,
  },
  ja: {
    stars: 'スター', days: '日', todayDone: (count) => `今日：${count}件完了`,
    pendingTasks: '保護者の承認待ちタスク', noPendingTasks: '現在、承認が必要なタスクはありません。',
    rewardCompleted: (points, date) => `ごほうび：+${points} ⭐ • ${date}に完了`,
    pendingRewards: '子どもからのごほうび申請', noPendingRewards: '承認待ちのごほうび申請はありません。',
    redemptionRequested: (points, time) => `${points} ⭐を使用 • ${time}に申請`,
  },
  ko: {
    stars: '별', days: '일', todayDone: (count) => `오늘: ${count}개 완료`,
    pendingTasks: '부모 승인 대기 과제', noPendingTasks: '현재 승인할 과제가 없습니다.',
    rewardCompleted: (points, date) => `보상: +${points} ⭐ • ${date} 완료`,
    pendingRewards: '아이의 보상 교환 요청', noPendingRewards: '대기 중인 보상 요청이 없습니다.',
    redemptionRequested: (points, time) => `${points} ⭐ 차감 • ${time} 요청`,
  },
};

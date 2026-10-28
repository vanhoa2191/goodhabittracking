import type { Language } from '@/types';

type ApprovalsCopy = {
  stars: string;
  days: string;
  todayDone: (count: number) => string;
  pendingTasks: string;
  noPendingTasks: string;
  inboxTitle: string;
  inboxEmptyBody: string;
  rewardCompleted: (points: number, date: string) => string;
  pendingRewards: string;
  noPendingRewards: string;
  redemptionRequested: (points: number, time: string) => string;
  /** Names the queue as spanning every child of the family, so a count of tasks or rewards is never mistaken for one child's. */
  allChildrenScope: string;
  approvedAwaitingDelivery: string;
  deliveryUnfulfilled: string;
  deliveryFailed: string;
  deliveredStale: string;
  deliveredDone: string;
  rejectedDone: string;
  reconcileMessage: string;
};

export const parentApprovalsCopy: Record<Language, ApprovalsCopy> = {
  vi: {
    stars: 'sao', days: 'ngày', todayDone: (count) => `Hôm nay: ${count} việc đã xong`,
    pendingTasks: 'Nhiệm vụ chờ bố mẹ duyệt', noPendingTasks: 'Hiện không có nhiệm vụ nào cần phê duyệt.',
    inboxTitle: 'Cần duyệt — tất cả bé', inboxEmptyBody: 'Khi bé hoàn thành việc cần duyệt hoặc xin đổi quà, việc đó sẽ xuất hiện ở đây.',
    rewardCompleted: (points, date) => `Thưởng: +${points} ⭐ • Hoàn thành ngày ${date}`,
    pendingRewards: 'Yêu cầu đổi quà từ các con', noPendingRewards: 'Không có yêu cầu đổi quà nào đang chờ.',
    redemptionRequested: (points, time) => `Đã trừ ${points} ⭐ • Yêu cầu lúc ${time}`,
    allChildrenScope: 'tất cả bé',
    approvedAwaitingDelivery: 'Đã duyệt, chờ trao quà.',
    deliveryUnfulfilled: 'Đã duyệt nhưng chưa trao được quà. Làm mới danh sách để kiểm tra trạng thái mới nhất.',
    deliveryFailed: 'Chưa trao được quà. Bạn thử lại nhé.',
    deliveredStale: 'Đã trao quà, chưa tải lại được dữ liệu mới.',
    deliveredDone: 'Đã trao quà.',
    rejectedDone: 'Đã từ chối, điểm đã hoàn lại.',
    reconcileMessage: 'Trạng thái trên máy chủ không khớp nên danh sách đã được tải lại.',
  },
  en: {
    stars: 'stars', days: 'days', todayDone: (count) => `Today: ${count} tasks completed`,
    pendingTasks: 'Tasks awaiting parent approval', noPendingTasks: 'No tasks currently need approval.',
    inboxTitle: 'Needs review — all children', inboxEmptyBody: 'When a child finishes a task that needs approval or asks for a reward, it appears here.',
    rewardCompleted: (points, date) => `Reward: +${points} ⭐ • Completed on ${date}`,
    pendingRewards: 'Reward requests from children', noPendingRewards: 'No reward requests are waiting.',
    redemptionRequested: (points, time) => `${points} ⭐ deducted • Requested at ${time}`,
    allChildrenScope: 'all children',
    approvedAwaitingDelivery: 'Approved, waiting for delivery.',
    deliveryUnfulfilled: 'Approved, but the gift could not be handed over.',
    deliveryFailed: 'The gift could not be handed over. Please try again.',
    deliveredStale: 'Gift handed over, but the fresh data has not loaded.',
    deliveredDone: 'Gift handed over.',
    rejectedDone: 'Rejected; the points were returned.',
    reconcileMessage: 'The server state did not match, so the list was reloaded.',
  },
  fr: {
    stars: 'étoiles', days: 'jours', todayDone: (count) => `Aujourd’hui : ${count} tâches terminées`,
    pendingTasks: 'Tâches en attente de validation', noPendingTasks: 'Aucune tâche ne nécessite de validation.',
    inboxTitle: 'À valider — tous les enfants', inboxEmptyBody: 'Quand un enfant termine une tâche à valider ou demande une récompense, cela apparaît ici.',
    rewardCompleted: (points, date) => `Récompense : +${points} ⭐ • Terminée le ${date}`,
    pendingRewards: 'Demandes de récompense des enfants', noPendingRewards: 'Aucune demande de récompense en attente.',
    redemptionRequested: (points, time) => `${points} ⭐ déduites • Demandée à ${time}`,
    allChildrenScope: 'tous les enfants',
    approvedAwaitingDelivery: 'Approuvée, en attente de remise.',
    deliveryUnfulfilled: 'Approuvée, mais le cadeau n’a pas pu être remis.',
    deliveryFailed: 'Le cadeau n’a pas pu être remis. Veuillez réessayer.',
    deliveredStale: 'Cadeau remis, mais les données fraîches ne se sont pas chargées.',
    deliveredDone: 'Cadeau remis.',
    rejectedDone: 'Refusée ; les points ont été rendus.',
    reconcileMessage: 'L’état du serveur ne correspondait pas, la liste a été rechargée.',
  },
  de: {
    stars: 'Sterne', days: 'Tage', todayDone: (count) => `Heute: ${count} Aufgaben erledigt`,
    pendingTasks: 'Aufgaben warten auf Bestätigung', noPendingTasks: 'Keine Aufgabe muss derzeit bestätigt werden.',
    inboxTitle: 'Zu prüfen — alle Kinder', inboxEmptyBody: 'Wenn ein Kind eine Aufgabe zur Bestätigung abschließt oder eine Belohnung anfragt, erscheint das hier.',
    rewardCompleted: (points, date) => `Belohnung: +${points} ⭐ • Erledigt am ${date}`,
    pendingRewards: 'Belohnungswünsche der Kinder', noPendingRewards: 'Keine Belohnungswünsche offen.',
    redemptionRequested: (points, time) => `${points} ⭐ abgezogen • Angefragt um ${time}`,
    allChildrenScope: 'alle Kinder',
    approvedAwaitingDelivery: 'Genehmigt, wartet auf Übergabe.',
    deliveryUnfulfilled: 'Genehmigt, aber das Geschenk konnte nicht übergeben werden.',
    deliveryFailed: 'Das Geschenk konnte nicht übergeben werden. Bitte versuchen Sie es erneut.',
    deliveredStale: 'Geschenk übergeben, aber die neuen Daten wurden nicht geladen.',
    deliveredDone: 'Geschenk übergeben.',
    rejectedDone: 'Abgelehnt; die Punkte wurden zurückerstattet.',
    reconcileMessage: 'Der Serverstand passte nicht, die Liste wurde neu geladen.',
  },
  it: {
    stars: 'stelle', days: 'giorni', todayDone: (count) => `Oggi: ${count} attività completate`,
    pendingTasks: 'Attività in attesa di approvazione', noPendingTasks: 'Nessuna attività richiede approvazione.',
    inboxTitle: 'Da approvare — tutti i bambini', inboxEmptyBody: 'Quando un bambino completa un’attività da approvare o chiede un premio, compare qui.',
    rewardCompleted: (points, date) => `Premio: +${points} ⭐ • Completata il ${date}`,
    pendingRewards: 'Richieste premio dei bambini', noPendingRewards: 'Nessuna richiesta premio in attesa.',
    redemptionRequested: (points, time) => `${points} ⭐ detratte • Richiesta alle ${time}`,
    allChildrenScope: 'tutti i bambini',
    approvedAwaitingDelivery: 'Approvata, in attesa di consegna.',
    deliveryUnfulfilled: 'Approvata, ma il regalo non è stato consegnato.',
    deliveryFailed: 'Non è stato possibile consegnare il regalo. Riprovi.',
    deliveredStale: 'Regalo consegnato, ma i dati aggiornati non sono stati caricati.',
    deliveredDone: 'Regalo consegnato.',
    rejectedDone: 'Rifiutata; i punti sono stati rimborsati.',
    reconcileMessage: 'Lo stato del server non corrispondeva, l’elenco è stato ricaricato.',
  },
  es: {
    stars: 'estrellas', days: 'días', todayDone: (count) => `Hoy: ${count} tareas completadas`,
    pendingTasks: 'Tareas pendientes de aprobación', noPendingTasks: 'No hay tareas que requieran aprobación.',
    inboxTitle: 'Por revisar — todos los niños', inboxEmptyBody: 'Cuando un niño termina una tarea que requiere aprobación o pide un premio, aparece aquí.',
    rewardCompleted: (points, date) => `Premio: +${points} ⭐ • Completada el ${date}`,
    pendingRewards: 'Solicitudes de premios de los niños', noPendingRewards: 'No hay solicitudes de premios pendientes.',
    redemptionRequested: (points, time) => `${points} ⭐ descontadas • Solicitado a las ${time}`,
    allChildrenScope: 'todos los niños',
    approvedAwaitingDelivery: 'Aprobada, pendiente de entrega.',
    deliveryUnfulfilled: 'Aprobada, pero el regalo no se pudo entregar.',
    deliveryFailed: 'No se pudo entregar el regalo. Inténtelo de nuevo.',
    deliveredStale: 'Regalo entregado, pero no se cargaron los datos actualizados.',
    deliveredDone: 'Regalo entregado.',
    rejectedDone: 'Rechazada; se devolvieron los puntos.',
    reconcileMessage: 'El estado del servidor no coincidía, se recargó la lista.',
  },
  zh: {
    stars: '星', days: '天', todayDone: (count) => `今天：已完成 ${count} 项任务`,
    pendingTasks: '等待家长确认的任务', noPendingTasks: '目前没有需要确认的任务。',
    inboxTitle: '待处理 — 所有孩子', inboxEmptyBody: '当孩子完成需要确认的任务或申请奖励时，会显示在这里。',
    rewardCompleted: (points, date) => `奖励：+${points} ⭐ • 完成于 ${date}`,
    pendingRewards: '孩子的奖励兑换申请', noPendingRewards: '目前没有待处理的奖励申请。',
    redemptionRequested: (points, time) => `已扣除 ${points} ⭐ • 申请时间 ${time}`,
    allChildrenScope: '所有孩子',
    approvedAwaitingDelivery: '已批准，等待发放。',
    deliveryUnfulfilled: '已批准，但礼物未能发放。',
    deliveryFailed: '礼物未能发放，请再试一次。',
    deliveredStale: '礼物已发放，但最新数据未能加载。',
    deliveredDone: '礼物已发放。',
    rejectedDone: '已拒绝，积分已退回。',
    reconcileMessage: '服务器状态不一致，已重新加载列表。',
  },
  ja: {
    stars: 'スター', days: '日', todayDone: (count) => `今日：${count}件完了`,
    pendingTasks: '保護者の承認待ちミッション', noPendingTasks: '現在、承認が必要なミッションはありません。',
    inboxTitle: '確認待ち — すべての子ども', inboxEmptyBody: '子どもが承認待ちのミッションを終えるか、ごほうびを申請すると、ここに表示されます。',
    rewardCompleted: (points, date) => `ごほうび：+${points} ⭐ • ${date}に完了`,
    pendingRewards: '子どもからのごほうび申請', noPendingRewards: '承認待ちのごほうび申請はありません。',
    redemptionRequested: (points, time) => `${points} ⭐を使用 • ${time}に申請`,
    allChildrenScope: 'すべての子ども',
    approvedAwaitingDelivery: '承認済み、渡すのを待っています。',
    deliveryUnfulfilled: '承認済みですが、ごほうびを渡せませんでした。',
    deliveryFailed: 'ごほうびを渡せませんでした。もう一度お試しください。',
    deliveredStale: 'ごほうびを渡しましたが、最新データを読み込めませんでした。',
    deliveredDone: 'ごほうびを渡しました。',
    rejectedDone: '却下しました。ポイントは返還済みです。',
    reconcileMessage: 'サーバーの状態が一致しなかったため、一覧を再読み込みしました。',
  },
  ko: {
    stars: '별', days: '일', todayDone: (count) => `오늘: ${count}개 완료`,
    pendingTasks: '부모 승인 대기 미션', noPendingTasks: '현재 승인할 미션이 없습니다.',
    inboxTitle: '확인 필요 — 모든 아이', inboxEmptyBody: '아이가 승인이 필요한 일을 마치거나 보상을 요청하면 여기에 표시돼요.',
    rewardCompleted: (points, date) => `보상: +${points} ⭐ • ${date} 완료`,
    pendingRewards: '아이의 보상 교환 요청', noPendingRewards: '대기 중인 보상 요청이 없습니다.',
    redemptionRequested: (points, time) => `${points} ⭐ 차감 • ${time} 요청`,
    allChildrenScope: '모든 아이',
    approvedAwaitingDelivery: '승인됨, 전달 대기 중.',
    deliveryUnfulfilled: '승인되었지만 선물을 전달하지 못했어요.',
    deliveryFailed: '선물을 전달하지 못했어요. 다시 시도해 주세요.',
    deliveredStale: '선물을 전달했지만 최신 데이터를 불러오지 못했어요.',
    deliveredDone: '선물을 전달했어요.',
    rejectedDone: '거절했어요. 포인트는 반환되었어요.',
    reconcileMessage: '서버 상태가 일치하지 않아 목록을 다시 불러왔어요.',
  },
};

import type { Language } from '@/types';

export type ParentActionsCopy = {
  readonly title: string;
  readonly nothing: string;
  readonly reviewTasks: (count: number) => string;
  readonly reviewRewards: (count: number) => string;
  readonly suggestions: (count: number) => string;
  readonly selectAll: string;
  readonly clearSelection: string;
  readonly selectedCount: (count: number, names: string) => string;
  readonly selectOne: (title: string, child: string) => string;
  readonly approveSelected: (count: number) => string;
  readonly rejectSelected: (count: number) => string;
  readonly reviewing: string;
  readonly reviewedApproved: (count: number) => string;
  readonly reviewedRejected: (count: number) => string;
  readonly reviewedSkipped: (count: number) => string;
  readonly reviewFailed: string;
  readonly limitNote: (limit: number) => string;
  readonly nextStep: (child: string, habit: string, program: string) => string;
  readonly addNextStep: string;
  readonly later: string;
  readonly nextStepStarted: string;
  readonly nextStepUnconfirmed: string;
};

const vi: ParentActionsCopy = {
  title: 'Cần bạn xử lý',
  nothing: 'Hiện không có việc nào cần ba mẹ xử lý.',
  reviewTasks: (count) => `Duyệt ${count} việc của bé`,
  reviewRewards: (count) => `Xem ${count} yêu cầu đổi quà`,
  suggestions: (count) => `Xem ${count} gợi ý điều chỉnh`,
  selectAll: 'Chọn tất cả',
  clearSelection: 'Bỏ chọn',
  selectedCount: (count, names) => `Đã chọn ${count} việc · ${names}`,
  selectOne: (title, child) => `Chọn “${title}” của ${child}`,
  approveSelected: (count) => `Duyệt ${count} việc`,
  rejectSelected: (count) => `Từ chối ${count} việc`,
  reviewing: 'Đang lưu…',
  reviewedApproved: (count) => `Đã duyệt ${count} việc.`,
  reviewedRejected: (count) => `Đã từ chối ${count} việc.`,
  reviewedSkipped: (count) => `${count} việc đã được xử lý trước đó nên được bỏ qua.`,
  reviewFailed: 'Chưa lưu được. Bạn thử lại nhé.',
  limitNote: (limit) => `Mỗi lần chọn tối đa ${limit} việc.`,
  nextStep: (child, habit, program) => `${child} đã quen các thói quen đầu của bộ “${program}”. Có thể thêm “${habit}” khi ba mẹ thấy sẵn sàng.`,
  addNextStep: 'Thêm bước tiếp theo',
  later: 'Để sau',
  nextStepStarted: 'Đã thêm bước tiếp theo.',
  nextStepUnconfirmed: 'Chưa xác nhận được việc thêm. Kiểm tra mục Quản lý việc trước khi thử lại.',
};

const en: ParentActionsCopy = {
  title: 'Needs you',
  nothing: 'Nothing needs you right now.',
  reviewTasks: (count) => `Review ${count} task${count === 1 ? '' : 's'}`,
  reviewRewards: (count) => `See ${count} reward request${count === 1 ? '' : 's'}`,
  suggestions: (count) => `See ${count} suggestion${count === 1 ? '' : 's'}`,
  selectAll: 'Select all',
  clearSelection: 'Clear selection',
  selectedCount: (count, names) => `${count} selected · ${names}`,
  selectOne: (title, child) => `Select “${title}” for ${child}`,
  approveSelected: (count) => `Approve ${count} task${count === 1 ? '' : 's'}`,
  rejectSelected: (count) => `Reject ${count} task${count === 1 ? '' : 's'}`,
  reviewing: 'Saving…',
  reviewedApproved: (count) => `Approved ${count} task${count === 1 ? '' : 's'}.`,
  reviewedRejected: (count) => `Rejected ${count} task${count === 1 ? '' : 's'}.`,
  reviewedSkipped: (count) => `${count} already handled earlier, so skipped.`,
  reviewFailed: 'Could not save. Please try again.',
  limitNote: (limit) => `Up to ${limit} tasks at a time.`,
  nextStep: (child, habit, program) => `${child} is comfortable with the first habits of “${program}”. You can add “${habit}” when you feel ready.`,
  addNextStep: 'Add the next step',
  later: 'Later',
  nextStepStarted: 'Added the next step.',
  nextStepUnconfirmed: 'Could not confirm the addition. Check Manage tasks before trying again.',
};

const fr: ParentActionsCopy = {
  title: 'À voir avec vous',
  nothing: 'Rien ne demande votre attention pour le moment.',
  reviewTasks: (count) => `Tâches : ${count}`,
  reviewRewards: (count) => `Demandes de récompense : ${count}`,
  suggestions: (count) => `Suggestions : ${count}`,
  selectAll: 'Tout sélectionner',
  clearSelection: 'Effacer la sélection',
  selectedCount: (count, names) => `${count} sélectionné(s) · ${names}`,
  selectOne: (title, child) => `Sélectionner « ${title} » pour ${child}`,
  approveSelected: (count) => `Approuver ${count} tâche(s)`,
  rejectSelected: (count) => `Refuser ${count} tâche(s)`,
  reviewing: 'Enregistrement…',
  reviewedApproved: (count) => `${count} tâche(s) approuvée(s).`,
  reviewedRejected: (count) => `${count} tâche(s) refusée(s).`,
  reviewedSkipped: (count) => `${count} déjà traitée(s), donc ignorée(s).`,
  reviewFailed: 'Enregistrement impossible. Veuillez réessayer.',
  limitNote: (limit) => `Jusqu’à ${limit} tâches à la fois.`,
  nextStep: (child, habit, program) => `${child} est à l’aise avec les premières habitudes de « ${program} ». Vous pouvez ajouter « ${habit} » quand vous vous sentirez prêt(e).`,
  addNextStep: 'Ajouter l’étape suivante',
  later: 'Plus tard',
  nextStepStarted: 'Étape suivante ajoutée.',
  nextStepUnconfirmed: 'Impossible de confirmer l’ajout. Vérifiez dans Gérer les tâches avant de réessayer.',
};

const de: ParentActionsCopy = {
  title: 'Erfordert Ihre Aufmerksamkeit',
  nothing: 'Im Moment gibt es nichts zu erledigen.',
  reviewTasks: (count) => `Aufgaben: ${count}`,
  reviewRewards: (count) => `Belohnungsanfragen: ${count}`,
  suggestions: (count) => `Vorschläge: ${count}`,
  selectAll: 'Alle auswählen',
  clearSelection: 'Auswahl aufheben',
  selectedCount: (count, names) => `${count} ausgewählt · ${names}`,
  selectOne: (title, child) => `„${title}“ für ${child} auswählen`,
  approveSelected: (count) => `${count} Aufgabe(n) genehmigen`,
  rejectSelected: (count) => `${count} Aufgabe(n) ablehnen`,
  reviewing: 'Wird gespeichert…',
  reviewedApproved: (count) => `${count} Aufgabe(n) genehmigt.`,
  reviewedRejected: (count) => `${count} Aufgabe(n) abgelehnt.`,
  reviewedSkipped: (count) => `${count} bereits erledigt und deshalb übersprungen.`,
  reviewFailed: 'Speichern nicht möglich. Bitte versuchen Sie es erneut.',
  limitNote: (limit) => `Bis zu ${limit} Aufgaben auf einmal.`,
  nextStep: (child, habit, program) => `${child} kommt mit den ersten Gewohnheiten aus „${program}“ gut zurecht. Sie können „${habit}“ hinzufügen, wenn es sich für Sie richtig anfühlt.`,
  addNextStep: 'Nächsten Schritt hinzufügen',
  later: 'Später',
  nextStepStarted: 'Nächster Schritt hinzugefügt.',
  nextStepUnconfirmed: 'Das Hinzufügen konnte nicht bestätigt werden. Prüfen Sie „Aufgaben verwalten“, bevor Sie es erneut versuchen.',
};

const it: ParentActionsCopy = {
  title: 'Da controllare',
  nothing: 'Al momento non c’è nulla da fare.',
  reviewTasks: (count) => `Attività: ${count}`,
  reviewRewards: (count) => `Richieste premio: ${count}`,
  suggestions: (count) => `Suggerimenti: ${count}`,
  selectAll: 'Selezioni tutto',
  clearSelection: 'Annulli la selezione',
  selectedCount: (count, names) => `${count} selezionati · ${names}`,
  selectOne: (title, child) => `Selezioni “${title}” per ${child}`,
  approveSelected: (count) => `Approvi ${count} attività`,
  rejectSelected: (count) => `Rifiuti ${count} attività`,
  reviewing: 'Salvataggio…',
  reviewedApproved: (count) => `${count} attività approvate.`,
  reviewedRejected: (count) => `${count} attività rifiutate.`,
  reviewedSkipped: (count) => `${count} già gestite in precedenza, quindi ignorate.`,
  reviewFailed: 'Impossibile salvare. Riprovi.',
  limitNote: (limit) => `Fino a ${limit} attività alla volta.`,
  nextStep: (child, habit, program) => `${child} ha preso confidenza con le prime abitudini di “${program}”. Può aggiungere “${habit}” quando si sente pronto.`,
  addNextStep: 'Aggiunga il prossimo passo',
  later: 'Più tardi',
  nextStepStarted: 'Prossimo passo aggiunto.',
  nextStepUnconfirmed: 'Non è stato possibile confermare l’aggiunta. Controlli Gestisci attività prima di riprovare.',
};

const es: ParentActionsCopy = {
  title: 'Pendiente de su atención',
  nothing: 'Ahora mismo no hay nada pendiente.',
  reviewTasks: (count) => `Tareas: ${count}`,
  reviewRewards: (count) => `Solicitudes de recompensa: ${count}`,
  suggestions: (count) => `Sugerencias: ${count}`,
  selectAll: 'Seleccionar todo',
  clearSelection: 'Borrar selección',
  selectedCount: (count, names) => `${count} seleccionadas · ${names}`,
  selectOne: (title, child) => `Seleccione «${title}» para ${child}`,
  approveSelected: (count) => `Apruebe ${count} tareas`,
  rejectSelected: (count) => `Rechace ${count} tareas`,
  reviewing: 'Guardando…',
  reviewedApproved: (count) => `${count} tareas aprobadas.`,
  reviewedRejected: (count) => `${count} tareas rechazadas.`,
  reviewedSkipped: (count) => `${count} ya se habían gestionado y se omitieron.`,
  reviewFailed: 'No se pudo guardar. Inténtelo de nuevo.',
  limitNote: (limit) => `Hasta ${limit} tareas cada vez.`,
  nextStep: (child, habit, program) => `${child} ya se maneja bien con los primeros hábitos de «${program}». Puede añadir «${habit}» cuando le parezca bien.`,
  addNextStep: 'Añada el siguiente paso',
  later: 'Más tarde',
  nextStepStarted: 'Siguiente paso añadido.',
  nextStepUnconfirmed: 'No se pudo confirmar que se añadiera. Revise Gestionar tareas antes de intentarlo otra vez.',
};

const zh: ParentActionsCopy = {
  title: '需要你处理',
  nothing: '目前没有需要处理的事项。',
  reviewTasks: (count) => `任务：${count}`,
  reviewRewards: (count) => `奖励兑换请求：${count}`,
  suggestions: (count) => `调整建议：${count}`,
  selectAll: '全选',
  clearSelection: '清除选择',
  selectedCount: (count, names) => `已选 ${count} 项 · ${names}`,
  selectOne: (title, child) => `为${child}选择“${title}”`,
  approveSelected: (count) => `批准 ${count} 项任务`,
  rejectSelected: (count) => `拒绝 ${count} 项任务`,
  reviewing: '正在保存…',
  reviewedApproved: (count) => `已批准 ${count} 项任务。`,
  reviewedRejected: (count) => `已拒绝 ${count} 项任务。`,
  reviewedSkipped: (count) => `${count} 项之前已处理，因此已跳过。`,
  reviewFailed: '无法保存，请再试一次。',
  limitNote: (limit) => `每次最多选择 ${limit} 项任务。`,
  nextStep: (child, habit, program) => `${child}已经熟悉“${program}”中的前几项习惯。你觉得合适时，可以添加“${habit}”。`,
  addNextStep: '添加下一步',
  later: '稍后',
  nextStepStarted: '已添加下一步。',
  nextStepUnconfirmed: '无法确认是否添加成功。请先检查“管理任务”，再重试。',
};

const ja: ParentActionsCopy = {
  title: '確認してください',
  nothing: '今、対応が必要なものはありません。',
  reviewTasks: (count) => `タスク：${count}件`,
  reviewRewards: (count) => `ごほうびのリクエスト：${count}件`,
  suggestions: (count) => `調整の提案：${count}件`,
  selectAll: 'すべて選択',
  clearSelection: '選択を解除',
  selectedCount: (count, names) => `${count}件を選択中 · ${names}`,
  selectOne: (title, child) => `${child}の「${title}」を選択`,
  approveSelected: (count) => `${count}件のタスクを承認`,
  rejectSelected: (count) => `${count}件のタスクを却下`,
  reviewing: '保存中…',
  reviewedApproved: (count) => `${count}件のタスクを承認しました。`,
  reviewedRejected: (count) => `${count}件のタスクを却下しました。`,
  reviewedSkipped: (count) => `${count}件はすでに対応済みのため、スキップしました。`,
  reviewFailed: '保存できませんでした。もう一度お試しください。',
  limitNote: (limit) => `一度に選択できるタスクは${limit}件までです。`,
  nextStep: (child, habit, program) => `${child}は「${program}」の最初の習慣に慣れてきました。よいと思うタイミングで「${habit}」を追加できます。`,
  addNextStep: '次のステップを追加',
  later: 'あとで',
  nextStepStarted: '次のステップを追加しました。',
  nextStepUnconfirmed: '追加できたか確認できませんでした。もう一度試す前に「タスクを管理」を確認してください。',
};

const ko: ParentActionsCopy = {
  title: '확인이 필요해요',
  nothing: '지금은 확인할 항목이 없어요.',
  reviewTasks: (count) => `할 일: ${count}개`,
  reviewRewards: (count) => `보상 요청: ${count}개`,
  suggestions: (count) => `조정 제안: ${count}개`,
  selectAll: '모두 선택',
  clearSelection: '선택 해제',
  selectedCount: (count, names) => `${count}개 선택됨 · ${names}`,
  selectOne: (title, child) => `${child}의 “${title}” 선택`,
  approveSelected: (count) => `할 일 ${count}개 승인`,
  rejectSelected: (count) => `할 일 ${count}개 거절`,
  reviewing: '저장 중…',
  reviewedApproved: (count) => `할 일 ${count}개를 승인했어요.`,
  reviewedRejected: (count) => `할 일 ${count}개를 거절했어요.`,
  reviewedSkipped: (count) => `이미 처리된 ${count}개는 건너뛰었어요.`,
  reviewFailed: '저장하지 못했어요. 다시 시도해 주세요.',
  limitNote: (limit) => `한 번에 최대 ${limit}개까지 선택할 수 있어요.`,
  nextStep: (child, habit, program) => `${child}가 “${program}”의 첫 습관들에 익숙해졌어요. 준비됐다고 느낄 때 “${habit}”을 추가할 수 있어요.`,
  addNextStep: '다음 단계 추가',
  later: '나중에',
  nextStepStarted: '다음 단계를 추가했어요.',
  nextStepUnconfirmed: '추가 여부를 확인할 수 없어요. 다시 시도하기 전에 할 일 관리에서 확인해 주세요.',
};

const COPY: Record<Language, ParentActionsCopy> = { vi, en, fr, de, it, es, zh, ja, ko };

export function getParentActionsCopy(language: Language): ParentActionsCopy {
  return COPY[language];
}

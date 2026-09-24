import type { Language } from '@/types';

type JourneyMapCopy = {
  readonly current: string;
  readonly next: string;
  readonly complete: string;
  readonly available: string;
  readonly allDone: string;
  readonly selectChild: string;
  readonly noChild: string;
  readonly alreadyApplied: string;
  readonly assigned: (done: number, total: number) => string;
  readonly practiced: (done: number, total: number) => string;
  readonly applyRemaining: (count: number) => string;
};

export const journeyMapCopy: Record<Language, JourneyMapCopy> = {
  vi: { current: 'Đang thực hành', next: 'Tiếp theo', complete: 'Đã hoàn thành', available: 'Chưa bắt đầu', allDone: 'Đã đi hết lộ trình', selectChild: 'Xem hành trình của bé', noChild: 'Thêm hồ sơ bé để theo dõi hành trình.', alreadyApplied: 'Các việc trong chặng này đã có trong lịch của bé.', assigned: (done, total) => `Đã thêm ${done}/${total} việc`, practiced: (done, total) => `Đã thực hành ${done}/${total} việc`, applyRemaining: (count) => `Thêm ${count} việc còn lại` },
  en: { current: 'In progress', next: 'Up next', complete: 'Completed', available: 'Not started', allDone: 'Journey completed', selectChild: "View child's journey", noChild: 'Add a child profile to follow their journey.', alreadyApplied: 'All habits in this stage are already on the schedule.', assigned: (done, total) => `${done}/${total} habits added`, practiced: (done, total) => `${done}/${total} habits practiced`, applyRemaining: (count) => `Add ${count} remaining habits` },
  fr: { current: 'En cours', next: 'À suivre', complete: 'Terminé', available: 'Pas commencé', allDone: 'Parcours terminé', selectChild: "Voir le parcours de l’enfant", noChild: 'Ajoutez un profil enfant pour suivre son parcours.', alreadyApplied: 'Toutes les habitudes de cette étape sont déjà au programme.', assigned: (done, total) => `${done}/${total} habitudes ajoutées`, practiced: (done, total) => `${done}/${total} habitudes pratiquées`, applyRemaining: (count) => `Ajouter ${count} habitudes restantes` },
  de: { current: 'In Arbeit', next: 'Als Nächstes', complete: 'Abgeschlossen', available: 'Noch nicht begonnen', allDone: 'Reise abgeschlossen', selectChild: 'Reise des Kindes ansehen', noChild: 'Füge ein Kinderprofil hinzu, um die Reise zu verfolgen.', alreadyApplied: 'Alle Gewohnheiten dieser Stufe stehen bereits im Plan.', assigned: (done, total) => `${done}/${total} Gewohnheiten hinzugefügt`, practiced: (done, total) => `${done}/${total} Gewohnheiten geübt`, applyRemaining: (count) => `${count} übrige Gewohnheiten hinzufügen` },
  it: { current: 'In corso', next: 'Prossima tappa', complete: 'Completato', available: 'Da iniziare', allDone: 'Percorso completato', selectChild: 'Vedi il percorso del bambino', noChild: 'Aggiungi un profilo bambino per seguire il percorso.', alreadyApplied: 'Tutte le abitudini di questa tappa sono già nel programma.', assigned: (done, total) => `${done}/${total} abitudini aggiunte`, practiced: (done, total) => `${done}/${total} abitudini praticate`, applyRemaining: (count) => `Aggiungi ${count} abitudini restanti` },
  es: { current: 'En curso', next: 'A continuación', complete: 'Completado', available: 'Sin empezar', allDone: 'Recorrido completado', selectChild: 'Ver el recorrido del niño', noChild: 'Añade un perfil infantil para seguir su recorrido.', alreadyApplied: 'Todos los hábitos de esta etapa ya están en el horario.', assigned: (done, total) => `${done}/${total} hábitos añadidos`, practiced: (done, total) => `${done}/${total} hábitos practicados`, applyRemaining: (count) => `Añadir ${count} hábitos restantes` },
  zh: { current: '正在练习', next: '下一阶段', complete: '已完成', available: '尚未开始', allDone: '已完成整个旅程', selectChild: '查看孩子的旅程', noChild: '添加孩子档案后即可跟踪成长旅程。', alreadyApplied: '本阶段的习惯已全部加入日程。', assigned: (done, total) => `已加入 ${done}/${total} 项习惯`, practiced: (done, total) => `已练习 ${done}/${total} 项习惯`, applyRemaining: (count) => `加入剩余 ${count} 项习惯` },
  ja: { current: '取り組み中', next: '次のステージ', complete: '完了', available: '未開始', allDone: 'すべて完了', selectChild: 'お子さまの進み具合', noChild: 'お子さまのプロフィールを追加すると進み具合を確認できます。', alreadyApplied: 'この段階の習慣はすべて予定に入っています。', assigned: (done, total) => `${done}/${total}個を追加済み`, practiced: (done, total) => `${done}/${total}個を実践済み`, applyRemaining: (count) => `残り${count}個を追加` },
  ko: { current: '실천 중', next: '다음 단계', complete: '완료', available: '시작 전', allDone: '여정 완료', selectChild: '아이의 여정 보기', noChild: '아이 프로필을 추가하면 여정을 확인할 수 있어요.', alreadyApplied: '이 단계의 습관은 모두 일정에 등록되어 있어요.', assigned: (done, total) => `${done}/${total}개 습관 등록`, practiced: (done, total) => `${done}/${total}개 습관 실천`, applyRemaining: (count) => `남은 ${count}개 습관 추가` },
};

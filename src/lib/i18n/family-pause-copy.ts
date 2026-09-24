import type { Language } from '@/types';

type FamilyPauseCopy = {
  readonly title: string;
  readonly active: string;
  readonly paused: string;
  readonly pause: string;
  readonly resume: string;
  readonly confirmPause: string;
  readonly confirmResume: string;
  readonly cancel: string;
  readonly error: string;
  readonly childMessage: string;
};

export const familyPauseCopy: Record<Language, FamilyPauseCopy> = {
  vi: { title: 'Nhịp nghỉ của gia đình', active: 'Các việc tốt vẫn diễn ra theo lịch.', paused: 'Gia đình đang nghỉ. Việc tốt và phần thưởng vẫn được giữ nguyên.', pause: 'Tạm nghỉ', resume: 'Tiếp tục', confirmPause: 'Tạm dừng nhắc tiến độ và chuỗi ngày? Bé vẫn có thể làm việc tốt, không mất nhiệm vụ hay phần thưởng.', confirmResume: 'Tiếp tục hiển thị tiến độ và chuỗi ngày?', cancel: 'Để sau', error: 'Chưa lưu được. Vui lòng thử lại.', childMessage: 'Hôm nay gia đình mình nghỉ ngơi. Con có thể làm việc tốt khi muốn.' },
  en: { title: 'Family pause', active: 'Good habits continue on schedule.', paused: 'Your family is taking a break. Habits and rewards remain in place.', pause: 'Take a break', resume: 'Resume', confirmPause: 'Pause progress and streak prompts? Your child can still do habits, and nothing will be deleted.', confirmResume: 'Show progress and streak prompts again?', cancel: 'Not now', error: 'Could not save. Please try again.', childMessage: 'Our family is taking a break today. You can still do a good habit whenever you want.' },
  fr: { title: 'Pause familiale', active: 'Les bonnes habitudes suivent leur programme.', paused: 'Votre famille fait une pause. Les habitudes et récompenses restent en place.', pause: 'Faire une pause', resume: 'Reprendre', confirmPause: 'Mettre en pause les rappels de progression et de série ? Rien ne sera supprimé.', confirmResume: 'Afficher à nouveau la progression et la série ?', cancel: 'Plus tard', error: 'Enregistrement impossible. Réessayez.', childMessage: 'Notre famille fait une pause aujourd’hui. Tu peux toujours faire une bonne action.' },
  de: { title: 'Familienpause', active: 'Gute Gewohnheiten laufen nach Plan.', paused: 'Eure Familie macht eine Pause. Aufgaben und Belohnungen bleiben erhalten.', pause: 'Pause machen', resume: 'Fortsetzen', confirmPause: 'Fortschritts- und Serienhinweise pausieren? Nichts wird gelöscht.', confirmResume: 'Fortschritt und Serien wieder anzeigen?', cancel: 'Später', error: 'Speichern nicht möglich. Bitte erneut versuchen.', childMessage: 'Unsere Familie macht heute eine Pause. Du kannst trotzdem etwas Gutes tun.' },
  it: { title: 'Pausa in famiglia', active: 'Le buone abitudini seguono il programma.', paused: 'La famiglia è in pausa. Attività e premi restano disponibili.', pause: 'Fai una pausa', resume: 'Riprendi', confirmPause: 'Mettere in pausa progressi e serie? Non verrà eliminato nulla.', confirmResume: 'Mostrare di nuovo progressi e serie?', cancel: 'Più tardi', error: 'Impossibile salvare. Riprova.', childMessage: 'Oggi la famiglia si prende una pausa. Puoi comunque fare una buona azione.' },
  es: { title: 'Pausa familiar', active: 'Los buenos hábitos siguen el programa.', paused: 'La familia está descansando. Las tareas y recompensas permanecen.', pause: 'Tomar un descanso', resume: 'Reanudar', confirmPause: '¿Pausar los avisos de progreso y racha? No se borrará nada.', confirmResume: '¿Volver a mostrar el progreso y la racha?', cancel: 'Más tarde', error: 'No se pudo guardar. Inténtalo de nuevo.', childMessage: 'Hoy nuestra familia descansa. Aun así puedes hacer algo bueno.' },
  zh: { title: '家庭休息', active: '好习惯按计划继续。', paused: '全家正在休息，任务和奖励都会保留。', pause: '暂时休息', resume: '继续', confirmPause: '暂停进度和连续打卡提示吗？任务与奖励不会被删除。', confirmResume: '重新显示进度和连续打卡提示吗？', cancel: '稍后', error: '保存失败，请重试。', childMessage: '今天全家休息一下。想做一件好事时，随时都可以。' },
  ja: { title: '家族のお休み', active: 'よい習慣は予定どおり続いています。', paused: '家族はお休み中です。習慣とごほうびは残ります。', pause: 'お休みする', resume: '再開する', confirmPause: '進捗と連続日数の表示を休みますか？習慣やごほうびは消えません。', confirmResume: '進捗と連続日数をもう一度表示しますか？', cancel: 'あとで', error: '保存できませんでした。もう一度お試しください。', childMessage: '今日は家族でひと休み。やりたいときには、よいことをしてもいいよ。' },
  ko: { title: '가족 휴식', active: '좋은 습관은 일정대로 이어집니다.', paused: '가족이 쉬는 중입니다. 활동과 보상은 그대로 남습니다.', pause: '잠시 쉬기', resume: '다시 시작', confirmPause: '진행 상황과 연속 기록 알림을 잠시 멈출까요? 활동과 보상은 삭제되지 않습니다.', confirmResume: '진행 상황과 연속 기록을 다시 보여줄까요?', cancel: '나중에', error: '저장하지 못했습니다. 다시 시도해 주세요.', childMessage: '오늘은 가족이 쉬는 날이에요. 하고 싶을 때 좋은 일을 해도 좋아요.' },
};

import type { Language } from '@/types';
import type { HabitStatus } from '@/lib/habit-programs/status';
import type { CompetenceMilestone } from '@/lib/habit-programs/competence';

export type IndependenceCopy = {
  readonly status: Readonly<Record<HabitStatus, string>>;
  readonly trendTitle: string;
  readonly trendEasing: string;
  readonly trendNotEnough: string;
  readonly trendWeek: (start: string) => string;
  readonly legend: { readonly alone: string; readonly prompted: string; readonly together: string; readonly unknown: string; readonly missed: string };
  readonly readyToGraduate: (child: string, habit: string) => string;
  readonly graduate: string;
  readonly reduceStars: (from: number, to: number) => string;
  readonly keepAsIs: string;
  readonly graduatedNotice: (habit: string) => string;
  readonly starsReduced: (habit: string, to: number) => string;
  readonly undo: string;
  readonly failed: string;
  readonly recheck: (child: string, habit: string) => string;
  readonly stillAlone: string;
  readonly bringBack: string;
  readonly graduatedTitle: string;
  readonly graduatedEmpty: string;
  readonly graduatedSince: (date: string) => string;
  readonly restoreStars: (to: number) => string;
  readonly rhythm: (done: number, of: number) => string;
  readonly rhythmNote: string;
  readonly newDay: string;
  readonly kidGraduatedTitle: string;
  readonly kidGraduatedBody: string;
  readonly kidPracticeTitle: string;
  readonly milestone: Readonly<Record<CompetenceMilestone, (habit: string) => string>>;
};

const vi: IndependenceCopy = {
  status: { 'not-started': 'Chưa bắt đầu', forming: 'Đang hình thành', 'needs-help': 'Cần hỗ trợ', steady: 'Đang ổn định' },
  trendTitle: 'Mức hỗ trợ 6 tuần gần đây',
  trendEasing: 'Mức hỗ trợ đang giảm: bé tự làm nhiều hơn so với đầu kỳ.',
  trendNotEnough: 'Chưa đủ dữ liệu để nói.',
  trendWeek: (start) => `Tuần ${start}`,
  legend: { alone: 'Tự làm', prompted: 'Cần nhắc', together: 'Làm cùng', unknown: 'Chưa ghi', missed: 'Chưa làm' },
  readyToGraduate: (child, habit) => `${child} đã tự làm “${habit}” đều đặn nhiều tuần. Ba mẹ có thể cho thói quen này tốt nghiệp, hoặc giữ nguyên.`,
  graduate: 'Tốt nghiệp',
  reduceStars: (from, to) => `Giảm sao (${from} → ${to})`,
  keepAsIs: 'Giữ nguyên',
  graduatedNotice: (habit) => `Đã cho “${habit}” tốt nghiệp. Bé vẫn thấy nó trong mục “Con đã làm được”.`,
  starsReduced: (habit, to) => `“${habit}” giờ thưởng ${to} sao cho các lần sau.`,
  undo: 'Hoàn tác',
  failed: 'Chưa lưu được. Bạn thử lại nhé.',
  recheck: (child, habit) => `Con vẫn tự làm “${habit}” chứ? (${child})`,
  stillAlone: 'Vẫn tự làm',
  bringBack: 'Cần đưa lại',
  graduatedTitle: 'Con đã làm được',
  graduatedEmpty: 'Chưa có thói quen nào tốt nghiệp.',
  graduatedSince: (date) => `từ ${date}`,
  restoreStars: (to) => `Trả lại ${to} sao`,
  rhythm: (done, of) => `${done}/${of} ngày tuần này`,
  rhythmNote: 'Nhịp đều quan trọng hơn chuỗi: lỡ một ngày không mất gì.',
  newDay: 'Ngày mới, mình làm tiếp nhé!',
  kidGraduatedTitle: 'Con đã làm được!',
  kidGraduatedBody: 'Những việc con làm đều đến mức không cần nhắc nữa.',
  kidPracticeTitle: 'Việc con đang tập',
  milestone: {
    'first-alone': (habit) => `Lần đầu con tự làm “${habit}”! Con làm được rồi.`,
    'three-alone': (habit) => `Con đã tự làm “${habit}” 3 lần. Con thật giỏi!`,
    'seven-in-a-row': (habit) => `7 lần liền con tự làm “${habit}”. Con tự làm được rồi!`,
    'two-weeks-unprompted': (habit) => `Hai tuần nay con không cần nhắc “${habit}”. Con thật đáng tự hào!`,
  },
};

const en: IndependenceCopy = {
  status: { 'not-started': 'Not started', forming: 'Taking shape', 'needs-help': 'Needs support', steady: 'Steady' },
  trendTitle: 'Support over the last 6 weeks',
  trendEasing: 'Support is easing: your child does it alone more than at the start.',
  trendNotEnough: 'Not enough data to say yet.',
  trendWeek: (start) => `Week of ${start}`,
  legend: { alone: 'Alone', prompted: 'With a reminder', together: 'Together', unknown: 'Not recorded', missed: 'Not done' },
  readyToGraduate: (child, habit) => `${child} has done “${habit}” alone steadily for several weeks. You can let this habit graduate, or keep it as it is.`,
  graduate: 'Graduate',
  reduceStars: (from, to) => `Lower stars (${from} → ${to})`,
  keepAsIs: 'Keep as is',
  graduatedNotice: (habit) => `“${habit}” has graduated. Your child still sees it under “What I can do”.`,
  starsReduced: (habit, to) => `“${habit}” now gives ${to} stars from the next time.`,
  undo: 'Undo',
  failed: 'Could not save. Please try again.',
  recheck: (child, habit) => `Does your child still do “${habit}” alone? (${child})`,
  stillAlone: 'Still alone',
  bringBack: 'Bring it back',
  graduatedTitle: 'What I can do',
  graduatedEmpty: 'No habit has graduated yet.',
  graduatedSince: (date) => `since ${date}`,
  restoreStars: (to) => `Restore ${to} stars`,
  rhythm: (done, of) => `${done}/${of} days this week`,
  rhythmNote: 'A steady rhythm matters more than a streak: missing a day costs nothing.',
  newDay: 'A new day, let’s keep going!',
  kidGraduatedTitle: 'What I can do!',
  kidGraduatedBody: 'Things you do so steadily that nobody needs to remind you any more.',
  kidPracticeTitle: 'What I’m practising',
  milestone: {
    'first-alone': (habit) => `The first time you did “${habit}” on your own! You did it.`,
    'three-alone': (habit) => `You did “${habit}” on your own 3 times. Well done!`,
    'seven-in-a-row': (habit) => `7 times in a row you did “${habit}” on your own. You can do it!`,
    'two-weeks-unprompted': (habit) => `Two weeks without a reminder for “${habit}”. Be proud!`,
  },
};

const fr: IndependenceCopy = {
  status: { 'not-started': 'Pas commencé', forming: 'En cours', 'needs-help': 'A besoin de soutien', steady: 'Régulier' },
  trendTitle: 'Soutien au cours des 6 dernières semaines',
  trendEasing: 'Le soutien diminue : votre enfant fait davantage les choses seul qu’au début.',
  trendNotEnough: 'Pas encore assez de données pour le dire.',
  trendWeek: (start) => `Semaine du ${start}`,
  legend: { alone: 'Seul(e)', prompted: 'Avec un rappel', together: 'Ensemble', unknown: 'Non renseigné', missed: 'Non fait' },
  readyToGraduate: (child, habit) => `${child} fait « ${habit} » seul(e) régulièrement depuis plusieurs semaines. Vous pouvez considérer cette habitude comme acquise ou la garder telle quelle.`,
  graduate: 'Valider',
  reduceStars: (from, to) => `Réduire les étoiles (${from} → ${to})`,
  keepAsIs: 'Garder telle quelle',
  graduatedNotice: (habit) => `« ${habit} » est validée. Votre enfant la retrouve dans « Ce que je sais faire ».`,
  starsReduced: (habit, to) => `« ${habit} » rapportera ${to} étoiles à partir de la prochaine fois.`,
  undo: 'Annuler',
  failed: 'Enregistrement impossible. Veuillez réessayer.',
  recheck: (child, habit) => `${child} fait-il/elle toujours « ${habit} » seul(e) ?`,
  stillAlone: 'Toujours seul(e)',
  bringBack: 'Réactiver',
  graduatedTitle: 'Habitudes acquises',
  graduatedEmpty: 'Aucune habitude acquise pour le moment.',
  graduatedSince: (date) => `depuis ${date}`,
  restoreStars: (to) => `Rétablir ${to} étoiles`,
  rhythm: (done, of) => `${done}/${of} jours cette semaine`,
  rhythmNote: 'La régularité compte plus qu’une série : manquer un jour ne vous fait rien perdre.',
  newDay: 'Un nouveau jour, continue !',
  kidGraduatedTitle: 'Ce que je sais faire !',
  kidGraduatedBody: 'Les choses que tu fais si régulièrement qu’on n’a plus besoin de te les rappeler.',
  kidPracticeTitle: 'Ce que je m’entraîne à faire',
  milestone: {
    'first-alone': (habit) => `Tu as fait « ${habit} » tout(e) seul(e) pour la première fois ! Bravo.`,
    'three-alone': (habit) => `Tu as fait « ${habit} » tout(e) seul(e) 3 fois. Bravo !`,
    'seven-in-a-row': (habit) => `Tu as fait « ${habit} » tout(e) seul(e) 7 fois de suite. Tu y arrives !`,
    'two-weeks-unprompted': (habit) => `Deux semaines sans rappel pour « ${habit} ». Tu peux être fier/fière !`,
  },
};

const de: IndependenceCopy = {
  status: { 'not-started': 'Noch nicht begonnen', forming: 'Entwickelt sich', 'needs-help': 'Braucht Unterstützung', steady: 'Regelmäßig' },
  trendTitle: 'Unterstützung in den letzten 6 Wochen',
  trendEasing: 'Es wird weniger Unterstützung gebraucht: Ihr Kind erledigt mehr allein als am Anfang.',
  trendNotEnough: 'Dafür gibt es noch nicht genug Daten.',
  trendWeek: (start) => `Woche ab ${start}`,
  legend: { alone: 'Allein', prompted: 'Mit Erinnerung', together: 'Gemeinsam', unknown: 'Nicht erfasst', missed: 'Nicht erledigt' },
  readyToGraduate: (child, habit) => `${child} erledigt „${habit}“ seit mehreren Wochen regelmäßig allein. Sie können die Gewohnheit abschließen oder so lassen, wie sie ist.`,
  graduate: 'Abschließen',
  reduceStars: (from, to) => `Sterne reduzieren (${from} → ${to})`,
  keepAsIs: 'So lassen',
  graduatedNotice: (habit) => `„${habit}“ ist abgeschlossen. Ihr Kind sieht es weiterhin unter „Das kann ich schon“.`,
  starsReduced: (habit, to) => `Für „${habit}“ gibt es ab dem nächsten Mal ${to} Sterne.`,
  undo: 'Rückgängig',
  failed: 'Speichern nicht möglich. Bitte versuchen Sie es erneut.',
  recheck: (child, habit) => `Erledigt ${child} „${habit}“ weiterhin allein?`,
  stillAlone: 'Weiterhin allein',
  bringBack: 'Wieder aufnehmen',
  graduatedTitle: 'Das kann ich schon',
  graduatedEmpty: 'Noch keine Gewohnheit abgeschlossen.',
  graduatedSince: (date) => `seit ${date}`,
  restoreStars: (to) => `${to} Sterne wiederherstellen`,
  rhythm: (done, of) => `${done}/${of} Tage diese Woche`,
  rhythmNote: 'Ein regelmäßiger Rhythmus zählt mehr als eine Serie: Ein ausgelassener Tag kostet Sie nichts.',
  newDay: 'Ein neuer Tag, wir machen weiter!',
  kidGraduatedTitle: 'Das kann ich schon!',
  kidGraduatedBody: 'Dinge, die du so regelmäßig machst, dass dich niemand mehr daran erinnern muss.',
  kidPracticeTitle: 'Das übe ich gerade',
  milestone: {
    'first-alone': (habit) => `Zum ersten Mal hast du „${habit}“ allein gemacht! Das hast du geschafft.`,
    'three-alone': (habit) => `Du hast „${habit}“ 3-mal allein gemacht. Gut gemacht!`,
    'seven-in-a-row': (habit) => `7-mal hintereinander hast du „${habit}“ allein gemacht. Du schaffst das!`,
    'two-weeks-unprompted': (habit) => `Zwei Wochen ohne Erinnerung an „${habit}“. Darauf kannst du stolz sein!`,
  },
};

const it: IndependenceCopy = {
  status: { 'not-started': 'Non iniziata', forming: 'In via di sviluppo', 'needs-help': 'Ha bisogno di supporto', steady: 'Costante' },
  trendTitle: 'Supporto nelle ultime 6 settimane',
  trendEasing: 'Serve meno supporto: rispetto all’inizio, suo figlio fa più cose da solo.',
  trendNotEnough: 'Non ci sono ancora dati sufficienti per dirlo.',
  trendWeek: (start) => `Settimana del ${start}`,
  legend: { alone: 'Da solo', prompted: 'Con un promemoria', together: 'Insieme', unknown: 'Non registrato', missed: 'Non fatto' },
  readyToGraduate: (child, habit) => `${child} fa “${habit}” da solo con regolarità da diverse settimane. Può considerare conclusa questa abitudine oppure lasciarla così.`,
  graduate: 'Concludi',
  reduceStars: (from, to) => `Riduci le stelle (${from} → ${to})`,
  keepAsIs: 'Lascia così',
  graduatedNotice: (habit) => `“${habit}” è completata. Suo figlio la trova ancora in “Cose che so fare”.`,
  starsReduced: (habit, to) => `Da ora “${habit}” dà ${to} stelle a partire dalla prossima volta.`,
  undo: 'Annulla',
  failed: 'Impossibile salvare. Riprovi.',
  recheck: (child, habit) => `${child} fa ancora “${habit}” da solo?`,
  stillAlone: 'Ancora da solo',
  bringBack: 'Riattiva',
  graduatedTitle: 'Abitudini consolidate',
  graduatedEmpty: 'Nessuna abitudine consolidata per ora.',
  graduatedSince: (date) => `dal ${date}`,
  restoreStars: (to) => `Ripristina ${to} stelle`,
  rhythm: (done, of) => `${done}/${of} giorni questa settimana`,
  rhythmNote: 'La regolarità conta più di una serie: saltare un giorno non le fa perdere nulla.',
  newDay: 'Un nuovo giorno, continuiamo!',
  kidGraduatedTitle: 'Cose che so fare!',
  kidGraduatedBody: 'Cose che fai con tanta regolarità che nessuno deve più ricordartele.',
  kidPracticeTitle: 'Cosa sto imparando',
  milestone: {
    'first-alone': (habit) => `La prima volta che fai “${habit}” da solo! Ci sei riuscito.`,
    'three-alone': (habit) => `Hai fatto “${habit}” da solo 3 volte. Ben fatto!`,
    'seven-in-a-row': (habit) => `Hai fatto “${habit}” da solo 7 volte di fila. Puoi farcela!`,
    'two-weeks-unprompted': (habit) => `Due settimane senza promemoria per “${habit}”. Puoi esserne fiero!`,
  },
};

const es: IndependenceCopy = {
  status: { 'not-started': 'Sin empezar', forming: 'En desarrollo', 'needs-help': 'Necesita apoyo', steady: 'Constante' },
  trendTitle: 'Apoyo durante las últimas 6 semanas',
  trendEasing: 'Necesita menos apoyo: ahora su hijo hace más cosas por su cuenta que al principio.',
  trendNotEnough: 'Aún no hay datos suficientes para saberlo.',
  trendWeek: (start) => `Semana del ${start}`,
  legend: { alone: 'A solas', prompted: 'Con un recordatorio', together: 'Juntos', unknown: 'Sin registrar', missed: 'Sin hacer' },
  readyToGraduate: (child, habit) => `${child} lleva varias semanas haciendo «${habit}» por su cuenta con regularidad. Puede dar por consolidado este hábito o dejarlo como está.`,
  graduate: 'Dar por completado',
  reduceStars: (from, to) => `Reducir estrellas (${from} → ${to})`,
  keepAsIs: 'Dejar como está',
  graduatedNotice: (habit) => `«${habit}» está consolidado. Su hijo aún lo verá en «Hábitos consolidados».`,
  starsReduced: (habit, to) => `A partir de la próxima vez, «${habit}» dará ${to} estrellas.`,
  undo: 'Deshacer',
  failed: 'No se pudo guardar. Inténtelo de nuevo.',
  recheck: (child, habit) => `¿${child} sigue haciendo «${habit}» por su cuenta?`,
  stillAlone: 'Sigue haciéndolo por su cuenta',
  bringBack: 'Volver a activar',
  graduatedTitle: 'Hábitos consolidados',
  graduatedEmpty: 'Todavía no se ha consolidado ningún hábito.',
  graduatedSince: (date) => `desde ${date}`,
  restoreStars: (to) => `Restablecer ${to} estrellas`,
  rhythm: (done, of) => `${done}/${of} días esta semana`,
  rhythmNote: 'La constancia importa más que una racha: saltarse un día no le hace perder nada.',
  newDay: 'Un nuevo día, ¡sigamos!',
  kidGraduatedTitle: '¡Lo que ya sé hacer!',
  kidGraduatedBody: 'Cosas que haces con tanta constancia que ya no hace falta que nadie te las recuerde.',
  kidPracticeTitle: 'Lo que estoy practicando',
  milestone: {
    'first-alone': (habit) => `¡La primera vez que haces «${habit}» por tu cuenta! Lo has conseguido.`,
    'three-alone': (habit) => `Has hecho «${habit}» por tu cuenta 3 veces. ¡Muy bien!`,
    'seven-in-a-row': (habit) => `Has hecho «${habit}» por tu cuenta 7 veces seguidas. ¡Tú puedes!`,
    'two-weeks-unprompted': (habit) => `Dos semanas sin recordatorios para «${habit}». ¡Puedes sentirte orgulloso!`,
  },
};

const zh: IndependenceCopy = {
  status: { 'not-started': '尚未开始', forming: '正在养成', 'needs-help': '需要帮助', steady: '已稳定' },
  trendTitle: '过去 6 周的支持情况',
  trendEasing: '需要的支持正在减少：孩子现在比刚开始时更常独立完成。',
  trendNotEnough: '目前还没有足够的数据来判断。',
  trendWeek: (start) => `${start}所在的一周`,
  legend: { alone: '独立完成', prompted: '提醒后完成', together: '一起完成', unknown: '未记录', missed: '未完成' },
  readyToGraduate: (child, habit) => `${child}已经连续几周稳定地独立完成“${habit}”。你可以让这个习惯结业，也可以保持现状。`,
  graduate: '结业',
  reduceStars: (from, to) => `减少星星（${from} → ${to}）`,
  keepAsIs: '保持现状',
  graduatedNotice: (habit) => `“${habit}”已结业。孩子仍可在“我已经会做的事”中看到它。`,
  starsReduced: (habit, to) => `从下次开始，“${habit}”奖励 ${to} 颗星星。`,
  undo: '撤销',
  failed: '无法保存，请再试一次。',
  recheck: (child, habit) => `${child}现在还会独立完成“${habit}”吗？`,
  stillAlone: '仍能独立完成',
  bringBack: '重新启用',
  graduatedTitle: '我已经会做的事',
  graduatedEmpty: '还没有习惯结业。',
  graduatedSince: (date) => `自${date}起`,
  restoreStars: (to) => `恢复为 ${to} 颗星星`,
  rhythm: (done, of) => `本周 ${done}/${of} 天`,
  rhythmNote: '保持节奏比连续打卡更重要：漏掉一天不会失去任何东西。',
  newDay: '新的一天，我们继续吧！',
  kidGraduatedTitle: '我已经会做的事！',
  kidGraduatedBody: '你做得很规律，已经不需要别人提醒的事情。',
  kidPracticeTitle: '我正在练习的事',
  milestone: {
    'first-alone': (habit) => `第一次独立完成“${habit}”！你做到了。`,
    'three-alone': (habit) => `你已经独立完成“${habit}”3次了。做得好！`,
    'seven-in-a-row': (habit) => `你已经连续7次独立完成“${habit}”。你可以做到！`,
    'two-weeks-unprompted': (habit) => `两周没有提醒你做“${habit}”了。为自己感到骄傲吧！`,
  },
};

const ja: IndependenceCopy = {
  status: { 'not-started': '未開始', forming: '習慣づくり中', 'needs-help': 'サポートが必要', steady: '安定' },
  trendTitle: '過去6週間のサポート',
  trendEasing: 'サポートが少なくなっています。始めた頃より、お子さんが一人でできることが増えています。',
  trendNotEnough: '判断するには、まだデータが足りません。',
  trendWeek: (start) => `${start}の週`,
  legend: { alone: '一人で', prompted: '声かけあり', together: '一緒に', unknown: '記録なし', missed: 'できなかった' },
  readyToGraduate: (child, habit) => `${child}は「${habit}」を何週間も続けて一人でできています。この習慣を卒業にするか、そのまま続けるか選べます。`,
  graduate: '卒業にする',
  reduceStars: (from, to) => `星を減らす（${from} → ${to}）`,
  keepAsIs: 'そのままにする',
  graduatedNotice: (habit) => `「${habit}」を卒業にしました。「できるようになったこと」に引き続き表示されます。`,
  starsReduced: (habit, to) => `次回から「${habit}」でもらえる星は${to}個です。`,
  undo: '元に戻す',
  failed: '保存できませんでした。もう一度お試しください。',
  recheck: (child, habit) => `${child}は今も「${habit}」を一人でできていますか？`,
  stillAlone: '今も一人でできる',
  bringBack: 'もう一度取り入れる',
  graduatedTitle: 'できるようになったこと',
  graduatedEmpty: '卒業した習慣はまだありません。',
  graduatedSince: (date) => `${date}から`,
  restoreStars: (to) => `星を${to}個に戻す`,
  rhythm: (done, of) => `今週 ${done}/${of}日`,
  rhythmNote: '続けるリズムは連続記録より大切です。一日できなくても失うものはありません。',
  newDay: '新しい一日、また続けよう！',
  kidGraduatedTitle: 'できるようになったこと！',
  kidGraduatedBody: '何度も続けてできるようになって、もう声をかけてもらわなくてもできること。',
  kidPracticeTitle: '練習していること',
  milestone: {
    'first-alone': (habit) => `初めて「${habit}」を一人でできたね！できたよ。`,
    'three-alone': (habit) => `「${habit}」を一人で3回できたね。よくできたね！`,
    'seven-in-a-row': (habit) => `「${habit}」を7回続けて一人でできたね。きっとできるよ！`,
    'two-weeks-unprompted': (habit) => `「${habit}」を2週間、声をかけられずにできたね。誇りに思っていいよ！`,
  },
};

const ko: IndependenceCopy = {
  status: { 'not-started': '시작 전', forming: '습관을 만드는 중', 'needs-help': '도움이 필요해요', steady: '꾸준해요' },
  trendTitle: '지난 6주간의 도움 정도',
  trendEasing: '도움이 줄고 있어요. 처음보다 아이가 혼자 하는 일이 늘었어요.',
  trendNotEnough: '아직 판단할 데이터가 충분하지 않아요.',
  trendWeek: (start) => `${start} 주간`,
  legend: { alone: '혼자', prompted: '알림을 받고', together: '함께', unknown: '기록 없음', missed: '하지 않음' },
  readyToGraduate: (child, habit) => `${child}가 몇 주 동안 “${habit}”을 꾸준히 혼자 해냈어요. 이 습관을 마무리하거나 지금처럼 이어갈 수 있어요.`,
  graduate: '마무리하기',
  reduceStars: (from, to) => `별 줄이기 (${from} → ${to})`,
  keepAsIs: '그대로 두기',
  graduatedNotice: (habit) => `“${habit}” 습관을 마무리했어요. 아이는 “내가 할 수 있는 것”에서 계속 볼 수 있어요.`,
  starsReduced: (habit, to) => `다음부터 “${habit}”을 하면 별 ${to}개를 받아요.`,
  undo: '실행 취소',
  failed: '저장하지 못했어요. 다시 시도해 주세요.',
  recheck: (child, habit) => `${child}가 아직 “${habit}”을 혼자 하나요?`,
  stillAlone: '아직 혼자 해요',
  bringBack: '다시 시작하기',
  graduatedTitle: '내가 할 수 있는 것',
  graduatedEmpty: '아직 마무리한 습관이 없어요.',
  graduatedSince: (date) => `${date}부터`,
  restoreStars: (to) => `별 ${to}개로 되돌리기`,
  rhythm: (done, of) => `이번 주 ${done}/${of}일`,
  rhythmNote: '연속 기록보다 꾸준한 리듬이 중요해요. 하루 빠져도 잃는 것은 없어요.',
  newDay: '새로운 하루, 계속해 봐요!',
  kidGraduatedTitle: '내가 할 수 있는 것!',
  kidGraduatedBody: '꾸준히 해서 이제는 아무도 알려 주지 않아도 할 수 있는 일들이에요.',
  kidPracticeTitle: '내가 연습하는 것',
  milestone: {
    'first-alone': (habit) => `처음으로 “${habit}”을 혼자 했어요! 해냈어요.`,
    'three-alone': (habit) => `“${habit}”을 혼자 3번 했어요. 잘했어요!`,
    'seven-in-a-row': (habit) => `“${habit}”을 혼자 7번 연속으로 했어요. 할 수 있어요!`,
    'two-weeks-unprompted': (habit) => `2주 동안 “${habit}”을 알림 없이 했어요. 정말 뿌듯해해도 돼요!`,
  },
};

const COPY: Record<Language, IndependenceCopy> = { vi, en, fr, de, it, es, zh, ja, ko };

export function getIndependenceCopy(language: Language): IndependenceCopy {
  return COPY[language];
}

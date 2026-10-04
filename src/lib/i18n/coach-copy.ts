import type { Language } from '@/types';
import type { TryKind } from '@/lib/habit-programs/coach';

export type CoachCopy = {
  readonly title: string;
  readonly intro: string;
  readonly change: Readonly<Record<TryKind, (habit: string) => string>>;
  readonly whyBetterTime: (habit: string, time: string) => string;
  readonly tryIt: string;
  readonly running: (habit: string, kind: string, endsOn: string) => string;
  readonly kindName: Readonly<Record<TryKind, string>>;
  readonly review: (habit: string, kind: string) => string;
  readonly helped: string;
  readonly notYet: string;
  readonly dropped: string;
  readonly backToFull: string;
  readonly started: string;
  readonly failed: string;
  readonly nothing: string;
  readonly cueChangeHint: string;
  readonly focusTitle: string;
  readonly focusIntro: string;
  readonly offer: (habit: string) => string;
  readonly pickFocus: (name: string) => string;
  readonly focusSaved: string;
  readonly kidFocusTitle: string;
  readonly kidFocusPick: string;
  readonly kidFocusProgress: (done: number) => string;
  readonly kidFocusSave: string;
  readonly kidFocusChange: string;
  readonly kidFocusMax: string;
};

const vi: CoachCopy = {
  title: 'Một thay đổi tuần này',
  intro: 'Mỗi lần chỉ thử một thay đổi trong 7 ngày, rồi xem có giúp không.',
  change: {
    smaller: (habit) => `Thử làm “${habit}” nhỏ hơn (bản hai phút) trong 7 ngày.`,
    retime: (habit) => `Thử đổi giờ của “${habit}” sang lúc bé thường làm.`,
    together: (habit) => `Làm “${habit}” cùng bé vài ngày; không tính là bé lỡ.`,
    cue_change: (habit) => `Thử đổi tín hiệu nhắc của “${habit}” (hình ảnh, hoặc để bé tự đặt).`,
    reduce_support: (habit) => `Thử nhắc ít đi với “${habit}”: chờ bé tự bắt đầu trước.`,
  },
  whyBetterTime: (habit, time) => `Bé thường làm “${habit}” vào khoảng ${time}.`,
  tryIt: 'Thử trong 7 ngày',
  running: (habit, kind, endsOn) => `Đang thử “${habit}”: ${kind}, đến ${endsOn}.`,
  kindName: { smaller: 'làm nhỏ hơn', retime: 'đổi giờ', together: 'làm cùng', cue_change: 'đổi tín hiệu', reduce_support: 'nhắc ít đi' },
  review: (habit, kind) => `Thay đổi “${kind}” cho “${habit}” có giúp không?`,
  helped: 'Có giúp',
  notYet: 'Chưa',
  dropped: 'Bỏ',
  backToFull: 'Chọn “Chưa” hoặc “Bỏ” thì thói quen trở lại như trước khi thử.',
  started: 'Đã bắt đầu thử. Ứng dụng sẽ hỏi lại sau 7 ngày.',
  failed: 'Chưa lưu được. Bạn thử lại nhé.',
  nothing: 'Tuần này chưa cần đổi gì. Cứ giữ nhịp.',
  cueChangeHint: 'Mở Quản lý việc để sửa tín hiệu của thói quen này.',
  focusTitle: 'Mục tiêu tuần của bé',
  focusIntro: 'Chọn 2 đến 4 việc để bé tự chọn một hoặc hai việc làm mục tiêu tuần. Bé dưới 6 tuổi thì ba mẹ chọn cùng bé.',
  offer: (habit) => `Cho bé chọn “${habit}”`,
  pickFocus: (name) => `Mục tiêu tuần của ${name}`,
  focusSaved: 'Đã lưu mục tiêu tuần.',
  kidFocusTitle: 'Mục tiêu tuần này',
  kidFocusPick: 'Chọn 1 hoặc 2 việc con muốn tập trung tuần này',
  kidFocusProgress: (done) => `${done}/7 ngày`,
  kidFocusSave: 'Chọn xong',
  kidFocusChange: 'Đổi lựa chọn',
  kidFocusMax: 'Chọn tối đa 2 việc.',
};

const en: CoachCopy = {
  title: 'One change this week',
  intro: 'Try just one change at a time for 7 days, then see whether it helped.',
  change: {
    smaller: (habit) => `Try a smaller version of “${habit}” (two minutes) for 7 days.`,
    retime: (habit) => `Try moving “${habit}” to the time your child usually does it.`,
    together: (habit) => `Do “${habit}” together for a few days; it does not count as a miss.`,
    cue_change: (habit) => `Try a different cue for “${habit}” (a picture, or let your child set the reminder).`,
    reduce_support: (habit) => `Try fewer reminders for “${habit}”: wait for your child to start first.`,
  },
  whyBetterTime: (habit, time) => `Your child usually does “${habit}” around ${time}.`,
  tryIt: 'Try it for 7 days',
  running: (habit, kind, endsOn) => `Trying “${habit}”: ${kind}, until ${endsOn}.`,
  kindName: { smaller: 'a smaller version', retime: 'a new time', together: 'doing it together', cue_change: 'a new cue', reduce_support: 'fewer reminders' },
  review: (habit, kind) => `Did ${kind} help with “${habit}”?`,
  helped: 'It helped',
  notYet: 'Not yet',
  dropped: 'Drop it',
  backToFull: 'Choosing “Not yet” or “Drop it” puts the habit back as it was before the try.',
  started: 'Started. The app will ask again in 7 days.',
  failed: 'Could not save. Please try again.',
  nothing: 'Nothing to change this week. Keep the rhythm.',
  cueChangeHint: 'Open Manage tasks to edit this habit’s cue.',
  focusTitle: 'Your child’s weekly focus',
  focusIntro: 'Mark 2 to 4 tasks your child may choose from, then your child picks one or two as the week’s focus. For a child under 6 you choose together.',
  offer: (habit) => `Let your child choose “${habit}”`,
  pickFocus: (name) => `${name}’s weekly focus`,
  focusSaved: 'Weekly focus saved.',
  kidFocusTitle: 'This week’s focus',
  kidFocusPick: 'Pick 1 or 2 things you want to focus on this week',
  kidFocusProgress: (done) => `${done}/7 days`,
  kidFocusSave: 'Done choosing',
  kidFocusChange: 'Change my choice',
  kidFocusMax: 'Pick at most 2.',
};

const fr: CoachCopy = {
  title: 'Un changement cette semaine',
  intro: 'Essayez un seul changement à la fois pendant 7 jours, puis voyez s’il a aidé.',
  change: {
    smaller: (habit) => `Essayez une version plus courte de « ${habit} » (deux minutes) pendant 7 jours.`,
    retime: (habit) => `Essayez de déplacer « ${habit} » au moment où votre enfant le fait habituellement.`,
    together: (habit) => `Faites « ${habit} » ensemble pendant quelques jours ; cela ne compte pas comme un oubli.`,
    cue_change: (habit) => `Essayez un autre repère pour « ${habit} » (une image, ou laissez votre enfant choisir le rappel).`,
    reduce_support: (habit) => `Essayez de moins rappeler « ${habit} » : attendez que votre enfant commence de lui-même.`,
  },
  whyBetterTime: (habit, time) => `Votre enfant fait généralement « ${habit} » vers ${time}.`,
  tryIt: 'Essayer pendant 7 jours',
  running: (habit, kind, endsOn) => `Essai de « ${habit} » : ${kind}, jusqu’au ${endsOn}.`,
  kindName: { smaller: 'une version plus courte', retime: 'un autre horaire', together: 'le faire ensemble', cue_change: 'un autre repère', reduce_support: 'moins de rappels' },
  review: (habit, kind) => `Est-ce que ${kind} a aidé pour « ${habit} » ?`,
  helped: 'Oui, cela a aidé',
  notYet: 'Pas encore',
  dropped: 'Arrêter',
  backToFull: 'Choisir « Pas encore » ou « Arrêter » rétablit l’habitude comme avant l’essai.',
  started: 'Essai commencé. L’application vous reposera la question dans 7 jours.',
  failed: 'Enregistrement impossible. Veuillez réessayer.',
  nothing: 'Rien à changer cette semaine. Gardez le rythme.',
  cueChangeHint: 'Ouvrez Gérer les tâches pour modifier le repère de cette habitude.',
  focusTitle: 'Objectif de la semaine de votre enfant',
  focusIntro: 'Choisissez 2 à 4 tâches parmi lesquelles votre enfant pourra en choisir une ou deux pour la semaine. Avant 6 ans, choisissez ensemble.',
  offer: (habit) => `Proposer à votre enfant de choisir « ${habit} »`,
  pickFocus: (name) => `Objectif de la semaine de ${name}`,
  focusSaved: 'Objectif de la semaine enregistré.',
  kidFocusTitle: 'Mon objectif de la semaine',
  kidFocusPick: 'Choisis 1 ou 2 choses sur lesquelles tu veux te concentrer cette semaine',
  kidFocusProgress: (done) => `${done}/7 jours`,
  kidFocusSave: 'Terminer mon choix',
  kidFocusChange: 'Modifier mon choix',
  kidFocusMax: 'Choisis-en 2 au maximum.',
};

const de: CoachCopy = {
  title: 'Eine Änderung für diese Woche',
  intro: 'Probieren Sie jeweils nur eine Änderung 7 Tage lang aus und sehen Sie dann, ob sie geholfen hat.',
  change: {
    smaller: (habit) => `Probieren Sie 7 Tage lang eine kleinere Version von „${habit}“ (zwei Minuten).`,
    retime: (habit) => `Probieren Sie, „${habit}“ auf den Zeitpunkt zu verlegen, zu dem Ihr Kind es normalerweise macht.`,
    together: (habit) => `Machen Sie „${habit}“ ein paar Tage gemeinsam; das zählt nicht als ausgelassen.`,
    cue_change: (habit) => `Probieren Sie einen anderen Hinweis für „${habit}“ (ein Bild oder Ihr Kind wählt die Erinnerung selbst).`,
    reduce_support: (habit) => `Erinnern Sie weniger an „${habit}“: Warten Sie, bis Ihr Kind selbst anfängt.`,
  },
  whyBetterTime: (habit, time) => `Ihr Kind macht „${habit}“ normalerweise ungefähr um ${time}.`,
  tryIt: '7 Tage lang ausprobieren',
  running: (habit, kind, endsOn) => `„${habit}“ wird ausprobiert: ${kind}, bis ${endsOn}.`,
  kindName: { smaller: 'eine kleinere Version', retime: 'eine andere Zeit', together: 'gemeinsam machen', cue_change: 'ein anderer Hinweis', reduce_support: 'weniger Erinnerungen' },
  review: (habit, kind) => `Hat ${kind} bei „${habit}“ geholfen?`,
  helped: 'Es hat geholfen',
  notYet: 'Noch nicht',
  dropped: 'Beenden',
  backToFull: 'Mit „Noch nicht“ oder „Beenden“ kehrt die Gewohnheit zum Stand vor dem Versuch zurück.',
  started: 'Ausprobieren gestartet. Die App fragt in 7 Tagen erneut nach.',
  failed: 'Speichern nicht möglich. Bitte versuchen Sie es erneut.',
  nothing: 'Diese Woche muss nichts geändert werden. Bleiben Sie im Rhythmus.',
  cueChangeHint: 'Öffnen Sie „Aufgaben verwalten“, um den Hinweis für diese Gewohnheit zu ändern.',
  focusTitle: 'Wochenfokus Ihres Kindes',
  focusIntro: 'Markieren Sie 2 bis 4 Aufgaben, aus denen Ihr Kind eine oder zwei für den Wochenfokus auswählt. Unter 6 Jahren wählen Sie gemeinsam.',
  offer: (habit) => `Lassen Sie Ihr Kind „${habit}“ auswählen`,
  pickFocus: (name) => `Wochenfokus für ${name}`,
  focusSaved: 'Wochenfokus gespeichert.',
  kidFocusTitle: 'Mein Fokus für diese Woche',
  kidFocusPick: 'Wähle 1 oder 2 Dinge aus, auf die du dich diese Woche konzentrieren möchtest',
  kidFocusProgress: (done) => `${done}/7 Tage`,
  kidFocusSave: 'Auswahl abschließen',
  kidFocusChange: 'Auswahl ändern',
  kidFocusMax: 'Wähle höchstens 2.',
};

const it: CoachCopy = {
  title: 'Un cambiamento questa settimana',
  intro: 'Provi un solo cambiamento alla volta per 7 giorni, poi verifichi se è stato utile.',
  change: {
    smaller: (habit) => `Provi una versione più breve di “${habit}” (due minuti) per 7 giorni.`,
    retime: (habit) => `Provi a spostare “${habit}” all’orario in cui suo figlio lo fa di solito.`,
    together: (habit) => `Faccia “${habit}” insieme a suo figlio per qualche giorno: non conterà come un’occasione saltata.`,
    cue_change: (habit) => `Provi un segnale diverso per “${habit}” (un’immagine, oppure lasci scegliere il promemoria a suo figlio).`,
    reduce_support: (habit) => `Provi a ricordare meno “${habit}”: aspetti che suo figlio inizi da solo.`,
  },
  whyBetterTime: (habit, time) => `Di solito suo figlio fa “${habit}” verso le ${time}.`,
  tryIt: 'Provi per 7 giorni',
  running: (habit, kind, endsOn) => `Prova di “${habit}”: ${kind}, fino al ${endsOn}.`,
  kindName: { smaller: 'una versione più breve', retime: 'un nuovo orario', together: 'farlo insieme', cue_change: 'un nuovo segnale', reduce_support: 'meno promemoria' },
  review: (habit, kind) => `${kind} è stato utile per “${habit}”?`,
  helped: 'È stato utile',
  notYet: 'Non ancora',
  dropped: 'Interrompi',
  backToFull: 'Scegliendo “Non ancora” o “Interrompi”, l’abitudine torna com’era prima della prova.',
  started: 'Prova iniziata. L’app le chiederà di nuovo tra 7 giorni.',
  failed: 'Impossibile salvare. Riprovi.',
  nothing: 'Questa settimana non c’è nulla da cambiare. Mantenga il ritmo.',
  cueChangeHint: 'Apra Gestisci attività per modificare il segnale di questa abitudine.',
  focusTitle: 'Obiettivo settimanale di suo figlio',
  focusIntro: 'Scelga da 2 a 4 attività tra cui suo figlio potrà indicarne una o due come obiettivo della settimana. Sotto i 6 anni, scelga insieme a lui.',
  offer: (habit) => `Lasci che suo figlio scelga “${habit}”`,
  pickFocus: (name) => `Obiettivo settimanale di ${name}`,
  focusSaved: 'Obiettivo settimanale salvato.',
  kidFocusTitle: 'Il mio obiettivo di questa settimana',
  kidFocusPick: 'Scegli 1 o 2 cose su cui vuoi concentrarti questa settimana',
  kidFocusProgress: (done) => `${done}/7 giorni`,
  kidFocusSave: 'Ho finito di scegliere',
  kidFocusChange: 'Cambia scelta',
  kidFocusMax: 'Scegline al massimo 2.',
};

const es: CoachCopy = {
  title: 'Un cambio para esta semana',
  intro: 'Pruebe solo un cambio cada vez durante 7 días y después compruebe si ha ayudado.',
  change: {
    smaller: (habit) => `Pruebe una versión más corta de «${habit}» (dos minutos) durante 7 días.`,
    retime: (habit) => `Pruebe a cambiar «${habit}» a la hora en que su hijo suele hacerlo.`,
    together: (habit) => `Haga «${habit}» junto con su hijo durante unos días; no contará como un día sin hacerlo.`,
    cue_change: (habit) => `Pruebe otra señal para «${habit}» (una imagen o deje que su hijo elija el recordatorio).`,
    reduce_support: (habit) => `Pruebe a recordar menos «${habit}»: espere a que su hijo empiece por su cuenta.`,
  },
  whyBetterTime: (habit, time) => `Su hijo suele hacer «${habit}» sobre las ${time}.`,
  tryIt: 'Probar durante 7 días',
  running: (habit, kind, endsOn) => `Probando «${habit}»: ${kind}, hasta el ${endsOn}.`,
  kindName: { smaller: 'una versión más corta', retime: 'otro horario', together: 'hacerlo juntos', cue_change: 'otra señal', reduce_support: 'menos recordatorios' },
  review: (habit, kind) => `¿Ha ayudado ${kind} con «${habit}»?`,
  helped: 'Ha ayudado',
  notYet: 'Todavía no',
  dropped: 'Dejarlo',
  backToFull: 'Al elegir «Todavía no» o «Dejarlo», el hábito vuelve a estar como antes de la prueba.',
  started: 'Prueba iniciada. La aplicación volverá a preguntar dentro de 7 días.',
  failed: 'No se pudo guardar. Inténtalo de nuevo.',
  nothing: 'Esta semana no hay nada que cambiar. Mantén el ritmo.',
  cueChangeHint: 'Abra Gestionar tareas para editar la señal de este hábito.',
  focusTitle: 'Enfoque semanal de su hijo',
  focusIntro: 'Marque entre 2 y 4 tareas para que su hijo elija una o dos como objetivo de la semana. Si tiene menos de 6 años, elijan juntos.',
  offer: (habit) => `Deje que su hijo elija «${habit}»`,
  pickFocus: (name) => `Enfoque semanal de ${name}`,
  focusSaved: 'Enfoque semanal guardado.',
  kidFocusTitle: 'Mi objetivo de esta semana',
  kidFocusPick: 'Elige 1 o 2 cosas en las que quieras centrarte esta semana',
  kidFocusProgress: (done) => `${done}/7 días`,
  kidFocusSave: 'Terminar de elegir',
  kidFocusChange: 'Cambiar mi elección',
  kidFocusMax: 'Elige como máximo 2.',
};

const zh: CoachCopy = {
  title: '本周尝试一个改变',
  intro: '每次只尝试一个改变，持续7天，然后看看是否有帮助。',
  change: {
    smaller: (habit) => `试着把“${habit}”简化一些（两分钟版本），持续7天。`,
    retime: (habit) => `试着把“${habit}”调整到孩子平时会做的时间。`,
    together: (habit) => `接下来几天和孩子一起做“${habit}”；这不算漏做。`,
    cue_change: (habit) => `试着换一种“${habit}”的提示方式（图片，或让孩子自己设置提醒）。`,
    reduce_support: (habit) => `试着减少对“${habit}”的提醒：等孩子先自己开始。`,
  },
  whyBetterTime: (habit, time) => `孩子通常会在${time}左右做“${habit}”。`,
  tryIt: '尝试7天',
  running: (habit, kind, endsOn) => `正在尝试“${habit}”：${kind}，直到${endsOn}。`,
  kindName: { smaller: '简化一些', retime: '换个时间', together: '一起完成', cue_change: '换个提示', reduce_support: '减少提醒' },
  review: (habit, kind) => `${kind}对“${habit}”有帮助吗？`,
  helped: '有帮助',
  notYet: '还没有',
  dropped: '停止尝试',
  backToFull: '选择“还没有”或“停止尝试”后，习惯会恢复到尝试前的状态。',
  started: '已开始尝试。应用会在7天后再次询问。',
  failed: '无法保存，请再试一次。',
  nothing: '本周不需要调整，保持节奏就好。',
  cueChangeHint: '打开“管理任务”来编辑这个习惯的提示。',
  focusTitle: '孩子本周的重点',
  focusIntro: '先选出2到4项任务，再让孩子从中选一两项作为本周重点。未满6岁的孩子，请和家长一起选择。',
  offer: (habit) => `让孩子选择“${habit}”`,
  pickFocus: (name) => `${name}本周的重点`,
  focusSaved: '本周重点已保存。',
  kidFocusTitle: '我本周的重点',
  kidFocusPick: '选择1或2件你这周想专注做的事',
  kidFocusProgress: (done) => `${done}/7天`,
  kidFocusSave: '选好了',
  kidFocusChange: '更改我的选择',
  kidFocusMax: '最多选2项。',
};

const ja: CoachCopy = {
  title: '今週はひとつ変えてみる',
  intro: '一度にひとつだけ、7日間試してから役立ったか見てみましょう。',
  change: {
    smaller: (habit) => `「${habit}」を小さくした形（2分間）で、7日間試してみましょう。`,
    retime: (habit) => `「${habit}」をお子さんがいつもする時間に移してみましょう。`,
    together: (habit) => `数日間「${habit}」を一緒にやってみましょう。できなかった日には数えません。`,
    cue_change: (habit) => `「${habit}」の合図を変えてみましょう（絵を使う、またはお子さんがリマインダーを設定する）。`,
    reduce_support: (habit) => `「${habit}」の声かけを減らしてみましょう。お子さんが自分で始めるまで待ちます。`,
  },
  whyBetterTime: (habit, time) => `お子さんは通常${time}ごろに「${habit}」をしています。`,
  tryIt: '7日間試す',
  running: (habit, kind, endsOn) => `「${habit}」を試しています：${kind}、${endsOn}まで。`,
  kindName: { smaller: '小さくする', retime: '時間を変える', together: '一緒にする', cue_change: '合図を変える', reduce_support: '声かけを減らす' },
  review: (habit, kind) => `${kind}は「${habit}」に役立ちましたか？`,
  helped: '役立った',
  notYet: 'まだ',
  dropped: 'やめる',
  backToFull: '「まだ」または「やめる」を選ぶと、習慣は試す前の状態に戻ります。',
  started: '試し始めました。7日後にアプリからもう一度お聞きします。',
  failed: '保存できませんでした。もう一度お試しください。',
  nothing: '今週は変えなくて大丈夫です。今のリズムを続けましょう。',
  cueChangeHint: '「タスクを管理」を開くと、この習慣の合図を編集できます。',
  focusTitle: 'お子さんの今週の目標',
  focusIntro: '2〜4個のタスクを選ぶと、お子さんがその中から1つか2つを今週の目標に選べます。6歳未満のお子さんの場合は一緒に選びましょう。',
  offer: (habit) => `「${habit}」を選んでもらう`,
  pickFocus: (name) => `${name}の今週の目標`,
  focusSaved: '今週の目標を保存しました。',
  kidFocusTitle: '今週の目標',
  kidFocusPick: '今週がんばりたいことを1つか2つ選んでね',
  kidFocusProgress: (done) => `${done}/7日`,
  kidFocusSave: '選び終わり',
  kidFocusChange: '選び直す',
  kidFocusMax: '選べるのは2つまでです。',
};

const ko: CoachCopy = {
  title: '이번 주에 한 가지 바꿔 보기',
  intro: '한 번에 한 가지씩 7일 동안 시도한 뒤 도움이 되었는지 살펴봐요.',
  change: {
    smaller: (habit) => `“${habit}”을 더 작게(2분 버전으로) 7일 동안 해 봐요.`,
    retime: (habit) => `아이가 보통 하는 시간에 “${habit}”을 해 봐요.`,
    together: (habit) => `며칠 동안 “${habit}”을 함께 해 봐요. 놓친 날로 기록되지 않아요.`,
    cue_change: (habit) => `“${habit}”의 신호를 바꿔 봐요(그림을 쓰거나 아이가 알림을 정하도록 해요).`,
    reduce_support: (habit) => `“${habit}” 알림을 줄여 봐요. 아이가 먼저 시작할 때까지 기다려 주세요.`,
  },
  whyBetterTime: (habit, time) => `아이는 보통 ${time}쯤 “${habit}”을 해요.`,
  tryIt: '7일 동안 해 보기',
  running: (habit, kind, endsOn) => `“${habit}” 시도 중: ${kind}, ${endsOn}까지.`,
  kindName: { smaller: '더 작게 하기', retime: '시간 바꾸기', together: '함께 하기', cue_change: '신호 바꾸기', reduce_support: '알림 줄이기' },
  review: (habit, kind) => `${kind}가 “${habit}”에 도움이 되었나요?`,
  helped: '도움이 됐어요',
  notYet: '아직이에요',
  dropped: '그만하기',
  backToFull: '“아직이에요” 또는 “그만하기”를 선택하면 습관이 시도 전 상태로 돌아가요.',
  started: '시작했어요. 앱에서 7일 후에 다시 물어볼게요.',
  failed: '저장하지 못했어요. 다시 시도해 주세요.',
  nothing: '이번 주에는 바꿀 것이 없어요. 지금 리듬을 이어가요.',
  cueChangeHint: '할 일 관리에서 이 습관의 신호를 수정할 수 있어요.',
  focusTitle: '아이의 이번 주 목표',
  focusIntro: '2~4개의 할 일을 고르면 아이가 그중 한두 개를 이번 주 목표로 선택해요. 만 6세 미만이라면 함께 골라 주세요.',
  offer: (habit) => `아이가 “${habit}”을 선택하게 해 주세요`,
  pickFocus: (name) => `${name}의 이번 주 목표`,
  focusSaved: '이번 주 목표를 저장했어요.',
  kidFocusTitle: '이번 주 목표',
  kidFocusPick: '이번 주에 집중하고 싶은 것을 1~2개 골라 봐요',
  kidFocusProgress: (done) => `${done}/7일`,
  kidFocusSave: '선택 완료',
  kidFocusChange: '선택 바꾸기',
  kidFocusMax: '최대 2개까지 골라요.',
};

const COPY: Record<Language, CoachCopy> = { vi, en, fr, de, it, es, zh, ja, ko };

export function getCoachCopy(language: Language): CoachCopy {
  return COPY[language];
}

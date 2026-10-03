import type { Language } from '@/types';

export type KidHistoryCopy = {
  readonly historyNote: string;
  readonly dayProgress: (done: number, total: number) => string;
  readonly noTasksThatDay: string;
  readonly noTasksToday: string;
  readonly noChild: string;
  readonly statusDone: string;
  readonly statusPending: string;
  readonly statusNotDone: string;
};

const COPY: Record<Language, KidHistoryCopy> = {
  vi: {
    historyNote: 'Đây là lịch sử. Con chỉ có thể xem các nhiệm vụ của ngày này.',
    dayProgress: (done, total) => `${done}/${total} nhiệm vụ đã hoàn thành`,
    noTasksThatDay: 'Ngày này không có nhiệm vụ',
    noTasksToday: 'Hôm nay không có nhiệm vụ',
    noChild: 'Chưa có hồ sơ của bé. Nhờ ba mẹ tạo hồ sơ hoặc ghép lại thiết bị.',
    statusDone: 'Đã xong',
    statusPending: 'Chờ ba mẹ duyệt',
    statusNotDone: 'Chưa làm',
  },
  en: {
    historyNote: 'This is history. You can only look at the quests from this day.',
    dayProgress: (done, total) => `${done}/${total} quests done`,
    noTasksThatDay: 'There were no quests on this day',
    noTasksToday: 'No quests today',
    noChild: 'There is no profile for the child yet. Ask a parent to create one or pair this device again.',
    statusDone: 'Done',
    statusPending: 'Waiting for a parent',
    statusNotDone: 'Not done',
  },
  fr: {
    historyNote: 'C’est l’historique. Tu peux seulement consulter les missions de ce jour.',
    dayProgress: (done, total) => `${done}/${total} missions terminées`,
    noTasksThatDay: 'Il n’y avait aucune mission ce jour-là',
    noTasksToday: 'Aucune mission aujourd’hui',
    noChild: 'Il n’y a pas encore de profil pour l’enfant. Demande à un parent d’en créer un ou de jumeler à nouveau cet appareil.',
    statusDone: 'Fait',
    statusPending: 'En attente d’un parent',
    statusNotDone: 'Pas encore fait',
  },
  de: {
    historyNote: 'Das ist der Verlauf. Du kannst dir die Aufgaben dieses Tages nur ansehen.',
    dayProgress: (done, total) => `${done}/${total} Aufgaben erledigt`,
    noTasksThatDay: 'An diesem Tag gab es keine Aufgaben',
    noTasksToday: 'Heute gibt es keine Aufgaben',
    noChild: 'Für das Kind gibt es noch kein Profil. Bitte Mama oder Papa, eines anzulegen oder das Gerät neu zu koppeln.',
    statusDone: 'Erledigt',
    statusPending: 'Wartet auf die Eltern',
    statusNotDone: 'Noch nicht erledigt',
  },
  it: {
    historyNote: 'Questa è la cronologia. Puoi solo guardare le missioni di questo giorno.',
    dayProgress: (done, total) => `${done}/${total} missioni completate`,
    noTasksThatDay: 'Quel giorno non c’erano missioni',
    noTasksToday: 'Oggi non ci sono missioni',
    noChild: 'Non c’è ancora un profilo per il bambino. Chiedi a un genitore di crearlo o di abbinare di nuovo il dispositivo.',
    statusDone: 'Fatto',
    statusPending: 'In attesa di un genitore',
    statusNotDone: 'Non ancora fatto',
  },
  es: {
    historyNote: 'Esto es el historial. Solo puedes mirar las misiones de este día.',
    dayProgress: (done, total) => `${done}/${total} misiones hechas`,
    noTasksThatDay: 'Este día no había misiones',
    noTasksToday: 'Hoy no hay misiones',
    noChild: 'Todavía no hay un perfil del niño. Pide a uno de tus padres que cree uno o vuelva a vincular este dispositivo.',
    statusDone: 'Hecho',
    statusPending: 'Esperando a uno de tus padres',
    statusNotDone: 'Aún sin hacer',
  },
  zh: {
    historyNote: '这里是历史记录。你只能查看这一天的任务。',
    dayProgress: (done, total) => `已完成 ${done}/${total} 个任务`,
    noTasksThatDay: '这一天没有任务',
    noTasksToday: '今天没有任务',
    noChild: '还没有孩子的档案。请让爸爸妈妈创建档案，或重新配对这台设备。',
    statusDone: '已完成',
    statusPending: '等待家长确认',
    statusNotDone: '还没做',
  },
  ja: {
    historyNote: 'これは記録です。この日のミッションは見るだけです。',
    dayProgress: (done, total) => `${done}/${total} 個のミッションが完了`,
    noTasksThatDay: 'この日はミッションがありませんでした',
    noTasksToday: '今日はミッションがありません',
    noChild: 'まだあなたのプロフィールがないよ。おうちの人にプロフィールを作ってもらうか、この端末をもう一度つないでもらってね。',
    statusDone: 'できた',
    statusPending: '保護者の確認待ち',
    statusNotDone: 'まだ',
  },
  ko: {
    historyNote: '지난 기록이에요. 이날의 미션은 볼 수만 있어요.',
    dayProgress: (done, total) => `미션 ${done}/${total}개 완료`,
    noTasksThatDay: '이날은 미션이 없었어요',
    noTasksToday: '오늘은 미션이 없어요',
    noChild: '아직 아이 프로필이 없어요. 부모님께 프로필을 만들거나 이 기기를 다시 연결해 달라고 부탁해 주세요.',
    statusDone: '완료',
    statusPending: '부모님 승인 대기 중',
    statusNotDone: '아직 안 했어요',
  },
};

export function getKidHistoryCopy(language: Language): KidHistoryCopy {
  return COPY[language];
}

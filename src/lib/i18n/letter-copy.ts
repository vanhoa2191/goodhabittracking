import type { Language } from '@/types';

export type LetterCopy = {
  readonly title: (name: string) => string;
  readonly read: string;
  readonly loadFailed: string;
  readonly retry: string;
  readonly saveFailed: string;
  readonly saving: string;
  readonly markRead: string;
  readonly opening: string;
};

const COPY: Record<Language, LetterCopy> = {
  vi: {
    title: (name) => `Thư buổi sáng từ ${name}`,
    read: 'Đã đọc',
    loadFailed: 'Chưa tải được thư. Vui lòng thử lại.',
    retry: 'Thử lại',
    saveFailed: 'Chưa lưu được trạng thái đã đọc. Hãy thử lại.',
    saving: 'Đang lưu…',
    markRead: 'Mình đã đọc',
    opening: 'Đang mở thư…',
  },
  en: {
    title: (name) => `Morning letter from ${name}`,
    read: 'Read',
    loadFailed: 'The letter could not be loaded. Please try again.',
    retry: 'Try again',
    saveFailed: 'Could not save your read status. Please try again.',
    saving: 'Saving…',
    markRead: 'I have read it',
    opening: 'Opening your letter…',
  },
  fr: {
    title: (name) => `Lettre du matin de ${name}`,
    read: 'Lue',
    loadFailed: 'La lettre n’a pas pu être chargée. Veuillez réessayer.',
    retry: 'Réessayer',
    saveFailed: 'L’état « lu » n’a pas pu être enregistré. Veuillez réessayer.',
    saving: 'Enregistrement…',
    markRead: 'Je l’ai lue',
    opening: 'Ouverture de ta lettre…',
  },
  de: {
    title: (name) => `Morgenbrief von ${name}`,
    read: 'Gelesen',
    loadFailed: 'Der Brief konnte nicht geladen werden. Bitte versuche es erneut.',
    retry: 'Erneut versuchen',
    saveFailed: 'Der Lesestatus konnte nicht gespeichert werden. Bitte versuche es erneut.',
    saving: 'Wird gespeichert …',
    markRead: 'Ich habe ihn gelesen',
    opening: 'Dein Brief wird geöffnet …',
  },
  it: {
    title: (name) => `Lettera del mattino da ${name}`,
    read: 'Letta',
    loadFailed: 'Non è stato possibile caricare la lettera. Riprova.',
    retry: 'Riprova',
    saveFailed: 'Non è stato possibile salvare lo stato «letta». Riprova.',
    saving: 'Salvataggio…',
    markRead: 'L’ho letta',
    opening: 'Apertura della tua lettera…',
  },
  es: {
    title: (name) => `Carta de la mañana de ${name}`,
    read: 'Leída',
    loadFailed: 'No se pudo cargar la carta. Inténtalo de nuevo.',
    retry: 'Reintentar',
    saveFailed: 'No se pudo guardar el estado de lectura. Inténtalo de nuevo.',
    saving: 'Guardando…',
    markRead: 'La he leído',
    opening: 'Abriendo tu carta…',
  },
  zh: {
    title: (name) => `${name} 的早安信`,
    read: '已读',
    loadFailed: '无法加载信件。请重试。',
    retry: '重试',
    saveFailed: '无法保存已读状态。请重试。',
    saving: '正在保存…',
    markRead: '我读完了',
    opening: '正在打开你的信…',
  },
  ja: {
    title: (name) => `${name} からの朝の手紙`,
    read: '読んだ',
    loadFailed: '手紙を読み込めませんでした。もう一度お試しください。',
    retry: '再試行',
    saveFailed: '既読の状態を保存できませんでした。もう一度お試しください。',
    saving: '保存しています…',
    markRead: '読んだよ',
    opening: '手紙を開いています…',
  },
  ko: {
    title: (name) => `${name}의 아침 편지`,
    read: '읽음',
    loadFailed: '편지를 불러오지 못했어요. 다시 시도해 주세요.',
    retry: '다시 시도',
    saveFailed: '읽음 상태를 저장하지 못했어요. 다시 시도해 주세요.',
    saving: '저장하는 중…',
    markRead: '다 읽었어요',
    opening: '편지를 여는 중…',
  },
};

export function getLetterCopy(language: Language): LetterCopy {
  return COPY[language] ?? COPY.en;
}

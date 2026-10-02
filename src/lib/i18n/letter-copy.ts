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
    title: (name) => `Morning letter from ${name}`,
    read: 'Read',
    loadFailed: 'The letter could not be loaded. Please try again.',
    retry: 'Try again',
    saveFailed: 'Could not save your read status. Please try again.',
    saving: 'Saving…',
    markRead: 'I have read it',
    opening: 'Opening your letter…',
  },
  de: {
    title: (name) => `Morning letter from ${name}`,
    read: 'Read',
    loadFailed: 'The letter could not be loaded. Please try again.',
    retry: 'Try again',
    saveFailed: 'Could not save your read status. Please try again.',
    saving: 'Saving…',
    markRead: 'I have read it',
    opening: 'Opening your letter…',
  },
  it: {
    title: (name) => `Morning letter from ${name}`,
    read: 'Read',
    loadFailed: 'The letter could not be loaded. Please try again.',
    retry: 'Try again',
    saveFailed: 'Could not save your read status. Please try again.',
    saving: 'Saving…',
    markRead: 'I have read it',
    opening: 'Opening your letter…',
  },
  es: {
    title: (name) => `Morning letter from ${name}`,
    read: 'Read',
    loadFailed: 'The letter could not be loaded. Please try again.',
    retry: 'Try again',
    saveFailed: 'Could not save your read status. Please try again.',
    saving: 'Saving…',
    markRead: 'I have read it',
    opening: 'Opening your letter…',
  },
  zh: {
    title: (name) => `Morning letter from ${name}`,
    read: 'Read',
    loadFailed: 'The letter could not be loaded. Please try again.',
    retry: 'Try again',
    saveFailed: 'Could not save your read status. Please try again.',
    saving: 'Saving…',
    markRead: 'I have read it',
    opening: 'Opening your letter…',
  },
  ja: {
    title: (name) => `Morning letter from ${name}`,
    read: 'Read',
    loadFailed: 'The letter could not be loaded. Please try again.',
    retry: 'Try again',
    saveFailed: 'Could not save your read status. Please try again.',
    saving: 'Saving…',
    markRead: 'I have read it',
    opening: 'Opening your letter…',
  },
  ko: {
    title: (name) => `Morning letter from ${name}`,
    read: 'Read',
    loadFailed: 'The letter could not be loaded. Please try again.',
    retry: 'Try again',
    saveFailed: 'Could not save your read status. Please try again.',
    saving: 'Saving…',
    markRead: 'I have read it',
    opening: 'Opening your letter…',
  },
};

export function getLetterCopy(language: Language): LetterCopy {
  return COPY[language] ?? COPY.en;
}

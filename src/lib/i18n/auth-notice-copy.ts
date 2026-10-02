import type { Language } from '@/types';

export type AuthNoticeCopy = {
  readonly googleSignInFailed: (message: string) => string;
  readonly dismiss: string;
};

const COPY: Record<Language, AuthNoticeCopy> = {
  vi: {
    googleSignInFailed: (message) => `Không thể mở đăng nhập Google: ${message}`,
    dismiss: 'Đóng',
  },
  en: {
    googleSignInFailed: (message) => `Google sign-in could not be opened: ${message}`,
    dismiss: 'Close',
  },
  fr: {
    googleSignInFailed: (message) => `La connexion Google n’a pas pu s’ouvrir : ${message}`,
    dismiss: 'Fermer',
  },
  de: {
    googleSignInFailed: (message) => `Die Google-Anmeldung konnte nicht geöffnet werden: ${message}`,
    dismiss: 'Schließen',
  },
  it: {
    googleSignInFailed: (message) => `Non è stato possibile aprire l’accesso con Google: ${message}`,
    dismiss: 'Chiudi',
  },
  es: {
    googleSignInFailed: (message) => `No se pudo abrir el inicio de sesión de Google: ${message}`,
    dismiss: 'Cerrar',
  },
  zh: {
    googleSignInFailed: (message) => `无法打开 Google 登录：${message}`,
    dismiss: '关闭',
  },
  ja: {
    googleSignInFailed: (message) => `Googleログインを開けませんでした：${message}`,
    dismiss: '閉じる',
  },
  ko: {
    googleSignInFailed: (message) => `Google 로그인을 열 수 없어요: ${message}`,
    dismiss: '닫기',
  },
};

export function getAuthNoticeCopy(language: Language): AuthNoticeCopy {
  return COPY[language] ?? COPY.en;
}

'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import type { Language } from '@/types';
import {
  detectLanguage,
  isLanguage,
  LANGUAGE_PREFERENCE_KEY,
} from './language-detection';
import { translations } from './translations';

export interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
];

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)['vi'];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_CHANGE_EVENT = 'kidhabit-language-change';

function subscribeToLanguage(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  };
}

function readLanguageCookie(): Language | null {
  const cookiePrefix = `${LANGUAGE_PREFERENCE_KEY}=`;
  const cookie = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(cookiePrefix));
  if (!cookie) return null;

  const value = cookie.slice(cookiePrefix.length);
  return isLanguage(value) ? value : null;
}

function getBrowserLanguage(initialLanguage: Language): Language {
  return detectLanguage({
    savedLanguage: readLanguageCookie() ?? localStorage.getItem(LANGUAGE_PREFERENCE_KEY),
    preferredLocales: [initialLanguage, ...navigator.languages],
    countryCode: null,
  });
}

function writeLanguageCookie(language: Language): void {
  const secureAttribute = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LANGUAGE_PREFERENCE_KEY}=${language}; Path=/; Max-Age=31536000; SameSite=Lax${secureAttribute}`;
}

export function I18nProvider({
  children,
  initialLanguage,
}: {
  readonly children: React.ReactNode;
  readonly initialLanguage: Language;
}) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    () => getBrowserLanguage(initialLanguage),
    () => initialLanguage
  );

  const setLanguage = (lang: Language) => {
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, lang);
    writeLanguageCookie(lang);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  };

  const t = translations[language] || translations.vi;

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `${t.appName} - ${t.appSlogan}`;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = t.appSlogan;

    const cookieLanguage = readLanguageCookie();
    const savedLanguage = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
    if (cookieLanguage) {
      if (savedLanguage !== cookieLanguage) {
        localStorage.setItem(LANGUAGE_PREFERENCE_KEY, cookieLanguage);
      }
    } else if (isLanguage(savedLanguage)) {
      writeLanguageCookie(savedLanguage);
    }
  }, [language, t.appName, t.appSlogan]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

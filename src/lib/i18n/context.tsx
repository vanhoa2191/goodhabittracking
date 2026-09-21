'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import type { Language } from '@/types';
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

const LANGUAGE_STORAGE_KEY = 'kidhabit_language';
const LANGUAGE_CHANGE_EVENT = 'kidhabit-language-change';

function isLanguage(value: string | null): value is Language {
  return value === 'vi'
    || value === 'en'
    || value === 'zh'
    || value === 'ja'
    || value === 'ko'
    || value === 'fr'
    || value === 'de'
    || value === 'it'
    || value === 'es';
}

function subscribeToLanguage(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  };
}

function getLanguageSnapshot(): Language {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLanguage(savedLanguage) ? savedLanguage : 'vi';
}

function getServerLanguageSnapshot(): Language {
  return 'vi';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot
  );

  const setLanguage = (lang: Language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  };

  const t = translations[language] || translations.vi;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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

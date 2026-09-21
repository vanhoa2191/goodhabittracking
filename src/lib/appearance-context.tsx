'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

export type FontFamilyChoice = 'rounded' | 'modern' | 'playful' | 'serif';
export type FontSizeChoice = 'normal' | 'large' | 'xlarge';

export interface FontOption {
  id: FontFamilyChoice;
  name: string;
  cssFont: string;
  previewSample: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'rounded',
    name: 'Phông Tròn Thân Thiện (Mặc định)',
    cssFont: 'ui-rounded, "Comfortaa", "Nunito", "Quicksand", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    previewSample: 'Nét chữ tròn đáng yêu cho bé',
  },
  {
    id: 'modern',
    name: 'Phông Tinh Gọn Hiện Đại',
    cssFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    previewSample: 'Rõ ràng, hiện đại, tối giản',
  },
  {
    id: 'playful',
    name: 'Phông Vui Tươi Trẻ Thơ',
    cssFont: '"Trebuchet MS", "Lucida Sans Unicode", "Segoe UI", system-ui, sans-serif',
    previewSample: 'Năng động, tươi vui, hoạt bát',
  },
  {
    id: 'serif',
    name: 'Phông Cổ Điển Nhã Nhặn',
    cssFont: 'Georgia, Cambria, "Times New Roman", serif',
    previewSample: 'Ấm áp, mộc mạc, truyền cảm',
  },
];

export const FONT_SIZE_SCALES: Record<FontSizeChoice, { label: string; scale: number; percentage: string }> = {
  normal: { label: 'Vừa vặn (100%)', scale: 1.0, percentage: '100%' },
  large: { label: 'Lớn hơn một tí (108%)', scale: 1.08, percentage: '108%' },
  xlarge: { label: 'Chữ to rõ ràng (118%)', scale: 1.18, percentage: '118%' },
};

interface AppearanceContextType {
  fontFamily: FontFamilyChoice;
  setFontFamily: (font: FontFamilyChoice) => void;
  fontSize: FontSizeChoice;
  setFontSize: (size: FontSizeChoice) => void;
  currentFontOption: FontOption;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const FONT_FAMILY_STORAGE_KEY = 'kidhabit_font_family';
const FONT_SIZE_STORAGE_KEY = 'kidhabit_font_size';
const APPEARANCE_CHANGE_EVENT = 'kidhabit-appearance-change';

function isFontFamilyChoice(value: string | null): value is FontFamilyChoice {
  return value === 'rounded' || value === 'modern' || value === 'playful' || value === 'serif';
}

function isFontSizeChoice(value: string | null): value is FontSizeChoice {
  return value === 'normal' || value === 'large' || value === 'xlarge';
}

function subscribeToAppearance(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(APPEARANCE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(APPEARANCE_CHANGE_EVENT, onStoreChange);
  };
}

function getFontFamilySnapshot(): FontFamilyChoice {
  const savedFont = localStorage.getItem(FONT_FAMILY_STORAGE_KEY);
  return isFontFamilyChoice(savedFont) ? savedFont : 'rounded';
}

function getFontSizeSnapshot(): FontSizeChoice {
  const savedSize = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
  return isFontSizeChoice(savedSize) ? savedSize : 'large';
}

function getServerFontFamilySnapshot(): FontFamilyChoice {
  return 'rounded';
}

function getServerFontSizeSnapshot(): FontSizeChoice {
  return 'large';
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const fontFamily = useSyncExternalStore(
    subscribeToAppearance,
    getFontFamilySnapshot,
    getServerFontFamilySnapshot
  );
  const fontSize = useSyncExternalStore(
    subscribeToAppearance,
    getFontSizeSnapshot,
    getServerFontSizeSnapshot
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentOpt = FONT_OPTIONS.find((f) => f.id === fontFamily) || FONT_OPTIONS[0];
    const scaleObj = FONT_SIZE_SCALES[fontSize] || FONT_SIZE_SCALES.large;

    document.documentElement.style.setProperty('--app-font-family', currentOpt.cssFont);
    document.documentElement.style.setProperty('--app-font-scale', String(scaleObj.scale));
  }, [fontFamily, fontSize]);

  const setFontFamily = (font: FontFamilyChoice) => {
    localStorage.setItem(FONT_FAMILY_STORAGE_KEY, font);
    window.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT));
  };

  const setFontSize = (size: FontSizeChoice) => {
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
    window.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT));
  };

  const currentFontOption = FONT_OPTIONS.find((f) => f.id === fontFamily) || FONT_OPTIONS[0];

  return (
    <AppearanceContext.Provider
      value={{
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        currentFontOption,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}

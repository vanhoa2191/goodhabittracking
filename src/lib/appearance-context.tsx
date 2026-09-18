'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  // Default to rounded and slightly larger as requested by user
  const [fontFamily, setFontFamilyState] = useState<FontFamilyChoice>('rounded');
  const [fontSize, setFontSizeState] = useState<FontSizeChoice>('large');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedFont = localStorage.getItem('kidhabit_font_family') as FontFamilyChoice;
    if (savedFont && ['rounded', 'modern', 'playful', 'serif'].includes(savedFont)) {
      setFontFamilyState(savedFont);
    }
    const savedSize = localStorage.getItem('kidhabit_font_size') as FontSizeChoice;
    if (savedSize && ['normal', 'large', 'xlarge'].includes(savedSize)) {
      setFontSizeState(savedSize);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentOpt = FONT_OPTIONS.find((f) => f.id === fontFamily) || FONT_OPTIONS[0];
    const scaleObj = FONT_SIZE_SCALES[fontSize] || FONT_SIZE_SCALES.large;

    document.documentElement.style.setProperty('--app-font-family', currentOpt.cssFont);
    document.documentElement.style.setProperty('--app-font-scale', String(scaleObj.scale));
  }, [fontFamily, fontSize]);

  const setFontFamily = (font: FontFamilyChoice) => {
    setFontFamilyState(font);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kidhabit_font_family', font);
    }
  };

  const setFontSize = (size: FontSizeChoice) => {
    setFontSizeState(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kidhabit_font_size', size);
    }
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

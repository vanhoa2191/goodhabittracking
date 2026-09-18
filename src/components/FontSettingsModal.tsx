'use client';

import React from 'react';
import { Type, X, Check, ZoomIn } from 'lucide-react';
import {
  useAppearance,
  FONT_OPTIONS,
  FONT_SIZE_SCALES,
  FontFamilyChoice,
  FontSizeChoice,
} from '@/lib/appearance-context';
import { useTranslation } from '@/lib/i18n/context';

interface FontSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FontSettingsModal({ isOpen, onClose }: FontSettingsModalProps) {
  const { fontFamily, setFontFamily, fontSize, setFontSize } = useAppearance();
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 my-auto overflow-hidden">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Type className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-tight">
                {t.fontSettingsTitle}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{t.fontSettingsSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">
          {/* 1. Font Size Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5 text-indigo-600" />
              {t.fontSizeLabel}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(FONT_SIZE_SCALES) as FontSizeChoice[]).map((sizeKey) => {
                const item = FONT_SIZE_SCALES[sizeKey];
                const isSelected = fontSize === sizeKey;
                return (
                  <button
                    key={sizeKey}
                    type="button"
                    onClick={() => setFontSize(sizeKey)}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-extrabold shadow-xs scale-[1.02]'
                        : 'border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/60 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold">{item.percentage}</span>
                    <span className="text-[10px] sm:text-[11px] opacity-80">{item.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Font Family Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-indigo-600" />
              {t.fontFamilyLabel}
            </label>
            <div className="space-y-2">
              {FONT_OPTIONS.map((f) => {
                const isSelected = fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontFamily(f.id)}
                    style={{ fontFamily: f.cssFont }}
                    className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs'
                        : 'border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {f.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">
                        {f.previewSample}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800 border border-slate-200/80 dark:border-zinc-700 text-center">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">Xem trước mẫu chữ:</span>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
              🌟 Chào bé yêu! Hôm nay chúng mình cùng hoàn thành việc tốt và tích sao đổi quà nhé!
            </p>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 flex items-center justify-end pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 text-center"
          >
            {t.confirm} &amp; {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}

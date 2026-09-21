'use client';

import React, { useState } from 'react';
import { Sparkles, Palette, Check, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { ModalShell } from '@/components/ui/ModalShell';
import { getProfileMutationCopy } from '@/lib/i18n/profile-mutation-copy';

export const AVATAR_OPTIONS = [
  { emoji: '🦁', label: 'Sư tử dũng cảm' },
  { emoji: '🐰', label: 'Thỏ thông thái' },
  { emoji: '🐼', label: 'Gấu trúc an vui' },
  { emoji: '🦊', label: 'Cáo nhanh nhẹn' },
  { emoji: '🐱', label: 'Mèo đáng yêu' },
  { emoji: '🐶', label: 'Cún trung thành' },
  { emoji: '🦄', label: 'Kỳ lân ước mơ' },
  { emoji: '🚀', label: 'Tàu vũ trụ vươn xa' },
  { emoji: '⭐', label: 'Ngôi sao sáng' },
  { emoji: '👑', label: 'Vương miện tự tin' },
  { emoji: '🐯', label: 'Hổ kiên cường' },
  { emoji: '🐻', label: 'Gấu ấm áp' },
  { emoji: '🐬', label: 'Cá heo thân thiện' },
  { emoji: '🦖', label: 'Khủng long mạnh mẽ' },
  { emoji: '🦅', label: 'Đại bàng tự do' },
  { emoji: '🦉', label: 'Cú mèo sáng suốt' },
  { emoji: '🌺', label: 'Đóa hoa nở nụ cười' },
  { emoji: '🌈', label: 'Cầu vồng hy vọng' },
];

export const THEME_COLOR_OPTIONS = [
  { hex: '#3b82f6', name: 'Xanh Đại Dương' },
  { hex: '#ec4899', name: 'Hồng Ngọt Ngào' },
  { hex: '#10b981', name: 'Xanh Lá Tươi Vui' },
  { hex: '#f59e0b', name: 'Vàng Rực Rỡ' },
  { hex: '#8b5cf6', name: 'Tím Phép Thuật' },
  { hex: '#06b6d4', name: 'Xanh Lam Ngọc' },
  { hex: '#f43f5e', name: 'Đỏ Năng Lượng' },
  { hex: '#6366f1', name: 'Chàm Thông Thái' },
];

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  currentColor: string;
  onSave: (avatar: string, color: string) => Promise<boolean>;
}

export function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar,
  currentColor,
  onSave,
}: AvatarPickerModalProps) {
  const { t, language } = useTranslation();
  const copy = getProfileMutationCopy(language);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    const saved = await onSave(selectedAvatar, selectedColor);
    setIsSaving(false);
    if (saved) {
      onClose();
      return;
    }
    setSaveError(copy.saveError);
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} label="Chọn hình đại diện">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/50 shrink-0"
              style={{ backgroundColor: selectedColor }}
            >
              {selectedAvatar}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-tight">
                {t.changeAvatar}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {t.chooseAvatarTip}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">
          {/* Mascot Avatar Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {t.pickAvatarTitle}
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-800 overscroll-contain">
              {AVATAR_OPTIONS.map((item) => {
                const isSelected = selectedAvatar === item.emoji;
                return (
                  <button
                    type="button"
                    key={item.emoji}
                    onClick={() => setSelectedAvatar(item.emoji)}
                    title={item.label}
                    className={`h-11 sm:h-12 rounded-xl text-xl sm:text-2xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-700 border-2 border-indigo-600 shadow-md scale-105 z-10'
                        : 'hover:bg-white/80 dark:hover:bg-zinc-700/60'
                    }`}
                  >
                    {item.emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Color Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              {t.pickColorTitle}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {THEME_COLOR_OPTIONS.map((color) => {
                const isSelected = selectedColor.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    type="button"
                    key={color.hex}
                    onClick={() => setSelectedColor(color.hex)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-slate-800 dark:border-white shadow-sm ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white"
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                      {color.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 space-y-3 pb-safe">
          {saveError && <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">{saveError}</p>}
          <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            aria-busy={isSaving}
            className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 disabled:cursor-wait disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {isSaving ? copy.saving : t.save}
          </button>
          </div>
        </div>
    </ModalShell>
  );
}

'use client';

import React, { useState } from 'react';
import { Sparkles, Palette, Check, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { ModalShell } from '@/components/ui/ModalShell';
import { getProfileMutationCopy } from '@/lib/i18n/profile-mutation-copy';
import { getMascot, MASCOTS } from '@/lib/mascots';
import { MascotAvatar } from './MascotAvatar';

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
  cooldownUntil: Date | null;
  cooldownStatus: 'loading' | 'ready' | 'error';
}

export function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar,
  currentColor,
  onSave,
  cooldownUntil,
  cooldownStatus,
}: AvatarPickerModalProps) {
  const { t, language } = useTranslation();
  const copy = getProfileMutationCopy(language);
  const currentMascotId = getMascot(currentAvatar)?.id ?? currentAvatar;
  const [selectedAvatar, setSelectedAvatar] = useState(currentMascotId);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const changeBlocked = selectedAvatar !== currentMascotId
    && (cooldownStatus !== 'ready' || cooldownUntil !== null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (changeBlocked) return;
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
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border border-white/50 shrink-0"
              style={{ backgroundColor: selectedColor }}
            >
              <MascotAvatar avatar={selectedAvatar} alt="" priority className="h-11 w-11 text-2xl" />
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
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-zinc-800 dark:hover:text-slate-100 transition-colors shrink-0"
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
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-sand-200 bg-sand-50 p-2 dark:border-zinc-800 dark:bg-zinc-800/60 sm:grid-cols-3">
              {MASCOTS.map((mascot) => {
                const isSelected = selectedAvatar === mascot.id;
                const choiceBlocked = mascot.id !== currentMascotId
                  && (cooldownStatus !== 'ready' || cooldownUntil !== null);
                return (
                  <button
                    type="button"
                    key={mascot.id}
                    disabled={choiceBlocked}
                    onClick={() => {
                      setSelectedAvatar(mascot.id);
                      setSelectedColor(mascot.themeColor);
                    }}
                    aria-pressed={isSelected}
                    className={`relative flex min-h-28 flex-col items-center justify-center rounded-2xl border p-2 transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      isSelected
                        ? 'border-indigo-600 bg-white shadow-md ring-2 ring-indigo-500/20 dark:bg-zinc-700'
                        : 'border-transparent bg-white/70 enabled:hover:border-sand-200 enabled:hover:bg-white dark:bg-zinc-800/60 dark:enabled:hover:bg-zinc-700/60'
                    }`}
                  >
                    <MascotAvatar avatar={mascot.id} alt="" priority className="h-20 w-20" />
                    <span className="mt-1 text-sm font-extrabold text-sand-900 dark:text-slate-100">{mascot.name}</span>
                    {isSelected && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white"><Check className="h-4 w-4" /></span>}
                  </button>
                );
              })}
            </div>
            {cooldownStatus === 'loading' && <p role="status" className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{copy.mascotChecking}</p>}
            {cooldownStatus === 'error' && <p role="alert" className="mt-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{copy.mascotCheckError}</p>}
            {cooldownStatus === 'ready' && cooldownUntil && (
              <p role="status" className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {copy.mascotCooldown(new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(cooldownUntil))}
              </p>
            )}
          </div>

          {/* Theme Color Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              {t.pickColorTitle}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {THEME_COLOR_OPTIONS.map((color) => {
                const isSelected = selectedColor.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    type="button"
                    key={color.hex}
                    onClick={() => setSelectedColor(color.hex)}
                    className={`flex min-h-11 items-center gap-2 p-2 rounded-xl border text-left transition-all ${
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
                    <span className="min-w-0 text-xs font-bold text-slate-700 dark:text-slate-200">
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
            className="min-h-11 px-4 rounded-xl text-xs font-semibold text-slate-600 enabled:hover:bg-slate-100 dark:text-slate-300 dark:enabled:hover:bg-zinc-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || changeBlocked}
            aria-busy={isSaving}
            className="min-h-11 px-6 rounded-xl bg-indigo-600 enabled:hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {isSaving ? copy.saving : t.save}
          </button>
          </div>
        </div>
    </ModalShell>
  );
}

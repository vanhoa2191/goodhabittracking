'use client';

import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { useTranslation } from '@/lib/i18n/context';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { OnboardingWizard } from './onboarding/OnboardingWizard';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { language } = useTranslation();
  const copy = getOnboardingCopy(language);

  if (!isOpen) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} label={copy.dialogLabel} maxWidth="2xl">
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {copy.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-w-11 min-h-11 flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={copy.close}
            aria-label={copy.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <OnboardingWizard onClose={onClose} />
    </ModalShell>
  );
}

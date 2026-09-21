'use client';

import React, { useState } from 'react';
import { Lock, X, Delete } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { ModalShell } from '@/components/ui/ModalShell';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  verifyPin: (pin: string) => boolean;
}

export function PinModal({ isOpen, onClose, onSuccess, verifyPin }: PinModalProps) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (verifyPin(nextPin)) {
          setPin('');
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} label={t.enterPin} maxWidth="sm" mobileSheet={false} className={error ? 'animate-shake' : ''}>
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-tight">
                {t.enterPin}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{t.pinPlaceholder}</p>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain pb-safe">
          {/* PIN Indicators */}
          <div className="flex justify-center gap-3.5 my-2 sm:my-3">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 ${
                  pin.length > index
                    ? error
                      ? 'bg-rose-500 scale-125'
                      : 'bg-indigo-600 scale-125'
                    : 'bg-slate-200 dark:bg-zinc-700'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-rose-500 text-xs text-center font-medium animate-bounce my-1">
              {t.wrongPin}
            </p>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                className="h-11 sm:h-13 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-zinc-700 font-bold text-lg sm:text-xl text-slate-700 dark:text-slate-200 transition-colors active:scale-95 flex items-center justify-center shadow-xs"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-11 sm:h-13 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-zinc-700 font-bold text-lg sm:text-xl text-slate-700 dark:text-slate-200 transition-colors active:scale-95 flex items-center justify-center shadow-xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-11 sm:h-13 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 transition-colors active:scale-95 shadow-xs"
              aria-label={t.delete}
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>
    </ModalShell>
  );
}

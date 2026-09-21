'use client';

import React, { useState } from 'react';
import { X, Smartphone, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '@/lib/store';
import { sounds } from '@/lib/sound';
import { useModalFocus } from '@/lib/use-modal-focus';
import { useTranslation } from '@/lib/i18n/context';
import { getDeviceConnectCopy } from '@/lib/i18n/device-connect-copy';

interface DeviceConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeviceConnectModal({ isOpen, onClose, onSuccess }: DeviceConnectModalProps) {
  useModalFocus(isOpen, onClose);
  const { language } = useTranslation();
  const copy = getDeviceConnectCopy(language);
  const {
    connectWithFamilyCode,
    setMode,
  } = useAppStore();

  const [enteredCode, setEnteredCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [connectedFamilyName, setConnectedFamilyName] = useState<string | null>(null);
  const [connectedChild, setConnectedChild] = useState<{ name?: string; avatar?: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!enteredCode.trim()) {
      setErrorMsg(copy.errorRequired);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const result = await connectWithFamilyCode(enteredCode);

    setLoading(false);

    if (result.success) {
      setIsSuccess(true);
      setConnectedFamilyName(result.familyName || copy.defaultFamily);
      if (result.childName || result.childAvatar) {
        setConnectedChild({ name: result.childName, avatar: result.childAvatar });
      }
      sounds.playFanfare();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(result.message || copy.errorFallback);
    }
  };

  const handleFinish = () => {
    setMode('kid');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={copy.dialogLabel}
        className="relative w-full max-w-md max-h-[90dvh] flex flex-col bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-100 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-zinc-900 dark:to-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-slate-100">
                {isSuccess ? copy.successTitle : copy.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isSuccess ? copy.successSubtitle : copy.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={copy.close}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
          {!isSuccess ? (
            <>
              <div className="text-center space-y-1.5 py-1">
                <span className="text-4xl">🦁🚀</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {copy.guideSteps[1]}
                </p>
              </div>

              {/* Form Input */}
              <form onSubmit={handleConnect} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-center">
                    {copy.codeLabel}
                  </label>
                  <input
                    type="text"
                    value={enteredCode}
                    onChange={(e) => {
                      setEnteredCode(e.target.value.toUpperCase());
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="VD: 7KPM-4XQ2"
                    maxLength={12}
                    autoFocus
                    className="w-full text-center text-xl sm:text-2xl font-mono font-black tracking-widest py-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-zinc-800 border-2 border-indigo-200 dark:border-indigo-800 focus:border-indigo-600 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-600 text-slate-800 dark:text-slate-100 uppercase"
                  />
                  <p className="text-[11px] text-center text-slate-400 mt-1">
                    {copy.codeHelp}
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs font-medium animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !enteredCode.trim()}
                  className="w-full min-h-[46px] rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all cursor-pointer active:scale-98"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{copy.connecting}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{copy.connect}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Step instructions */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{copy.guide}</span>
                </div>
                <ul className="text-slate-500 dark:text-slate-400 space-y-1 pl-4 list-disc text-[11px]">
                  {copy.guideSteps.map((step) => <li key={step}>{step}</li>)}
                </ul>
              </div>
            </>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="relative inline-block mx-auto">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg text-4xl">
                  {connectedChild?.avatar || '🦁'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h4 className="font-black text-lg text-slate-800 dark:text-slate-100">
                  {connectedChild?.name ? copy.welcomeChild(connectedChild.name) : copy.welcomeFamily(connectedFamilyName || copy.defaultFamily)}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {copy.successBody}
                </p>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full min-h-[46px] rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none transition-all cursor-pointer active:scale-98"
              >
                <span>{copy.finish}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isSuccess ? copy.close : copy.later}
          </button>
        </div>
      </div>
    </div>
  );
}

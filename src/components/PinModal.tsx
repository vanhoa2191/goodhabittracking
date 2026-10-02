'use client';

import React, { useEffect, useState } from 'react';
import { Delete, Lock, X } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { useTranslation } from '@/lib/i18n/context';
import { getPinCopy } from '@/lib/i18n/pin-copy';
import type { ParentPinChange, ParentPinStatus, ParentPinVerification } from '@/lib/store/parent-pin-client';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  refreshStatus: () => Promise<ParentPinStatus>;
  verifyPin: (pin: string) => Promise<ParentPinVerification>;
  savePin: (input: { readonly newPin: string }) => Promise<ParentPinChange>;
}

type Phase = 'loading' | 'verify' | 'new' | 'confirm';

export function PinModal({ isOpen, onClose, onSuccess, refreshStatus, verifyPin, savePin }: PinModalProps) {
  const { t, language } = useTranslation();
  const pinCopy = getPinCopy(language);
  const [phase, setPhase] = useState<Phase>('loading');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [message, setMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setPhase('loading');
      setPin('');
      setNewPin('');
      setMessage('');
      void refreshStatus()
        .then((status) => {
          if (!active) return;
          if (status.lockedUntil && new Date(status.lockedUntil).getTime() > Date.now()) {
            setMessage(pinCopy.tooManyAttempts);
            setPhase('verify');
            return;
          }
          setPhase(status.configured ? 'verify' : 'new');
        })
        .catch(() => {
          if (!active) return;
          setMessage(pinCopy.cannotCheck);
          setPhase('verify');
        });
    });
    return () => {
      active = false;
    };
  }, [isOpen, pinCopy, refreshStatus]);

  if (!isOpen) return null;

  const completePin = async (completedPin: string) => {
    setIsBusy(true);
    setMessage('');
    try {
      if (phase === 'verify') {
        const result = await verifyPin(completedPin);
        if (result.status === 'verified') {
          setPin('');
          onSuccess();
          return;
        }
        if (result.status === 'setup_required') {
          setPin('');
          setPhase('new');
          return;
        }
        setMessage(result.status === 'locked'
          ? pinCopy.tooManyAttemptsMinutes(Math.ceil(result.retryAfterSeconds / 60))
          : pinCopy.wrongPin);
        setPin('');
        return;
      }
      if (phase === 'new') {
        setNewPin(completedPin);
        setPin('');
        setPhase('confirm');
        return;
      }
      if (completedPin !== newPin) {
        setMessage(pinCopy.mismatch);
        setPin('');
        setNewPin('');
        setPhase('new');
        return;
      }
      const result = await savePin({ newPin: completedPin });
      if (result.status !== 'updated') {
        setMessage(pinCopy.cannotSave);
        setPin('');
        return;
      }
      onSuccess();
    } catch {
      setMessage(pinCopy.cannotProcess);
      setPin('');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDigit = (digit: string) => {
    if (isBusy || phase === 'loading' || pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setMessage('');
    if (nextPin.length === 4) void completePin(nextPin);
  };

  const heading = phase === 'new'
    ? pinCopy.createTitle
    : phase === 'confirm'
      ? pinCopy.confirmTitle
      : t.enterPin;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} label={heading} maxWidth="sm" mobileSheet={false}>
      <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"><Lock aria-hidden="true" className="h-5 w-5" /></div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{heading}</h3>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{phase === 'new' || phase === 'confirm' ? pinCopy.protects : t.pinPlaceholder}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800" aria-label={t.close}><X aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <div className="space-y-4 overflow-y-auto p-4 pb-safe sm:p-6" aria-busy={isBusy || phase === 'loading'}>
        <div className="my-3 flex justify-center gap-3.5" aria-label={pinCopy.digitsEntered(pin.length)}>
          {[0, 1, 2, 3].map((index) => <span key={index} aria-hidden="true" className={`h-4 w-4 rounded-full ${pin.length > index ? 'scale-125 bg-indigo-600' : 'bg-slate-200 dark:bg-zinc-700'}`} />)}
        </div>
        {message && <p role="alert" className="text-center text-sm font-semibold text-rose-700 dark:text-rose-300">{message}</p>}
        {phase === 'loading' ? <p role="status" className="py-8 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">{pinCopy.checking}</p> : (
          <div className="mx-auto grid max-w-xs grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => <button key={num} type="button" disabled={isBusy} onClick={() => handleDigit(num)} className="flex min-h-11 items-center justify-center rounded-2xl bg-slate-50 text-xl font-bold text-slate-700 active:scale-95 disabled:opacity-50 dark:bg-zinc-800 dark:text-slate-200">{num}</button>)}
            <div />
            <button type="button" disabled={isBusy} onClick={() => handleDigit('0')} className="flex min-h-11 items-center justify-center rounded-2xl bg-slate-50 text-xl font-bold text-slate-700 active:scale-95 disabled:opacity-50 dark:bg-zinc-800 dark:text-slate-200">0</button>
            <button type="button" disabled={isBusy} onClick={() => setPin((value) => value.slice(0, -1))} className="flex min-h-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 active:scale-95 disabled:opacity-50 dark:bg-zinc-800" aria-label={t.delete}><Delete aria-hidden="true" className="h-5 w-5" /></button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

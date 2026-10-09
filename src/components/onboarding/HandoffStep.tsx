'use client';

import { useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { LayoutDashboard, Smartphone, Users } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getOnboardingWizardCopy } from '@/lib/i18n/onboarding-wizard-copy';
import { getPinCopy } from '@/lib/i18n/pin-copy';
import { readPairingCredential } from '@/lib/store/pairing-client';

type HandoffStepProps = {
  readonly childId: string;
  readonly rewardsFailed: boolean;
  readonly onFinish: () => void;
};

type DeviceChoice = 'own' | 'shared';
type Pairing =
  | { readonly status: 'idle' | 'loading' | 'error' }
  | { readonly status: 'ready'; readonly code: string; readonly qrDataUrl: string };

const choiceButton = (active: boolean) => `flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
  active
    ? 'border-indigo-600 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/20 dark:bg-indigo-950/30 dark:text-indigo-200'
    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200'
}`;
const primaryButton = 'min-h-11 w-full py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';
const secondaryButton = 'min-h-11 w-full rounded-2xl px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 dark:text-indigo-300 dark:hover:bg-indigo-950/30';

export function HandoffStep({ childId, rewardsFailed, onFinish }: HandoffStepProps) {
  const { language } = useTranslation();
  const wizard = getOnboardingWizardCopy(language);
  const copy = wizard.handoff;
  const pinCopy = getPinCopy(language);
  const { currentUser, parentPinConfigured, refreshParentPinStatus, updateParentPin, setActiveChildId, lockParent } = useAppStore();
  const signedIn = Boolean(currentUser);
  const [choice, setChoice] = useState<DeviceChoice | null>(signedIn ? null : 'shared');
  const [pairing, setPairing] = useState<Pairing>({ status: 'idle' });
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [savingPin, setSavingPin] = useState(false);

  const loadPairing = async () => {
    if (pairing.status !== 'idle') return;
    setPairing({ status: 'loading' });
    try {
      const credential = await readPairingCredential(childId);
      if (!credential) {
        setPairing({ status: 'error' });
        return;
      }
      const qrDataUrl = await QRCode.toDataURL(credential.qrPayload, { width: 320, margin: 1 });
      setPairing({ status: 'ready', code: credential.code, qrDataUrl });
    } catch {
      setPairing({ status: 'error' });
    }
  };

  const chooseOwnDevice = () => {
    setChoice('own');
    void loadPairing();
  };

  const openKid = () => {
    setActiveChildId(childId);
    lockParent();
    onFinish();
  };

  const loadPinStatus = async () => {
    setPinError(null);
    try {
      await refreshParentPinStatus();
    } catch {
      setPinError(pinCopy.cannotCheck);
    }
  };

  const chooseSharedDevice = () => {
    setChoice('shared');
    if (parentPinConfigured === null) void loadPinStatus();
  };

  const setPinAndOpen = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setPinError(copy.pinError);
      return;
    }
    setSavingPin(true);
    setPinError(null);
    try {
      const result = await updateParentPin({ newPin: pin });
      if (result.status !== 'updated') {
        setPinError(result.status === 'invalid_format' ? copy.pinError : pinCopy.cannotSave);
        return;
      }
      openKid();
    } catch {
      setPinError(pinCopy.cannotProcess);
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <div className="space-y-5">
      {rewardsFailed && (
        <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {copy.rewardsFailed}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {signedIn && (
          <button type="button" aria-pressed={choice === 'own'} onClick={chooseOwnDevice} className={choiceButton(choice === 'own')}>
            <Smartphone className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <span>{copy.ownDevice}</span>
          </button>
        )}
        <button type="button" aria-pressed={choice === 'shared'} onClick={chooseSharedDevice} className={choiceButton(choice === 'shared')}>
          <Users className="h-5 w-5 text-indigo-600" aria-hidden="true" />
          <span>{copy.sharedDevice}</span>
        </button>
      </div>

      {choice === 'own' && (
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {copy.ownDeviceSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          {pairing.status === 'loading' && (
            <div className="mx-auto h-60 w-60 animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-700" aria-hidden="true" />
          )}
          {pairing.status === 'error' && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
              {copy.codeError}
            </p>
          )}
          {pairing.status === 'ready' && (
            <div className="flex flex-col items-center gap-3">
              <Image src={pairing.qrDataUrl} alt={copy.codeLabel} width={240} height={240} unoptimized className="h-60 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xs dark:border-zinc-700" />
              <div className="text-center">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{copy.codeLabel}</p>
                <p className="font-mono text-2xl font-black tracking-widest text-indigo-700 dark:text-indigo-300">{pairing.code}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {choice === 'shared' && (
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-3">
          {parentPinConfigured === null ? (
            <>
              {pinError ? (
                <>
                  <p role="alert" className="text-sm font-bold text-rose-700 dark:text-rose-300">{pinError}</p>
                  <button type="button" onClick={() => void loadPinStatus()} className={secondaryButton}>{pinCopy.retry}</button>
                </>
              ) : <p role="status" className="text-sm text-slate-700 dark:text-slate-200">{pinCopy.checking}</p>}
              <button type="button" onClick={openKid} className={secondaryButton}>{copy.skipPin}</button>
            </>
          ) : parentPinConfigured === false ? (
            <>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{copy.pinExplain}</p>
              <div>
                <label htmlFor="onboarding-parent-pin" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {copy.pinLabel}
                </label>
                <input
                  id="onboarding-parent-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(null); }}
                  aria-invalid={pinError ? true : undefined}
                  aria-describedby={pinError ? 'onboarding-parent-pin-error' : undefined}
                  className="w-full min-h-11 py-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-lg font-black tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                {pinError && <p id="onboarding-parent-pin-error" role="alert" className="mt-1.5 text-sm font-bold text-rose-700 dark:text-rose-300">{pinError}</p>}
              </div>
              <button type="button" onClick={() => void setPinAndOpen()} disabled={savingPin} className={primaryButton}>
                {copy.setPinAndOpen}
              </button>
              <button type="button" onClick={openKid} disabled={savingPin} className={secondaryButton}>
                {copy.skipPin}
              </button>
            </>
          ) : (
            <button type="button" onClick={openKid} className={primaryButton}>
              {copy.openKid}
            </button>
          )}
        </div>
      )}

      <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-zinc-800">
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{copy.finalExplain}</p>
        <button
          type="button"
          onClick={onFinish}
          className="min-h-11 w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100 dark:hover:bg-zinc-700"
        >
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          <span>{copy.toDashboard}</span>
        </button>
      </div>
    </div>
  );
}

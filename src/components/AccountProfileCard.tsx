'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getAccountProfileCopy } from '@/lib/i18n/account-profile-copy';
import { HelpTip } from '@/components/help/HelpTip';

type ProfileResponse = {
  readonly profile: {
    readonly display_name: string;
    readonly email: string;
    readonly phone: string | null;
    readonly marketing_consent: boolean;
  };
};

type LoadState = 'loading' | 'ready' | 'error';
type Notice = { readonly text: string; readonly tone: 'info' | 'error' } | null;

const fieldClass = 'mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal dark:border-zinc-700 dark:bg-zinc-800';

export function AccountProfileCard() {
  const { language } = useTranslation();
  const copy = getAccountProfileCopy(language);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [isSaving, setIsSaving] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const load = useCallback(async (isCurrent: () => boolean = () => true) => {
    setLoadState('loading');
    try {
      const response = await fetch('/api/account/profile');
      if (!response.ok) throw new Error('profile_request_failed');
      const body = await response.json() as ProfileResponse;
      if (!isCurrent()) return;
      setName(body.profile.display_name);
      setEmail(body.profile.email);
      setPhone(body.profile.phone ?? '');
      setConsent(body.profile.marketing_consent);
      setLoadState('ready');
    } catch {
      if (isCurrent()) setLoadState('error');
    }
  }, []);

  useEffect(() => {
    let current = true;
    queueMicrotask(() => { void load(() => current); });
    return () => { current = false; };
  }, [load]);

  const save = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setNotice({ text: copy.saving, tone: 'info' });
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayName: name, phone, marketingConsent: consent }),
      });
      if (response.ok) setNotice({ text: copy.saved, tone: 'info' });
      else setNotice({ text: response.status === 400 ? copy.invalidPhone : copy.saveFailed, tone: 'error' });
    } catch {
      // A dropped connection must not leave "Saving…" on the screen for ever.
      setNotice({ text: copy.saveFailed, tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const redeem = async () => {
    if (isRedeeming || coupon.trim() === '') return;
    setIsRedeeming(true);
    try {
      const response = await fetch('/api/coupons/redeem', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: coupon }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (response.ok) setNotice({ text: copy.redeemed, tone: 'info' });
      else setNotice({ text: body.error ?? copy.redeemFailed, tone: 'error' });
    } catch {
      setNotice({ text: copy.redeemFailed, tone: 'error' });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900" aria-busy={loadState === 'loading' || isSaving}>
      <div className="flex items-center gap-1"><h4 className="flex items-center gap-2 text-sm font-extrabold">
        <UserRound aria-hidden="true" className="h-4 w-4 text-indigo-600" />{copy.title}
      </h4><HelpTip topic="settings.account" /></div>

      {loadState === 'loading' && <p role="status" className="text-sm font-semibold text-slate-600 dark:text-slate-300">{copy.loading}</p>}

      {loadState === 'error' && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
          <span>{copy.loadFailed}</span>
          <button type="button" onClick={() => void load()} className="min-h-11 rounded-xl border border-rose-300 bg-white px-4 font-bold text-rose-700 dark:border-rose-800 dark:bg-zinc-900 dark:text-rose-300">{copy.retry}</button>
        </div>
      )}

      {loadState === 'ready' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold">{copy.fullName}
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className={fieldClass} />
            </label>
            <label className="text-sm font-bold">{copy.phone}
              <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" className={fieldClass} />
            </label>
            <label className="text-sm font-bold sm:col-span-2">{copy.email}
              <input value={email} disabled className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 font-normal text-slate-500 dark:border-zinc-700 dark:bg-zinc-800" />
            </label>
          </div>
          <label className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4" />
            <span>{copy.consent}</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void save()} disabled={isSaving} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">
              {isSaving ? copy.saving : copy.save}
            </button>
            <input
              value={coupon}
              onChange={(event) => setCoupon(event.target.value.toUpperCase())}
              placeholder={copy.coupon}
              aria-label={copy.coupon}
              className="min-h-11 rounded-xl border px-3 dark:bg-zinc-800"
            />
            <button type="button" onClick={() => void redeem()} disabled={isRedeeming || coupon.trim() === ''} className="min-h-11 rounded-xl border px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
              {copy.redeem}
            </button>
            <HelpTip topic="settings.coupon" />
          </div>
        </>
      )}

      {notice && (
        <p role={notice.tone === 'error' ? 'alert' : 'status'} className={`text-sm font-semibold ${notice.tone === 'error' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'}`}>
          {notice.text}
        </p>
      )}
    </section>
  );
}

'use client';

import { useEffect, useId, useState } from 'react';
import { Mail } from 'lucide-react';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { getEmailCodeCopy } from '@/lib/i18n/email-code-copy';
import {
  isCompleteCode,
  isValidEmail,
  normalizeCode,
  requestEmailCode,
  verifyEmailCode,
  type EmailCodeFailure,
} from '@/lib/auth/email-code';
import { getSupabase } from '@/lib/supabase';
import type { Language } from '@/types';

const RESEND_SECONDS = 60;

const field = 'min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';
const primary = 'flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-base font-extrabold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60';
const quiet = 'min-h-11 rounded-xl px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 dark:text-indigo-300 dark:hover:bg-zinc-800';

/**
 * Sign in with a one-time code sent by email. Shown only when the flag is on, which happens after the
 * auth service has an email provider and a mail sender configured (see docs/deployment.md).
 */
export function EmailCodeSignIn({ language, onSignedIn }: { readonly language: Language; readonly onSignedIn?: () => void }) {
  const copy = getEmailCodeCopy(language);
  const emailId = useId();
  const codeId = useId();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<EmailCodeFailure | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  if (!defaultExperienceFlags.emailCodeLogin) return null;

  const send = async () => {
    setFailure(null);
    setBusy(true);
    const result = await requestEmailCode(email, getSupabase());
    setBusy(false);
    if (!result.ok) {
      setFailure(result.reason);
      return;
    }
    setCode('');
    setStep('code');
    setCooldown(RESEND_SECONDS);
  };

  const verify = async () => {
    setFailure(null);
    setBusy(true);
    const result = await verifyEmailCode(email, code, getSupabase());
    setBusy(false);
    if (!result.ok) {
      setFailure(result.reason);
      return;
    }
    onSignedIn?.();
  };

  return (
    <section aria-labelledby={`${emailId}-heading`} className="mt-6 border-t border-slate-200 pt-5 dark:border-zinc-800">
      <h2 id={`${emailId}-heading`} className="flex items-center gap-2 text-sm font-extrabold text-slate-700 dark:text-slate-200">
        <Mail aria-hidden="true" className="h-4 w-4" />{copy.heading}
      </h2>

      {step === 'email' ? (
        <form
          className="mt-3 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) void send();
          }}
        >
          <label htmlFor={emailId} className="text-sm font-bold text-slate-700 dark:text-slate-200">{copy.emailLabel}</label>
          <input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            placeholder={copy.emailPlaceholder}
            onChange={(event) => setEmail(event.target.value)}
            className={field}
            required
          />
          <button type="submit" disabled={busy || !isValidEmail(email)} className={primary}>
            {busy ? copy.sending : copy.send}
          </button>
        </form>
      ) : (
        <form
          className="mt-3 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy && isCompleteCode(code)) void verify();
          }}
        >
          <p role="status" className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">{copy.sentTo(email.trim())}</p>
          <label htmlFor={codeId} className="text-sm font-bold text-slate-700 dark:text-slate-200">{copy.codeLabel}</label>
          <input
            id={codeId}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={12}
            value={code}
            placeholder={copy.codeHint}
            onChange={(event) => setCode(normalizeCode(event.target.value))}
            className={`${field} tracking-[0.3em]`}
            autoFocus
          />
          <button type="submit" disabled={busy || !isCompleteCode(code)} className={primary}>
            {busy ? copy.verifying : copy.verify}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" disabled={busy || cooldown > 0} onClick={() => void send()} className={quiet}>
              {cooldown > 0 ? copy.resendIn(cooldown) : copy.resend}
            </button>
            <button type="button" disabled={busy} onClick={() => { setStep('email'); setFailure(null); setCode(''); }} className={quiet}>
              {copy.changeEmail}
            </button>
          </div>
        </form>
      )}

      {failure && <p role="alert" className="mt-3 text-sm font-bold text-rose-700 dark:text-rose-300">{copy.errors[failure]}</p>}
    </section>
  );
}

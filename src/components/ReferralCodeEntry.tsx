'use client';

import { useEffect, useId, useState } from 'react';
import { Gift } from 'lucide-react';
import { HelpTip } from '@/components/help/HelpTip';
import { useTranslation } from '@/lib/i18n/context';
import { getAffiliateCopy, type AffiliateCopy } from '@/lib/i18n/affiliate-copy';
import { clearReferralCookieString, normalizeReferralCode } from '@/lib/referral/referral-code';

const SESSION_HINT_DOMAIN = process.env.NEXT_PUBLIC_SESSION_HINT_DOMAIN?.trim() || null;
type ResultKey = keyof AffiliateCopy['entry']['results'];
type Notice = { readonly kind: 'ok' | 'error'; readonly text: string } | null;

const RESULT_KEYS: readonly ResultKey[] = ['claimed', 'invalid', 'self', 'already_referred', 'expired', 'disabled', 'failed'];

/**
 * Lets a new family type in the code a friend gave them. It shows only while the server says the family
 * can still be attributed (new, unpaid, not yet referred), so nothing appears for everyone else.
 */
export function ReferralCodeEntry() {
  const { language } = useTranslation();
  const copy = getAffiliateCopy(language);
  const inputId = useId();
  const hintId = useId();
  const [state, setState] = useState<'loading' | 'eligible' | 'referred' | 'hidden'>('loading');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/referral/claim', { cache: 'no-store' });
        const body = await response.json().catch(() => null) as { state?: unknown } | null;
        if (!active) return;
        setState(response.ok && body?.state === 'eligible' ? 'eligible' : response.ok && body?.state === 'referred' ? 'referred' : 'hidden');
      } catch {
        if (active) setState('hidden');
      }
    })();
    return () => { active = false; };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const normalized = normalizeReferralCode(code.replace(/[\s-]/g, ''));
    if (!normalized) {
      setNotice({ kind: 'error', text: copy.entry.results.invalid });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: normalized }),
      });
      const body = await response.json().catch(() => null) as { status?: unknown } | null;
      const status = typeof body?.status === 'string' && (RESULT_KEYS as readonly string[]).includes(body.status) ? body.status as ResultKey : 'failed';
      const kind = status === 'claimed' ? 'ok' : 'error';
      setNotice({ kind, text: copy.entry.results[status] });
      if (status === 'claimed' || status === 'already_referred') {
        // A manual entry settles attribution, so a code left over from a link is no longer needed.
        document.cookie = clearReferralCookieString(SESSION_HINT_DOMAIN);
        document.cookie = clearReferralCookieString(null);
        setState(status === 'claimed' ? 'referred' : 'hidden');
      } else if (status === 'expired' || status === 'disabled') {
        setState('hidden');
      }
    } catch {
      setNotice({ kind: 'error', text: copy.entry.results.failed });
    } finally {
      setBusy(false);
    }
  };

  if (state === 'loading') return null;
  if (state === 'referred' || (state === 'hidden' && notice)) {
    const failed = state === 'hidden';
    return (
      <p role="status" className={`rounded-2xl border p-3 text-sm font-semibold ${failed ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100' : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'}`}>
        {notice?.text ?? copy.entry.referred}
      </p>
    );
  }
  if (state !== 'eligible') return null;

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900" aria-describedby={hintId}>
      <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
        <Gift className="h-4 w-4 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
        <label htmlFor={inputId}>{copy.entry.prompt}</label>
        <HelpTip topic="settings.referralCode" />
      </div>
      <p id={hintId} className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{copy.entry.hint}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          value={code}
          onChange={(event) => { setCode(event.target.value.toUpperCase().slice(0, 12)); setNotice(null); }}
          placeholder={copy.entry.placeholder}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          aria-label={copy.entry.label}
          className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-mono text-sm tracking-widest text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
        <button type="submit" disabled={busy || code.trim() === ''} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60">
          {busy ? copy.entry.submitting : copy.entry.submit}
        </button>
      </div>
      {notice && <p role="alert" className={`mt-2 text-sm font-semibold ${notice.kind === 'ok' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>{notice.text}</p>}
    </form>
  );
}

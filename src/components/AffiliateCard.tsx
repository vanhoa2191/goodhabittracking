'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { Copy, Gift, Share2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getAffiliateCopy, type AffiliateCopy } from '@/lib/i18n/affiliate-copy';
import { referralLink } from '@/lib/referral/referral-code';
import { getMarketingOrigin } from '@/lib/site';
import { HelpTip } from '@/components/help/HelpTip';

type Settings = {
  readonly commissionBps: number;
  readonly attributionDays: number;
  readonly earningWindowDays: number;
  readonly holdDays: number;
  readonly minPayout: number;
};

type Overview =
  | { readonly enrolled: false; readonly enabled: boolean; readonly settings: Settings }
  | {
      readonly enrolled: true;
      readonly enabled: boolean;
      readonly code: string;
      readonly status: 'active' | 'suspended';
      readonly signups: number;
      readonly paying: number;
      readonly amounts: { readonly held: number; readonly available: number; readonly requested: number; readonly paid: number };
      readonly recent: ReadonlyArray<{ readonly createdAt: string; readonly amount: number; readonly status: keyof AffiliateCopy['status']; readonly planId: string | null }>;
      readonly payout: { readonly bank: string | null; readonly accountLast4: string | null; readonly accountName: string | null; readonly complete: boolean };
      readonly settings: Settings;
    };

type Notice = { readonly kind: 'ok' | 'error'; readonly text: string } | null;

const input = 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60';
const quiet = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-zinc-800';

function money(amount: number, language: string): string {
  return `${new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(amount)} ${language === 'vi' ? 'đ' : 'VND'}`;
}

async function call(body?: unknown): Promise<{ readonly ok: boolean; readonly status: number; readonly data: Record<string, unknown> | null }> {
  const response = await fetch('/api/affiliate', body === undefined
    ? { cache: 'no-store' }
    : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => null) as Record<string, unknown> | null;
  return { ok: response.ok, status: response.status, data };
}

/** The parent's referral programme: link, results, payout details and withdrawal requests. */
export function AffiliateCard() {
  const { language } = useTranslation();
  const copy = getAffiliateCopy(language);
  const marketingOrigin = getMarketingOrigin().origin;
  const titleId = useId();
  const termsId = useId();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [editing, setEditing] = useState(false);
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await call();
      if (result.ok && result.data) {
        setOverview(result.data as unknown as Overview);
        setLoadFailed(false);
      } else {
        setLoadFailed(true);
      }
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await call();
        if (!active) return;
        if (result.ok && result.data) setOverview(result.data as unknown as Overview);
        else setLoadFailed(true);
      } catch {
        if (active) setLoadFailed(true);
      }
    })();
    return () => { active = false; };
  }, []);

  const failure = (status: number, data: Record<string, unknown> | null): string => {
    if (status === 403 && data?.code === 'parent_pin_required') return copy.messages.pinRequired;
    if (status === 403 && data?.code === 'parent_pin_not_set') return copy.messages.pinNotSet;
    return copy.messages.failed;
  };

  const run = async (body: unknown, onDone: (data: Record<string, unknown>) => Notice | Promise<Notice>) => {
    setBusy(true);
    setNotice(null);
    try {
      const result = await call(body);
      if (!result.data) {
        setNotice({ kind: 'error', text: copy.messages.failed });
      } else if (result.ok) {
        setNotice(await onDone(result.data));
      } else {
        const status = typeof result.data.status === 'string' ? result.data.status : '';
        const known: Record<string, string> = {
          invalid_details: copy.messages.invalidDetails,
          below_minimum: copy.messages.belowMinimum,
          missing_details: copy.messages.missingDetails,
          details_recent: copy.messages.detailsRecent,
          suspended: copy.messages.suspended,
        };
        setNotice({ kind: 'error', text: known[status] ?? failure(result.status, result.data) });
      }
    } catch {
      setNotice({ kind: 'error', text: copy.messages.failed });
    } finally {
      setBusy(false);
    }
  };

  if (!overview) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900" aria-labelledby={titleId}>
        <div className="flex items-center gap-1"><h4 id={titleId} className="text-base font-extrabold text-slate-900 dark:text-slate-100">{copy.title}</h4><HelpTip topic="settings.affiliate" /></div>
        {loadFailed && <p role="alert" className="mt-2 text-sm font-semibold text-rose-700 dark:text-rose-300">{copy.messages.loadFailed}</p>}
      </section>
    );
  }
  if (!overview.enabled) return null;

  const percent = overview.settings.commissionBps / 100;
  const rules = copy.rules({
    percent,
    holdDays: overview.settings.holdDays,
    windowDays: overview.settings.earningWindowDays,
    minPayout: money(overview.settings.minPayout, language),
  });

  if (!overview.enrolled) {
    return (
      <section data-testid="affiliate-card" className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900" aria-labelledby={titleId}>
        <div className="flex items-center gap-1"><h4 id={titleId} className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100"><Gift aria-hidden="true" className="h-4 w-4 text-indigo-600" />{copy.title}</h4><HelpTip topic="settings.affiliate" /></div>
        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.intro(percent)}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
          {rules.map((rule) => <li key={rule}>{rule}</li>)}
        </ul>
        <label htmlFor={termsId} className="mt-4 flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
          <input id={termsId} type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4" />
          <span>{copy.terms} <a href={new URL('/gioi-thieu/', marketingOrigin).href} className="font-bold text-indigo-700 underline dark:text-indigo-300">{copy.termsLink}</a></span>
        </label>
        <button type="button" disabled={!accepted || busy} className={`${primary} mt-4`} onClick={() => void run({ action: 'enroll', acceptTerms: true }, async () => { await load(); return null; })}>
          {busy ? copy.joining : copy.join}
        </button>
        {notice && <p role={notice.kind === 'error' ? 'alert' : 'status'} className={`mt-3 text-sm font-semibold ${notice.kind === 'error' ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{notice.text}</p>}
      </section>
    );
  }

  const link = referralLink(marketingOrigin, overview.code);
  const stats: ReadonlyArray<readonly [string, string]> = [
    [copy.signups, String(overview.signups)],
    [copy.paying, String(overview.paying)],
    [copy.held, money(overview.amounts.held, language)],
    [copy.available, money(overview.amounts.available, language)],
    [copy.requested, money(overview.amounts.requested, language)],
    [copy.paid, money(overview.amounts.paid, language)],
  ];
  const showForm = editing || !overview.payout.complete;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <section data-testid="affiliate-card" className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900" aria-labelledby={titleId}>
      <div className="flex items-center gap-1"><h4 id={titleId} className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100"><Gift aria-hidden="true" className="h-4 w-4 text-indigo-600" />{copy.title}</h4><HelpTip topic="settings.affiliate" /></div>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.intro(percent)}</p>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">{copy.yourLink}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <code data-testid="affiliate-link" className="min-w-0 flex-1 break-all rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-zinc-800">{link}</code>
          <button type="button" className={quiet} onClick={() => { void navigator.clipboard?.writeText(link).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2000); }).catch(() => undefined); }}>
            <Copy aria-hidden="true" className="h-4 w-4" />{copied ? copy.copied : copy.copy}
          </button>
          {canShare && (
            <button type="button" className={quiet} onClick={() => { void navigator.share({ title: 'KidHabit Hero', text: copy.shareText, url: link }).catch(() => undefined); }}>
              <Share2 aria-hidden="true" className="h-4 w-4" />{copy.share}
            </button>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-3 dark:bg-zinc-800">
            <dt className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</dt>
            <dd className="mt-1 text-lg font-black tabular-nums text-slate-900 dark:text-white">{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600 dark:text-slate-400">
        {rules.map((rule) => <li key={rule}>{rule}</li>)}
      </ul>

      <h5 className="mt-5 text-sm font-extrabold text-slate-900 dark:text-slate-100">{copy.payoutTitle}</h5>
      {showForm ? (
        <form
          className="mt-2 grid gap-3 sm:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (busy) return;
            void run({ action: 'savePayout', bank, accountNumber, accountName }, async () => {
              setEditing(false);
              setAccountNumber('');
              await load();
              return { kind: 'ok', text: copy.messages.saved };
            });
          }}
        >
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">{copy.bank}
            <input className={input} value={bank} onChange={(event) => setBank(event.target.value)} autoComplete="off" required minLength={2} maxLength={80} />
          </label>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">{copy.accountNumber}
            <input className={input} value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} inputMode="numeric" autoComplete="off" required minLength={4} maxLength={30} />
          </label>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">{copy.accountName}
            <input className={input} value={accountName} onChange={(event) => setAccountName(event.target.value)} autoComplete="off" required minLength={2} maxLength={80} />
          </label>
          <div className="sm:col-span-3"><button type="submit" disabled={busy} className={primary}>{copy.saveDetails}</button></div>
        </form>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
          <span data-testid="affiliate-payout-summary">{overview.payout.bank} · ****{overview.payout.accountLast4} · {overview.payout.accountName}</span>
          <button type="button" className={quiet} onClick={() => setEditing(true)}>{copy.editDetails}</button>
        </div>
      )}
      <button
        type="button"
        data-testid="affiliate-request"
        disabled={busy || !overview.payout.complete || overview.amounts.available < overview.settings.minPayout}
        className={`${primary} mt-3`}
        onClick={() => void run({ action: 'requestPayout' }, async () => { await load(); return { kind: 'ok', text: copy.messages.requested }; })}
      >
        {busy ? copy.requesting : `${copy.requestPayout} (${money(overview.amounts.available, language)})`}
      </button>
      {notice && <p role={notice.kind === 'error' ? 'alert' : 'status'} className={`mt-3 text-sm font-semibold ${notice.kind === 'error' ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{notice.text}</p>}

      <h5 className="mt-5 text-sm font-extrabold text-slate-900 dark:text-slate-100">{copy.recent}</h5>
      {overview.recent.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{copy.noCommissions}</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 text-sm dark:divide-zinc-800">
          {overview.recent.map((entry) => (
            <li key={`${entry.createdAt}-${entry.amount}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{new Date(entry.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')} · {entry.planId ? copy.plan[entry.planId] ?? entry.planId : ''}</span>
              <span className="font-bold tabular-nums">{money(entry.amount, language)} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold dark:bg-zinc-800">{copy.status[entry.status]}</span></span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs leading-5 text-slate-600 dark:text-slate-400">{copy.tax}</p>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { ArrowRight, Camera, House, LogIn, PlayCircle, ShieldCheck } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { appEntryCopy } from '@/lib/i18n/app-entry-copy';
import type { Language } from '@/types';
import { EmailCodeSignIn } from '@/components/EmailCodeSignIn';

interface AppEntryGateProps {
  readonly isLoading: boolean;
  readonly language: Language;
  readonly marketingHomeUrl: string;
  readonly onLoginGoogle: () => void;
  readonly onOpenPairing: () => void;
  readonly onStartDemo: () => void;
}

export function AppEntryGate({
  isLoading,
  language,
  marketingHomeUrl,
  onLoginGoogle,
  onOpenPairing,
  onStartDemo,
}: AppEntryGateProps) {
  const copy = appEntryCopy[language];

  return (
    <section className="relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_top_right,_#e0e7ff,_transparent_38%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top_right,_#312e81,_transparent_34%),linear-gradient(180deg,#09090b_0%,#18181b_100%)] sm:py-16">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.78fr)]">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark className="h-12 w-12" label="KidHabit Hero" />
            <p className="m-0 text-sm font-extrabold uppercase tracking-[0.12em] text-indigo-700 dark:text-indigo-300">{copy.badge}</p>
          </div>
          <h1 className="mt-6 max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-700 dark:text-slate-300 sm:text-lg">
            {copy.description}
          </p>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{copy.safety}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-2xl shadow-indigo-100/70 dark:border-indigo-900/70 dark:bg-zinc-900 dark:shadow-none sm:p-7">
          <div className="grid gap-3" aria-busy={isLoading}>
            <button
              type="button"
              onClick={onLoginGoogle}
              disabled={isLoading}
              className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-indigo-600 px-5 py-3 text-left font-extrabold text-white shadow-lg shadow-indigo-200 transition-transform hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-indigo-400 disabled:cursor-wait disabled:opacity-60 dark:shadow-none"
            >
              <span className="flex items-center gap-3"><LogIn aria-hidden="true" className="h-5 w-5" />{isLoading ? copy.loading : copy.parentLogin}</span>
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </button>

            <EmailCodeSignIn language={language} />

            <button
              type="button"
              onClick={onOpenPairing}
              disabled={isLoading}
              className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-3 text-left font-extrabold text-amber-950 transition-transform hover:-translate-y-0.5 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-amber-400 disabled:cursor-wait disabled:opacity-60 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            >
              <span className="flex items-center gap-3"><Camera aria-hidden="true" className="h-5 w-5" />{copy.childEntry}</span>
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </button>

            <button
              type="button"
              data-testid="landing-primary-action"
              onClick={onStartDemo}
              disabled={isLoading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-indigo-400 disabled:cursor-wait disabled:opacity-60 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
            >
              <PlayCircle aria-hidden="true" className="h-5 w-5" /> {copy.demo}
            </button>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4 text-center dark:border-zinc-700">
            <Link href={marketingHomeUrl} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-indigo-400 dark:text-slate-200 dark:hover:bg-zinc-800">
              <House aria-hidden="true" className="h-4 w-4" /> {copy.marketingHome}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

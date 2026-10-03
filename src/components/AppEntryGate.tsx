'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Camera, ChevronDown, House, LogIn, Mail, PlayCircle, ShieldCheck } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { shouldOpenChildBlock } from '@/lib/app-entry-disclosure';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { appEntryCopy } from '@/lib/i18n/app-entry-copy';
import type { Language } from '@/types';
import { EmailCodeSignIn } from '@/components/EmailCodeSignIn';

interface AppEntryGateProps {
  /** Overrides the email-code sign-in flag; the "other ways to sign in" block exists only while that option does. */
  readonly emailCodeEnabled?: boolean;
  readonly isLoading: boolean;
  /** True while the child pairing dialog is on screen, so the child block is already open when it closes. */
  readonly isPairingOpen?: boolean;
  readonly language: Language;
  readonly marketingHomeUrl: string;
  readonly onLoginGoogle: () => void;
  readonly onOpenPairing: () => void;
  readonly onStartDemo: () => void;
}

interface GateDisclosureProps {
  readonly children: ReactNode;
  readonly icon: ReactNode;
  readonly label: string;
  readonly onToggle?: (open: boolean) => void;
  readonly open?: boolean;
  readonly testId: string;
}

/** A closed-by-default block. Native details/summary gives keyboard use and the expanded state for free. */
function GateDisclosure({ children, icon, label, onToggle, open, testId }: GateDisclosureProps) {
  return (
    <details
      data-testid={testId}
      open={open}
      onToggle={onToggle ? (event) => onToggle(event.currentTarget.open) : undefined}
      className="group rounded-2xl border border-slate-300 bg-white px-4 dark:border-zinc-600 dark:bg-zinc-900"
    >
      <summary
        data-testid={`${testId}-toggle`}
        className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl py-2 text-sm font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-indigo-400 dark:text-slate-100 [&::-webkit-details-marker]:hidden"
      >
        <span className="flex min-w-0 items-center gap-3">{icon}<span className="min-w-0">{label}</span></span>
        <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="pb-4 pt-1">{children}</div>
    </details>
  );
}

export function AppEntryGate({
  emailCodeEnabled = defaultExperienceFlags.emailCodeLogin,
  isLoading,
  isPairingOpen = false,
  language,
  marketingHomeUrl,
  onLoginGoogle,
  onOpenPairing,
  onStartDemo,
}: AppEntryGateProps) {
  const copy = appEntryCopy[language];
  // A closed block starts open only for someone already pairing a child device. The address is read once, here,
  // before the pairing dialog removes `pair` from it; the buttons below render only after the session check.
  const [childOpen, setChildOpen] = useState(() => shouldOpenChildBlock({
    pairingOpen: isPairingOpen,
    search: typeof window === 'undefined' ? '' : window.location.search,
  }));
  const showOtherWays = emailCodeEnabled;

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
          {isLoading ? (
            // While the session is being checked there is nothing to press yet: show where the buttons will be
            // instead of a purple login button that is switched off.
            <div role="status" aria-live="polite" className="grid gap-3">
              <div aria-hidden="true" className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-zinc-800" />
              <div aria-hidden="true" className="h-12 animate-pulse rounded-2xl bg-slate-100 dark:bg-zinc-800" />
              <div aria-hidden="true" className="h-12 animate-pulse rounded-2xl bg-slate-100 dark:bg-zinc-800" />
              <p className="text-center text-sm font-semibold text-slate-600 dark:text-slate-300">{copy.loading}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              <button
                type="button"
                data-testid="gate-parent-login"
                onClick={onLoginGoogle}
                className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl bg-indigo-600 px-5 py-3 text-left text-white shadow-lg shadow-indigo-200 transition-transform hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-indigo-400 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:shadow-none"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <LogIn aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-extrabold">{copy.parentLogin}</span>
                    <span className="block text-sm font-semibold text-indigo-50">{copy.parentLoginHint}</span>
                  </span>
                </span>
                <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0" />
              </button>

              <button
                type="button"
                data-testid="landing-primary-action"
                onClick={onStartDemo}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-indigo-200 bg-white px-5 py-3 font-bold text-indigo-800 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-indigo-400 disabled:cursor-wait disabled:opacity-60 dark:border-indigo-800 dark:bg-transparent dark:text-indigo-200 dark:hover:bg-indigo-950/40"
              >
                <PlayCircle aria-hidden="true" className="h-5 w-5 shrink-0" /> {copy.demo}
              </button>

              <GateDisclosure
                testId="gate-child-block"
                open={childOpen || isPairingOpen}
                onToggle={setChildOpen}
                icon={<Camera aria-hidden="true" className="h-5 w-5 shrink-0" />}
                label={copy.childToggle}
              >
                <p className="m-0 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{copy.childHelp}</p>
                <button
                  type="button"
                  data-testid="gate-child-open"
                  onClick={onOpenPairing}
                  className="mt-3 flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-3 text-left font-extrabold text-amber-950 transition-transform hover:-translate-y-0.5 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-amber-400 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                >
                  <span className="min-w-0">{copy.childOpen}</span>
                  <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0" />
                </button>
              </GateDisclosure>

              {showOtherWays && (
                <GateDisclosure
                  testId="gate-other-ways"
                  icon={<Mail aria-hidden="true" className="h-5 w-5 shrink-0" />}
                  label={copy.otherWays}
                >
                  <EmailCodeSignIn language={language} embedded />
                </GateDisclosure>
              )}
            </div>
          )}

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

'use client';

import React, { type RefObject } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { getOnboardingExtraCopy } from '@/lib/i18n/onboarding-extra-copy';
import { getOnboardingWizardCopy } from '@/lib/i18n/onboarding-wizard-copy';
import type { WizardDraft } from '@/lib/onboarding/wizard';
import { getMarketingOrigin } from '@/lib/site';
import { MascotAvatar } from '@/components/MascotAvatar';

type ConfirmStepProps = {
  readonly draft: WizardDraft;
  readonly onChange: (draft: WizardDraft) => void;
  readonly error: string | null;
  readonly consentError: string | null;
  readonly consentRef: RefObject<HTMLInputElement | null>;
};

const marketingOrigin = getMarketingOrigin();

export function ConfirmStep({ draft, onChange, error, consentError, consentRef }: ConfirmStepProps) {
  const { language } = useTranslation();
  const copy = getOnboardingCopy(language);
  const extra = getOnboardingExtraCopy(language);
  const wizard = getOnboardingWizardCopy(language);
  const habitCount = draft.habits.filter((habit) => habit.selected).length;
  const rewardCount = draft.rewards.filter((reward) => reward.selected).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-3xl border border-slate-200/80 bg-slate-50 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/60">
        <MascotAvatar avatar={draft.childAvatar} alt="" className="h-14 w-14 shrink-0" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {wizard.confirm.summary(draft.childName.trim(), draft.childAge, habitCount, rewardCount)}
        </p>
      </div>

      <div>
        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200">
          <input
            ref={consentRef}
            type="checkbox"
            checked={draft.hasConsent}
            onChange={(event) => onChange({ ...draft, hasConsent: event.target.checked })}
            aria-invalid={consentError ? true : undefined}
            aria-describedby={consentError ? 'onboarding-consent-error' : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-600"
          />
          <span>
            {copy.consent}
          </span>
        </label>
        {consentError && <p id="onboarding-consent-error" role="alert" className="mt-1.5 text-sm font-bold text-rose-700 dark:text-rose-300">{consentError}</p>}
      </div>
      <p className="text-center text-xs text-slate-600 dark:text-slate-300">{extra.legalTemplate.split(/(\[privacy\]|\[terms\])/).map((part, index) => {
        if (part === '[privacy]') return <Link key={index} href={`${marketingOrigin}/privacy`} target="_blank" className="font-bold text-indigo-700 underline dark:text-indigo-300">{extra.privacy}</Link>;
        if (part === '[terms]') return <Link key={index} href={`${marketingOrigin}/terms`} target="_blank" className="font-bold text-indigo-700 underline dark:text-indigo-300">{extra.terms}</Link>;
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}</p>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      )}

      <Link href={`${marketingOrigin}/docs`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/30"><BookOpen className="h-4 w-4" />{extra.guide}</Link>
    </div>
  );
}

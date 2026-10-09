'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { sounds } from '@/lib/sound';
import { useTranslation } from '@/lib/i18n/context';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { getOnboardingExtraCopy } from '@/lib/i18n/onboarding-extra-copy';
import { getOnboardingWizardCopy } from '@/lib/i18n/onboarding-wizard-copy';
import { submitOnboarding } from '@/lib/onboarding/submit';
import { canAdvance, createInitialDraft, type WizardDraft, type WizardStep } from '@/lib/onboarding/wizard';
import { ChildStep } from './ChildStep';
import { ConfirmStep } from './ConfirmStep';
import { HabitsStep } from './HabitsStep';
import { HandoffStep } from './HandoffStep';
import { RewardsStep } from './RewardsStep';

type OnboardingWizardProps = {
  readonly onClose: () => void;
};

const TOTAL_STEPS = 5;
const NEXT_STEP = { 1: 2, 2: 3, 3: 4 } as const satisfies Record<1 | 2 | 3, WizardStep>;
const PREVIOUS_STEP = { 2: 1, 3: 2, 4: 3 } as const satisfies Record<2 | 3 | 4, WizardStep>;

export function OnboardingWizard({ onClose }: OnboardingWizardProps) {
  const { language } = useTranslation();
  const copy = getOnboardingCopy(language);
  const extra = getOnboardingExtraCopy(language);
  const wizard = getOnboardingWizardCopy(language);
  const { createProfile, createReward, currentUser, isPro, activateFreeTrial } = useAppStore();

  const [draft, setDraft] = useState<WizardDraft>(createInitialDraft);
  const [step, setStep] = useState<WizardStep>(1);
  const [requestId] = useState(() => crypto.randomUUID());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [result, setResult] = useState<{ readonly profileId: string; readonly rewardsFailed: boolean } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef<WizardStep>(step);

  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    headingRef.current?.focus();
  }, [step]);

  const titles: Record<WizardStep, string> = {
    1: wizard.child.title,
    2: wizard.habits.title,
    3: wizard.rewards.title,
    4: wizard.confirm.title,
    5: wizard.handoff.title,
  };

  const updateDraft = (next: WizardDraft) => {
    setDraft(next);
    setNameError(null);
  };

  const submit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const outcome = await submitOnboarding(draft, {
        language,
        requestId,
        signedIn: Boolean(currentUser),
        isPro,
        fetcher: (input, init) => fetch(input, init),
        activateFreeTrial,
        createProfile,
        createReward,
      });
      if (!outcome.ok) {
        setSubmitError(outcome.message);
        return;
      }
      sounds.playLevelUp();
      setResult({ profileId: outcome.profileId, rewardsFailed: outcome.rewardsFailed });
      setStep(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = (event: React.FormEvent) => {
    event.preventDefault();
    if (step === 5 || isSubmitting) return;
    if (!canAdvance(step, draft)) {
      if (step === 1) {
        setNameError(copy.childNameRequired);
        nameRef.current?.focus();
      }
      return;
    }
    if (step === 4) {
      void submit();
      return;
    }
    setStep(NEXT_STEP[step]);
  };

  const handleBack = () => {
    if (step === 2 || step === 3 || step === 4) setStep(PREVIOUS_STEP[step]);
  };

  const canGoBack = (step === 2 || step === 3 || step === 4) && !isSubmitting;
  const nextDisabled = step !== 1 && (!canAdvance(step, draft) || isSubmitting);

  return (
    <form noValidate onSubmit={handleNext} className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 sm:px-6 pt-4 space-y-2">
        <p aria-live="polite" className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {wizard.stepOf(step, TOTAL_STEPS)}
        </p>
        <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <span key={index} className={`h-1.5 rounded-full ${index < step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-zinc-700'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight focus:outline-none"
        >
          {titles[step]}
        </h3>

        {step === 1 && <ChildStep draft={draft} onChange={updateDraft} nameError={nameError} nameRef={nameRef} />}
        {step === 2 && <HabitsStep draft={draft} onChange={updateDraft} />}
        {step === 3 && <RewardsStep draft={draft} onChange={updateDraft} />}
        {step === 4 && <ConfirmStep draft={draft} onChange={updateDraft} error={submitError} />}
        {step === 5 && result && (
          <HandoffStep childId={result.profileId} rewardsFailed={result.rewardsFailed} onFinish={onClose} />
        )}
      </div>

      {step !== 5 && (
        <div className="shrink-0 flex items-center gap-3 border-t border-slate-100 dark:border-zinc-800 px-5 sm:px-6 py-3">
          {canGoBack && (
            <button
              type="button"
              onClick={handleBack}
              className="min-h-11 flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200 dark:hover:bg-zinc-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>{wizard.back}</span>
            </button>
          )}
          <button
            type="submit"
            disabled={nextDisabled}
            className="min-h-11 flex-1 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {step === 4 ? (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 fill-current" aria-hidden="true" />
                <span>{isSubmitting
                  ? copy.saving
                  : currentUser && !isPro
                    ? extra.startTrial
                    : copy.complete}</span>
              </>
            ) : (
              <>
                <span>{wizard.next}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
}

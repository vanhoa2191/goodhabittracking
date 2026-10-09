'use client';

import type { RefObject } from 'react';
import { Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { getOnboardingWizardCopy } from '@/lib/i18n/onboarding-wizard-copy';
import { MASCOTS } from '@/lib/mascots';
import { withAge, type WizardDraft } from '@/lib/onboarding/wizard';
import { getStageFromAge, getStageInfo } from '@/lib/wit-framework';
import { MascotAvatar } from '@/components/MascotAvatar';

type ChildStepProps = {
  readonly draft: WizardDraft;
  readonly onChange: (draft: WizardDraft) => void;
  readonly nameError: string | null;
  readonly nameRef: RefObject<HTMLInputElement | null>;
};

export function ChildStep({ draft, onChange, nameError, nameRef }: ChildStepProps) {
  const { language } = useTranslation();
  const copy = getOnboardingCopy(language);
  const wizard = getOnboardingWizardCopy(language);
  const stage = getStageFromAge(draft.childAge);
  const stageInfo = getStageInfo(stage);
  const stageCopy = copy.stages[stage];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="onboarding-child-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {copy.childNameLabel}
          </label>
          <input
            ref={nameRef}
            id="onboarding-child-name"
            type="text"
            required
            placeholder={copy.childNamePlaceholder}
            value={draft.childName}
            onChange={(e) => onChange({ ...draft, childName: e.target.value })}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? 'onboarding-child-name-error' : undefined}
            className="w-full min-h-11 py-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
          {nameError && <p id="onboarding-child-name-error" role="alert" className="mt-1.5 text-sm font-bold text-rose-700 dark:text-rose-300">{nameError}</p>}
        </div>

        <div>
          <label htmlFor="onboarding-child-nickname" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {copy.nicknameLabel}
          </label>
          <input
            id="onboarding-child-nickname"
            type="text"
            placeholder={copy.nicknamePlaceholder}
            value={draft.childNickname}
            onChange={(e) => onChange({ ...draft, childNickname: e.target.value })}
            className="w-full min-h-11 py-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="onboarding-child-age" className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>{copy.ageLabel}</span>
          </label>
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-700 px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-600">
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-300">
              {draft.childAge}
            </span>
            <span className="text-xs font-bold text-slate-500">{copy.ageUnit}</span>
          </div>
        </div>

        <input
          id="onboarding-child-age"
          type="range"
          min={0}
          max={18}
          value={draft.childAge}
          onChange={(e) => onChange(withAge(draft, parseInt(e.target.value, 10)))}
          className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg"
        />

        <div className={`p-3.5 rounded-2xl bg-gradient-to-r ${stageInfo.color} text-white shadow-sm space-y-1`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">{stageInfo.icon}</span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider block opacity-90">
                {copy.stageLabels[stage]} &bull; {stageCopy.title}
              </span>
              <h4 className="text-sm font-black">{stageCopy.subtitle}</h4>
            </div>
          </div>
          <p className="text-xs opacity-95 leading-relaxed pt-1">
            {stageCopy.summary}
          </p>
        </div>

        <p className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">{wizard.child.explain}</p>
      </div>

      <div role="group" aria-labelledby="onboarding-child-mascot-label">
        <p id="onboarding-child-mascot-label" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          {wizard.child.mascotLabel}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MASCOTS.map((mascot) => (
            <button
              key={mascot.id}
              type="button"
              onClick={() => onChange({ ...draft, childAvatar: mascot.id, childThemeColor: mascot.themeColor })}
              aria-pressed={draft.childAvatar === mascot.id}
              className={`relative flex min-h-28 flex-col items-center justify-center rounded-2xl border p-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                draft.childAvatar === mascot.id
                  ? 'border-indigo-600 bg-indigo-50 shadow-sm ring-2 ring-indigo-500/20 dark:bg-indigo-950/30'
                  : 'border-sand-200 bg-white hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-800'
              }`}
            >
              <MascotAvatar avatar={mascot.id} alt="" priority className="h-20 w-20" />
              <span className="mt-1 text-sm font-extrabold text-sand-900 dark:text-slate-100">{mascot.name}</span>
              {draft.childAvatar === mascot.id && <span className="absolute right-2 top-2 h-3 w-3 rounded-full bg-indigo-600 ring-2 ring-white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

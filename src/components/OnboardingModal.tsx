'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Sparkles,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AgeStage } from '@/types';
import { getStageFromAge, getStageInfo, generateAgeAdaptedHabits } from '@/lib/wit-framework';
import { sounds } from '@/lib/sound';
import { ModalShell } from '@/components/ui/ModalShell';
import { useTranslation } from '@/lib/i18n/context';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { getOnboardingExtraCopy } from '@/lib/i18n/onboarding-extra-copy';
import { getProfileMutationCopy, getProfileMutationError } from '@/lib/i18n/profile-mutation-copy';
import { MASCOTS, getMascotLabel } from '@/lib/mascots';
import { getMarketingOrigin } from '@/lib/site';
import { MascotAvatar } from './MascotAvatar';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const marketingOrigin = getMarketingOrigin();

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { language } = useTranslation();
  const copy = getOnboardingCopy(language);
  const extra = getOnboardingExtraCopy(language);
  const profileCopy = getProfileMutationCopy(language);
  const {
    createProfile,
    currentUser,
    isPro,
    activateFreeTrial,
  } = useAppStore();

  const [childName, setChildName] = useState('');
  const [childNickname, setChildNickname] = useState('');
  const [childAge, setChildAge] = useState<number>(5);
  const [childAvatar, setChildAvatar] = useState('mascot:leo');
  const [childThemeColor, setChildThemeColor] = useState('#F59E0B');
  const [autoApplyHabits, setAutoApplyHabits] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [profileRequestId] = useState(() => crypto.randomUUID());
  const childNameRef = useRef<HTMLInputElement>(null);
  const [childNameError, setChildNameError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStage: AgeStage = getStageFromAge(childAge);
  const stageInfo = getStageInfo(currentStage);
  const stageCopy = copy.stages[currentStage];
  const previewHabits = generateAgeAdaptedHabits(null, currentStage);

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!childName.trim()) {
      setChildNameError(copy.childNameRequired);
      childNameRef.current?.focus();
      return;
    }
    if (!hasConsent) {
      setSubmitError(copy.consentRequired);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    let failureMessage = profileCopy.privacyError;
    try {
      if (currentUser) {
        const response = await fetch('/api/privacy/consent', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ policyVersion: '2026-09-19', childDataConsent: true }),
        });
        if (!response.ok) {
          setSubmitError(profileCopy.privacyError);
          return;
        }

        if (!isPro) {
          failureMessage = extra.trialFailed;
          const trialResult = await activateFreeTrial();
          if (!trialResult.success) {
            setSubmitError(extra.trialFailed);
            return;
          }
        }
      }

      failureMessage = getProfileMutationError(language, { success: false, code: 'profile_mutation_failed' });
      const profileResult = await createProfile({
        name: childName.trim(),
        nickname: childNickname.trim() || `${copy.nicknamePrefix} ${childName.trim().split(/\s+/).pop()}`,
        avatar: childAvatar,
        themeColor: childThemeColor,
        points: 20,
        totalEarned: 20,
        level: 1,
        streak: 1,
        age: childAge,
        birthYear: new Date().getFullYear() - childAge,
        ageStage: autoApplyHabits ? currentStage : undefined,
        showRealNameOnLeaderboard: false,
        isPublicOnLeaderboard: false,
      }, profileRequestId);
      if (!profileResult.success) {
        setSubmitError(getProfileMutationError(language, profileResult));
        return;
      }

      sounds.playLevelUp();
      onClose();
    } catch {
      setSubmitError(failureMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} label={copy.dialogLabel} maxWidth="2xl">
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {copy.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-w-11 min-h-11 flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={copy.close}
            aria-label={copy.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain">
          <form noValidate onSubmit={handleCompleteRegistration} className="space-y-5">
            {/* Child Name & Nickname */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="onboarding-child-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {copy.childNameLabel}
                </label>
                <input
                  ref={childNameRef}
                  id="onboarding-child-name"
                  type="text"
                  required
                  placeholder={copy.childNamePlaceholder}
                  value={childName}
                  onChange={(e) => { setChildName(e.target.value); setChildNameError(null); }}
                  aria-invalid={childNameError ? true : undefined}
                  aria-describedby={childNameError ? 'onboarding-child-name-error' : undefined}
                  className="w-full py-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                {childNameError && <p id="onboarding-child-name-error" role="alert" className="mt-1.5 text-sm font-bold text-rose-700 dark:text-rose-300">{childNameError}</p>}
              </div>

              <div>
                <label htmlFor="onboarding-child-nickname" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {copy.nicknameLabel}
                </label>
                <input
                  id="onboarding-child-nickname"
                  type="text"
                  placeholder={copy.nicknamePlaceholder}
                  value={childNickname}
                  onChange={(e) => setChildNickname(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Age Selector with Dynamic Golden Stage Card */}
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="onboarding-child-age" className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>{copy.ageLabel}</span>
                </label>
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-700 px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-600">
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-300">
                    {childAge}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{copy.ageUnit}</span>
                </div>
              </div>

              {/* Range Slider */}
              <input
                id="onboarding-child-age"
                type="range"
                min={0}
                max={18}
                value={childAge}
                onChange={(e) => setChildAge(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg"
              />

            </div>

            <details className="space-y-5">
              <summary className="min-h-11 cursor-pointer rounded-xl px-3 py-3 text-sm font-bold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300">{copy.customizeMore}</summary>
              {/* Dynamic Stage Banner */}
              <div className={`p-3.5 rounded-2xl bg-gradient-to-r ${stageInfo.color} text-white shadow-sm space-y-1`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{stageInfo.icon}</span>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block opacity-90">
                        {copy.stageLabels[currentStage]} &bull; {stageCopy.title}
                      </span>
                      <h4 className="text-sm font-black">{stageCopy.subtitle}</h4>
                    </div>
                  </div>
                </div>
                <p className="text-xs opacity-95 leading-relaxed pt-1">
                  {stageCopy.summary}
                </p>
              </div>

            {/* Avatar Mascot & Color Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {copy.luckyMascot(getMascotLabel(childAvatar))}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MASCOTS.map((mascot) => (
                  <button
                    key={mascot.id}
                    type="button"
                    onClick={() => {
                      setChildAvatar(mascot.id);
                      setChildThemeColor(mascot.themeColor);
                    }}
                    aria-pressed={childAvatar === mascot.id}
                    className={`relative flex min-h-28 flex-col items-center justify-center rounded-2xl border p-2 transition-all ${
                      childAvatar === mascot.id
                        ? 'border-indigo-600 bg-indigo-50 shadow-sm ring-2 ring-indigo-500/20 dark:bg-indigo-950/30'
                        : 'border-sand-200 bg-white hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-800'
                    }`}
                  >
                    <MascotAvatar avatar={mascot.id} alt="" priority className="h-20 w-20" />
                    <span className="mt-1 text-sm font-extrabold text-sand-900 dark:text-slate-100">{mascot.name}</span>
                    {childAvatar === mascot.id && <span className="absolute right-2 top-2 h-3 w-3 rounded-full bg-indigo-600 ring-2 ring-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview of Age-Adapted Habits Bundle */}
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                    {copy.previewBundle(copy.stageLabels[currentStage])}
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <input
                    type="checkbox"
                    checked={autoApplyHabits}
                    onChange={(e) => setAutoApplyHabits(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{copy.autoLoad}</span>
                </label>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {previewHabits.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{act.icon}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {stageCopy.habitTitles[idx] ?? act.title}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full shrink-0">
                      +{act.points} ⭐
                    </span>
                  </div>
                ))}
              </div>
            </div>

            </details>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(event) => setHasConsent(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-600"
              />
              <span>
                {copy.consent}
              </span>
            </label>
            <p className="text-center text-xs text-slate-600 dark:text-slate-300">{extra.legalTemplate.split(/(\[privacy\]|\[terms\])/).map((part, index) => {
              if (part === '[privacy]') return <Link key={index} href={`${marketingOrigin}/privacy`} target="_blank" className="font-bold text-indigo-700 underline dark:text-indigo-300">{extra.privacy}</Link>;
              if (part === '[terms]') return <Link key={index} href={`${marketingOrigin}/terms`} target="_blank" className="font-bold text-indigo-700 underline dark:text-indigo-300">{extra.terms}</Link>;
              return <React.Fragment key={index}>{part}</React.Fragment>;
            })}</p>

            {submitError && (
              <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                {submitError}
              </p>
            )}

            {/* Action Buttons */}
            <Link href={`${marketingOrigin}/docs`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/30"><BookOpen className="h-4 w-4" />{extra.guide}</Link>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-11 flex-1 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
                <span>{isSubmitting
                  ? copy.saving
                  : currentUser && !isPro
                    ? extra.startTrial
                    : copy.complete}</span>
              </button>
            </div>
          </form>
        </div>
    </ModalShell>
  );
}

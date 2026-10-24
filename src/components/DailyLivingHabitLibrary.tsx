'use client';

import { useRef, useState } from 'react';
import { Check, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { WIT_HABIT_PACKS, type HabitTemplate } from '@/lib/constants';
import {
  dailyLivingStatus,
  getAllDailyLivingTemplates,
  toHabitActivity,
  type DailyLivingStatus,
  type DailyLivingTemplate,
} from '@/lib/daily-living-habits';
import { isDailyLivingTemplateId } from '@/lib/daily-living-habits-id';
import { SUPPORTED_LANGUAGES, useTranslation } from '@/lib/i18n/context';
import {
  getDailyLivingCopy,
  getDailyLivingCue,
  getDailyLivingSupport,
} from '@/lib/i18n/daily-living-copy';
import { localizeWitTemplate } from '@/lib/i18n/wit-template-copy';
import { matchesLegacyTemplateAssignment } from '@/lib/legacy-template-identity';
import { useAppStore } from '@/lib/store';
import type { HabitActivity } from '@/types';

function findLegacyMatchInputs(templateId: string): { item: HabitTemplate; copies: HabitTemplate[] } | undefined {
  for (const pack of WIT_HABIT_PACKS) {
    const index = pack.items.findIndex((item) => item.id === templateId);
    if (index >= 0) {
      const item = pack.items[index];
      return {
        item,
        copies: SUPPORTED_LANGUAGES.map((option) => localizeWitTemplate(item, index, option.code)),
      };
    }
  }
  return undefined;
}

export function findMatchingDailyLivingActivities(
  template: DailyLivingTemplate,
  activities: readonly HabitActivity[],
): HabitActivity[] {
  return activities.filter((activity) => {
    if (isDailyLivingTemplateId(template.id)) {
      return activity.legacyTemplateId === template.id;
    }
    const inputs = findLegacyMatchInputs(template.id);
    return inputs !== undefined && matchesLegacyTemplateAssignment(activity, inputs.item, inputs.copies);
  });
}

export type DailyLivingCardState = {
  readonly status: DailyLivingStatus;
  readonly targetActivity?: HabitActivity;
};

export function resolveDailyLivingCardState(
  template: DailyLivingTemplate,
  scope: string,
  activities: readonly HabitActivity[],
): DailyLivingCardState {
  if (!scope) {
    return { status: 'available' };
  }
  const matching = findMatchingDailyLivingActivities(template, activities);
  if (scope === 'shared') {
    const shared = matching.filter((activity) => activity.childId === null);
    const graduated = shared.find((activity) => Boolean(activity.graduatedAt));
    if (graduated) return { status: 'graduated', targetActivity: graduated };
    const active = shared.find((activity) => activity.isActive);
    if (active) return { status: 'added', targetActivity: active };
    const archived = shared.find((activity) => !activity.isActive && !activity.graduatedAt);
    if (archived) return { status: 'archived', targetActivity: archived };
    return { status: 'available' };
  }

  const status = dailyLivingStatus(template, scope, activities);
  if (status === 'graduated') {
    return {
      status,
      targetActivity: matching.find((activity) => Boolean(activity.graduatedAt) && activity.childId === scope),
    };
  }
  if (status === 'added') {
    return {
      status,
      targetActivity: matching.find((activity) => activity.isActive && activity.childId === scope),
    };
  }
  if (status === 'sharedCovers') {
    return {
      status,
      targetActivity: matching.find((activity) => activity.isActive && activity.childId === null),
    };
  }
  if (status === 'archived') {
    return {
      status,
      targetActivity:
        matching.find((activity) => !activity.isActive && !activity.graduatedAt && activity.childId === scope)
        ?? matching.find((activity) => !activity.isActive && !activity.graduatedAt && activity.childId === null),
    };
  }
  return { status: 'available' };
}

export function DailyLivingHabitLibrary() {
  const { activities, profiles, activeChildId, familyId, createActivities, updateActivity } = useAppStore();
  const { language } = useTranslation();
  const copy = getDailyLivingCopy(language);
  const templates = getAllDailyLivingTemplates();

  const [userChoseScope, setUserChoseScope] = useState(false);
  const [selectedScope, setSelectedScope] = useState<string>(() => (
    activeChildId && profiles.some((profile) => profile.id === activeChildId) ? activeChildId : ''
  ));
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [unconfirmedMessage, setUnconfirmedMessage] = useState<string | null>(null);
  const pendingRef = useRef(false);

  const defaultScope = activeChildId && profiles.some((profile) => profile.id === activeChildId) ? activeChildId : '';
  const effectiveScope = userChoseScope
    ? (selectedScope === 'shared' || profiles.some((profile) => profile.id === selectedScope) ? selectedScope : '')
    : defaultScope;

  const isBusy = pendingId !== null;

  const handleScopeChange = (nextScope: string) => {
    setUserChoseScope(true);
    setSelectedScope(nextScope);
    setSavedMessage(null);
    setUnconfirmedMessage(null);
  };

  const handleAdd = async (template: DailyLivingTemplate): Promise<void> => {
    if (!effectiveScope || pendingRef.current) return;
    pendingRef.current = true;
    setPendingId(template.id);
    setSavedMessage(null);
    setUnconfirmedMessage(null);
    try {
      const childId = effectiveScope === 'shared' ? null : effectiveScope;
      const activity = await toHabitActivity(template, familyId ?? 'local-family', { childId });
      const saved = await createActivities([activity]);
      if (saved) {
        setSavedMessage(copy.savedNotice);
      } else {
        setUnconfirmedMessage(copy.saveUnconfirmedNotice);
      }
    } catch {
      setUnconfirmedMessage(copy.saveUnconfirmedNotice);
    } finally {
      pendingRef.current = false;
      setPendingId(null);
    }
  };

  const handleRestore = async (template: DailyLivingTemplate, targetActivity?: HabitActivity): Promise<void> => {
    if (!targetActivity || pendingRef.current) return;
    pendingRef.current = true;
    setPendingId(template.id);
    setSavedMessage(null);
    setUnconfirmedMessage(null);
    try {
      const saved = await updateActivity(targetActivity.id, { isActive: true });
      if (saved) {
        setSavedMessage(copy.restoreNotice);
      } else {
        setUnconfirmedMessage(copy.saveUnconfirmedNotice);
      }
    } catch {
      setUnconfirmedMessage(copy.saveUnconfirmedNotice);
    } finally {
      pendingRef.current = false;
      setPendingId(null);
    }
  };

  const handlePracticeAgain = async (template: DailyLivingTemplate, targetActivity?: HabitActivity): Promise<void> => {
    if (!targetActivity || pendingRef.current) return;
    pendingRef.current = true;
    setPendingId(template.id);
    setSavedMessage(null);
    setUnconfirmedMessage(null);
    try {
      const saved = await updateActivity(targetActivity.id, { graduatedAt: null, isActive: true });
      if (saved) {
        setSavedMessage(copy.practiceAgainNotice);
      } else {
        setUnconfirmedMessage(copy.saveUnconfirmedNotice);
      }
    } catch {
      setUnconfirmedMessage(copy.saveUnconfirmedNotice);
    } finally {
      pendingRef.current = false;
      setPendingId(null);
    }
  };

  return (
    <section
      data-testid="daily-living-library"
      aria-labelledby="daily-living-library-title"
      className="space-y-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <h4 id="daily-living-library-title" className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              {copy.libraryTitle}
            </h4>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {copy.libraryIntro}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[220px]">
          <label htmlFor="daily-living-child-select" className="block text-xs font-bold text-slate-700 dark:text-slate-200">
            {copy.childSelectLabel}
          </label>
          <select
            id="daily-living-child-select"
            data-testid="daily-living-child-select"
            value={effectiveScope}
            aria-describedby="daily-living-scope-note"
            onChange={(event) => handleScopeChange(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
          >
            <option value="">{copy.childSelectPlaceholder}</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
            <option value="shared">{copy.allFamilyOption}</option>
          </select>
        </div>
      </div>

      <p
        id="daily-living-scope-note"
        data-testid="daily-living-shared-note"
        className={`rounded-2xl border px-4 py-2.5 text-xs font-medium leading-relaxed ${
          effectiveScope === 'shared'
            ? 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-200'
            : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-slate-300'
        }`}
      >
        {copy.allFamilyNote}
      </p>

      {!effectiveScope && (
        <p
          role="status"
          data-testid="daily-living-no-child-notice"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {copy.errorNoChildSelected}
        </p>
      )}

      {unconfirmedMessage && (
        <p
          role="alert"
          data-testid="daily-living-unconfirmed-notice"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {unconfirmedMessage}
        </p>
      )}

      {savedMessage && (
        <p
          role="status"
          aria-live="polite"
          data-testid="daily-living-saved-notice"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          {savedMessage}
        </p>
      )}

      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {templates.map((template) => {
          const { status, targetActivity } = resolveDailyLivingCardState(template, effectiveScope, activities);
          const isPending = pendingId === template.id;
          const supportText = template.support ?? getDailyLivingSupport(template.id, language);
          const cueText = template.cue ?? getDailyLivingCue(template.id, language);
          const primaryHeading = template.source === 'legacy' ? template.shortTitle : template.title;
          const secondaryTitle = template.source === 'legacy' ? template.title : (template.shortTitle !== template.title ? template.shortTitle : null);

          return (
            <li key={template.id} className="flex">
              <article
                data-testid="daily-living-card"
                data-template-id={template.id}
                data-status={status}
                className="flex w-full flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/60"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-2xs dark:bg-zinc-900"
                    >
                      {template.icon}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {copy.timeOfDayLabels[template.timeOfDay]}
                        </span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          +{template.points} ⭐
                        </span>
                        {status === 'graduated' && (
                          <span
                            data-testid="daily-living-graduated-badge"
                            className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          >
                            {copy.graduatedLabel}
                          </span>
                        )}
                      </div>
                      <h5 className="text-base font-extrabold leading-snug text-slate-800 dark:text-slate-100">
                        {primaryHeading}
                      </h5>
                      {secondaryTitle && (
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {secondaryTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {template.id === 'WIT-NUT-01' ? (
                    <p
                      data-testid="hand-washing-note"
                      className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs font-semibold leading-relaxed text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                      {copy.handWashingNote}
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {template.description}
                    </p>
                  )}

                  {supportText && (
                    <details className="group rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                      <summary className="cursor-pointer text-sm font-bold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300">
                        {copy.supportSummary}
                      </summary>
                      <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        <p>{supportText}</p>
                        {cueText && (
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            <span className="font-bold">{copy.cueLabel}</span> {cueText}
                          </p>
                        )}
                      </div>
                    </details>
                  )}

                  {status === 'sharedCovers' && (
                    <p
                      data-testid="daily-living-shared-covers-note"
                      className="text-xs font-semibold text-indigo-700 dark:text-indigo-300"
                    >
                      {copy.sharedCoversNote}
                    </p>
                  )}
                </div>

                {status === 'added' || status === 'sharedCovers' ? (
                  <button
                    type="button"
                    data-testid="daily-living-added"
                    disabled
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800 cursor-not-allowed dark:bg-emerald-950/60 dark:text-emerald-300"
                  >
                    <Check aria-hidden="true" className="h-4 w-4" />
                    {status === 'sharedCovers' ? copy.addedSharedButton : copy.addedButton}
                  </button>
                ) : status === 'archived' ? (
                  <button
                    type="button"
                    data-testid="daily-living-restore"
                    disabled={isBusy}
                    onClick={() => void handleRestore(template, targetActivity)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                  >
                    <RotateCcw aria-hidden="true" className="h-4 w-4" />
                    {isPending ? copy.savingButton : copy.restoreButton}
                  </button>
                ) : status === 'graduated' ? (
                  <button
                    type="button"
                    data-testid="daily-living-practice-again"
                    disabled={isBusy}
                    onClick={() => void handlePracticeAgain(template, targetActivity)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                  >
                    <RotateCcw aria-hidden="true" className="h-4 w-4" />
                    {isPending ? copy.savingButton : copy.practiceAgainButton}
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid="daily-living-add"
                    disabled={!effectiveScope || isBusy}
                    onClick={() => void handleAdd(template)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    {isPending ? copy.savingButton : copy.addButton}
                  </button>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

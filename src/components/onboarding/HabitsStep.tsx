'use client';

import { useTranslation } from '@/lib/i18n/context';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { getOnboardingWizardCopy } from '@/lib/i18n/onboarding-wizard-copy';
import { newHabitLimit } from '@/lib/habit-programs/config';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import {
  isParentRoleStage,
  type StarterHabitChoice,
  type WizardDraft,
  initialDailyHabitSelection,
  isAgeStarterHabitChoice,
  isDailyStarterHabitChoice,
} from '@/lib/onboarding/wizard';
import { generateAgeAdaptedHabits, getStageFromAge } from '@/lib/wit-framework';
import { getTemplatesForSet } from '@/lib/daily-living-habits';

type HabitsStepProps = {
  readonly draft: WizardDraft;
  readonly onChange: (draft: WizardDraft) => void;
};

type HabitSource = 'age' | 'daily';

export function HabitsStep({ draft, onChange }: HabitsStepProps) {
  const { language } = useTranslation();
  const copy = getOnboardingCopy(language);
  const wizard = getOnboardingWizardCopy(language);
  const stage = getStageFromAge(draft.childAge);
  const parentRole = isParentRoleStage(draft.childAge);
  const recommended = newHabitLimit(draft.childAge);
  const showDailyOption = defaultExperienceFlags.dailyLivingHabits && language === 'vi';

  // Determine current source from habits
  const hasDailyHabits = draft.habits.some(isDailyStarterHabitChoice);
  const currentSource: HabitSource = hasDailyHabits ? 'daily' : 'age';

  // Get templates for current source
  const ageTemplates = generateAgeAdaptedHabits(null, stage);
  const dailyTemplates = getTemplatesForSet('DLS-01');
  const templates = currentSource === 'age' ? ageTemplates : dailyTemplates;

  // Count selected habits in current source
  const selectedCount = draft.habits.filter((habit) => habit.selected && 
    (currentSource === 'age' ? isAgeStarterHabitChoice(habit) : isDailyStarterHabitChoice(habit))
  ).length;

  const updateHabit = (habit: StarterHabitChoice, patch: { selected?: boolean; requiresApproval?: boolean }) => {
    onChange({
      ...draft,
      habits: draft.habits.map((h) => {
        if (isAgeStarterHabitChoice(h) && isAgeStarterHabitChoice(habit)) {
          return h.templateIndex === habit.templateIndex ? { ...h, ...patch } : h;
        }
        if (isDailyStarterHabitChoice(h) && isDailyStarterHabitChoice(habit)) {
          return h.templateId === habit.templateId ? { ...h, ...patch } : h;
        }
        return h;
      }),
    });
  };

  const switchSource = (newSource: HabitSource) => {
    if (newSource === currentSource) return;

    if (newSource === 'daily') {
      // Switch to daily: replace age habits with daily habits, preserve age habits for potential switch back
      const ageHabits = draft.habits.filter(isAgeStarterHabitChoice);
      const dailyHabits = initialDailyHabitSelection(draft.childAge);
      onChange({ ...draft, habits: [...ageHabits, ...dailyHabits] });
    } else {
      // Switch to age: remove daily habits, keep age habits
      const ageHabits = draft.habits.filter(isAgeStarterHabitChoice);
      onChange({ ...draft, habits: ageHabits });
    }
  };

  const renderHabitList = () => {
    return (
      <ul className="space-y-1.5" role="list" aria-label={currentSource === 'age' ? wizard.habits.ageOptionLabel : wizard.habits.dailyOptionLabel}>
        {draft.habits
          .filter((habit) => (currentSource === 'age' ? isAgeStarterHabitChoice(habit) : isDailyStarterHabitChoice(habit)))
          .map((habit, index) => {
            const template = templates[index];
            if (!template) return null;
            const inputId = `onboarding-habit-${currentSource}-${isAgeStarterHabitChoice(habit) ? habit.templateIndex : habit.templateId}`;
            return (
              <li
                key={isAgeStarterHabitChoice(habit) ? habit.templateIndex : habit.templateId}
                className={`flex flex-col gap-1 rounded-xl border p-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-2 ${
                  habit.selected
                    ? 'border-indigo-200 bg-white dark:border-indigo-900 dark:bg-zinc-800'
                    : 'border-slate-100 bg-white/60 dark:border-zinc-700 dark:bg-zinc-800/60'
                }`}
              >
                <label htmlFor={inputId} className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2">
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={habit.selected}
                    onChange={(e) => updateHabit(habit, { selected: e.target.checked })}
                    className="h-5 w-5 shrink-0 accent-indigo-600"
                  />
                  <span className="text-base" aria-hidden="true">{template.icon}</span>
                  <span className="min-w-0 font-semibold text-slate-700 dark:text-slate-200">
                    {isAgeStarterHabitChoice(habit) ? copy.stages[stage].habitTitles[habit.templateIndex] ?? template.title : template.title}
                  </span>
                  <span className="ml-auto shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                    +{template.points} ⭐
                  </span>
                </label>
                {!parentRole && currentSource === 'age' && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={habit.requiresApproval}
                    disabled={!habit.selected}
                    onClick={() => updateHabit(habit, { requiresApproval: !habit.requiresApproval })}
                    className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 self-end rounded-xl px-2 sm:self-auto text-xs font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-zinc-700"
                  >
                    <span
                      aria-hidden="true"
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${habit.requiresApproval ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${habit.requiresApproval ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </span>
                    <span>{wizard.habits.approval}</span>
                  </button>
                )}
              </li>
            );
          })}
      </ul>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{wizard.habits.explain}</p>
      {parentRole && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {wizard.habits.parentRole}
        </p>
      )}

      {showDailyOption && (
        <fieldset className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
          <legend className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
            {wizard.habits.title}
          </legend>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="habit-source"
                value="age"
                checked={currentSource === 'age'}
                onChange={() => switchSource('age')}
                className="h-4 w-4 accent-indigo-600"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-200">{wizard.habits.ageOptionLabel}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="habit-source"
                value="daily"
                checked={currentSource === 'daily'}
                onChange={() => switchSource('daily')}
                className="h-4 w-4 accent-indigo-600"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-200">{wizard.habits.dailyOptionLabel}</span>
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            {currentSource === 'age' ? wizard.habits.ageOptionExplain : wizard.habits.dailyOptionExplain}
          </p>
        </fieldset>
      )}

      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-2.5">
        <p className="text-xs font-black text-slate-800 dark:text-slate-100">
          {wizard.habits.counter(selectedCount, recommended)}
        </p>
        {renderHabitList()}
      </div>

      {selectedCount > recommended && (
        <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {wizard.habits.overLimit}
        </p>
      )}
      {selectedCount === 0 && (
        <p role="status" className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-zinc-800 dark:text-slate-200">
          {wizard.habits.none}
        </p>
      )}
    </div>
  );
}

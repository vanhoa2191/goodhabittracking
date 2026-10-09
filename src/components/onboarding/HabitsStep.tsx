'use client';

import { useTranslation } from '@/lib/i18n/context';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { getOnboardingWizardCopy } from '@/lib/i18n/onboarding-wizard-copy';
import { newHabitLimit } from '@/lib/habit-programs/config';
import { isParentRoleStage, type StarterHabitChoice, type WizardDraft } from '@/lib/onboarding/wizard';
import { generateAgeAdaptedHabits, getStageFromAge } from '@/lib/wit-framework';

type HabitsStepProps = {
  readonly draft: WizardDraft;
  readonly onChange: (draft: WizardDraft) => void;
};

export function HabitsStep({ draft, onChange }: HabitsStepProps) {
  const { language } = useTranslation();
  const copy = getOnboardingCopy(language);
  const wizard = getOnboardingWizardCopy(language);
  const stage = getStageFromAge(draft.childAge);
  const templates = generateAgeAdaptedHabits(null, stage);
  const parentRole = isParentRoleStage(draft.childAge);
  const recommended = newHabitLimit(draft.childAge);
  const selectedCount = draft.habits.filter((habit) => habit.selected).length;

  const updateHabit = (templateIndex: number, patch: Partial<StarterHabitChoice>) => {
    onChange({
      ...draft,
      habits: draft.habits.map((habit) => (habit.templateIndex === templateIndex ? { ...habit, ...patch } : habit)),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{wizard.habits.explain}</p>
      {parentRole && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {wizard.habits.parentRole}
        </p>
      )}

      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-2.5">
        <p className="text-xs font-black text-slate-800 dark:text-slate-100">
          {wizard.habits.counter(selectedCount, recommended)}
        </p>
        <ul className="space-y-1.5">
          {draft.habits.map((habit) => {
            const template = templates[habit.templateIndex];
            if (!template) return null;
            const inputId = `onboarding-habit-${habit.templateIndex}`;
            return (
              <li
                key={habit.templateIndex}
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
                    onChange={(e) => updateHabit(habit.templateIndex, { selected: e.target.checked })}
                    className="h-5 w-5 shrink-0 accent-indigo-600"
                  />
                  <span className="text-base" aria-hidden="true">{template.icon}</span>
                  <span className="min-w-0 font-semibold text-slate-700 dark:text-slate-200">
                    {copy.stages[stage].habitTitles[habit.templateIndex] ?? template.title}
                  </span>
                  <span className="ml-auto shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                    +{template.points} ⭐
                  </span>
                </label>
                {!parentRole && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={habit.requiresApproval}
                    disabled={!habit.selected}
                    onClick={() => updateHabit(habit.templateIndex, { requiresApproval: !habit.requiresApproval })}
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

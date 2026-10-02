'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getHabitProgramsCopy } from '@/lib/i18n/habit-programs-copy';
import { createActivityFromFrameworkHabit } from '@/lib/habit-framework/catalog';
import { useLocalizedFramework } from '@/lib/habit-framework/localized';
import { newHabitLimit } from '@/lib/habit-programs/config';
import { cuePlanInputSchema } from '@/lib/habit-programs/cue-plan-input';
import { defaultStartHabitIds, startCueDefaults } from '@/lib/habit-programs/programs';
import type { HabitProgram } from '@/lib/habit-programs/programs';
import { programActivityId } from '@/lib/habit-programs/program-activity-id';
import { settleWithin } from '@/lib/habit-programs/settle-within';
import { fillTemplate } from '@/lib/habit-programs/suggestion-display';
import type { ChildProfile, HabitActivity } from '@/types';
import { HelpTip } from '@/components/help/HelpTip';

type Phase = 'edit' | 'adding' | 'saving' | 'failed';

const STEPS = 3;
const SAVE_WAIT_MS = 10_000;
const REQUEST_LIMIT_MS = 20_000;
const TEMPLATE_KEYS = ['cueTemplate1', 'cueTemplate2', 'cueTemplate3', 'cueTemplate4', 'cueTemplate5'] as const;

type HabitProgramStartModalProps = {
  readonly program: HabitProgram;
  readonly child: ChildProfile;
  readonly ageYears: number;
  readonly onClose: () => void;
  readonly onStarted: () => void;
  /** Adding the habits did not answer as saved. They may still have been added, so nothing is retried here. */
  readonly onNotConfirmed: () => void;
};

/** Three steps: pick where to start, agree on a cue for each habit, confirm. Nothing is saved before the last step. */
export function HabitProgramStartModal({ program, child, ageYears, onClose, onStarted, onNotConfirmed }: HabitProgramStartModalProps) {
  const { activities, createActivities, saveHabitCuePlan } = useAppStore();
  const { language } = useTranslation();
  const framework = useLocalizedFramework(language);
  const habitById = useMemo(() => new Map(framework.habits.map((habit) => [habit.id, habit])), [framework]);
  const copy = getHabitProgramsCopy(language);
  const limit = newHabitLimit(ageYears);
  const childName = child.nickname || child.name;

  const activityFor = (habitId: string): HabitActivity | undefined => activities.find((activity) => (
    activity.isActive && activity.frameworkHabitId === habitId && (activity.childId === child.id || activity.childId === null)
  ));

  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<Phase>('edit');
  const [selected, setSelected] = useState<readonly string[]>(() => (
    defaultStartHabitIds(program, ageYears, new Set(program.habitIds.filter((habitId) => activityFor(habitId))))
  ));
  const [cueTexts, setCueTexts] = useState<Readonly<Record<string, string>>>({});
  const savingRef = useRef(false);

  const chosen = program.habitIds.filter((habitId) => selected.includes(habitId));
  const cuesValid = chosen.length > 0 && chosen.every((habitId) => cuePlanInputSchema.safeParse(startCueDefaults(cueTexts[habitId] ?? '')).success);

  const confirm = async () => {
    if (phase === 'adding' || phase === 'saving') return;
    setPhase('adding');
    const missing = chosen.filter((habitId) => !activityFor(habitId));
    if (missing.length > 0) {
      const additions = await Promise.all(missing.flatMap((habitId) => {
        const habit = habitById.get(habitId);
        if (!habit) return [];
        return [programActivityId(child.id, habitId).then((id) => ({ ...createActivityFromFrameworkHabit(habit, child.id, framework.language), id }))];
      }));
      const created = await settleWithin(createActivities(additions), REQUEST_LIMIT_MS);
      if (!created) {
        onNotConfirmed();
        return;
      }
    }
    setPhase('saving');
  };

  // The new activities reach this component through the store, so cues are saved from the render that can see them.
  useEffect(() => {
    if (phase !== 'saving' || savingRef.current) return;
    const ready = chosen.every((habitId) => activityFor(habitId));
    if (!ready) {
      const timer = window.setTimeout(() => setPhase('failed'), SAVE_WAIT_MS);
      return () => window.clearTimeout(timer);
    }
    savingRef.current = true;
    void (async () => {
      let allSaved = true;
      for (const habitId of chosen) {
        const activity = activityFor(habitId);
        const saved = activity ? await settleWithin(saveHabitCuePlan(activity.id, startCueDefaults(cueTexts[habitId] ?? ''), child.id), REQUEST_LIMIT_MS) : false;
        if (!saved) allSaved = false;
      }
      savingRef.current = false;
      if (allSaved) onStarted();
      else setPhase('failed');
    })();
  });

  const busy = phase === 'adding' || phase === 'saving';
  const fieldClass = 'mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100';
  const titles = [copy.programStep1Title, copy.programStep2Title, copy.programStep3Title];

  return (
    <ModalShell isOpen onClose={busy ? () => undefined : onClose} label={`${program.name} · ${fillTemplate(copy.programsForChild, { child: childName })}`} maxWidth="md">
      <div className="space-y-4 overflow-y-auto p-5 sm:p-6" aria-busy={busy}>
        <div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{fillTemplate(copy.programStepOf, { step: String(step), total: String(STEPS) })}</p>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{program.name}</h2>
          <div className="flex items-center gap-1"><h3 className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{titles[step - 1]}</h3><HelpTip topic="habits.programStart" /></div>
        </div>

        {step === 1 && (
          <fieldset className="space-y-2">
            <legend className="text-sm text-slate-600 dark:text-slate-300">{fillTemplate(copy.programStep1Hint, { child: childName, limit: String(limit) })}</legend>
            {program.habitIds.map((habitId) => {
              const habit = habitById.get(habitId);
              if (!habit) return null;
              return (
                <label key={habitId} className="flex min-h-11 items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-zinc-700">
                  <input
                    type="checkbox"
                    data-habit-id={habitId}
                    checked={selected.includes(habitId)}
                    onChange={(event) => setSelected((previous) => event.target.checked ? [...previous, habitId] : previous.filter((id) => id !== habitId))}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span className="text-slate-800 dark:text-slate-100">
                    <span className="font-bold">{habit.name}</span>
                    {activityFor(habitId) && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{copy.programInUse}</span>}
                    <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">{habit.childMeaning}</span>
                  </span>
                </label>
              );
            })}
            {chosen.length > limit && <p role="status" className="text-xs font-bold text-amber-700 dark:text-amber-300">{fillTemplate(copy.programTooMany, { selected: String(chosen.length), limit: String(limit) })}</p>}
          </fieldset>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">{copy.programStep2Hint}</p>
            {chosen.map((habitId) => {
              const habit = habitById.get(habitId);
              if (!habit) return null;
              return (
                <div key={habitId} className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    {fillTemplate(copy.programCueText, { habit: habit.name })}
                    <input data-cue-for={habitId} value={cueTexts[habitId] ?? ''} maxLength={200} onChange={(event) => setCueTexts((previous) => ({ ...previous, [habitId]: event.target.value }))} className={fieldClass} />
                  </label>
                  <div role="group" aria-label={copy.programCueTemplates} className="flex flex-wrap gap-2">
                    {TEMPLATE_KEYS.map((key) => (
                      <button key={key} type="button" onClick={() => setCueTexts((previous) => ({ ...previous, [habitId]: copy[key] }))} className="min-h-11 rounded-xl border border-indigo-200 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40">{copy[key]}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">{fillTemplate(copy.programStep3Hint, { count: String(chosen.length), child: childName })}</p>
            <ul className="space-y-2">
              {chosen.map((habitId) => (
                <li key={habitId} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-zinc-800/60">
                  <span className="font-bold text-slate-800 dark:text-slate-100">{habitById.get(habitId)?.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">{cueTexts[habitId]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {phase === 'failed' && <p role="alert" className="text-sm font-bold text-rose-600">{copy.programFailed}</p>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={step === 1 ? onClose : () => setStep(step - 1)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold disabled:opacity-50 dark:border-zinc-700">
            {step === 1 ? copy.cueCancel : copy.programBack}
          </button>
          {step < STEPS ? (
            <button type="button" disabled={step === 1 ? chosen.length === 0 : !cuesValid} onClick={() => setStep(step + 1)} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
              {copy.programNext}
            </button>
          ) : (
            <button type="button" data-testid="program-confirm" disabled={busy || !cuesValid} onClick={() => void confirm()} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? copy.programWorking : copy.programConfirm}
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

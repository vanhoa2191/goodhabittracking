'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getHabitProgramsCopy } from '@/lib/i18n/habit-programs-copy';
import { HABIT_FRAMEWORK_CATALOG } from '@/lib/habit-framework/catalog';
import { localDayKey } from '@/lib/habit-fire';
import { programsForAge } from '@/lib/habit-programs/programs';
import type { HabitProgram } from '@/lib/habit-programs/programs';
import { childAgeYears } from '@/lib/habit-programs/summary';
import { fillTemplate } from '@/lib/habit-programs/suggestion-display';
import type { ChildProfile } from '@/types';
import { HabitProgramStartModal } from './HabitProgramStartModal';

const habitNames = new Map(HABIT_FRAMEWORK_CATALOG.map((habit) => [habit.id, habit.name]));

type Target = { readonly program: HabitProgram; readonly child: ChildProfile; readonly ageYears: number };

/** Sets of habits to build step by step, offered per child by age. Starting one never happens without the parent's three steps. */
export function HabitProgramsPanel({ onStarted }: { readonly onStarted: () => void }) {
  const { profiles } = useAppStore();
  const { language } = useTranslation();
  const copy = getHabitProgramsCopy(language);
  const [target, setTarget] = useState<Target | null>(null);
  const today = localDayKey(new Date());

  return (
    <section data-testid="habit-programs" aria-labelledby="habit-programs-title" className="space-y-4">
      <div>
        <h3 id="habit-programs-title" className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{copy.programsTitle}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">{copy.programsIntro}</p>
      </div>
      {profiles.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-300">{copy.programsEmpty}</p>}
      {profiles.map((child) => {
        const ageYears = childAgeYears(child, today);
        const childName = child.nickname || child.name;
        return (
          <div key={child.id} data-child-id={child.id} className="space-y-3">
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-200">{fillTemplate(copy.programsForChild, { child: childName })}</h4>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {programsForAge(ageYears).map((program) => (
                <li key={program.id} data-program-id={program.id} className="flex flex-col justify-between gap-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div>
                    <h5 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{program.name}</h5>
                    <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {program.habitIds.map((habitId) => <li key={habitId}>{habitNames.get(habitId)}</li>)}
                    </ul>
                  </div>
                  <button
                    type="button"
                    data-testid="program-start"
                    onClick={() => setTarget({ program, child, ageYears })}
                    className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {fillTemplate(copy.programStartButton, { child: childName })}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {target && (
        <HabitProgramStartModal
          program={target.program}
          child={target.child}
          ageYears={target.ageYears}
          onClose={() => setTarget(null)}
          onStarted={() => { setTarget(null); onStarted(); }}
        />
      )}
    </section>
  );
}

'use client';

import { useState } from 'react';
import { BookOpen, Edit2, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import type { HabitActivity } from '@/types';
import { getParentPrimaryCopy } from '@/lib/i18n/parent-primary-copy';
import { localizeAgeAdaptedHabit } from '@/lib/i18n/age-habit-copy';
import { localizeDemoActivity } from '@/lib/i18n/demo-content-copy';
import { getActivityMutationError } from '@/lib/i18n/activity-mutation-copy';
import { HabitFrameworkLibrary } from './HabitFrameworkLibrary';
import { LegacyHabitTemplateLibrary } from './LegacyHabitTemplateLibrary';

interface ParentHabitsTabProps {
  onOpenHabit: (habit?: HabitActivity) => void;
  onOpenHandbook: () => void;
}

export function ParentHabitsTab({ onOpenHabit, onOpenHandbook }: ParentHabitsTabProps) {
  const { activities, profiles, deleteActivity } = useAppStore();
  const { t, language } = useTranslation();
  const copy = getParentPrimaryCopy(language);
  const [mutationError, setMutationError] = useState('');

  const removeActivity = async (activityId: string) => {
    setMutationError('');
    const saved = await deleteActivity(activityId);
    if (!saved) setMutationError(getActivityMutationError(language));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">
            {t.manageHabits} ({activities.length})
          </h3>
          <p className="text-xs text-slate-400">{copy.habitsIntro}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenHandbook}
            className="py-2.5 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors transition-transform border border-amber-200 dark:border-amber-800 flex items-center gap-2 active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>{copy.handbook}</span>
          </button>
          <button
            onClick={() => onOpenHabit()}
            className="py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors transition-transform shadow-md flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t.createHabitTitle}
          </button>
        </div>
      </div>

      {mutationError && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {mutationError}
        </div>
      )}

      {language === 'vi'
        ? <HabitFrameworkLibrary onMutationError={setMutationError} />
        : <LegacyHabitTemplateLibrary onMutationError={setMutationError} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activities.map((activity) => {
          const assignedChild = profiles.find((profile) => profile.id === activity.childId);
          const categoryLabel = t[activity.category as keyof typeof t] || activity.category;
          const localized = localizeAgeAdaptedHabit(localizeDemoActivity(activity, language), language);
          return (
            <div key={activity.id} className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/80">{activity.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">{localized.title}</h4>
                  {localized.description && <p className="text-sm text-slate-500 mt-1">{localized.description}</p>}
                  {localized.instructions && <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-2 text-xs text-slate-600 dark:bg-zinc-800 dark:text-slate-300">{localized.instructions}</p>}
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap text-xs font-semibold text-slate-500">
                    <span className="text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">+{activity.points} ⭐</span>
                    <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">{categoryLabel}</span>
                    <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{activity.recurrenceType === 'daily' ? t.daily : activity.recurrenceType === 'weekdays' ? t.weekdays : activity.recurrenceType === 'weekends' ? t.weekends : t.custom}</span>
                    <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{activity.timeOfDay === 'morning' ? t.morning : activity.timeOfDay === 'afternoon' ? t.afternoon : activity.timeOfDay === 'evening' ? t.evening : t.anytime}</span>
                    {assignedChild && <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">{assignedChild.name}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50 dark:border-zinc-800/80">
                <button onClick={() => onOpenHabit(localized)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors" title={t.edit}><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => void removeActivity(activity.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors" title={t.delete}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

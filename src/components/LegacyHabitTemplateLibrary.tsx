'use client';

import { useRef, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { WIT_HABIT_PACKS, type HabitTemplate } from '@/lib/constants';
import { getActivityMutationError } from '@/lib/i18n/activity-mutation-copy';
import { useTranslation } from '@/lib/i18n/context';
import { getParentPrimaryCopy } from '@/lib/i18n/parent-primary-copy';
import { getParentNavigationCopy } from '@/lib/i18n/parent-navigation-copy';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/context';
import { localizeWitTemplate } from '@/lib/i18n/wit-template-copy';
import { useAppStore } from '@/lib/store';
import { useSevenDayCutoff } from '@/lib/use-seven-day-cutoff';

type LegacyHabitTemplateLibraryProps = Readonly<{
  onMutationError: (message: string) => void;
}>;

export function LegacyHabitTemplateLibrary({ onMutationError }: LegacyHabitTemplateLibraryProps) {
  const { activities, logs, createActivity } = useAppStore();
  const { t, language } = useTranslation();
  const copy = getParentPrimaryCopy(language);
  const navigationCopy = getParentNavigationCopy(language);
  const [selectedPackKey, setSelectedPackKey] = useState('nutrition');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const currentPack = WIT_HABIT_PACKS.find((pack) => pack.key === selectedPackKey)
    ?? WIT_HABIT_PACKS[0];

  const getPackTitle = (pack: HabitTemplate['pack']): string => {
    switch (pack) {
      case 'nutrition': return t.witPackNutrition;
      case 'giving': return t.witPackGiving;
      case 'virtue': return t.witPackVirtue;
      case 'mindset': return t.witPackMindset;
      case 'personality': return t.witPackPersonality;
      case 'wisdom': return t.witPackWisdom;
      case 'capacity': return t.witPackCapacity;
      case 'physical': return t.physical;
    }
  };

  const addTemplate = async (template: HabitTemplate, templateIndex: number): Promise<void> => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    const localized = localizeWitTemplate(template, templateIndex, language);
    const templateId = template.id;
    setPendingId(templateId);
    onMutationError('');
    try {
      const saved = await createActivity({
        title: localized.title,
        description: localized.description || '',
        instructions: localized.description || '',
        icon: template.icon,
        category: template.category,
        points: template.points,
        recurrenceType: 'daily',
        recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: template.timeOfDay,
        durationMinutes: template.durationMinutes || 0,
        requiresApproval: Boolean(template.requiresApproval),
        legacyTemplateId: template.id,
        childId: null,
        isActive: true,
      });
      if (!saved) onMutationError(getActivityMutationError(language));
    } catch {
      onMutationError(getActivityMutationError(language));
    } finally {
      pendingRef.current = false;
      setPendingId(null);
    }
  };

  const weekStart = useSevenDayCutoff();

  return (
    <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <span className="rounded-2xl bg-amber-100 p-2 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"><Sparkles className="h-5 w-5" /></span>
        <div>
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{t.witSectionTitle}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-300">{copy.libraryIntro}</p>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {WIT_HABIT_PACKS.map((pack) => {
          const selected = selectedPackKey === pack.key;
          const title = getPackTitle(pack.key);
          return (
            <button key={pack.key} type="button" onClick={() => setSelectedPackKey(pack.key)} className={`shrink-0 rounded-2xl px-3.5 py-2 text-sm font-bold transition-colors ${selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300'}`}>
              {title}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {currentPack.items.map((item, index) => {
          const localized = localizeWitTemplate(item, index, language);
          const templateId = item.id;
          const titles = SUPPORTED_LANGUAGES.map((option) => localizeWitTemplate(item, index, option.code).title);
          const matchingIds = new Set(activities.filter((activity) => activity.legacyTemplateId === templateId
            || (!activity.legacyTemplateId && !activity.frameworkHabitId && titles.includes(activity.title))).map((activity) => activity.id));
          const isAdded = matchingIds.size > 0;
          const completionCount = logs.filter((log) => matchingIds.has(log.activityId)
            && (log.status === 'completed' || log.status === 'approved')
            && weekStart !== null && new Date(log.completedAt).getTime() >= weekStart).length;
          return (
            <article key={templateId} data-template-id={templateId} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/60">
              <div className="space-y-1">
                <p className="font-mono text-xs text-slate-600 dark:text-slate-300">{navigationCopy.activityId}: {templateId}</p>
                <h5 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{localized.title}</h5>
                {localized.description && <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{localized.description}</p>}
                {isAdded && <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{navigationCopy.lastSevenDays(completionCount)}</p>}
              </div>
              <button type="button" disabled={isAdded || pendingId !== null} onClick={() => void addTemplate(item, index)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-600 hover:text-white disabled:cursor-not-allowed disabled:bg-emerald-100 disabled:text-emerald-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:disabled:bg-emerald-950/40 dark:disabled:text-emerald-300">
                <Plus className="h-4 w-4" aria-hidden="true" />{isAdded ? navigationCopy.added : pendingId === templateId ? navigationCopy.adding : copy.addToChild}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { WIT_HABIT_PACKS, type HabitTemplate } from '@/lib/constants';
import { getActivityMutationError } from '@/lib/i18n/activity-mutation-copy';
import { useTranslation } from '@/lib/i18n/context';
import { getParentPrimaryCopy } from '@/lib/i18n/parent-primary-copy';
import { localizeWitTemplate } from '@/lib/i18n/wit-template-copy';
import { useAppStore } from '@/lib/store';

type LegacyHabitTemplateLibraryProps = Readonly<{
  onMutationError: (message: string) => void;
}>;

export function LegacyHabitTemplateLibrary({ onMutationError }: LegacyHabitTemplateLibraryProps) {
  const { createActivity } = useAppStore();
  const { t, language } = useTranslation();
  const copy = getParentPrimaryCopy(language);
  const [selectedPackKey, setSelectedPackKey] = useState('nutrition');
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
    const localized = localizeWitTemplate(template, templateIndex, language);
    onMutationError('');
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
      childId: null,
      isActive: true,
    });
    if (!saved) onMutationError(getActivityMutationError(language));
  };

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
          return (
            <article key={`${currentPack.key}-${localized.title}`} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/60">
              <div className="space-y-1">
                <h5 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{localized.title}</h5>
                {localized.description && <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{localized.description}</p>}
              </div>
              <button type="button" onClick={() => void addTemplate(item, index)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-600">
                <Plus className="h-4 w-4" />{copy.addToChild}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

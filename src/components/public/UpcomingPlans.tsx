'use client';

import { CheckCircle2, Sparkles } from 'lucide-react';
import { UPCOMING_PLAN_IDS } from '@/lib/upcoming-plans';
import { useTranslation } from '@/lib/i18n/context';
import { getUpcomingPlansCopy } from '@/lib/i18n/upcoming-plans-copy';

/** Announces the advanced plans with AI. There is no price and no button that can be pressed: they are not on sale yet. */
export function UpcomingPlans() {
  const { language } = useTranslation();
  const copy = getUpcomingPlansCopy(language);
  return (
    <section data-testid="upcoming-plans" aria-labelledby="upcoming-plans-title" className="mx-auto mt-6 w-full max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles aria-hidden="true" className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
        <h3 id="upcoming-plans-title" className="text-lg font-black text-slate-900 dark:text-white">{copy.heading}</h3>
        <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-black text-white">{copy.badge}</span>
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{copy.note}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {UPCOMING_PLAN_IDS.map((id) => (
          <div key={id} role="group" aria-label={copy.names[id]} data-plan={id} className="flex flex-col rounded-3xl border border-dashed border-indigo-300 bg-indigo-50/40 p-5 dark:border-indigo-800 dark:bg-indigo-950/20">
            <h4 className="text-base font-black text-slate-800 dark:text-slate-100">{copy.names[id]}</h4>
            <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">{copy.periods[id]}</p>
            <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-slate-700 dark:bg-zinc-900 dark:text-slate-200">{copy.priceSoon}</p>
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{copy.includes}</p>
            <ul className="mt-2 flex-1 space-y-2">
              {copy.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />{feature}</li>
              ))}
            </ul>
            <button type="button" disabled aria-disabled="true" className="mt-4 min-h-12 rounded-2xl border border-dashed border-slate-300 bg-slate-100 px-4 text-sm font-black text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300">{copy.button}</button>
          </div>
        ))}
      </div>
    </section>
  );
}

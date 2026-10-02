'use client';

import { PublicMarketingPage } from '@/components/PublicMarketingPage';
import { AGE_JOURNEY_PLANS, JOURNEY_STAGES } from '@/lib/journeys/age-journeys';
import { useTranslation } from '@/lib/i18n/context';
import { getPublicRoadmapsCopy, type PublicRoadmapsCopy } from '@/lib/i18n/public-roadmaps-copy';

type LocalizedPlan = Omit<(typeof AGE_JOURNEY_PLANS)[number], 'title' | 'description'> & PublicRoadmapsCopy['plans'][number];

function JourneyCards({ plans, newHabits }: { readonly plans: readonly LocalizedPlan[]; readonly newHabits: string }) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {plans.map((plan) => (
        <article key={plan.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="flex items-start gap-3"><span aria-hidden="true" className="text-3xl">{plan.icon}</span><div><p className="text-xs font-black uppercase tracking-wide text-indigo-700 dark:text-indigo-300">{plan.period}</p><h3 className="mt-1 text-lg font-black">{plan.title}</h3></div></div>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{plan.description}</p>
          <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">{newHabits}</p>
          <ul className="mt-2 space-y-2">
            {plan.habits.map((habit) => <li key={`${plan.id}-${habit.id}`} className="flex gap-2 text-sm leading-6 text-slate-700 dark:text-slate-300"><span aria-hidden="true">{habit.icon}</span><span>{plan.habit}</span></li>)}
          </ul>
        </article>
      ))}
    </div>
  );
}

export function RoadmapsContent() {
  const { language } = useTranslation();
  const copy = getPublicRoadmapsCopy(language);
  const plans = AGE_JOURNEY_PLANS.map((plan, index) => ({ ...plan, ...copy.plans[index] }));
  return (
    <PublicMarketingPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
    >
      {JOURNEY_STAGES.map((stage, index) => (
        <section key={stage.id} aria-labelledby={`${stage.id}-title`} className={index === 0 ? '' : 'mt-12'}>
          <h2 id={`${stage.id}-title`} className="text-2xl font-black tracking-tight sm:text-3xl">{stage.ageRange} {copy.age} · {copy.stages[index].title}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">{copy.stages[index].adultRole}</p>
          <JourneyCards plans={plans.filter((plan) => plan.ageStageId === stage.id)} newHabits={copy.newHabits} />
        </section>
      ))}
    </PublicMarketingPage>
  );
}

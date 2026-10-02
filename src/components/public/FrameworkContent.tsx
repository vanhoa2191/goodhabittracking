'use client';

import { PublicMarketingPage } from '@/components/PublicMarketingPage';
import { PORTRAITS_16, SEVEN_GIVINGS } from '@/lib/wit-framework';
import { useTranslation } from '@/lib/i18n/context';
import { getPublicFrameworkCopy } from '@/lib/i18n/public-framework-copy';

export function FrameworkContent() {
  const { language } = useTranslation();
  const copy = getPublicFrameworkCopy(language);
  const givings = SEVEN_GIVINGS.map((item, index) => ({ ...item, ...copy.givings[index] }));
  const portraits = PORTRAITS_16.map((item, index) => ({ ...item, ...copy.portraits[index] }));
  return (
    <PublicMarketingPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
    >
      <section aria-labelledby="giving-title">
        <h2 id="giving-title" className="text-2xl font-black tracking-tight sm:text-3xl">{copy.givingTitle}</h2>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{copy.givingDescription}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {givings.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start gap-3"><span aria-hidden="true" className="text-3xl">{item.icon}</span><div><h3 className="font-black">{item.name}</h3><p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{item.subName}</p></div></div>
              <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.meaning}</p>
              <p className="mt-3 rounded-2xl bg-indigo-50 p-3 text-sm font-semibold leading-6 text-slate-800 dark:bg-indigo-950/30 dark:text-slate-200"><strong>{copy.today}</strong> {item.dailyPractice}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="portrait-title" className="mt-12">
        <h2 id="portrait-title" className="text-2xl font-black tracking-tight sm:text-3xl">{copy.portraitTitle}</h2>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{copy.portraitDescription}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {portraits.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-black uppercase tracking-wide text-indigo-700 dark:text-indigo-300">{copy.categories[item.category]}</p>
              <h3 className="mt-2 flex items-center gap-2 text-lg font-black"><span aria-hidden="true">{item.icon}</span>{item.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicMarketingPage>
  );
}

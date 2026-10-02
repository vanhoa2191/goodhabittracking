'use client';

import { PublicMarketingPage } from '@/components/PublicMarketingPage';
import { SCIENCE_PRINCIPLES, SCIENCE_SOURCES } from '@/lib/science-content';
import { useTranslation } from '@/lib/i18n/context';
import { getPublicScienceCopy } from '@/lib/i18n/public-science-copy';

const sourceById = new Map(SCIENCE_SOURCES.map((source) => [source.id, source]));

export function ScienceContent() {
  const { language } = useTranslation();
  const copy = getPublicScienceCopy(language);
  const principles = SCIENCE_PRINCIPLES.map((principle, index) => ({ ...principle, ...copy.principles[index] }));
  return (
    <PublicMarketingPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
    >
      <section aria-labelledby="principles-title">
        <h2 id="principles-title" className="text-2xl font-black tracking-tight sm:text-3xl">{copy.principlesTitle}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {principles.map((principle) => (
            <article key={principle.id} id={principle.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-lg font-black">{principle.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300"><strong>{copy.evidence}</strong> {principle.evidence}</p>
              <p className="mt-3 rounded-2xl bg-indigo-50 p-3 text-sm font-semibold leading-6 text-slate-800 dark:bg-indigo-950/30 dark:text-slate-200"><strong>{copy.action}</strong> {principle.action}</p>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300"><strong>{copy.limit}</strong> {principle.limit}</p>
              <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{copy.source} {principle.sourceIds.map((id, index) => (
                <span key={id}>{index > 0 && ', '}<a href={`#source-${id}`} className="underline underline-offset-2">{sourceById.get(id)?.citation.split('.')[0]}</a></span>
              ))}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="unknowns-title" className="mt-12">
        <h2 id="unknowns-title" className="text-2xl font-black tracking-tight sm:text-3xl">{copy.unknownsTitle}</h2>
        <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
          {copy.unknowns.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section aria-labelledby="sources-title" className="mt-12">
        <h2 id="sources-title" className="text-2xl font-black tracking-tight sm:text-3xl">{copy.sourcesTitle}</h2>
        <ol className="mt-4 max-w-4xl space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
          {SCIENCE_SOURCES.map((source) => (
            <li key={source.id} id={`source-${source.id}`}>
              {source.citation}
              {source.doi && <> <a href={`https://doi.org/${source.doi}`} rel="noopener noreferrer" className="font-semibold underline underline-offset-2">doi:{source.doi}</a></>}
            </li>
          ))}
        </ol>
      </section>
    </PublicMarketingPage>
  );
}

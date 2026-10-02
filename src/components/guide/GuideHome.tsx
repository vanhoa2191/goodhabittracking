'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { GuideSearch } from '@/components/guide/GuideSearch';
import { GuideShell } from '@/components/guide/GuideShell';
import { DocsSection } from '@/components/docs/DocsSection';
import { useTranslation } from '@/lib/i18n/context';
import { getDocsCopy } from '@/lib/i18n/docs-copy';
import { getGuideCopy } from '@/lib/i18n/guide-copy';
import { guideHref } from '@/lib/guide/guide-sections';
import type { GuideIndex } from '@/lib/guide/guide-types';

export function GuideHome({ index }: { readonly index: GuideIndex }) {
  const { language } = useTranslation();
  const copy = getGuideCopy(language);
  const quick = getDocsCopy(language);
  return (
    <GuideShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{copy.title}</h1>
        <p className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-300">{copy.intro}</p>
      </div>

      {language !== 'vi' && (
        <p role="note" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">{copy.vietnameseOnly}</p>
      )}

      <GuideSearch />

      <section aria-labelledby="guide-tasks">
        <h2 id="guide-tasks" className="text-xl font-black">{copy.tasksTitle}</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {copy.tasks.map(([label, slug, anchor]) => (
            <li key={`${slug}#${anchor}`}>
              <Link href={guideHref(slug, anchor)} className="flex min-h-12 items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-800 hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100">{label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="guide-chapters">
        <h2 id="guide-chapters" className="text-xl font-black">{copy.chapters}</h2>
        <ol className="mt-3 grid gap-3 md:grid-cols-2">
          {index.map((entry) => (
            <li key={entry.slug}>
              <Link href={guideHref(entry.slug)} className="flex h-full min-h-24 gap-3 rounded-3xl border border-slate-200 bg-white p-4 hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900">
                <BookOpen aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
                <span>
                  {entry.number && <span className="block text-xs font-bold text-indigo-700 dark:text-indigo-300">{copy.chapterNumber(String(Number(entry.number)))}</span>}
                  <span className="block font-extrabold text-slate-900 dark:text-white">{entry.title}</span>
                  {entry.summary && <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">{entry.summary}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {language !== 'vi' && (
        <section aria-labelledby="guide-quick" className="space-y-4">
          <h2 id="guide-quick" className="text-xl font-black">{copy.quickGuide}</h2>
          <div className="grid gap-4">
            {quick.sections.map(([id, title, body]) => <DocsSection key={id} id={id} title={title}><p>{body}</p></DocsSection>)}
          </div>
        </section>
      )}
    </GuideShell>
  );
}

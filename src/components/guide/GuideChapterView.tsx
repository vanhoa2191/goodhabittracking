'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { GuideContent } from '@/components/guide/GuideContent';
import { GuideSearch } from '@/components/guide/GuideSearch';
import { GuideShell } from '@/components/guide/GuideShell';
import { useLocalizedGuideIndex } from '@/components/guide/use-guide-index';
import { loadGuideChapter } from '@/lib/guide/guide-client';
import { guideHref } from '@/lib/guide/guide-sections';
import type { GuideChapter, GuideIndex, GuideIndexEntry } from '@/lib/guide/guide-types';
import { useTranslation } from '@/lib/i18n/context';
import { getGuideCopy } from '@/lib/i18n/guide-copy';

type Load = { readonly kind: 'loading' } | { readonly kind: 'failed' } | { readonly kind: 'ready'; readonly chapter: GuideChapter };

function scrollToHash(): void {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({ block: 'start' });
}

export function GuideChapterView({ index: vietnameseIndex, entry: vietnameseEntry }: { readonly index: GuideIndex; readonly entry: GuideIndexEntry }) {
  const { language } = useTranslation();
  const { index, locale } = useLocalizedGuideIndex(vietnameseIndex);
  const entry = index.find((candidate) => candidate.slug === vietnameseEntry.slug) ?? vietnameseEntry;
  const copy = getGuideCopy(language);
  const [state, setState] = useState<Load>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const position = index.findIndex((candidate) => candidate.slug === entry.slug);
  const previous = position > 0 ? index[position - 1] : undefined;
  const next = position >= 0 ? index[position + 1] : undefined;

  useEffect(() => {
    let cancelled = false;
    void loadGuideChapter(entry.slug, locale)
      .then((chapter) => { if (!cancelled) setState({ kind: 'ready', chapter }); })
      .catch(() => { if (!cancelled) setState({ kind: 'failed' }); });
    return () => { cancelled = true; };
  }, [entry.slug, locale, attempt]);

  // The text arrives after the page, so the browser cannot jump to a #section by itself.
  useEffect(() => {
    if (state.kind === 'ready') scrollToHash();
  }, [state]);
  useEffect(() => {
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  const retry = useCallback(() => { setState({ kind: 'loading' }); setAttempt((value) => value + 1); }, []);
  const headings = entry.sections.filter((section) => section.level > 0);

  return (
    <GuideShell>
      <GuideSearch />
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label={copy.chapters} className="lg:sticky lg:top-6 lg:self-start">
          <details className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:open:block" open>
            <summary className="min-h-11 cursor-pointer list-none text-sm font-extrabold lg:cursor-default">{copy.allChapters}</summary>
            <ol className="mt-2 space-y-1">
              {index.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={guideHref(item.slug)}
                    aria-current={item.slug === entry.slug ? 'page' : undefined}
                    className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${item.slug === entry.slug ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-zinc-800'}`}
                  >
                    {item.number ? `${Number(item.number)}. ` : ''}{item.title}
                  </Link>
                </li>
              ))}
            </ol>
          </details>
        </nav>

        <article className="min-w-0 space-y-5">
          <header>
            {entry.number && <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{copy.chapterNumber(String(Number(entry.number)))}</p>}
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{entry.title}</h1>
            {entry.summary && <p className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-300">{entry.summary}</p>}
          </header>

          {headings.length > 1 && (
            <nav aria-label={copy.onThisPage} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-extrabold">{copy.onThisPage}</p>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {headings.map((section) => (
                  <li key={section.id} className={section.level === 3 ? 'pl-4' : undefined}>
                    <a href={`#${section.id}`} className="flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-zinc-800">{section.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
            {state.kind === 'loading' && <p role="status" className="text-sm text-slate-600 dark:text-slate-300">{copy.loading}</p>}
            {state.kind === 'failed' && (
              <div role="alert" className="space-y-3">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{copy.loadError}</p>
                <button type="button" onClick={retry} className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">{copy.retry}</button>
              </div>
            )}
            {state.kind === 'ready' && <GuideContent sections={state.chapter.sections} />}
          </div>

          <nav aria-label={copy.chapters} className="flex flex-wrap justify-between gap-3">
            {previous ? (
              <Link href={guideHref(previous.slug)} rel="prev" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-indigo-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-indigo-300"><ChevronLeft aria-hidden="true" className="h-4 w-4" />{copy.previous}: {previous.title}</Link>
            ) : <span />}
            {next && (
              <Link href={guideHref(next.slug)} rel="next" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-indigo-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-indigo-300">{copy.next}: {next.title}<ChevronRight aria-hidden="true" className="h-4 w-4" /></Link>
            )}
          </nav>
        </article>
      </div>
    </GuideShell>
  );
}

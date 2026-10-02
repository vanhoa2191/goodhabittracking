'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { getGuideCopy } from '@/lib/i18n/guide-copy';
import { loadAllGuideChapters } from '@/lib/guide/guide-client';
import { guideHref } from '@/lib/guide/guide-sections';
import { searchGuide, type GuideSearchHit } from '@/lib/guide/guide-search';
import type { GuideChapter } from '@/lib/guide/guide-types';

type State =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'ready'; readonly hits: readonly GuideSearchHit[] };

export function GuideSearch() {
  const { language } = useTranslation();
  const copy = getGuideCopy(language);
  const inputId = useId();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const chapters = useRef<GuideChapter[] | null>(null);
  const request = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    const current = ++request.current;
    if (trimmed.length < 2) return;
    const timer = window.setTimeout(() => {
      const run = (loaded: GuideChapter[]) => {
        if (current === request.current) setState({ kind: 'ready', hits: searchGuide(loaded, trimmed) });
      };
      if (chapters.current) {
        run(chapters.current);
        return;
      }
      setState({ kind: 'loading' });
      void loadAllGuideChapters()
        .then((loaded) => { chapters.current = loaded; run(loaded); })
        .catch(() => { if (current === request.current) setState({ kind: 'failed' }); });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const trimmed = query.trim();
  const showHint = trimmed.length > 0 && trimmed.length < 2;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-extrabold text-slate-700 dark:text-slate-200">{copy.searchLabel}</label>
      <div className="relative mt-2">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); if (event.target.value.trim().length < 2) setState({ kind: 'idle' }); }}
          placeholder={copy.searchPlaceholder}
          autoComplete="off"
          className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white py-2 pl-11 pr-4 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
        />
      </div>
      <div role="status" aria-live="polite" className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        {showHint && copy.searchTooShort}
        {state.kind === 'loading' && trimmed.length >= 2 && copy.searchLoading}
        {state.kind === 'failed' && trimmed.length >= 2 && copy.searchFailed}
        {state.kind === 'ready' && trimmed.length >= 2 && (state.hits.length === 0 ? copy.searchEmpty : copy.searchResults(state.hits.length))}
      </div>
      {state.kind === 'ready' && trimmed.length >= 2 && state.hits.length > 0 && (
        <ul className="mt-2 space-y-2" data-testid="guide-search-results">
          {state.hits.map((hit) => (
            <li key={`${hit.slug}#${hit.sectionId}`}>
              <Link href={guideHref(hit.slug, hit.sectionId)} className="block min-h-11 rounded-2xl border border-slate-200 bg-white p-3 hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="block text-xs font-bold text-indigo-700 dark:text-indigo-300">{hit.chapterTitle}</span>
                <span className="block font-extrabold text-slate-900 dark:text-white">{hit.sectionTitle}</span>
                <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">{hit.snippet}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

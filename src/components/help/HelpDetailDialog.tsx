'use client';

import Link from 'next/link';
import { ArrowLeft, X } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { GuideContent } from '@/components/guide/GuideContent';
import { ModalShell } from '@/components/ui/ModalShell';
import { loadGuideChapter } from '@/lib/guide/guide-client';
import { guideLocaleFor } from '@/lib/guide/guide-locale';
import { guideHref, sectionWithChildren, type GuideTarget } from '@/lib/guide/guide-sections';
import type { GuideChapter } from '@/lib/guide/guide-types';
import { useTranslation } from '@/lib/i18n/context';
import { getGuideCopy } from '@/lib/i18n/guide-copy';

type Props = {
  readonly title: string;
  readonly start: GuideTarget;
  readonly onClose: () => void;
};

type Load = { readonly kind: 'loading' } | { readonly kind: 'failed' } | { readonly kind: 'ready'; readonly chapter: GuideChapter };

/** The part of the guide a "?" points at, shown on top of the screen so the parent keeps their place. */
export function HelpDetailDialog({ title, start, onClose }: Props) {
  const { language } = useTranslation();
  const copy = getGuideCopy(language);
  const locale = guideLocaleFor(language);
  const titleId = useId();
  const [history, setHistory] = useState<readonly GuideTarget[]>([start]);
  const target = history[history.length - 1] as GuideTarget;
  const [loaded, setLoaded] = useState<{ readonly slug: string; readonly result: GuideChapter | 'failed' } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadGuideChapter(target.slug, locale)
      .then((chapter) => { if (!cancelled) setLoaded({ slug: target.slug, result: chapter }); })
      .catch(() => { if (!cancelled) setLoaded({ slug: target.slug, result: 'failed' }); });
    return () => { cancelled = true; };
  }, [target.slug, locale]);

  // Until the chapter named by the current target has arrived, show "loading" (this also covers moving to another chapter).
  const state = useMemo<Load>(() => (
    loaded && loaded.slug === target.slug
      ? (loaded.result === 'failed' ? { kind: 'failed' } : { kind: 'ready', chapter: loaded.result })
      : { kind: 'loading' }
  ), [loaded, target.slug]);

  const sections = useMemo(() => (state.kind === 'ready' && target.anchor ? sectionWithChildren(state.chapter, target.anchor) : []), [state, target.anchor]);
  const heading = history.length > 1 && state.kind === 'ready' ? (sections[0]?.title || state.chapter.title) : title;

  return (
    <ModalShell isOpen onClose={onClose} label={heading} titleId={titleId} maxWidth="2xl" className="flex max-h-[85vh] flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-zinc-800 sm:p-5">
        <div className="flex min-w-0 items-center gap-2">
          {history.length > 1 && (
            <button type="button" onClick={() => setHistory((current) => current.slice(0, -1))} aria-label={copy.helpBack} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-zinc-800">
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </button>
          )}
          <h2 id={titleId} className="text-lg font-black text-slate-900 dark:text-white">{heading}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label={copy.helpClose} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-zinc-800">
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {state.kind === 'loading' && <p role="status" className="text-sm text-slate-600 dark:text-slate-300">{copy.helpLoading}</p>}
        {state.kind === 'failed' && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{copy.helpDetailsUnavailable}</p>}
        {state.kind === 'ready' && (
          // Links to other parts of the guide open in this window; the full guide page stays one tap away.
          <GuideContent
            sections={target.anchor ? sections : state.chapter.sections}
            onGuideLink={(slug, anchor) => { setHistory((current) => [...current, { slug, anchor }]); return true; }}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-zinc-800 sm:p-5">
        <Link href={guideHref(target.slug, target.anchor)} onClick={onClose} className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">{copy.helpOpenFull}</Link>
        <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-zinc-800">{copy.helpClose}</button>
      </div>
    </ModalShell>
  );
}

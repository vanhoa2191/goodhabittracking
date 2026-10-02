'use client';

import { getAgeThemeCopy } from '@/lib/i18n/age-theme-copy';
import type { Language } from '@/types';
import type { AgeTheme } from './useAgeTheme';

const buttonClass = 'min-h-11 rounded-xl border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';

/** Said once when the screen is first tuned to age: the child (and a parent beside them) can keep the old look. */
export function AgeThemeNotice({ theme, language }: { readonly theme: AgeTheme; readonly language: Language }) {
  const copy = getAgeThemeCopy(language);
  const teen = theme.band === 'teen';
  return (
    <section
      role="region"
      aria-labelledby="age-theme-notice-title"
      data-testid="age-theme-notice"
      className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-slate-800 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-slate-100"
    >
      <h2 id="age-theme-notice-title" className="text-base font-extrabold">{copy.noticeTitle}</h2>
      <p className="mt-1 text-sm">{teen ? copy.noticeBodyTeen : copy.noticeBody}</p>
      {teen && <p className="mt-3 text-sm font-bold">{copy.styleQuestion}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {teen ? (
          <>
            <button type="button" onClick={() => theme.pickTeenStyle('compact')} className={`${buttonClass} border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700`}>{copy.styleCompact}</button>
            <button type="button" onClick={() => theme.pickTeenStyle('companion')} className={`${buttonClass} border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-100 dark:bg-zinc-900 dark:text-indigo-100`}>{copy.styleCompanion}</button>
          </>
        ) : (
          <button type="button" onClick={theme.useNewLook} className={`${buttonClass} border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700`}>{copy.useNew}</button>
        )}
        <button type="button" onClick={theme.keepOldLook} className={`${buttonClass} border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100`}>{copy.keepOld}</button>
      </div>
    </section>
  );
}

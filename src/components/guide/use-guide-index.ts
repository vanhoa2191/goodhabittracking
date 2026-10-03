'use client';

import { useEffect, useState } from 'react';
import { loadGuideIndex } from '@/lib/guide/guide-client';
import { guideLocaleFor, type GuideLocale } from '@/lib/guide/guide-locale';
import type { GuideIndex } from '@/lib/guide/guide-types';
import { useTranslation } from '@/lib/i18n/context';

/**
 * The chapter list in the reader's language. The page arrives with the Vietnamese list (so it can be drawn on the
 * server); a translated list replaces it as soon as it has loaded.
 */
export function useLocalizedGuideIndex(vietnamese: GuideIndex): { readonly index: GuideIndex; readonly locale: GuideLocale } {
  const { language } = useTranslation();
  const locale = guideLocaleFor(language);
  const [loaded, setLoaded] = useState<{ readonly locale: GuideLocale; readonly index: GuideIndex } | null>(null);

  useEffect(() => {
    if (locale === 'vi') return;
    let cancelled = false;
    void loadGuideIndex(locale)
      .then((index) => { if (!cancelled) setLoaded({ locale, index }); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [locale]);

  return { index: locale !== 'vi' && loaded?.locale === locale ? loaded.index : vietnamese, locale };
}

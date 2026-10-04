import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Language } from '@/types';

let language: Language = 'vi';
vi.mock('@/lib/i18n/context', () => ({ useTranslation: () => ({ language }) }));

import { ParentDashboardSkeleton } from '@/components/ParentDashboardSkeleton';
import { appEntryCopy } from '@/lib/i18n/app-entry-copy';

const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

describe('parent dashboard skeleton', () => {
  it.each(languages)('announces the wait as a status in %s and hides the pulsing blocks from assistive technology', (code) => {
    language = code;
    const html = renderToStaticMarkup(createElement(ParentDashboardSkeleton));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(appEntryCopy[code].loading);
    expect(html.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('only pulses when the device does not ask for reduced motion', () => {
    language = 'en';
    const html = renderToStaticMarkup(createElement(ParentDashboardSkeleton));
    expect(html).toContain('motion-safe:animate-pulse');
    expect(html).not.toMatch(/(?<!motion-safe:)animate-pulse/);
  });

  it('keeps the height of the area it stands in for so the page does not jump', () => {
    language = 'en';
    expect(renderToStaticMarkup(createElement(ParentDashboardSkeleton))).toContain('min-h-[60vh]');
  });
});

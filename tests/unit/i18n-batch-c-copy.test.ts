import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Language } from '@/types';
import * as contact from '@/lib/i18n/public-contact-copy';
import * as pricing from '@/lib/i18n/public-pricing-copy';
import * as framework from '@/lib/i18n/public-framework-copy';
import * as science from '@/lib/i18n/public-science-copy';
import * as roadmaps from '@/lib/i18n/public-roadmaps-copy';
import * as shell from '@/lib/i18n/public-shell-copy';
import * as errorCopy from '@/lib/i18n/public-error-copy';
import { ContactContent } from '@/components/public/ContactContent';
import { PricingContent } from '@/components/public/PricingContent';
import { FrameworkContent } from '@/components/public/FrameworkContent';
import { ScienceContent } from '@/components/public/ScienceContent';
import { RoadmapsContent } from '@/components/public/RoadmapsContent';
import ErrorBoundary from '@/app/error';
import { LegalDocument } from '@/components/LegalDocument';
import { PORTRAITS_16, SEVEN_GIVINGS } from '@/lib/wit-framework';
import { SCIENCE_PRINCIPLES, SCIENCE_SOURCES, SCIENCE_UNKNOWNS } from '@/lib/science-content';
import { AGE_JOURNEY_PLANS, JOURNEY_STAGES } from '@/lib/journeys/age-journeys';
import { PRICING_PLANS } from '@/lib/payos';
import { formatCurrency } from '@/lib/i18n/formatters';

const locale = vi.hoisted(() => ({ language: 'vi' as Language }));
vi.mock('@/lib/i18n/context', () => ({
  useTranslation: () => ({ language: locale.language }),
}));

const languages: readonly Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const vietnameseOnly = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const placeholder = /\$\{[^}]*\}|\{\{?\s*[\w.]+\s*\}?\}|\b(?:TODO|TBD|PLACEHOLDER)\b/;
const modules = [
  { name: 'contact', copy: contact.COPY, get: contact.getPublicContactCopy },
  { name: 'pricing', copy: pricing.COPY, get: pricing.getPublicPricingCopy },
  { name: 'framework', copy: framework.COPY, get: framework.getPublicFrameworkCopy },
  { name: 'science', copy: science.COPY, get: science.getPublicScienceCopy },
  { name: 'roadmaps', copy: roadmaps.COPY, get: roadmaps.getPublicRoadmapsCopy },
  { name: 'shell', copy: shell.COPY, get: shell.getPublicShellCopy },
  { name: 'error', copy: errorCopy.COPY, get: errorCopy.getPublicErrorCopy },
];

function checkCopy(value: unknown, original: unknown, language: Language, path: string): void {
  if (typeof value === 'string') {
    expect(value.trim(), path).not.toBe('');
    expect(value, path).not.toMatch(placeholder);
    if (language !== 'vi') expect(value, path).not.toMatch(vietnameseOnly);
    const slots = (text: string) => text.match(/\[[a-z]+\]/g) ?? [];
    expect(slots(value), path).toEqual(slots(String(original)));
  } else if (Array.isArray(value)) {
    expect(Array.isArray(original), path).toBe(true);
    const source = original as unknown[];
    expect(value.length, path).toBe(source.length);
    expect(value.length, path).toBeGreaterThan(0);
    value.forEach((entry, index) => checkCopy(entry, source[index], language, `${path}.${index}`));
  } else {
    expect(value !== null && typeof value === 'object', path).toBe(true);
    const entries = Object.entries(value as Record<string, unknown>);
    expect(entries.length, path).toBeGreaterThan(0);
    expect(Object.keys(value as object).sort(), path).toEqual(Object.keys(original as object).sort());
    for (const [key, entry] of entries) {
      checkCopy(entry, (original as Record<string, unknown>)[key], language, `${path}.${key}`);
    }
  }
}

describe.each(modules)('$name public copy', ({ name, copy, get }) => {
  it('contains exactly nine languages', () => {
    expect(Object.keys(copy).sort()).toEqual([...languages].sort());
  });

  it.each(languages)('has complete copy, matching shape and resolved link slots in %s', (language) => {
    expect(get(language)).toBe(copy[language]);
    checkCopy(copy[language], copy.vi, language, `${name}.${language}`);
  });
});

function render(element: ReactElement, language: Language): string {
  locale.language = language;
  return renderToStaticMarkup(element);
}

function escaped(text: string): string {
  return renderToStaticMarkup(createElement('span', null, text)).slice(6, -7);
}

const surfaces = [
  { name: 'contact', element: () => createElement(ContactContent, { approved: false, supportEmail: null }), title: (l: Language) => contact.COPY[l].title },
  { name: 'pricing', element: () => createElement(PricingContent, { isVietnam: true }), title: (l: Language) => pricing.COPY[l].title },
  { name: 'framework', element: () => createElement(FrameworkContent), title: (l: Language) => framework.COPY[l].title },
  { name: 'science', element: () => createElement(ScienceContent), title: (l: Language) => science.COPY[l].title },
  { name: 'roadmaps', element: () => createElement(RoadmapsContent), title: (l: Language) => roadmaps.COPY[l].title },
  { name: 'error', element: () => createElement(ErrorBoundary, { error: Object.assign(new Error('private details'), { digest: 'SUPPORT-17' }), reset: () => undefined }), title: (l: Language) => errorCopy.COPY[l].title },
];

describe.each(surfaces)('$name rendering', ({ element, title }) => {
  it.each(languages)('uses the selected %s language in the actual component and its shell', (language) => {
    const html = render(element(), language);
    expect(html).toContain(escaped(title(language)));
    if (html.includes('<footer')) {
      const footer = html.slice(html.indexOf('<footer'));
      for (const key of ['pricing', 'framework', 'science', 'roadmaps', 'guide'] as const) {
        expect(footer).toContain(escaped(shell.COPY[language][key]));
      }
      expect(footer).toContain(escaped(shell.COPY[language].footerNav));
    }
    expect(html).not.toMatch(placeholder);
    expect(html).not.toContain('[docs]');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    if (language !== 'vi') expect(html).not.toMatch(vietnameseOnly);
  });
});

describe('public content contracts', () => {
  it.each(languages)('renders only the support code and localized retry action in %s', (language) => {
    const html = render(createElement(ErrorBoundary, {
      error: Object.assign(new Error('private details'), { digest: 'SUPPORT-17' }),
      reset: () => undefined,
    }), language);
    expect(html).toContain('SUPPORT-17');
    expect(html).toContain(escaped(errorCopy.COPY[language].retry));
    expect(html).not.toContain('private details');
    const fallback = render(createElement(ErrorBoundary, { error: new Error('private details'), reset: () => undefined }), language);
    expect(fallback).toContain('LOCAL-ERROR');
  });

  it.each(languages)('renders the contact link, mailbox and publication gate in %s', (language) => {
    const draft = render(createElement(ContactContent, { approved: false, supportEmail: null }), language);
    expect(draft).toContain(escaped(contact.COPY[language].docsLabel));
    expect(draft).toContain('href="/docs"');
    expect(draft).toContain(escaped(contact.COPY[language].unconfigured));
    expect(draft).toContain(escaped(shell.COPY[language].draft));
    expect(draft).not.toContain('mailto:');
    const approved = render(createElement(ContactContent, { approved: true, supportEmail: 'support@example.test' }), language);
    expect(approved).toContain(`href="mailto:support@example.test?subject=${encodeURIComponent(contact.COPY[language].subject)}"`);
    expect(approved).not.toContain(escaped(shell.COPY[language].draft));
    expect(approved).not.toContain(escaped(contact.COPY[language].unconfigured));
  });

  it.each(languages)('keeps prices, trial, renewal and country payment routing in %s', (language) => {
    const html = render(createElement(PricingContent, { isVietnam: true }), language);
    expect(html.match(/<article\b/g)).toHaveLength(4);
    expect(html.match(/href="\/\?pricing=1"/g)).toHaveLength(4);
    expect(html).toContain(escaped(pricing.COPY[language].renewalTitle));
    expect(pricing.COPY[language].description).toContain('7');
    for (const plan of PRICING_PLANS.filter((p) => p.price > 0)) {
      expect(html).toContain(escaped(formatCurrency(plan.price, language, language === 'vi' ? 'VN' : 'UNAVAILABLE')));
    }
    expect(html).toContain(escaped(formatCurrency(708000, language, language === 'vi' ? 'VN' : 'UNAVAILABLE')));
    const international = render(createElement(PricingContent, { isVietnam: false }), language);
    expect(international.match(/href="\/\?demo=1"/g)).toHaveLength(4);
    expect(international).not.toContain('href="/?pricing=1"');
  });

  it('preserves the authored Vietnamese framework and science content', () => {
    expect(framework.COPY.vi.givings).toEqual(SEVEN_GIVINGS.map(({ name, subName, meaning, dailyPractice }) => ({ name, subName, meaning, dailyPractice })));
    expect(framework.COPY.vi.portraits).toEqual(PORTRAITS_16.map(({ name, summary }) => ({ name, summary })));
    expect(science.COPY.vi.principles).toEqual(SCIENCE_PRINCIPLES.map(({ title, evidence, action, limit }) => ({ title, evidence, action, limit })));
    expect(science.COPY.vi.unknowns).toEqual(SCIENCE_UNKNOWNS);
    expect(roadmaps.COPY.vi.stages).toEqual(JOURNEY_STAGES.map((stage) => ({ title: stage.title.vi, adultRole: stage.adultRole.vi })));
    expect(roadmaps.COPY.vi.plans).toEqual(AGE_JOURNEY_PLANS.map((plan) => ({ title: plan.title.vi, description: plan.description.vi, habit: plan.habits[0].title, period: plan.periodLabel })));
  });

  it.each(languages)('preserves science citations, reference anchors and heading structure in %s', (language) => {
    const html = render(createElement(ScienceContent), language);
    expect(html.match(/<article\b/g)).toHaveLength(7);
    expect(html).toContain('id="sources-title"');
    expect(html).toContain('id="unknowns-title"');
    for (const source of SCIENCE_SOURCES) {
      expect(html).toContain(escaped(source.citation));
      expect(html).toContain(`id="source-${source.id}"`);
      expect(html).toContain(`href="#source-${source.id}"`);
      expect(html).toContain(`href="https://doi.org/${source.doi}"`);
    }
    const frameworkHtml = render(createElement(FrameworkContent), language);
    expect(frameworkHtml.match(/<article\b/g)).toHaveLength(23);
    const roadmapsHtml = render(createElement(RoadmapsContent), language);
    expect(roadmapsHtml.match(/<article\b/g)).toHaveLength(15);
    for (const stage of JOURNEY_STAGES) expect(roadmapsHtml).toContain(`id="${stage.id}-title"`);
  });

  it.each(languages)('translates only the legal update label and preserves authored content in %s', (language) => {
    const html = render(createElement(LegalDocument, {
      sections: [{ title: 'Điều khoản nguyên bản', blocks: ['Liên hệ support@example.test', ['Không tự động gia hạn', 'Hoàn tiền 30 ngày']] }],
      updatedLabel: '01/10/2026', supportEmail: 'support@example.test',
    }), language);
    expect(html).toContain(escaped(shell.COPY[language].updated));
    for (const text of ['Điều khoản nguyên bản', 'Không tự động gia hạn', 'Hoàn tiền 30 ngày', '01/10/2026']) {
      expect(html).toContain(escaped(text));
    }
    expect(html).toContain('href="mailto:support@example.test"');
  });
});

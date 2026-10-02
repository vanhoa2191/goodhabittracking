import { createElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HabitActivity, Language } from '@/types';
import * as footer from '@/lib/i18n/app-footer-copy';
import * as scanner from '@/lib/i18n/child-qr-scanner-copy';
import * as profilePrompt from '@/lib/i18n/customer-profile-prompt-copy';
import * as trial from '@/lib/i18n/start-trial-entry-copy';
import * as task from '@/lib/i18n/task-details-copy';
import * as achievement from '@/lib/i18n/achievement-share-copy';
import * as pwa from '@/lib/i18n/pwa-install-copy';
import * as account from '@/lib/i18n/account-profile-copy';
import { ChildQrScanner } from '@/components/ChildQrScanner';
import { TaskDetailsModal } from '@/components/TaskDetailsModal';

const locale = vi.hoisted(() => ({ language: 'vi' as Language }));
vi.mock('@/lib/i18n/context', () => ({
  useTranslation: () => ({ language: locale.language, t: { close: 'Close', needApproval: 'Approval' } }),
}));

const languages: readonly Language[] = ['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'it', 'es'];
const vietnameseOnly = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const placeholder = /\$\{[^}]*\}|\{\{?\s*[\w.]+\s*\}?\}/;
const modules = [
  { name: 'footer', copy: footer.COPY, get: footer.getAppFooterCopy },
  { name: 'scanner', copy: scanner.COPY, get: scanner.getChildQrScannerCopy },
  { name: 'profilePrompt', copy: profilePrompt.COPY, get: profilePrompt.getCustomerProfilePromptCopy },
  { name: 'trial', copy: trial.COPY, get: trial.getStartTrialEntryCopy },
  { name: 'task', copy: task.COPY, get: task.getTaskDetailsCopy },
  { name: 'achievement', copy: achievement.COPY, get: achievement.getAchievementShareCopy },
  { name: 'pwa', copy: pwa.COPY, get: pwa.getPwaInstallCopy },
  { name: 'account', copy: account.COPY, get: account.getAccountProfileCopy },
];

const functionSamples: Record<string, readonly (readonly (string | number)[])[]> = {
  'profilePrompt.supportCode': [['SUPPORT-17'], ['REQUEST-83']],
  'task.duration': [[0], [1], [27]],
};

function structure(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(structure);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, structure(entry)]));
  }
  return typeof value;
}

function checkCopy(value: unknown, language: Language, path: string): void {
  const label = `${language}.${path}`;
  if (typeof value === 'function') {
    const samples = functionSamples[path];
    expect(samples, `Missing signature-specific samples for ${path}`).toBeDefined();
    for (const args of samples ?? []) {
      const output: unknown = value(...args);
      checkCopy(output, language, `${path}(${args.join(',')})`);
      for (const arg of args) expect(output, label).toContain(String(arg));
    }
  } else if (typeof value === 'string') {
    expect(value.trim(), label).not.toBe('');
    expect(value, label).not.toMatch(placeholder);
    if (language !== 'vi') expect(value, label).not.toMatch(vietnameseOnly);
  } else if (Array.isArray(value)) {
    expect(value.length, label).toBeGreaterThan(0);
    value.forEach((entry, index) => checkCopy(entry, language, `${path}.${index}`));
  } else {
    expect(value !== null && typeof value === 'object', label).toBe(true);
    const entries = Object.entries(value as Record<string, unknown>);
    expect(entries.length, label).toBeGreaterThan(0);
    for (const [key, entry] of entries) checkCopy(entry, language, `${path}.${key}`);
  }
}

describe.each(modules)('$name copy', ({ name, copy, get }) => {
  it('contains exactly the nine supported locales', () => {
    expect(Object.keys(copy).sort()).toEqual([...languages].sort());
  });

  it.each(languages)('has complete, resolved copy and the same recursive shape in %s', (language) => {
    expect(get(language)).toBe(copy[language]);
    expect(structure(copy[language])).toEqual(structure(copy.vi));
    checkCopy(copy[language], language, name);
  });
});

const activity: HabitActivity = {
  id: 'habit-1', childId: null, title: 'Sample habit', instructions: 'Sample instructions',
  icon: '⭐', category: 'health', points: 5, recurrenceType: 'daily', recurrenceDays: [],
  timeOfDay: 'morning', durationMinutes: 27, requiresApproval: true, isActive: true, createdAt: '2026-01-01',
};

describe('localized component rendering', () => {
  it.each(languages)('renders the real scanner opening status in %s', (language) => {
    locale.language = language;
    const html = renderToStaticMarkup(createElement(ChildQrScanner, { onCancel: () => undefined, onDetected: () => undefined }));
    expect(html).toContain(renderToStaticMarkup(createElement('span', null, scanner.getChildQrScannerCopy(language).openingCamera)).slice(6, -7));
    expect(html).toContain('role="status"');
    if (language !== 'vi') expect(html).not.toMatch(vietnameseOnly);
  });

  it.each(languages)('wires task labels, fallback description and duration in %s', (language) => {
    locale.language = language;
    const shell = TaskDetailsModal({ activity, onClose: () => undefined }) as ReactElement<{ label: string; children: ReactNode }>;
    const copy = task.getTaskDetailsCopy(language);
    expect(shell.props.label).toBe(copy.title);
    const html = renderToStaticMarkup(createElement('div', null, shell.props.children));
    for (const text of [copy.meaning, copy.description, copy.instructions, copy.duration(27), activity.title, activity.instructions!]) {
      const escaped = renderToStaticMarkup(createElement('span', null, text)).slice(6, -7);
      expect(html).toContain(escaped);
    }
    if (language !== 'vi') expect(html).not.toMatch(vietnameseOnly);
  });
});

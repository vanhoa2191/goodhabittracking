import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { LANGUAGE_PREFERENCE_KEY } from '@/lib/i18n/language-detection';
import { middleware } from '@/middleware';
import type { Language } from '@/types';

const languages: Language[] = ['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'it', 'es'];
const publicFile = (name: string) => readFileSync(join(process.cwd(), 'public', name), 'utf8');
const script = publicFile('offline.js');
const page = publicFile('offline.html');

type Page = { lang: string; title: string; heading: string; body: string; retry: string; reloaded: boolean };

function runOfflineScript(env: { cookie?: string; stored?: string | null; languages?: string[]; storageThrows?: boolean }): Page {
  const nodes = {
    'offline-heading': { textContent: 'h' },
    'offline-body': { textContent: 'b' },
    'offline-retry': { textContent: 'r' },
  };
  const state: Page = { lang: 'vi', title: 't', heading: '', body: '', retry: '', reloaded: false };
  let submit: ((event: { preventDefault: () => void }) => void) | undefined;
  const form = { addEventListener: (_name: string, handler: typeof submit) => { submit = handler; } };
  const document = {
    cookie: env.cookie ?? '',
    documentElement: state as unknown as { lang: string },
    set title(value: string) { state.title = value; },
    getElementById: (id: string) => (id === 'offline-form' ? form : nodes[id as keyof typeof nodes] ?? null),
  };
  const localStorage = {
    getItem: () => {
      if (env.storageThrows) throw new Error('blocked');
      return env.stored ?? null;
    },
  };
  vm.runInNewContext(script, {
    document,
    localStorage,
    navigator: { languages: env.languages ?? [], language: env.languages?.[0] },
    location: { reload: () => { state.reloaded = true; } },
  });
  state.heading = nodes['offline-heading'].textContent;
  state.body = nodes['offline-body'].textContent;
  state.retry = nodes['offline-retry'].textContent;
  submit?.({ preventDefault: vi.fn() });
  return state;
}

describe('offline page localization', () => {
  it('ships a dictionary with every language and every key', () => {
    for (const language of languages) {
      const entry = new RegExp(`\\b${language}: \\{ title: '([^']+)', heading: '([^']+)', body: '([^']+)', retry: '([^']+)' \\}`).exec(script);
      expect(entry, `dictionary entry for ${language}`).not.toBeNull();
    }
  });

  it('uses the same storage key as the app', () => {
    expect(script).toContain(`'${LANGUAGE_PREFERENCE_KEY}'`);
  });

  it.each(languages)('renders %s from the saved cookie with its own text', (language) => {
    const result = runOfflineScript({ cookie: `a=1; ${LANGUAGE_PREFERENCE_KEY}=${language}; b=2`, languages: ['vi-VN'] });
    expect(result.lang).toBe(language);
    for (const value of [result.title, result.heading, result.body, result.retry]) {
      expect(value.trim().length).toBeGreaterThan(1);
    }
    expect(result.title).toContain('KidHabit Hero');
  });

  it('gives all nine languages different headings', () => {
    const headings = languages.map((language) => runOfflineScript({ cookie: `${LANGUAGE_PREFERENCE_KEY}=${language}` }).heading);
    expect(new Set(headings).size).toBe(languages.length);
  });

  it('falls back from cookie to local storage to the browser language, then to Vietnamese', () => {
    expect(runOfflineScript({ stored: 'ja', languages: ['en-US'] }).lang).toBe('ja');
    expect(runOfflineScript({ cookie: `${LANGUAGE_PREFERENCE_KEY}=de`, stored: 'ja' }).lang).toBe('de');
    expect(runOfflineScript({ languages: ['pt-BR', 'ko-KR', 'en'] }).lang).toBe('ko');
    expect(runOfflineScript({ languages: ['pt-BR'] }).lang).toBe('vi');
    expect(runOfflineScript({}).lang).toBe('vi');
  });

  it('ignores an unknown saved value and a blocked storage', () => {
    expect(runOfflineScript({ cookie: `${LANGUAGE_PREFERENCE_KEY}=xx`, languages: ['fr-CA'] }).lang).toBe('fr');
    expect(runOfflineScript({ storageThrows: true, languages: ['es-MX'] }).lang).toBe('es');
  });

  it('reloads when the retry form is submitted', () => {
    expect(runOfflineScript({}).reloaded).toBe(true);
  });

  it('keeps the Vietnamese page readable without the script and loads it only from the same origin', () => {
    expect(page).toContain('<html lang="vi">');
    expect(page).toContain('Bạn đang ngoại tuyến');
    expect(page).toContain('Thử lại');
    expect(page).toContain('<script src="/offline.js"></script>');
    expect(page).not.toMatch(/<script(?![^>]*\bsrc=)/i);
    expect(page).not.toMatch(/\son[a-z]+=/i);
    for (const id of ['offline-heading', 'offline-body', 'offline-retry', 'offline-form']) {
      expect(page).toContain(`id="${id}"`);
    }
  });

  it('is cached by the service worker so it works offline', () => {
    const worker = publicFile('sw.js');
    expect(worker).toContain("'/offline.html'");
    expect(worker).toContain("'/offline.js'");
  });

  it('may run its own script under the content policy, without opening the rest', () => {
    const policyOf = (path: string) => middleware(new NextRequest(`https://app.kidhabithero.com${path}`)).headers.get('Content-Security-Policy') ?? '';
    const offline = policyOf('/offline.html');
    expect(offline).toContain("script-src 'self';");
    const scriptDirective = offline.split('; ').find((directive) => directive.startsWith('script-src')) ?? '';
    expect(scriptDirective).not.toContain('unsafe-inline');
    expect(scriptDirective).not.toContain('unsafe-eval');
    expect(policyOf('/')).toContain("'strict-dynamic'");
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { frameworkLanguageFor, loadFramework } from '@/lib/habit-framework/localized';

afterEach(() => vi.unstubAllGlobals());

describe('framework translations are static files, not bundled code', () => {
  it('fetches the reader\'s language from /data and parses it', async () => {
    const requested: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      requested.push(url);
      const file = resolve('public', url.replace(/^\//, ''));
      return new Response(readFileSync(file, 'utf8'), { status: 200 });
    }));

    const framework = await loadFramework('ja');

    expect(requested).toEqual(['/data/habit-framework-v1.ja.json']);
    expect(framework.language).toBe('ja');
    expect(framework.habits.length).toBeGreaterThan(0);
  });

  it('reads English for a language without a file, and Vietnamese needs no request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(frameworkLanguageFor('vi')).toBe('vi');
    await loadFramework('vi');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lets a failed download be retried', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    await expect(loadFramework('de')).rejects.toThrow(/could not be loaded/);

    vi.stubGlobal('fetch', vi.fn(async () => new Response(readFileSync(resolve('public/data/habit-framework-v1.de.json'), 'utf8'), { status: 200 })));
    await expect(loadFramework('de')).resolves.toMatchObject({ language: 'de' });
  });
});

import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildMarketingSite } from '../../scripts/build-marketing.mjs';
import { verifyMarketingRelease, waitForMarketingRelease } from '../../scripts/verify-marketing-release.mjs';
import { isReadyHealth } from '../../scripts/verify-release-candidate.mjs';

const temporaryDirectories: string[] = [];

async function buildFixture() {
  const directory = await mkdtemp(join(tmpdir(), 'kidhabit-marketing-release-'));
  temporaryDirectories.push(directory);
  await buildMarketingSite({
    appOrigin: 'https://app.example',
    marketingOrigin: 'https://www.example',
    outputDir: directory,
  });
  return directory;
}

async function replace(directory: string, relativePath: string, from: string, to: string) {
  const path = join(directory, relativePath);
  const html = await readFile(path, 'utf8');
  await writeFile(path, html.replaceAll(from, to));
}

afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('marketing release verifier', () => {
  it('accepts the complete static artifact', async () => {
    await expect(verifyMarketingRelease({
      directory: await buildFixture(),
      appOrigin: 'https://app.example',
      marketingOrigin: 'https://www.example',
    })).resolves.toEqual({ routes: 10, plans: 3 });
  });

  it('rejects a wrong canonical URL', async () => {
    const directory = await buildFixture();
    await replace(directory, 'pricing/index.html', 'https://www.example/pricing/', 'https://wrong.example/pricing/');
    await expect(verifyMarketingRelease({
      directory, appOrigin: 'https://app.example', marketingOrigin: 'https://www.example',
    })).rejects.toThrow(/canonical/i);
  });

  it('rejects checkout links outside the app origin', async () => {
    const directory = await buildFixture();
    await replace(directory, 'index.html', 'https://app.example/checkout?plan=monthly', 'https://wrong.example/checkout?plan=monthly');
    await expect(verifyMarketingRelease({
      directory, appOrigin: 'https://app.example', marketingOrigin: 'https://www.example',
    })).rejects.toThrow(/checkout outside/i);
  });

  it('rejects structured data that sends checkout outside the app origin', async () => {
    const directory = await buildFixture();
    const path = join(directory, 'index.html');
    const html = await readFile(path, 'utf8');
    await writeFile(path, html.replace(/("url":")https:\/\/app\.example(\/checkout\?plan=monthly")/, '$1https://wrong.example$2'));
    await expect(verifyMarketingRelease({
      directory, appOrigin: 'https://app.example', marketingOrigin: 'https://www.example',
    })).rejects.toThrow(/structured data sends checkout outside/i);
  });

  it('rejects exposed API routes', async () => {
    const directory = await buildFixture();
    await replace(directory, 'index.html', '</body>', '<a href="/api/health">API</a></body>');
    await expect(verifyMarketingRelease({
      directory, appOrigin: 'https://app.example', marketingOrigin: 'https://www.example',
    })).rejects.toThrow(/forbidden marker/i);
  });

  it('rejects a missing paid-plan CTA', async () => {
    const directory = await buildFixture();
    for (const file of ['index.html', 'pricing/index.html']) {
      await replace(directory, file, 'https://app.example/checkout?plan=yearly', 'https://app.example/');
    }
    await expect(verifyMarketingRelease({
      directory, appOrigin: 'https://app.example', marketingOrigin: 'https://www.example',
    })).rejects.toThrow(/yearly/i);
  });

  it('rejects a failed live route response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 503, text: vi.fn() });
    await expect(verifyMarketingRelease({
      directory: await buildFixture(),
      appOrigin: 'https://app.example',
      marketingOrigin: 'https://www.example',
      liveOrigin: 'https://preview.example',
      fetchImpl,
    })).rejects.toThrow(/HTTP 503/);
  });

  it('validates live HTML instead of accepting status alone', async () => {
    const directory = await buildFixture();
    const fetchImpl = vi.fn(async (input: URL | RequestInfo) => {
      const url = new URL(input.toString());
      const relativePath = url.pathname === '/' ? 'index.html' : `${url.pathname.slice(1)}index.html`;
      return new Response(await readFile(join(directory, relativePath), 'utf8'), { status: 200 });
    });
    await expect(verifyMarketingRelease({
      directory,
      appOrigin: 'https://app.example',
      marketingOrigin: 'https://www.example',
      liveOrigin: 'https://preview.example',
      fetchImpl,
    })).resolves.toEqual({ routes: 10, plans: 3 });
    expect(fetchImpl).toHaveBeenCalledTimes(10);
  });
});

describe('app release health contract', () => {
  it('requires ready status and every dependency check to be true', () => {
    expect(isReadyHealth({ status: 'ready', checks: { app: true, databaseConnection: true, billingConfig: true } })).toBe(true);
    expect(isReadyHealth({ status: 'ready', checks: { app: true, databaseConnection: false } })).toBe(false);
    expect(isReadyHealth({ status: 'degraded', checks: { app: true, databaseConnection: true } })).toBe(false);
    expect(isReadyHealth({ status: 'ready', checks: {} })).toBe(false);
  });
});

describe('waiting for the matching marketing release', () => {
  const answer = (release: string) => ({ ok: true, json: async () => ({ release }) }) as unknown as Response;

  it('records the release in the built site', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'kidhabit-marketing-release-'));
    temporaryDirectories.push(directory);
    await buildMarketingSite({
      appOrigin: 'https://app.example',
      marketingOrigin: 'https://www.example',
      outputDir: directory,
      release: 'abc123',
    });
    expect(JSON.parse(await readFile(join(directory, 'release.json'), 'utf8'))).toEqual({ release: 'abc123' });
  });

  it('returns once the live site serves the expected release', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(answer('older'))
      .mockResolvedValueOnce(answer('abc123'));
    const sleep = vi.fn(async () => undefined);
    await expect(waitForMarketingRelease({
      origin: 'https://www.example', release: 'abc123', fetchImpl: fetchImpl as unknown as typeof fetch, delayMs: 1, sleep,
    })).resolves.toEqual({ attempts: 2 });
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('fails with what the site still serves when it never catches up', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(answer('older'));
    await expect(waitForMarketingRelease({
      origin: 'https://www.example', release: 'abc123', fetchImpl: fetchImpl as unknown as typeof fetch,
      attempts: 3, delayMs: 1, sleep: async () => undefined,
    })).rejects.toThrow('still serves older instead of release abc123');
  });

  it('keeps waiting through errors and missing files', async () => {
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: false, status: 404 } as unknown as Response)
      .mockResolvedValueOnce(answer('abc123'));
    await expect(waitForMarketingRelease({
      origin: 'https://www.example', release: 'abc123', fetchImpl: fetchImpl as unknown as typeof fetch,
      attempts: 5, delayMs: 1, sleep: async () => undefined,
    })).resolves.toEqual({ attempts: 3 });
  });
});

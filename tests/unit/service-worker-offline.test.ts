import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8');

type Stored = { readonly path: string; readonly response: Response };

async function runInstall(respond: (path: string) => Response): Promise<Stored[]> {
  const stored: Stored[] = [];
  const handlers: Record<string, (event: { waitUntil: (promise: Promise<unknown>) => void }) => void> = {};
  const cache = { put: async (path: string, response: Response) => { stored.push({ path, response }); } };
  vm.runInNewContext(source, {
    self: { location: { origin: 'https://app.example' }, addEventListener: (name: string, handler: typeof handlers[string]) => { handlers[name] = handler; } },
    caches: { open: async () => cache },
    fetch: async (path: string) => respond(path),
    URL, Response, Promise, Error,
  });
  let pending: Promise<unknown> = Promise.resolve();
  handlers.install({ waitUntil: (promise) => { pending = promise; } });
  await pending;
  return stored;
}

const redirected = (body: string) => {
  const response = new Response(body, { status: 200, headers: { 'content-type': 'text/html' } });
  Object.defineProperty(response, 'redirected', { value: true });
  return response;
};

describe('service worker offline page', () => {
  it('keeps a plain copy of the offline page when the host redirects /offline.html', async () => {
    const stored = await runInstall((path) => (path === '/offline.html' ? redirected('<html>offline</html>') : new Response('ok')));
    const offline = stored.find((entry) => entry.path === '/offline.html');
    expect(offline).toBeDefined();
    expect(offline?.response.redirected).toBe(false);
    expect(await offline?.response.text()).toBe('<html>offline</html>');
    expect(offline?.response.headers.get('content-type')).toBe('text/html');
  });

  it('stores every public file and fails the install when one cannot be fetched', async () => {
    const stored = await runInstall(() => new Response('ok'));
    expect(stored.map((entry) => entry.path)).toEqual(expect.arrayContaining(['/offline.html', '/offline.js', '/favicon.svg']));
    await expect(runInstall((path) => (path === '/offline.js' ? new Response('missing', { status: 404 }) : new Response('ok'))))
      .rejects.toThrow('Could not cache /offline.js: 404');
  });

  it('uses a new cache version so devices drop the redirected copy they already hold', () => {
    expect(source).toContain('kidhabit-public-');
    expect(source).toMatch(/\$\{CACHE_PREFIX\}v3/);
  });
});

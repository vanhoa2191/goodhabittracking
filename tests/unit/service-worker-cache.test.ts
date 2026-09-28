import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type WorkerEvent = {
  request?: Request;
  data?: unknown;
  respondWith?: (response: Promise<Response> | Response) => void;
  waitUntil: (work: Promise<unknown>) => void;
};

const source = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8');

describe('service worker cache behavior', () => {
  const handlers = new Map<string, (event: WorkerEvent) => void>();
  const cache = {
    addAll: vi.fn(async () => undefined),
    match: vi.fn(async () => undefined),
    put: vi.fn(async () => undefined),
  };
  const cachesApi = {
    delete: vi.fn(async () => true),
    keys: vi.fn(async () => [] as string[]),
    match: vi.fn(async () => undefined as Response | undefined),
    open: vi.fn(async () => cache),
  };
  const fetchMock = vi.fn<() => Promise<Response>>();

  beforeEach(() => {
    handlers.clear();
    vi.clearAllMocks();
    vm.runInNewContext(source, {
      URL,
      Promise,
      fetch: fetchMock,
      caches: cachesApi,
      self: {
        location: { origin: 'https://app.example' },
        clients: { claim: vi.fn(async () => undefined) },
        skipWaiting: vi.fn(),
        addEventListener: (name: string, handler: (event: WorkerEvent) => void) => handlers.set(name, handler),
      },
    });
  });

  it.each(['/api/health', '/admin', '/invite/caregiver', '/pricing'])('never intercepts sensitive path %s', (path) => {
    const respondWith = vi.fn();
    handlers.get('fetch')?.({
      request: new Request(`https://app.example${path}`),
      respondWith,
      waitUntil: vi.fn(),
    });
    expect(respondWith).not.toHaveBeenCalled();
    expect(cachesApi.match).not.toHaveBeenCalled();
  });

  it('returns only the public offline page when a navigation loses network', async () => {
    const fallback = new Response('offline');
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    cachesApi.match.mockResolvedValueOnce(fallback);
    let responsePromise: Promise<Response> | null = null;
    const navigationRequest = new Request('https://app.example/', { headers: { accept: 'text/html' } });
    Object.defineProperty(navigationRequest, 'mode', { value: 'navigate' });
    handlers.get('fetch')?.({
      request: navigationRequest,
      respondWith: (value) => { responsePromise = Promise.resolve(value); },
      waitUntil: vi.fn(),
    });
    expect(responsePromise).not.toBeNull();
    await expect(responsePromise).resolves.toBe(fallback);
    expect(cachesApi.match).toHaveBeenCalledWith('/offline.html');
  });

  it('purges stale public cache versions on activation', async () => {
    cachesApi.keys.mockResolvedValueOnce(['kidhabit-public-v0', 'kidhabit-public-v1', 'unrelated-cache']);
    let activation: Promise<unknown> | null = null;
    handlers.get('activate')?.({ waitUntil: (value) => { activation = value; } });
    await activation;
    expect(cachesApi.delete).toHaveBeenCalledWith('kidhabit-public-v0');
    expect(cachesApi.delete).not.toHaveBeenCalledWith('unrelated-cache');
  });
});

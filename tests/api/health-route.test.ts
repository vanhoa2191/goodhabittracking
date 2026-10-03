import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/health/route';
import { resetHealthCacheForTests } from '@/lib/health-cache';
import { EXPECTED_SCHEMA_VERSION } from '@/lib/schema-version';

/** The database answers: the REST root for the connection probe, `rpc/schema_version` for the schema probe. */
let schemaAnswer: () => Promise<Response>;
const rpcCalls = () => vi.mocked(fetch).mock.calls.filter(([url]) => String(url).endsWith('/rpc/schema_version'));
const rootCalls = () => vi.mocked(fetch).mock.calls.filter(([url]) => String(url).endsWith('/rest/v1/'));
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });

function stubDatabase(root: () => Promise<Response> = async () => new Response('{}', { status: 200 })) {
  vi.stubGlobal('fetch', vi.fn((url: string | URL) => (
    String(url).endsWith('/rpc/schema_version') ? schemaAnswer() : root()
  )));
}

const readyEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  PAYOS_CLIENT_ID: 'client-current',
  PAYOS_API_KEY: 'api-current',
  PAYOS_CHECKSUM_KEY: 'checksum-current',
  PAIRING_RATE_LIMIT_SECRET: 'pairing-rate-limit-secret-at-least-32-bytes',
  CRON_SECRET: 'operations-secret',
};

const operations = () => new Request('https://app.kidhabithero.com/api/health', {
  headers: { authorization: 'Bearer operations-secret' },
});
const anonymous = () => new Request('https://app.kidhabithero.com/api/health');

describe('GET /api/health', () => {
  beforeEach(() => {
    resetHealthCacheForTests();
    schemaAnswer = async () => json(EXPECTED_SCHEMA_VERSION);
    stubDatabase();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('reports ready only when database, billing, and pairing configuration are complete', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);

    const response = await GET(operations());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: 'ready',
      checks: {
        app: true,
        databaseConfig: true,
        billingConfig: true,
        pairingConfig: true,
        schemaVersion: true,
      },
    });
  });

  it('asks the database for its schema version with the service role, bounded in time', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    await GET(operations());
    const [url, init] = rpcCalls()[0];
    expect(String(url)).toBe('https://project.supabase.co/rest/v1/rpc/schema_version');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { apikey: 'service-role-key', Authorization: 'Bearer service-role-key' },
      signal: expect.any(AbortSignal),
    });
  });

  it.each([
    ['an older version', () => json('202610020004'), 'database at 202610020004'],
    ['a number', () => json(9), 'unreadable version'],
    ['a non-numeric text', () => json('invalid'), 'unreadable version'],
    ['null', () => json(null), 'unreadable version'],
    ['a missing function', () => json({ code: 'PGRST202' }, 404), 'HTTP 404'],
    ['a refused request', () => json({ code: '42501' }, 401), 'HTTP 401'],
  ])('fails readiness for %s and tells the operator why', async (_label, answer, reason) => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    schemaAnswer = async () => answer();
    const response = await GET(operations());
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'degraded', checks: { schemaVersion: false } });
    expect(body.schemaVersionFailure).toContain(reason);
  });

  it('accepts a newer schema version', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    schemaAnswer = async () => json('202610040001');
    const response = await GET(operations());
    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty('schemaVersionFailure');
  });

  it('fails readiness when the schema request is rejected', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    schemaAnswer = async () => { throw new DOMException('timed out', 'TimeoutError'); };
    const response = await GET(operations());
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ checks: { schemaVersion: false }, schemaVersionFailure: 'TimeoutError' });
  });

  it('fails readiness when the schema RPC is unavailable without exposing checks anonymously', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    schemaAnswer = async () => json({ code: 'PGRST202' }, 404);
    const response = await GET(anonymous());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'degraded', version: expect.any(String) });
  });

  it('shows anonymous callers only the overall status and the build', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    vi.stubEnv('PAIRING_RATE_LIMIT_SECRET', '');

    const response = await GET(anonymous());

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe('degraded');
    expect(body).not.toHaveProperty('checks');
    expect(Object.keys(body).sort()).toEqual(['status', 'version']);
  });

  it('names the deployed commit as its version', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    vi.stubEnv('NEXT_PUBLIC_COMMIT_SHA', '11957de7a2960d6b544351fbd5c5cb2aeb758135');

    await expect((await GET(anonymous())).json()).resolves.toMatchObject({ version: '11957de7a296' });
  });

  it('reports a local build when no commit is known', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    vi.stubEnv('NEXT_PUBLIC_COMMIT_SHA', '');
    vi.stubEnv('CF_PAGES_COMMIT_SHA', '');
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', '');

    await expect((await GET(anonymous())).json()).resolves.toMatchObject({ version: 'local' });
  });

  it('fails readiness when the pairing secret is absent', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    vi.stubEnv('PAIRING_RATE_LIMIT_SECRET', '');

    const response = await GET(operations());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: 'degraded',
      checks: { pairingConfig: false },
    });
  });

  it('does not report ready when Supabase rejects configured credentials', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    stubDatabase(async () => new Response('{"message":"Invalid API key"}', { status: 401 }));

    const response = await GET(operations());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: 'degraded',
      checks: {
        databaseConfig: true,
        databaseConnection: false,
      },
    });
  });

  it('reuses a recent database answer instead of calling the database on every request', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    await GET(operations());
    await GET(operations());
    await GET(operations());

    expect(rootCalls()).toHaveLength(1);
    expect(rpcCalls()).toHaveLength(1);
  });

  it('asks the database again once the answer is stale', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
      await GET(operations());
      vi.setSystemTime(new Date('2026-10-01T00:00:11Z'));
      await GET(operations());
    } finally {
      vi.useRealTimers();
    }
    expect(rootCalls()).toHaveLength(2);
    expect(rpcCalls()).toHaveLength(2);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/health/route';
import { resetHealthCacheForTests } from '@/lib/health-cache';
import { EXPECTED_SCHEMA_VERSION } from '@/lib/schema-version';

const { rpc, abortSignal } = vi.hoisted(() => ({ rpc: vi.fn(), abortSignal: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({
    rpc: (name: string) => ({
      abortSignal: (signal: AbortSignal) => {
        abortSignal(signal);
        return rpc(name);
      },
    }),
  }),
}));

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
    rpc.mockReset().mockResolvedValue({ data: EXPECTED_SCHEMA_VERSION, error: null });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
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

  it.each([null, '202610020004', '9', 'invalid'])('fails readiness for missing or stale schema %s', async (data) => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    rpc.mockResolvedValue({ data, error: null });
    const response = await GET(operations());
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ status: 'degraded', checks: { schemaVersion: false } });
    expect(rpc).toHaveBeenCalledWith('schema_version');
  });

  it('accepts a newer schema version', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    rpc.mockResolvedValue({ data: '202610040001', error: null });
    expect((await GET(operations())).status).toBe(200);
  });

  it('bounds schema probes and fails readiness on a rejected request', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    rpc.mockRejectedValue(new Error('request timed out'));
    const response = await GET(operations());
    expect(response.status).toBe(503);
    expect(abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
    await expect(response.json()).resolves.toMatchObject({ checks: { schemaVersion: false } });
  });

  it('fails readiness when the schema RPC is unavailable without exposing checks anonymously', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
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
    vi.mocked(fetch).mockResolvedValue(new Response('{"message":"Invalid API key"}', { status: 401 }));

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
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await GET(operations());
    await GET(operations());
    await GET(operations());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('asks the database again once the answer is stale', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
      await GET(operations());
      vi.setSystemTime(new Date('2026-10-01T00:00:11Z'));
      await GET(operations());
    } finally {
      vi.useRealTimers();
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});

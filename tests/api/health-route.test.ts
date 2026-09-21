import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/health/route';

const readyEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  PAYOS_CLIENT_ID: 'client-current',
  PAYOS_API_KEY: 'api-current',
  PAYOS_CHECKSUM_KEY: 'checksum-current',
  PAIRING_RATE_LIMIT_SECRET: 'pairing-rate-limit-secret-at-least-32-bytes',
};

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('reports ready only when database, billing, and pairing configuration are complete', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: 'ready',
      checks: {
        app: true,
        databaseConfig: true,
        billingConfig: true,
        pairingConfig: true,
      },
    });
  });

  it('fails readiness when the pairing secret is absent', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    vi.stubEnv('PAIRING_RATE_LIMIT_SECRET', '');

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: 'degraded',
      checks: { pairingConfig: false },
    });
  });

  it('does not report ready when Supabase rejects configured credentials', async () => {
    for (const [key, value] of Object.entries(readyEnvironment)) vi.stubEnv(key, value);
    vi.mocked(fetch).mockResolvedValue(new Response('{"message":"Invalid API key"}', { status: 401 }));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: 'degraded',
      checks: {
        databaseConfig: true,
        databaseConnection: false,
      },
    });
  });
});

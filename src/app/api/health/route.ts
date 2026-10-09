import { NextResponse } from 'next/server';
import { inspectPayOSConfig } from '@/lib/billing/payos-config';
import { remember } from '@/lib/health-cache';
import { hasBearerSecret } from '@/lib/security/bearer-secret';
import { parentUnlockConfigReady } from '@/lib/security/parent-unlock';
import { EXPECTED_SCHEMA_VERSION } from '@/lib/schema-version';

export const runtime = 'nodejs';

interface SchemaProbeResult {
  readonly ready: boolean;
  /** Why the probe failed, reported only to callers holding the operations secret. */
  readonly failure: string | null;
}

const schemaReady: SchemaProbeResult = { ready: true, failure: null };
const schemaFailed = (failure: string): SchemaProbeResult => ({ ready: false, failure });

/**
 * Asks the database which migration it last applied. A plain request, like `probeDatabase`, so the probe
 * behaves the same in the Workers runtime as in Node.
 */
async function probeSchemaVersion(url: string, serviceRoleKey: string): Promise<SchemaProbeResult> {
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/schema_version`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) {
      return schemaFailed(`HTTP ${response.status}`);
    }
    const version: unknown = await response.json();
    if (typeof version !== 'string' || !/^\d+$/.test(version)) {
      return schemaFailed('unreadable version');
    }
    if (BigInt(version) < BigInt(EXPECTED_SCHEMA_VERSION)) {
      return schemaFailed(`database at ${version}, build expects ${EXPECTED_SCHEMA_VERSION}`);
    }
    return schemaReady;
  } catch (error) {
    return schemaFailed(error instanceof Error ? error.name : 'request failed');
  }
}

async function probeDatabase(url: string, serviceRoleKey: string) {
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Anyone may ask whether the app is ready and which build is running. Which dependency is missing (database,
 * payOS, pairing secret) is shown only to the operations workflows that hold `CRON_SECRET`.
 */
export async function GET(request: Request) {
  const databaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
  const databaseConfigReady = Boolean(
    databaseUrl.startsWith('https://') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    serviceRoleKey
  );
  const databaseConnectionReady = databaseConfigReady
    ? await remember(databaseUrl, () => probeDatabase(databaseUrl, serviceRoleKey))
    : false;
  const billingReady = inspectPayOSConfig().ready;
  const pairingSecret = process.env.PAIRING_RATE_LIMIT_SECRET?.trim() ?? '';
  const pairingReady = pairingSecret.length >= 32;
  const schemaProbe = databaseConnectionReady
    ? await remember(`${databaseUrl}:schema-version:${EXPECTED_SCHEMA_VERSION}`, () => probeSchemaVersion(databaseUrl, serviceRoleKey))
    : null;
  const schemaVersionReady = schemaProbe?.ready ?? false;
  const parentUnlockReady = parentUnlockConfigReady();
  const ready = databaseConnectionReady && billingReady && pairingReady && schemaVersionReady && parentUnlockReady;

  const operator = hasBearerSecret(request, process.env.CRON_SECRET);

  return NextResponse.json(
    {
      status: ready ? 'ready' : databaseConfigReady ? 'degraded' : 'unavailable',
      ...(operator && !schemaVersionReady && schemaProbe?.failure && { schemaVersionFailure: schemaProbe.failure }),
      ...(operator && {
        checks: {
          app: true,
          databaseConfig: databaseConfigReady,
          databaseConnection: databaseConnectionReady,
          billingConfig: billingReady,
          pairingConfig: pairingReady,
          parentUnlockConfig: parentUnlockReady,
          schemaVersion: schemaVersionReady,
        },
      }),
      // The deploy workflow builds with NEXT_PUBLIC_COMMIT_SHA, so this names the commit that is live.
      version: (process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA)?.slice(0, 12) || 'local',
    },
    { status: ready ? 200 : 503 }
  );
}

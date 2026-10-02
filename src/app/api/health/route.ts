import { NextResponse } from 'next/server';
import { inspectPayOSConfig } from '@/lib/billing/payos-config';
import { remember } from '@/lib/health-cache';
import { hasBearerSecret } from '@/lib/security/bearer-secret';

export const runtime = 'nodejs';

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
  const ready = databaseConnectionReady && billingReady && pairingReady;

  return NextResponse.json(
    {
      status: ready ? 'ready' : databaseConfigReady ? 'degraded' : 'unavailable',
      ...(hasBearerSecret(request, process.env.CRON_SECRET) && {
        checks: {
          app: true,
          databaseConfig: databaseConfigReady,
          databaseConnection: databaseConnectionReady,
          billingConfig: billingReady,
          pairingConfig: pairingReady,
        },
      }),
      // The deploy workflow builds with NEXT_PUBLIC_COMMIT_SHA, so this names the commit that is live.
      version: (process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA)?.slice(0, 12) || 'local',
    },
    { status: ready ? 200 : 503 }
  );
}

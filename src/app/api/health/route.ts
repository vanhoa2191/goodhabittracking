import { NextResponse } from 'next/server';
import { inspectPayOSConfig } from '@/lib/billing/payos-config';

export const runtime = 'nodejs';

async function canReachDatabase(url: string, serviceRoleKey: string) {
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

export async function GET() {
  const databaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
  const databaseConfigReady = Boolean(
    databaseUrl.startsWith('https://') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    serviceRoleKey
  );
  const databaseConnectionReady = databaseConfigReady
    ? await canReachDatabase(databaseUrl, serviceRoleKey)
    : false;
  const billingReady = inspectPayOSConfig().ready;
  const pairingSecret = process.env.PAIRING_RATE_LIMIT_SECRET?.trim() ?? '';
  const pairingReady = pairingSecret.length >= 32;
  const ready = databaseConnectionReady && billingReady && pairingReady;

  return NextResponse.json(
    {
      status: ready ? 'ready' : databaseConfigReady ? 'degraded' : 'unavailable',
      checks: {
        app: true,
        databaseConfig: databaseConfigReady,
        databaseConnection: databaseConnectionReady,
        billingConfig: billingReady,
        pairingConfig: pairingReady,
      },
      version: process.env.CF_PAGES_COMMIT_SHA?.slice(0, 12) || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || 'local',
    },
    { status: ready ? 200 : 503 }
  );
}

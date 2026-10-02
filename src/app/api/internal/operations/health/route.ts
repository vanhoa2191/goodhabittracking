import { NextRequest, NextResponse } from 'next/server';
import {
  evaluateOperationalHealth,
  OPERATIONAL_THRESHOLDS,
  type OperationalHealthInput,
} from '@/lib/observability/operational-health';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { hasBearerSecret } from '@/lib/security/bearer-secret';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!hasBearerSecret(request, process.env.CRON_SECRET)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const windowStart = new Date(Date.now() - 15 * 60_000).toISOString();
  const staleLock = new Date(Date.now() - 15 * 60_000).toISOString();
  const [paymentResult, profileResult, pairingResult, deadLettersResult, stuckOutboxResult] = await Promise.all([
    admin.from('operational_events').select('id', { count: 'exact', head: true }).eq('signal_type', 'payment_webhook_failure').gte('occurred_at', windowStart),
    admin.from('operational_events').select('id', { count: 'exact', head: true }).eq('signal_type', 'profile_mutation_failure').gte('occurred_at', windowStart),
    admin.from('operational_events').select('id', { count: 'exact', head: true }).eq('signal_type', 'pairing_failure').gte('occurred_at', windowStart),
    admin.from('lifecycle_outbox').select('id', { count: 'exact', head: true }).eq('status', 'dead_letter'),
    admin.from('lifecycle_outbox').select('id', { count: 'exact', head: true }).eq('status', 'processing').lt('locked_at', staleLock),
  ]);
  if (paymentResult.error || profileResult.error || pairingResult.error || deadLettersResult.error || stuckOutboxResult.error) {
    return NextResponse.json({ status: 'unavailable' }, { status: 503 });
  }

  const counts: OperationalHealthInput = {
    paymentWebhookFailures: paymentResult.count ?? 0,
    profileMutationFailures: profileResult.count ?? 0,
    pairingFailures: pairingResult.count ?? 0,
    deadLetters: deadLettersResult.count ?? 0,
    stuckOutbox: stuckOutboxResult.count ?? 0,
  };
  const health = evaluateOperationalHealth(counts);
  return NextResponse.json({
    status: health.ready ? 'ready' : 'alert',
    windowMinutes: 15,
    counts,
    thresholds: OPERATIONAL_THRESHOLDS,
    alerts: health.alerts,
  }, { status: health.ready ? 200 : 503 });
}

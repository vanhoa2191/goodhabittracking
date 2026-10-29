import { NextRequest, NextResponse } from 'next/server';
import { getLifecycleEmailConfig, LifecycleDeliveryUncertainError, parseLifecycleMessage, sendLifecycleEmail } from '@/lib/lifecycle/email';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { hasBearerSecret } from '@/lib/security/bearer-secret';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';

export const runtime = 'nodejs';

type ClaimedMessage = {
  readonly id: string;
  readonly template_key: string;
  readonly locale: string;
  readonly payload: unknown;
  readonly dedupe_key: string;
  readonly recipient_email: string;
  readonly claim_token: string;
};

function providerErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown_provider_failure';
  return /^email_provider_\d{3}$/.test(error.message) ? error.message : 'provider_failure';
}

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const correlationId = createCorrelationId();
  if (!hasBearerSecret(request, process.env.CRON_SECRET)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  if (!getLifecycleEmailConfig().enabled) {
    return NextResponse.json({ error: 'Lifecycle email is not configured.' }, { status: 409 });
  }

  const admin = createAdminSupabaseClient();
  const { error: scheduleError } = await admin.rpc('schedule_trial_ending_messages');
  if (scheduleError) {
    logOperationalEvent('error', { operation: 'lifecycle_schedule', reasonCode: 'database_failure', correlationId, route: request.nextUrl.pathname, status: 503 });
    return NextResponse.json({ error: 'Could not schedule lifecycle messages.', correlationId }, { status: 503 });
  }

  // Leave margin for persistence after ten 30s sends within the ten-minute lease.
  const { data, error: claimError } = await admin.rpc('claim_lifecycle_messages', { batch_size: 10 });
  if (claimError) {
    logOperationalEvent('error', { operation: 'lifecycle_claim', reasonCode: 'database_failure', correlationId, route: request.nextUrl.pathname, status: 503 });
    return NextResponse.json({ error: 'Could not claim lifecycle messages.', correlationId }, { status: 503 });
  }

  let sent = 0;
  let failed = 0;
  let uncertain = 0;
  let persistenceFailures = 0;
  for (const row of (data ?? []) as ClaimedMessage[]) {
    if (!row.claim_token) {
      persistenceFailures += 1;
      continue;
    }
    let providerId: string | null = null;
    let outcome: 'sent' | 'failed' | 'uncertain' = 'sent';
    let errorCode: string | null = null;
    try {
      const message = parseLifecycleMessage({
        templateKey: row.template_key,
        locale: row.locale,
        payload: row.payload,
      });
      providerId = await sendLifecycleEmail({
        to: row.recipient_email,
        dedupeKey: row.dedupe_key,
        message,
      });
    } catch (error) {
      outcome = error instanceof LifecycleDeliveryUncertainError ? 'uncertain' : 'failed';
      errorCode = outcome === 'uncertain' ? 'delivery_uncertain' : providerErrorCode(error);
    }
    const finish = async (result: typeof outcome, code: string | null) => {
      try {
        const { data, error } = await admin.rpc('finish_lifecycle_message', {
          target_id: row.id, lease_token: row.claim_token, outcome: result,
          provider_id: providerId, error_code: code,
        });
        return !error && data === true;
      } catch { return false; }
    };
    if (await finish(outcome, errorCode)) {
      if (outcome === 'sent') sent += 1;
      else if (outcome === 'failed') failed += 1;
      else uncertain += 1;
    } else {
      persistenceFailures += 1;
      if (outcome !== 'failed') {
        uncertain += 1;
        // Preserve acceptance evidence when a second write is possible. A stale token cannot overwrite a newer owner.
        await finish('uncertain', outcome === 'sent' ? 'sent_persistence_failure' : 'delivery_uncertain');
      }
    }
  }

  const healthy = persistenceFailures === 0 && uncertain === 0;
  if (!healthy) logOperationalEvent('error', { operation: 'lifecycle_finish', reasonCode: 'delivery_or_persistence_uncertain', correlationId, route: request.nextUrl.pathname, status: 503 });
  return NextResponse.json({ success: healthy, sent, failed, uncertain, persistenceFailures, correlationId }, { status: healthy ? 200 : 503 });
}

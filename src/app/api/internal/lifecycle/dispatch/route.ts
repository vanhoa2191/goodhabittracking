import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getLifecycleEmailConfig, parseLifecycleMessage, sendLifecycleEmail } from '@/lib/lifecycle/email';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type ClaimedMessage = {
  readonly id: string;
  readonly template_key: string;
  readonly locale: string;
  readonly payload: unknown;
  readonly dedupe_key: string;
  readonly recipient_email: string;
};

function authorized(request: NextRequest): boolean {
  const configured = process.env.CRON_SECRET?.trim();
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!configured || configured.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(configured), Buffer.from(provided));
}

function providerErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown_provider_failure';
  return /^email_provider_\d{3}$/.test(error.message) ? error.message : 'provider_failure';
}

export async function POST(request: NextRequest) {
  const correlationId = createCorrelationId();
  if (!authorized(request)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  if (!getLifecycleEmailConfig().enabled) {
    return NextResponse.json({ error: 'Lifecycle email is not configured.' }, { status: 409 });
  }

  const admin = createAdminSupabaseClient();
  const { error: scheduleError } = await admin.rpc('schedule_trial_ending_messages');
  if (scheduleError) {
    logOperationalEvent('error', { operation: 'lifecycle_schedule', reasonCode: 'database_failure', correlationId, route: request.nextUrl.pathname, status: 503 });
    return NextResponse.json({ error: 'Could not schedule lifecycle messages.', correlationId }, { status: 503 });
  }

  const { data, error: claimError } = await admin.rpc('claim_lifecycle_messages', { batch_size: 25 });
  if (claimError) {
    logOperationalEvent('error', { operation: 'lifecycle_claim', reasonCode: 'database_failure', correlationId, route: request.nextUrl.pathname, status: 503 });
    return NextResponse.json({ error: 'Could not claim lifecycle messages.', correlationId }, { status: 503 });
  }

  let sent = 0;
  let failed = 0;
  for (const row of (data ?? []) as ClaimedMessage[]) {
    try {
      const message = parseLifecycleMessage({
        templateKey: row.template_key,
        locale: row.locale,
        payload: row.payload,
      });
      const providerId = await sendLifecycleEmail({
        to: row.recipient_email,
        dedupeKey: row.dedupe_key,
        message,
      });
      await admin.rpc('finish_lifecycle_message', {
        target_id: row.id,
        outcome: 'sent',
        provider_id: providerId,
        error_code: null,
      });
      sent += 1;
    } catch (error) {
      await admin.rpc('finish_lifecycle_message', {
        target_id: row.id,
        outcome: 'failed',
        provider_id: null,
        error_code: providerErrorCode(error),
      });
      failed += 1;
    }
  }

  return NextResponse.json({ success: true, sent, failed, correlationId });
}

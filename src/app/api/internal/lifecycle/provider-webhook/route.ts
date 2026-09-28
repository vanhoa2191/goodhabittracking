import { NextRequest, NextResponse } from 'next/server';
import { verifyResendWebhook } from '@/lib/lifecycle/resend-webhook';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const correlationId = createCorrelationId();
  const payload = await request.text();
  const event = verifyResendWebhook({
    payload,
    id: request.headers.get('svix-id'),
    timestamp: request.headers.get('svix-timestamp'),
    signature: request.headers.get('svix-signature'),
  });
  if (!event) {
    logOperationalEvent('warn', { operation: 'lifecycle_provider_webhook', reasonCode: 'invalid_signature_or_payload', correlationId, route: request.nextUrl.pathname, status: 401 });
    return NextResponse.json({ error: 'Invalid webhook.' }, { status: 401 });
  }

  const recipient = event.data.to[0].trim().toLowerCase();
  const admin = createAdminSupabaseClient();
  const { data: profile, error: profileError } = await admin
    .from('parent_profiles')
    .select('user_id')
    .ilike('email', recipient)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: 'Could not process webhook.', correlationId }, { status: 503 });
  if (!profile) return NextResponse.json({ success: true });

  const reason = event.type === 'email.complained' ? 'complaint' : 'bounce';
  const { error } = await admin.from('email_suppressions').upsert({
    user_id: profile.user_id,
    scope: 'all',
    reason,
    provider_reference: event.data.email_id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,scope' });
  if (error) return NextResponse.json({ error: 'Could not process webhook.', correlationId }, { status: 503 });
  return NextResponse.json({ success: true });
}

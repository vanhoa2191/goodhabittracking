import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  CHILD_SESSION_COOKIE,
  createSessionToken,
  normalizeDisplayCode,
  requestFingerprint,
  sha256Hex,
} from '@/lib/pairing/crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';

export const runtime = 'nodejs';

const requestSchema = z.union([
  z.object({ code: z.string().min(1).max(32), token: z.never().optional(), deviceLabel: z.string().trim().max(80).optional() }).strict(),
  z.object({ token: z.string().min(32).max(200), code: z.never().optional(), deviceLabel: z.string().trim().max(80).optional() }).strict(),
]);

const statusMessages: Record<string, { status: number; error: string }> = {
  invalid: { status: 404, error: 'Mã ghép nối không đúng. Vui lòng kiểm tra và thử lại.' },
  expired: { status: 410, error: 'Mã đã hết hạn. Hãy tạo mã mới trên máy phụ huynh.' },
  revoked: { status: 410, error: 'Mã đã bị thu hồi. Hãy tạo mã mới trên máy phụ huynh.' },
  consumed: { status: 409, error: 'Mã đã được sử dụng. Mỗi mã chỉ dùng được một lần.' },
  attempts_exhausted: { status: 429, error: 'Mã đã bị khóa sau nhiều lần thử sai.' },
  rate_limited: { status: 429, error: 'Bạn thử quá nhanh. Vui lòng đợi 10 phút rồi thử lại.' },
};

export async function POST(request: NextRequest) {
  const correlationId = createCorrelationId();
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    logOperationalEvent('warn', { operation: 'pairing_exchange', reasonCode: 'invalid_payload', correlationId, route: request.nextUrl.pathname, status: 400 });
    return NextResponse.json({ error: 'Mã ghép nối không hợp lệ.', correlationId }, { status: 400 });
  }

  const submittedCode = parsed.data.code;
  const submittedToken = parsed.data.token;
  const normalizedCode = submittedCode ? normalizeDisplayCode(submittedCode) : null;
  if (submittedCode && !normalizedCode) {
    logOperationalEvent('warn', { operation: 'pairing_exchange', reasonCode: 'invalid_code', correlationId, route: request.nextUrl.pathname, status: 404 });
    return NextResponse.json({ error: statusMessages.invalid.error, correlationId }, { status: 404 });
  }
  const credentialValue = normalizedCode ?? submittedToken;
  if (!credentialValue) {
    return NextResponse.json({ error: 'Mã ghép nối không hợp lệ.', correlationId }, { status: 400 });
  }

  const sessionToken = createSessionToken();
  const [credentialHash, tokenHash, fingerprint] = await Promise.all([
    sha256Hex(credentialValue),
    sha256Hex(sessionToken),
    requestFingerprint(request),
  ]);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('exchange_pairing_credential', {
    manual_code_id: normalizedCode?.slice(0, 4) ?? null,
    manual_verifier_hash: normalizedCode ? credentialHash : null,
    pairing_token_hash: submittedToken ? credentialHash : null,
    session_token_hash: tokenHash,
    request_fingerprint_hex: fingerprint,
    requested_device_label: parsed.data.deviceLabel || null,
  });

  if (error) {
    logOperationalEvent('error', { operation: 'pairing_exchange', reasonCode: 'service_unavailable', correlationId, route: request.nextUrl.pathname, status: 503 });
    return NextResponse.json({ error: 'Dịch vụ ghép nối tạm thời chưa sẵn sàng.', correlationId }, { status: 503 });
  }

  const exchange = Array.isArray(data) ? data[0] : data;
  if (!exchange || exchange.exchange_status !== 'ok') {
    const failure = statusMessages[exchange?.exchange_status] || statusMessages.invalid;
    logOperationalEvent('warn', { operation: 'pairing_exchange', reasonCode: exchange?.exchange_status || 'invalid', correlationId, route: request.nextUrl.pathname, status: failure.status });
    return NextResponse.json({ error: failure.error, correlationId }, { status: failure.status });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(CHILD_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(exchange.session_expires_at),
  });
  return response;
}

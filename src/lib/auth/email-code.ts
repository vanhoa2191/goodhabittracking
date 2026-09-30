import type { SupabaseClient } from '@supabase/supabase-js';

export type EmailCodeFailure = 'invalid_email' | 'rate_limited' | 'unavailable' | 'wrong_code' | 'failed';
export type EmailCodeResult = { readonly ok: true } | { readonly ok: false; readonly reason: EmailCodeFailure };

type AuthClient = Pick<SupabaseClient, 'auth'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidEmail(input: string): boolean {
  const email = normalizeEmail(input);
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

/** The code arrives as digits, often with a space or dash typed or pasted in the middle. */
export function normalizeCode(input: string): string {
  return input.replace(/\D/g, '').slice(0, 10);
}

export function isCompleteCode(input: string): boolean {
  return normalizeCode(input).length >= 6;
}

type AuthErrorLike = { readonly code?: string; readonly status?: number; readonly message?: string } | null;

function failureFor(error: NonNullable<AuthErrorLike>, stage: 'send' | 'verify'): EmailCodeFailure {
  const code = error.code ?? '';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error.status === 429) return 'rate_limited';
  if (code === 'email_address_invalid' || code === 'validation_failed') return 'invalid_email';
  if (['otp_disabled', 'email_provider_disabled', 'signup_disabled', 'provider_disabled'].includes(code)) return 'unavailable';
  if (stage === 'verify' && (code === 'otp_expired' || error.status === 403 || error.status === 400 || error.status === 422)) return 'wrong_code';
  return 'failed';
}

/** Sends a one-time code to the address; the email itself is sent by the auth service. */
export async function requestEmailCode(email: string, client: AuthClient | null): Promise<EmailCodeResult> {
  if (!client) return { ok: false, reason: 'unavailable' };
  if (!isValidEmail(email)) return { ok: false, reason: 'invalid_email' };
  try {
    const { error } = await client.auth.signInWithOtp({
      email: normalizeEmail(email),
      options: { shouldCreateUser: true },
    });
    return error ? { ok: false, reason: failureFor(error, 'send') } : { ok: true };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

export async function verifyEmailCode(email: string, code: string, client: AuthClient | null): Promise<EmailCodeResult> {
  if (!client) return { ok: false, reason: 'unavailable' };
  if (!isValidEmail(email)) return { ok: false, reason: 'invalid_email' };
  if (!isCompleteCode(code)) return { ok: false, reason: 'wrong_code' };
  try {
    const { data, error } = await client.auth.verifyOtp({
      email: normalizeEmail(email),
      token: normalizeCode(code),
      type: 'email',
    });
    if (error) return { ok: false, reason: failureFor(error, 'verify') };
    return data.session ? { ok: true } : { ok: false, reason: 'failed' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

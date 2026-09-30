import { describe, expect, it, vi } from 'vitest';
import {
  isCompleteCode,
  isValidEmail,
  normalizeCode,
  normalizeEmail,
  requestEmailCode,
  verifyEmailCode,
} from '@/lib/auth/email-code';
import { getEmailCodeCopy } from '@/lib/i18n/email-code-copy';

type Result = { error: { code?: string; status?: number } | null; data?: { session: unknown } };
function client(overrides: { otp?: Result; verify?: Result } = {}) {
  const signInWithOtp = vi.fn(async () => overrides.otp ?? { error: null });
  const verifyOtp = vi.fn(async () => overrides.verify ?? { error: null, data: { session: { access_token: 'x' } } });
  return { auth: { signInWithOtp, verifyOtp }, signInWithOtp, verifyOtp } as never as {
    auth: never; signInWithOtp: typeof signInWithOtp; verifyOtp: typeof verifyOtp;
  };
}

describe('email code helpers', () => {
  it('validates and normalises addresses', () => {
    expect(isValidEmail('  Ba.Me@Example.com ')).toBe(true);
    expect(normalizeEmail('  Ba.Me@Example.com ')).toBe('ba.me@example.com');
    for (const bad of ['', 'no-at', 'a@b', 'a b@c.com', `${'a'.repeat(250)}@x.com`]) expect(isValidEmail(bad)).toBe(false);
  });

  it('keeps only the digits of a pasted code', () => {
    expect(normalizeCode(' 123 456 ')).toBe('123456');
    expect(normalizeCode('12-34-56')).toBe('123456');
    expect(normalizeCode('abc')).toBe('');
    expect(isCompleteCode('12345')).toBe(false);
    expect(isCompleteCode('123 456')).toBe(true);
  });
});

describe('requesting a code', () => {
  it('asks the auth service to email a code and create the account when it is new', async () => {
    const auth = client();
    await expect(requestEmailCode(' Ba.Me@Example.com ', auth as never)).resolves.toEqual({ ok: true });
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: 'ba.me@example.com', options: { shouldCreateUser: true } });
  });

  it('does not call the service for a bad address or without a client', async () => {
    const auth = client();
    await expect(requestEmailCode('nope', auth as never)).resolves.toEqual({ ok: false, reason: 'invalid_email' });
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
    await expect(requestEmailCode('a@b.com', null)).resolves.toEqual({ ok: false, reason: 'unavailable' });
  });

  it.each([
    [{ code: 'over_email_send_rate_limit', status: 429 }, 'rate_limited'],
    [{ status: 429 }, 'rate_limited'],
    [{ code: 'email_address_invalid' }, 'invalid_email'],
    [{ code: 'email_provider_disabled' }, 'unavailable'],
    [{ code: 'signup_disabled' }, 'unavailable'],
    [{ code: 'unexpected', status: 500 }, 'failed'],
  ])('maps %j to %s', async (error, reason) => {
    await expect(requestEmailCode('a@b.com', client({ otp: { error } }) as never)).resolves.toEqual({ ok: false, reason });
  });

  it('survives a thrown error', async () => {
    const auth = { auth: { signInWithOtp: vi.fn(async () => { throw new Error('offline'); }) } };
    await expect(requestEmailCode('a@b.com', auth as never)).resolves.toEqual({ ok: false, reason: 'failed' });
  });
});

describe('verifying a code', () => {
  it('sends the digits only and succeeds when a session comes back', async () => {
    const auth = client();
    await expect(verifyEmailCode('a@b.com', '123 456', auth as never)).resolves.toEqual({ ok: true });
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.com', token: '123456', type: 'email' });
  });

  it('refuses short codes without calling the service', async () => {
    const auth = client();
    await expect(verifyEmailCode('a@b.com', '123', auth as never)).resolves.toEqual({ ok: false, reason: 'wrong_code' });
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it.each([
    [{ code: 'otp_expired', status: 403 }, 'wrong_code'],
    [{ status: 403 }, 'wrong_code'],
    [{ status: 429 }, 'rate_limited'],
    [{ status: 500 }, 'failed'],
  ])('maps %j to %s', async (error, reason) => {
    await expect(verifyEmailCode('a@b.com', '123456', client({ verify: { error } }) as never)).resolves.toEqual({ ok: false, reason });
  });

  it('does not treat a missing session as a sign-in', async () => {
    await expect(verifyEmailCode('a@b.com', '123456', client({ verify: { error: null, data: { session: null } } }) as never))
      .resolves.toEqual({ ok: false, reason: 'failed' });
  });
});

describe('email code copy', () => {
  it.each(['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as const)('is complete in %s', (language) => {
    const copy = getEmailCodeCopy(language);
    expect(copy.sentTo('a@b.com')).toContain('a@b.com');
    expect(copy.resendIn(42)).toContain('42');
    for (const message of Object.values(copy.errors)) expect(message.length).toBeGreaterThan(5);
    expect(Object.keys(copy.errors).sort()).toEqual(['failed', 'invalid_email', 'rate_limited', 'unavailable', 'wrong_code']);
  });
});

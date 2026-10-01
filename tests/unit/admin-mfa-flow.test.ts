import { describe, expect, it, vi } from 'vitest';
import { startEnrollment, verifyCode, type MfaClient } from '@/lib/auth/admin-mfa-flow';

function client(overrides: Partial<MfaClient['auth']['mfa']> = {}) {
  const mfa = {
    listFactors: vi.fn(async () => ({ data: { all: [] }, error: null })),
    unenroll: vi.fn(async () => ({ error: null })),
    enroll: vi.fn(async () => ({ data: { id: 'factor-1', totp: { qr_code: 'data:image/svg+xml;base64,AA', secret: 'SECRET' } }, error: null })),
    challengeAndVerify: vi.fn(async () => ({ error: null })),
    ...overrides,
  };
  return { auth: { mfa } } as MfaClient & { auth: { mfa: typeof mfa } };
}

describe('admin second factor, browser steps', () => {
  it('starts a setup and returns the QR code and the manual secret', async () => {
    const c = client();
    await expect(startEnrollment(c, 'KidHabit Admin')).resolves.toEqual({ ok: true, factorId: 'factor-1', qrCode: 'data:image/svg+xml;base64,AA', secret: 'SECRET' });
    expect(c.auth.mfa.enroll).toHaveBeenCalledWith({ factorType: 'totp', friendlyName: 'KidHabit Admin' });
  });

  it('removes a setup that was never confirmed before starting again, and keeps confirmed factors', async () => {
    const unenroll = vi.fn(async () => ({ error: null }));
    const enroll = vi.fn(async () => ({ data: { id: 'factor-2', totp: { qr_code: 'qr', secret: 's' } }, error: null }));
    const c = client({
      listFactors: vi.fn(async () => ({ data: { all: [{ id: 'old', status: 'unverified' }, { id: 'keep', status: 'verified' }] }, error: null })),
      unenroll,
      enroll,
    });
    await startEnrollment(c, 'KidHabit Admin');
    expect(unenroll).toHaveBeenCalledTimes(1);
    expect(unenroll).toHaveBeenCalledWith({ factorId: 'old' });
    expect(unenroll.mock.invocationCallOrder[0]).toBeLessThan(enroll.mock.invocationCallOrder[0]!);
  });

  it('reports a setup that Supabase refuses or that throws', async () => {
    await expect(startEnrollment(client({ enroll: vi.fn(async () => ({ data: null, error: { message: 'no' } })) }), 'x')).resolves.toEqual({ ok: false });
    await expect(startEnrollment(client({ listFactors: vi.fn(async () => { throw new Error('offline'); }) }), 'x')).resolves.toEqual({ ok: false });
  });

  it('verifies a six-digit code against the factor', async () => {
    const c = client();
    await expect(verifyCode(c, 'factor-1', '123456')).resolves.toEqual({ ok: true });
    expect(c.auth.mfa.challengeAndVerify).toHaveBeenCalledWith({ factorId: 'factor-1', code: '123456' });
  });

  it.each([['', '123456'], ['factor-1', '12345'], ['factor-1', '12345a'], ['factor-1', '1234567']])('asks for a proper code before calling Supabase (%j, %j)', async (factorId, code) => {
    const c = client();
    await expect(verifyCode(c, factorId, code)).resolves.toEqual({ ok: false, reason: 'format' });
    expect(c.auth.mfa.challengeAndVerify).not.toHaveBeenCalled();
  });

  it('tells a wrong code apart from an unreachable service', async () => {
    await expect(verifyCode(client({ challengeAndVerify: vi.fn(async () => ({ error: { message: 'invalid' } })) }), 'f', '123456')).resolves.toEqual({ ok: false, reason: 'rejected' });
    await expect(verifyCode(client({ challengeAndVerify: vi.fn(async () => { throw new Error('offline'); }) }), 'f', '123456')).resolves.toEqual({ ok: false, reason: 'unavailable' });
  });
});

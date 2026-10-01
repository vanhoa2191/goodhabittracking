// The browser half of the admin second factor, kept apart from the component so each step can be tested with a
// stand-in for the Supabase client.

type MfaFactor = { readonly id: string; readonly status?: string };

export type MfaClient = {
  readonly auth: {
    readonly mfa: {
      listFactors(): Promise<{ data: { all?: readonly MfaFactor[] } | null; error: unknown }>;
      unenroll(input: { factorId: string }): Promise<{ error: unknown }>;
      enroll(input: { factorType: 'totp'; friendlyName: string }): Promise<{
        data: { id: string; totp: { qr_code: string; secret: string } } | null;
        error: unknown;
      }>;
      challengeAndVerify(input: { factorId: string; code: string }): Promise<{ error: unknown }>;
    };
  };
};

export type EnrollmentResult =
  | { readonly ok: true; readonly factorId: string; readonly qrCode: string; readonly secret: string }
  | { readonly ok: false };

/**
 * Starts a new authenticator setup. An earlier setup that was never confirmed would make Supabase refuse the same
 * friendly name, so those leftovers are removed first; a confirmed factor is never touched.
 */
export async function startEnrollment(client: MfaClient, friendlyName: string): Promise<EnrollmentResult> {
  try {
    const { data: listed } = await client.auth.mfa.listFactors();
    for (const factor of listed?.all ?? []) {
      if (factor.status === 'unverified') await client.auth.mfa.unenroll({ factorId: factor.id });
    }
    const { data, error } = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName });
    if (error || !data) return { ok: false };
    return { ok: true, factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
  } catch {
    return { ok: false };
  }
}

export type VerifyResult = { readonly ok: true } | { readonly ok: false; readonly reason: 'format' | 'rejected' | 'unavailable' };

export async function verifyCode(client: MfaClient, factorId: string, code: string): Promise<VerifyResult> {
  if (!factorId || !/^\d{6}$/.test(code)) return { ok: false, reason: 'format' };
  try {
    const { error } = await client.auth.mfa.challengeAndVerify({ factorId, code });
    return error ? { ok: false, reason: 'rejected' } : { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

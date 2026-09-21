import { createHash } from 'node:crypto';
import compromisedCredentialFingerprints from '../../../config/compromised-credential-fingerprints.json';

type PayOSEnvironment = Partial<Record<
  'PAYOS_CLIENT_ID' | 'PAYOS_API_KEY' | 'PAYOS_CHECKSUM_KEY',
  string | undefined
>>;

function currentPayOSEnvironment(): PayOSEnvironment {
  return {
    PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID,
    PAYOS_API_KEY: process.env.PAYOS_API_KEY,
    PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY,
  };
}

export type PayOSCredentials = Readonly<{
  PAYOS_CLIENT_ID: string;
  PAYOS_API_KEY: string;
  PAYOS_CHECKSUM_KEY: string;
}>;

type PayOSReadiness =
  | { readonly ready: true; readonly credentials: PayOSCredentials }
  | { readonly ready: false; readonly reason: 'missing'; readonly missing: string[] }
  | { readonly ready: false; readonly reason: 'compromised' };

const COMPROMISED_PAYOS_FINGERPRINTS = new Set([
  ...compromisedCredentialFingerprints.payosSha256,
]);

function fingerprint(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function inspectPayOSConfig(
  environment: PayOSEnvironment = currentPayOSEnvironment(),
  compromisedFingerprints: ReadonlySet<string> = COMPROMISED_PAYOS_FINGERPRINTS,
): PayOSReadiness {
  const credentials: PayOSCredentials = {
    PAYOS_CLIENT_ID: environment.PAYOS_CLIENT_ID?.trim() ?? '',
    PAYOS_API_KEY: environment.PAYOS_API_KEY?.trim() ?? '',
    PAYOS_CHECKSUM_KEY: environment.PAYOS_CHECKSUM_KEY?.trim() ?? '',
  };
  const missing = Object.entries(credentials)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length > 0) return { ready: false, reason: 'missing', missing };
  if (Object.values(credentials).some((value) => compromisedFingerprints.has(fingerprint(value)))) {
    return { ready: false, reason: 'compromised' };
  }
  return { ready: true, credentials };
}

export function requireSafePayOSConfig(
  environment: PayOSEnvironment = currentPayOSEnvironment(),
  compromisedFingerprints: ReadonlySet<string> = COMPROMISED_PAYOS_FINGERPRINTS,
): PayOSCredentials {
  const readiness = inspectPayOSConfig(environment, compromisedFingerprints);
  if (readiness.ready) return readiness.credentials;
  if (readiness.reason === 'compromised') {
    throw new Error('PayOS credential rotation is required.');
  }
  throw new Error('PayOS configuration is missing.');
}

const DISPLAY_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const CHILD_SESSION_COOKIE = 'kidhabit_child_session';

export type DerivedPairingCredential = {
  readonly code: string;
  readonly token: string;
};

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomDisplaySegment(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => DISPLAY_ALPHABET[byte % DISPLAY_ALPHABET.length]).join('');
}

export function createDisplayCode(): { code: string; codeId: string } {
  const codeId = randomDisplaySegment(4);
  const verifier = randomDisplaySegment(4);
  return { code: `${codeId}-${verifier}`, codeId };
}

export function normalizeDisplayCode(input: string): string | null {
  const normalized = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-HJ-NP-Z2-9]{8}$/.test(normalized)) return null;
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}

export function createSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

async function hmacSha256(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return new Uint8Array(signature);
}

export async function derivePairingCredential(
  childId: string,
  rotationNonce: string,
  secret: string,
): Promise<DerivedPairingCredential> {
  const [manualBytes, tokenBytes] = await Promise.all([
    hmacSha256(secret, `manual-code:${childId}:${rotationNonce}`),
    hmacSha256(secret, `qr-token:${childId}:${rotationNonce}`),
  ]);
  const compactCode = Array.from(
    manualBytes.slice(0, 8),
    (byte) => DISPLAY_ALPHABET[byte % DISPLAY_ALPHABET.length],
  ).join('');

  return {
    code: `${compactCode.slice(0, 4)}-${compactCode.slice(4)}`,
    token: Buffer.from(tokenBytes).toString('base64url'),
  };
}

export function getPairingSecret(): string | null {
  const secret = process.env.PAIRING_RATE_LIMIT_SECRET?.trim() ?? '';
  return secret.length >= 32 ? secret : null;
}

export async function requestFingerprint(request: Request): Promise<string> {
  const configuredSecret = process.env.PAIRING_RATE_LIMIT_SECRET?.trim();
  if (!configuredSecret && process.env.NODE_ENV === 'production') {
    throw new Error('PAIRING_RATE_LIMIT_SECRET is required in production.');
  }

  const secret = configuredSecret || 'local-development-pairing-rate-limit';
  const forwarded = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'local';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(forwarded));
  return bytesToHex(new Uint8Array(signature));
}

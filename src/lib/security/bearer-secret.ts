import { timingSafeEqual } from 'node:crypto';

/** True when the request carries `Authorization: Bearer <secret>` for a configured secret. */
export function hasBearerSecret(request: Request, configuredSecret: string | undefined): boolean {
  const configured = Buffer.from(configuredSecret?.trim() ?? '');
  const provided = Buffer.from(request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '');
  // Lengths are compared in bytes: a header with multi-byte characters must be refused, not throw.
  if (configured.length === 0 || configured.length !== provided.length) return false;
  return timingSafeEqual(configured, provided);
}

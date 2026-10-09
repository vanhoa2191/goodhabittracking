/** A structured answer from PayOS, never a timeout, generic HTTP error or malformed body. */
export class PayOSOrderNotFoundError extends Error {
  constructor() {
    super('PayOS does not know this order.');
  }
}

export function isPayOSOrderNotFound(status: number, body: unknown): boolean {
  // PayOS uses 231 for an unknown payment link; some API versions also use HTTP 404.
  // Require the provider error envelope so a proxy's 404/5xx cannot release a reservation.
  if (status !== 200 && status !== 400 && status !== 404) return false;
  return typeof body === 'object' && body !== null
    && 'code' in body && body.code === '231';
}

export const PAYMENT_LINK_LIFETIME_MS = 15 * 60 * 1000;

export function unknownOrderGraceElapsed(order: {
  readonly expires_at?: string | null;
  readonly created_at?: string | null;
}, now = Date.now()): boolean {
  const expiry = order.expires_at
    ? Date.parse(order.expires_at)
    : Date.parse(order.created_at ?? '') + PAYMENT_LINK_LIFETIME_MS;
  return Number.isFinite(expiry) && expiry <= now;
}

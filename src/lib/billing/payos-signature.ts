import { createHmac, timingSafeEqual } from 'node:crypto';

function canonicalValue(value: unknown): string {
  if (value === null || value === undefined || value === 'null' || value === 'undefined') return '';
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item: unknown) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
      return Object.fromEntries(Object.entries(item).sort(([left], [right]) => left.localeCompare(right)));
    }));
  }
  return String(value);
}

export function createPayOSSignature(data: Record<string, unknown>, checksumKey: string): string {
  const canonical = Object.keys(data)
    .sort()
    .filter((field) => data[field] !== undefined)
    .map((field) => `${field}=${canonicalValue(data[field])}`)
    .join('&');
  return createHmac('sha256', checksumKey).update(canonical).digest('hex');
}

export function verifyPayOSWebhook(
  data: Record<string, unknown>,
  signature: string,
  checksumKey: string
): boolean {
  const expected = Buffer.from(createPayOSSignature(data, checksumKey), 'hex');
  const received = Buffer.from(signature, 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const eventSchema = z.object({
  type: z.enum(['email.bounced', 'email.complained', 'email.suppressed']),
  data: z.object({
    email_id: z.string().min(1),
    to: z.array(z.string().email()).min(1).max(10),
  }).passthrough(),
}).passthrough();

export type ResendSuppressionEvent = z.infer<typeof eventSchema>;

export function verifyResendWebhook(input: {
  readonly payload: string;
  readonly id: string | null;
  readonly timestamp: string | null;
  readonly signature: string | null;
  readonly secret?: string;
  readonly now?: number;
}): ResendSuppressionEvent | null {
  const secret = input.secret ?? process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret || !input.id || !input.timestamp || !input.signature) return null;
  const timestamp = Number(input.timestamp);
  const now = input.now ?? Math.floor(Date.now() / 1000);
  if (!Number.isInteger(timestamp) || Math.abs(now - timestamp) > 300) return null;
  const encodedSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const key = Buffer.from(encodedSecret, 'base64');
  if (key.length === 0) return null;
  const expected = createHmac('sha256', key)
    .update(`${input.id}.${input.timestamp}.${input.payload}`)
    .digest();
  const verified = input.signature.split(' ').some((candidate) => {
    const [version, value] = candidate.split(',', 2);
    if (version !== 'v1' || !value) return false;
    const received = Buffer.from(value, 'base64');
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
  if (!verified) return null;
  try {
    const parsed = eventSchema.safeParse(JSON.parse(input.payload));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

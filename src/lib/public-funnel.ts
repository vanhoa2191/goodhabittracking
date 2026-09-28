import { z } from 'zod';

const locale = z.enum(['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko']);
const market = z.enum(['VN', 'other']);
const plan = z.enum(['solo_monthly', 'monthly', 'yearly']);

const publicFunnelEventSchema = z.discriminatedUnion('event', [
  z.strictObject({ event: z.literal('landing_view'), locale, market }),
  z.strictObject({ event: z.literal('demo_started'), locale, market }),
  z.strictObject({ event: z.literal('demo_value_reached'), value: z.enum(['task_completed', 'parent_dashboard_opened']) }),
  z.strictObject({ event: z.literal('signup_started'), provider: z.literal('google') }),
  z.strictObject({ event: z.literal('profile_created') }),
  z.strictObject({ event: z.literal('trial_started') }),
  z.strictObject({ event: z.literal('checkout_started'), plan }),
  z.strictObject({ event: z.literal('paid_activated'), plan }),
]);

export type PublicFunnelEvent = z.infer<typeof publicFunnelEventSchema>;
export type PublicFunnelSink = (event: PublicFunnelEvent) => void;

export function parsePublicFunnelEvent(payload: unknown): PublicFunnelEvent | null {
  const result = publicFunnelEventSchema.safeParse(payload);
  return result.success ? result.data : null;
}

export function recordConsentedPublicFunnelEvent({
  payload,
  hasExplicitConsent,
  sink,
}: {
  readonly payload: unknown;
  readonly hasExplicitConsent: boolean;
  readonly sink?: PublicFunnelSink;
}): boolean {
  if (!hasExplicitConsent || !sink) return false;
  const event = parsePublicFunnelEvent(payload);
  if (!event) return false;
  try {
    sink(event);
    return true;
  } catch {
    return false;
  }
}

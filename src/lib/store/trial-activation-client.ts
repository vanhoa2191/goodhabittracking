import { z } from 'zod';

const trialActivationResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    entitlement: z.object({
      plan: z.literal('trial'),
      status: z.literal('active'),
      trial_ends_at: z.string().min(1),
      subscription_ends_at: z.null(),
    }),
  }),
  z.object({ success: z.literal(false), error: z.string().min(1) }),
]);

export type TrialActivationRequester = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type TrialActivationResult =
  | { readonly success: true }
  | { readonly success: false; readonly error: string };

export async function requestTrialActivation(
  requester: TrialActivationRequester = globalThis.fetch,
): Promise<TrialActivationResult> {
  let response: Response;
  let input: unknown;

  try {
    response = await requester('/api/entitlement/trial', { method: 'POST' });
    input = await response.json();
  } catch (error: unknown) {
    if (error instanceof TypeError) {
      return { success: false, error: 'Không thể kết nối tới máy chủ.' };
    }
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Không thể kích hoạt dùng thử.' };
    }
    throw error;
  }

  const parsed = trialActivationResponseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Không thể kích hoạt dùng thử.' };
  }
  if (!response.ok || !parsed.data.success) {
    return {
      success: false,
      error: parsed.data.success ? 'Không thể kích hoạt dùng thử.' : parsed.data.error,
    };
  }
  return { success: true };
}

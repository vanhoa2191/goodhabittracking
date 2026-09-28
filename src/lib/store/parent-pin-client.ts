import { z } from 'zod';

const statusSchema = z.object({
  configured: z.boolean(),
  lockedUntil: z.string().nullable(),
});
const verifySchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('verified') }),
  z.object({ status: z.literal('setup_required') }),
  z.object({ status: z.literal('invalid'), attemptsRemaining: z.number().int().optional() }),
  z.object({ status: z.literal('locked'), retryAfterSeconds: z.number().int().positive() }),
]);
const changeSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('updated') }),
  z.object({ status: z.literal('invalid_current'), attemptsRemaining: z.number().int().optional() }),
  z.object({ status: z.literal('invalid_format') }),
  z.object({ status: z.literal('locked'), retryAfterSeconds: z.number().int().positive() }),
]);

type Requester = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type ParentPinStatus = z.infer<typeof statusSchema>;
export type ParentPinVerification = z.infer<typeof verifySchema>;
export type ParentPinChange = z.infer<typeof changeSchema>;

async function parseResponse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new Error('parent_pin_invalid_response');
  return parsed.data;
}

export async function readParentPinStatus(requester: Requester = fetch): Promise<ParentPinStatus> {
  const response = await requester('/api/parent-pin');
  if (!response.ok) throw new Error('parent_pin_status_failed');
  return parseResponse(response, statusSchema);
}

export async function verifyParentPin(pin: string, requester: Requester = fetch): Promise<ParentPinVerification> {
  const response = await requester('/api/parent-pin', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!response.ok && response.status !== 400 && response.status !== 409 && response.status !== 429) {
    throw new Error('parent_pin_verify_failed');
  }
  return parseResponse(response, verifySchema);
}

export async function changeParentPin(
  input: { readonly currentPin?: string; readonly newPin: string },
  requester: Requester = fetch,
): Promise<ParentPinChange> {
  const response = await requester('/api/parent-pin', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok && response.status !== 400 && response.status !== 409 && response.status !== 429) {
    throw new Error('parent_pin_change_failed');
  }
  return parseResponse(response, changeSchema);
}

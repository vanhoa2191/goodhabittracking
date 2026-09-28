import { z } from 'zod';

const customerProfileSchema = z.object({
  display_name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  marketing_consent: z.boolean(),
});

const customerProfileResponseSchema = z.object({
  profile: customerProfileSchema,
});

const errorResponseSchema = z.object({
  correlationId: z.string().optional(),
}).passthrough();

export type CustomerProfile = z.infer<typeof customerProfileSchema>;
export type CustomerProfileInput = {
  readonly displayName: string;
  readonly phone: string;
  readonly marketingConsent: boolean;
};

type Requester = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type CustomerProfileErrorCode =
  | 'network_error'
  | 'session_expired'
  | 'invalid_response'
  | 'service_unavailable';

export class CustomerProfileRequestError extends Error {
  readonly code: CustomerProfileErrorCode;
  readonly correlationId?: string;

  constructor(code: CustomerProfileErrorCode, correlationId?: string) {
    super(code);
    this.name = 'CustomerProfileRequestError';
    this.code = code;
    this.correlationId = correlationId;
  }
}

async function requestProfile(
  requester: Requester,
  init?: RequestInit,
): Promise<CustomerProfile> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await requester('/api/account/profile', {
      ...init,
      signal: controller.signal,
    });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const parsedError = errorResponseSchema.safeParse(body);
      const correlationId = parsedError.success ? parsedError.data.correlationId : undefined;
      if (response.status === 401) {
        throw new CustomerProfileRequestError('session_expired', correlationId);
      }
      throw new CustomerProfileRequestError('service_unavailable', correlationId);
    }

    const parsed = customerProfileResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new CustomerProfileRequestError('invalid_response');
    }
    return parsed.data.profile;
  } catch (error: unknown) {
    if (error instanceof CustomerProfileRequestError) throw error;
    throw new CustomerProfileRequestError('network_error');
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export function loadCustomerProfile(requester: Requester = fetch): Promise<CustomerProfile> {
  return requestProfile(requester);
}

export function saveCustomerProfile(
  input: CustomerProfileInput,
  requester: Requester = fetch,
): Promise<CustomerProfile> {
  return requestProfile(requester, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}

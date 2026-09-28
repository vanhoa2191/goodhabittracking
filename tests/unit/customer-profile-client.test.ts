import { describe, expect, it, vi } from 'vitest';

import { loadCustomerProfile, saveCustomerProfile } from '@/lib/customer-profile-client';

const profile = {
  display_name: 'Nguyễn Văn An',
  email: 'an@example.com',
  phone: '0912345678',
  marketing_consent: true,
} as const;

describe('customer profile client', () => {
  it('parses a saved profile from the account boundary', async () => {
    const requester = vi.fn(async () => new Response(JSON.stringify({ success: true, profile }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(saveCustomerProfile({
      displayName: profile.display_name,
      phone: profile.phone,
      marketingConsent: true,
    }, requester)).resolves.toEqual(profile);
  });

  it('maps a rejected request to a retryable typed error', async () => {
    const requester = vi.fn(async () => Promise.reject(new TypeError('network offline')));

    await expect(loadCustomerProfile(requester)).rejects.toMatchObject({
      name: 'CustomerProfileRequestError',
      code: 'network_error',
    });
  });

  it('keeps the server correlation id when a save fails', async () => {
    const requester = vi.fn(async () => new Response(JSON.stringify({
      success: false,
      error: 'Could not save profile.',
      correlationId: '11111111-1111-4111-8111-111111111111',
    }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    }));

    const promise = saveCustomerProfile({
      displayName: profile.display_name,
      phone: profile.phone,
      marketingConsent: false,
    }, requester);

    await expect(promise).rejects.toMatchObject({
      name: 'CustomerProfileRequestError',
      code: 'service_unavailable',
      correlationId: '11111111-1111-4111-8111-111111111111',
    });
  });
});

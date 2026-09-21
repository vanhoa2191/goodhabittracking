import { describe, expect, it } from 'vitest';
import {
  requestTrialActivation,
  type TrialActivationRequester,
} from '@/lib/store/trial-activation-client';

describe('trial activation client', () => {
  it('accepts a validated trial entitlement', async () => {
    const requester: TrialActivationRequester = async () => new Response(JSON.stringify({
      success: true,
      entitlement: {
        plan: 'trial',
        status: 'active',
        trial_ends_at: '2026-09-27T00:00:00.000Z',
        subscription_ends_at: null,
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await expect(requestTrialActivation(requester)).resolves.toEqual({ success: true });
  });

  it('preserves a server-declared trial conflict', async () => {
    const requester: TrialActivationRequester = async () => new Response(JSON.stringify({
      success: false,
      error: 'Free trial has already been used.',
    }), { status: 409, headers: { 'content-type': 'application/json' } });

    await expect(requestTrialActivation(requester)).resolves.toEqual({
      success: false,
      error: 'Free trial has already been used.',
    });
  });

  it('rejects malformed success payloads with a safe user-facing result', async () => {
    const requester: TrialActivationRequester = async () => new Response(JSON.stringify({
      success: true,
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await expect(requestTrialActivation(requester)).resolves.toEqual({
      success: false,
      error: 'Không thể kích hoạt dùng thử.',
    });
  });

  it('maps a network failure without swallowing unexpected errors', async () => {
    const requester: TrialActivationRequester = async () => {
      throw new TypeError('Network request failed');
    };

    await expect(requestTrialActivation(requester)).resolves.toEqual({
      success: false,
      error: 'Không thể kết nối tới máy chủ.',
    });
  });
});

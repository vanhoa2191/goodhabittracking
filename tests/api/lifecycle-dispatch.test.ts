import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpc, sendLifecycleEmail } = vi.hoisted(() => ({
  rpc: vi.fn(),
  sendLifecycleEmail: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(() => ({ rpc })),
}));
vi.mock('@/lib/lifecycle/email', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/lifecycle/email')>();
  return {
    ...actual,
    getLifecycleEmailConfig: vi.fn(() => ({ enabled: true, apiKey: 'hidden', from: 'sender' })),
    sendLifecycleEmail,
  };
});

import { POST } from '@/app/api/internal/lifecycle/dispatch/route';

const claimed = {
  id: '11111111-1111-4111-8111-111111111111',
  template_key: 'welcome_setup',
  locale: 'vi',
  payload: {},
  dedupe_key: 'welcome-setup/user-1',
  recipient_email: 'parent@example.test',
};

function request(secret = 'cron-test-secret') {
  return new NextRequest('http://localhost/api/internal/lifecycle/dispatch', {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}` },
  });
}

describe('POST /api/internal/lifecycle/dispatch', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'cron-test-secret');
    rpc.mockImplementation((name: string) => {
      if (name === 'schedule_trial_ending_messages') return Promise.resolve({ data: 0, error: null });
      if (name === 'claim_lifecycle_messages') return Promise.resolve({ data: [claimed], error: null });
      return Promise.resolve({ data: true, error: null });
    });
    sendLifecycleEmail.mockResolvedValue('provider-message-1');
  });

  it('rejects callers without the cron secret', async () => {
    const response = await POST(request('wrong-secret-value'));
    expect(response.status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('sends a claimed message once and records its provider id', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(sendLifecycleEmail).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith('finish_lifecycle_message', expect.objectContaining({
      target_id: claimed.id,
      outcome: 'sent',
      provider_id: 'provider-message-1',
    }));
  });

  it('returns success for the batch while scheduling a bounded retry after provider failure', async () => {
    sendLifecycleEmail.mockRejectedValue(new Error('email_provider_503'));
    const response = await POST(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(expect.objectContaining({ sent: 0, failed: 1 }));
    expect(rpc).toHaveBeenCalledWith('finish_lifecycle_message', expect.objectContaining({
      outcome: 'failed',
      error_code: 'email_provider_503',
    }));
  });
});

import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const { getParentContext, createPayOSPayment, createAdminSupabaseClient } = vi.hoisted(() => ({
  getParentContext: vi.fn(async () => ({
    familyId: 'family-a',
    role: 'owner',
    user: { id: 'user-a' },
  })),
  createPayOSPayment: vi.fn(),
  createAdminSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/billing/payos-server', () => ({ createPayOSPayment }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient }));

import { POST } from '@/app/api/payment/create/route';

describe('POST /api/payment/create', () => {
  it.each([
    { planId: 'monthly', amount: 1 },
    { planId: 'monthly', userId: 'attacker' },
    { planId: 'monthly', returnUrl: 'https://attacker.example' },
  ])('rejects caller-controlled payment fields: %o', async (body) => {
    const response = await POST(
      new NextRequest('http://localhost/api/payment/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
    );

    expect(response.status).toBe(400);
    expect(createPayOSPayment).not.toHaveBeenCalled();
    expect(createAdminSupabaseClient).not.toHaveBeenCalled();
  });
});

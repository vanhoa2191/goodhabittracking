import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, createPayOSPayment, cancelPayOSPayment, createAdminSupabaseClient } = vi.hoisted(() => ({
  getParentContext: vi.fn(async () => ({
    familyId: 'family-a',
    role: 'owner',
    user: { id: 'user-a' },
  })),
  createPayOSPayment: vi.fn(),
  cancelPayOSPayment: vi.fn(),
  createAdminSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/billing/payos-server', () => ({ createPayOSPayment, cancelPayOSPayment }));
vi.mock('@/lib/billing/payos-config', () => ({ requireSafePayOSConfig: () => ({ PAYOS_CLIENT_ID: 'client', PAYOS_API_KEY: 'key', PAYOS_CHECKSUM_KEY: 'checksum' }) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc: vi.fn() })) }));

const { flags } = vi.hoisted(() => ({ flags: { printablesSale: false } }));
vi.mock('@/lib/experience-flags', () => ({ defaultExperienceFlags: flags }));

vi.mock('@/lib/security/parent-unlock', () => ({
  requireParentUnlock: vi.fn(async () => null),
}));

import { PayOSOrderNotFoundError } from '@/lib/billing/payos-errors';

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

describe('POST /api/payment/create atomic order reservation', () => {
  const rpc = vi.fn();
  const update = vi.fn();
  const eq = vi.fn();
  let discount = 1000;
  let pending: Record<string, unknown> | null = null;
  let referrerLookup: { owner: unknown; referral: unknown; profile: unknown; error: unknown };
  const lookupChain = (table: string) => {
    const result = () => ({ data: table === 'family_memberships' ? referrerLookup.owner : table === 'referrals' ? referrerLookup.referral : referrerLookup.profile, error: referrerLookup.error });
    const chain: Record<string, unknown> = {};
    for (const name of ['select', 'eq', 'order', 'limit']) chain[name] = () => chain;
    chain.maybeSingle = async () => result();
    return chain;
  };
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  function post(planId: string) {
    return POST(new NextRequest('http://localhost/api/payment/create', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ planId }),
    }));
  }
  beforeEach(() => {
    rpc.mockReset(); update.mockReset(); eq.mockReset(); flags.printablesSale = false;
    createPayOSPayment.mockReset(); cancelPayOSPayment.mockReset();
    discount = 1000; pending = null; referrerLookup = { owner: { user_id: 'owner-1' }, referral: { referrer_user_id: 'ref-1' }, profile: { display_name: 'Lan' }, error: null };
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ code: '00', data: { orderCode: 987, amount: 399000, amountPaid: 0, status: 'PENDING' } }))));
    rpc.mockImplementation(async (_name, args) => {
      const yearly = ['yearly', 'solo_yearly', 'pro_plus_yearly'].includes(args.selected_plan);
      const price = { monthly: 69000, yearly: 590000, solo_monthly: 49000, solo_yearly: 399000, pro_plus_monthly: 79000, pro_plus_yearly: 790000, ai_addon_monthly: 29000, printables: 99000 }[args.selected_plan as 'monthly'];
      return { data: [{ amount: Math.floor(price * (1 - (yearly ? discount : 0) / 10000) / 1000) * 1000, discount_bps: yearly ? discount : 0 }], error: null };
    });
    const chain: Record<string, unknown> = {};
    chain.eq = (...args: unknown[]) => { eq(...args); return chain; };
    chain.select = () => chain;
    chain.maybeSingle = async () => ({ data: pending, error: null });
    chain.then = (resolve: (value: unknown) => void) => resolve({ error: null });
    update.mockReturnValue(chain);
    createAdminSupabaseClient.mockReturnValue({ rpc, from: (table: string) => (['family_memberships', 'referrals', 'parent_profiles'].includes(table) ? lookupChain(table) : { update, select: () => chain }) });
    createPayOSPayment.mockImplementation(async (input) => ({ ...input, checkoutUrl: 'https://pay.example/x', paymentLinkId: 'link' }));
    cancelPayOSPayment.mockResolvedValue(undefined);
  });
  it.each([['yearly', 531000, 590000], ['solo_yearly', 359000, 399000]])('uses the atomic DB price for %s', async (planId, amount, listPrice) => {
    const response = await post(String(planId));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('create_family_payment_order', expect.objectContaining({ target_family: 'family-a', actor_id: 'user-a', selected_plan: planId }));
    expect(createPayOSPayment).toHaveBeenCalledWith(expect.objectContaining({ amount, expiresAt: expect.any(String) }));
    const body = await response.json();
    expect(body.payment).toMatchObject({ amount, listPrice, discountAmount: listPrice - amount, referrerName: 'Lan' });
    expect(body.payment).not.toHaveProperty('discountPercent');
  });
  it('reports a referred Pro Plus yearly order as 790000 less 79000 from Lan', async () => {
    const response = await post('pro_plus_yearly');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.payment).toMatchObject({ amount: 711000, listPrice: 790000, discountAmount: 79000, referrerName: 'Lan' });
  });
  it('sells Pro Plus monthly at list price', async () => {
    const body = await (await post('pro_plus_monthly')).json();
    expect(body.payment.amount).toBe(79000);
    expect(body.payment).not.toHaveProperty('discountAmount');
  });
  it('reports a referred Solo yearly order as 399000 less 40000 from Lan', async () => {
    const body = await (await post('solo_yearly')).json();
    expect(body.payment).toMatchObject({ amount: 359000, listPrice: 399000, discountAmount: 40000, referrerName: 'Lan' });
  });
  it('truncates referrer names by code points without splitting an emoji', async () => {
    const expected = `${'x'.repeat(39)}😀`;
    referrerLookup.profile = { display_name: ` ${expected}extra ` };
    const response = await post('solo_yearly');
    expect(response.status).toBe(200);
    const { payment } = await response.json();
    expect(payment.referrerName).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/);
    expect(Array.from(payment.referrerName)).toHaveLength(40);
    expect(payment.referrerName).toBe(expected);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ checkout_payment: expect.objectContaining({ referrerName: expected }) }));
    expect(cancelPayOSPayment).not.toHaveBeenCalled();
  });
  it.each([
    ['lone surrogates and controls', ' \uD800La\u0000n\uDC00\u007F\u0085😀 ', 'Lan😀'],
    ['only invalid characters', '\uD800\u0000\uDC00', null],
  ])('strips %s from referrer names before saving checkout', async (_label, displayName, expected) => {
    referrerLookup.profile = { display_name: displayName };
    const response = await post('solo_yearly');
    expect(response.status).toBe(200);
    const { payment } = await response.json();
    expect(payment.referrerName).toBe(expected);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ checkout_payment: expect.objectContaining({ referrerName: expected }) }));
  });
  it.each([
    ['blank name', { profile: { display_name: '   ' } }, null],
    ['long name', { profile: { display_name: ` ${'x'.repeat(60)} ` } }, 'x'.repeat(40)],
    ['no referral row', { referral: null }, null],
    ['lookup error', { error: { message: 'boom' } }, null],
  ])('keeps checkout working with %s', async (_label, patch, expected) => {
    Object.assign(referrerLookup, patch);
    const response = await post('yearly');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.payment).toMatchObject({ amount: 531000, discountAmount: 59000, referrerName: expected });
  });
  it.each([['monthly', 69000], ['solo_monthly', 49000], ['yearly', 590000], ['solo_yearly', 399000]])('uses list price when not eligible for %s', async (planId, amount) => {
    discount = 0;
    const body = await (await post(String(planId))).json();
    expect(body.payment.amount).toBe(amount);
    expect(body.payment.listPrice).toBeUndefined();
    expect(body.payment).not.toHaveProperty('discountAmount');
    expect(body.payment).not.toHaveProperty('referrerName');
  });
  it('refuses a concurrent yearly checkout before opening another provider link', async () => {
    pending = { order_code: 987, family_id: 'family-a', plan_id: 'yearly', amount: 590000, description: 'KIDHABIT 987', status: 'PENDING', expires_at: new Date(Date.now() + 60000).toISOString() };
    rpc.mockResolvedValue({ data: [{ amount: 590000, discount_bps: 0, existing_order_code: 987 }], error: null });
    const response = await post('yearly');
    expect(response.status).toBe(409);
    expect(createPayOSPayment).not.toHaveBeenCalled();
  });
  it('reuses a valid link for the same plan without opening another provider link', async () => {
    const payment = { orderCode: 987, planId: 'yearly', amount: 531000, listPrice: 590000, discountPercent: 10, checkoutUrl: 'https://pay.example/existing' };
    pending = { order_code: 987, family_id: 'family-a', plan_id: 'yearly', amount: 531000, description: 'KIDHABIT 987', status: 'PENDING', expires_at: new Date(Date.now() + 60000).toISOString(), checkout_payment: payment };
    rpc.mockResolvedValue({ data: [{ amount: 531000, discount_bps: 0, existing_order_code: 987 }], error: null });
    await expect((await post('yearly')).json()).resolves.toMatchObject({ success: true, payment });
    expect(createPayOSPayment).not.toHaveBeenCalled();
    expect(cancelPayOSPayment).not.toHaveBeenCalled();
  });
  it.each([['solo_yearly', 'yearly'], ['yearly', 'solo_yearly']])('switches %s to %s immediately after cancelling the valid link', async (previous, next) => {
    pending = { order_code: 987, family_id: 'family-a', plan_id: previous, amount: 399000, description: 'KIDHABIT 987', status: 'PENDING', expires_at: new Date(Date.now() + 60000).toISOString(), checkout_payment: { planId: previous } };
    rpc.mockResolvedValueOnce({ data: [{ amount: 399000, discount_bps: 0, existing_order_code: 987 }], error: null });
    expect((await post(next)).status).toBe(200);
    expect(cancelPayOSPayment).toHaveBeenCalledWith(987, 'Customer selected a new checkout');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
    expect(createPayOSPayment).toHaveBeenCalledWith(expect.objectContaining({ planId: next }));
    expect(rpc).toHaveBeenCalledTimes(2);
  });
  it('recovers from create failure plus unknown-order cancel failure on the next checkout after grace', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-09T00:00:00Z'));
    const normalReservation = rpc.getMockImplementation()!;
    rpc.mockImplementation(async (name, args) => {
      if (pending?.status === 'PENDING') return { data: [{ amount: pending.amount, discount_bps: 0, existing_order_code: pending.order_code }], error: null };
      const result = await normalReservation(name, args);
      pending = { order_code: args.new_order_code, family_id: args.target_family, plan_id: args.selected_plan, amount: result.data[0].amount, description: `KIDHABIT ${args.new_order_code}`, status: 'PENDING', created_at: new Date().toISOString(), expires_at: args.expires_at };
      return result;
    });
    createPayOSPayment.mockRejectedValueOnce(new Error('create timed out'));
    cancelPayOSPayment.mockRejectedValue(new PayOSOrderNotFoundError());
    expect((await post('yearly')).status).toBe(503);
    expect(update).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
    vi.setSystemTime(new Date('2026-10-09T00:16:00Z'));
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ code: '231', desc: 'Payment link not found' }))));
    update.mockImplementation((patch) => {
      if (patch.status === 'CANCELLED' && pending) pending.status = 'CANCELLED';
      const chain: Record<string, unknown> = {};
      chain.eq = () => chain;
      chain.then = (resolve: (value: unknown) => void) => resolve({ error: null });
      return chain;
    });
    expect((await post('yearly')).status).toBe(200);
    expect(createPayOSPayment).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
  });
  it('keeps an expired but unverified link reserved during a transient provider outage', async () => {
    pending = { order_code: 987, family_id: 'family-a', plan_id: 'yearly', amount: 590000, description: 'KIDHABIT 987', status: 'PENDING', expires_at: new Date(Date.now() - 60000).toISOString() };
    rpc.mockResolvedValue({ data: [{ amount: 590000, discount_bps: 0, existing_order_code: 987 }], error: null });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('unavailable', { status: 503 })));
    cancelPayOSPayment.mockRejectedValue(new Error('network'));
    expect((await post('solo_yearly')).status).toBe(503);
    expect(update).not.toHaveBeenCalled();
    expect(createPayOSPayment).not.toHaveBeenCalled();
  });
  it('retries provider cancellation immediately after a failed create attempt has finished', async () => {
    pending = { order_code: 987, family_id: 'family-a', plan_id: 'yearly', amount: 590000, description: 'KIDHABIT 987', status: 'PENDING', expires_at: new Date(Date.now() + 60000).toISOString(), checkout_creation_finished_at: new Date().toISOString() };
    rpc.mockResolvedValueOnce({ data: [{ amount: 590000, discount_bps: 0, existing_order_code: 987 }], error: null });
    expect((await post('solo_yearly')).status).toBe(200);
    expect(cancelPayOSPayment).toHaveBeenCalledWith(987, 'Customer selected a new checkout');
    expect(createPayOSPayment).toHaveBeenCalledWith(expect.objectContaining({ planId: 'solo_yearly' }));
  });
  it('closes a failed-create order PayOS does not know at once instead of returning 503 during grace', async () => {
    pending = { order_code: 987, family_id: 'family-a', plan_id: 'yearly', amount: 590000, description: 'KIDHABIT 987', status: 'PENDING', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 14 * 60000).toISOString(), checkout_creation_finished_at: new Date().toISOString() };
    rpc.mockResolvedValueOnce({ data: [{ amount: 590000, discount_bps: 0, existing_order_code: 987 }], error: null });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ code: '231', desc: 'Payment link not found' }))));
    cancelPayOSPayment.mockRejectedValue(new PayOSOrderNotFoundError());
    const response = await post('yearly');
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
    expect(eq).toHaveBeenCalledWith('order_code', 987);
    expect(createPayOSPayment).toHaveBeenCalledWith(expect.objectContaining({ planId: 'yearly' }));
    expect(rpc).toHaveBeenCalledTimes(2);
  });
  it('still holds an unknown order within grace while its create may be in flight', async () => {
    pending = { order_code: 987, family_id: 'family-a', plan_id: 'yearly', amount: 590000, description: 'KIDHABIT 987', status: 'PENDING', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 14 * 60000).toISOString() };
    rpc.mockResolvedValue({ data: [{ amount: 590000, discount_bps: 0, existing_order_code: 987 }], error: null });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ code: '231', desc: 'Payment link not found' }))));
    cancelPayOSPayment.mockRejectedValue(new PayOSOrderNotFoundError());
    expect((await post('yearly')).status).toBe(409);
    expect(update).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
    expect(createPayOSPayment).not.toHaveBeenCalled();
  });
  it('does not cancel another family reservation based only on shared owner attribution', async () => {
    pending = { order_code: 987, family_id: 'other-family', user_id: 'another-payer', plan_id: 'yearly', amount: 590000, status: 'PENDING' };
    rpc.mockResolvedValue({ data: [{ amount: 590000, discount_bps: 0, existing_order_code: 987 }], error: null });
    const normalAdmin = createAdminSupabaseClient.getMockImplementation()!();
    createAdminSupabaseClient.mockReturnValue({ ...normalAdmin, from: (table: string) => table === 'family_memberships'
      ? { select: () => ({ eq: () => ({ eq: () => ({ in: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) }) }
      : normalAdmin.from(table) });
    expect((await post('yearly')).status).toBe(409);
    expect(cancelPayOSPayment).not.toHaveBeenCalled();
    expect(createPayOSPayment).not.toHaveBeenCalled();
  });
  it('retries unique order-code collisions but no other database errors', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: '23505' } });
    expect((await post('monthly')).status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(2);
    rpc.mockReset(); rpc.mockResolvedValue({ data: null, error: { code: '23505' } });
    expect((await post('monthly')).status).toBe(503);
    expect(rpc).toHaveBeenCalledTimes(3);
    rpc.mockClear(); rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
    expect((await post('monthly')).status).toBe(503);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('keeps an uncertain provider link pending for reconciliation', async () => {
    createPayOSPayment.mockRejectedValue(new Error('network'));
    cancelPayOSPayment.mockRejectedValue(new Error('not confirmed'));
    expect((await post('monthly')).status).toBe(503);
    expect(update).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ checkout_creation_finished_at: expect.any(String) }));
  });
  it('cancels only PENDING after provider confirmation, never overwriting PAID', async () => {
    createPayOSPayment.mockRejectedValue(new Error('QR failed after link creation'));
    expect((await post('monthly')).status).toBe(503);
    expect(cancelPayOSPayment).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
    expect(eq).toHaveBeenCalledWith('status', 'PENDING');
  });
  it('does not sell the old upcoming Pro Plus ids', async () => {
    expect((await post('family_plus_yearly')).status).toBe(400);
    expect(createPayOSPayment).not.toHaveBeenCalled();
  });
  it('sells the AI add-on with no discount, no referrer lookup and no discount fields', async () => {
    discount = 1000;
    const response = await post('ai_addon_monthly');
    expect(response.status).toBe(200);
    const { payment } = await response.json();
    expect(payment).toMatchObject({ amount: 29000, planId: 'ai_addon_monthly' });
    expect(payment).not.toHaveProperty('listPrice');
    expect(payment).not.toHaveProperty('discountAmount');
    expect(payment).not.toHaveProperty('referrerName');
  });
  it.each([
    ['addon_requires_plan', 'ai_addon_monthly'],
    ['already_included', 'ai_addon_monthly'],
    ['already_owned', 'printables'],
    ['lifetime_active', 'pro_plus_monthly'],
  ])('answers %s with 409 and that code, creating no provider link', async (code, planId) => {
    flags.printablesSale = true;
    rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message: code } });
    const response = await post(planId);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ success: false, code });
    expect(createPayOSPayment).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('answers a lower-rank refusal with 409 higher_plan_active for any plan', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message: 'higher_plan_active' } });
    const response = await post('solo_monthly');
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ success: false, code: 'higher_plan_active' });
    expect(createPayOSPayment).not.toHaveBeenCalled();
  });
  it('answers printables with the flag off before it reads the session', async () => {
    flags.printablesSale = false;
    getParentContext.mockClear();
    const response = await post('printables');
    expect(response.status).toBe(404);
    expect(getParentContext).not.toHaveBeenCalled();
  });
  it('sells printables when the sale flag is on', async () => {
    flags.printablesSale = true;
    const response = await post('printables');
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('create_family_payment_order', expect.objectContaining({ selected_plan: 'printables' }));
    expect((await response.json()).payment.amount).toBe(99000);
  });
  it('answers 404 not_available for printables with the flag off, without touching the database', async () => {
    flags.printablesSale = false;
    const response = await post('printables');
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ success: false, code: 'not_available' });
    expect(createAdminSupabaseClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(createPayOSPayment).not.toHaveBeenCalled();
  });
});

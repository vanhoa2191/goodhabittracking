import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/billing/payos-config', () => ({
  requireSafePayOSConfig: () => ({ PAYOS_CLIENT_ID: 'client', PAYOS_API_KEY: 'api-key', PAYOS_CHECKSUM_KEY: 'checksum-key' }),
}));

import { createPayOSSignature } from '@/lib/billing/payos-signature';
import { fetchPayOSPaymentInfo, reconcileOrderOutcome, reconcilePendingOrder } from '@/lib/billing/payos-reconcile';

const order = { order_code: 123456, amount: 49000, description: 'KIDHABIT 123456', status: 'PENDING' };

function payosAnswer(data: Record<string, unknown>, options: { sign?: boolean; badSignature?: boolean } = {}) {
  const body: Record<string, unknown> = { code: '00', desc: 'success', data };
  if (options.sign) body.signature = options.badSignature ? 'a'.repeat(64) : createPayOSSignature(data, 'checksum-key');
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

const paid = { orderCode: 123456, amount: 49000, amountPaid: 49000, status: 'PAID', transactions: [{ reference: 'FT26274ABC' }] };

describe('PayOS reconciliation', () => {
  const rpc = vi.fn();
  beforeEach(() => rpc.mockReset());
  afterEach(() => vi.unstubAllGlobals());

  it('asks PayOS with our credentials for the order', async () => {
    const fetchMock = vi.fn<(url: string, init: { headers: Record<string, string> }) => Promise<Response>>(async () => payosAnswer(paid));
    vi.stubGlobal('fetch', fetchMock);
    await fetchPayOSPaymentInfo(123456);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api-merchant.payos.vn/v2/payment-requests/123456');
    expect(init.headers).toMatchObject({ 'x-client-id': 'client', 'x-api-key': 'api-key' });
  });

  it('settles a paid order through the webhook function with the real bank reference', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => payosAnswer(paid, { sign: true })));
    rpc.mockResolvedValue({ data: 'activated', error: null });
    await expect(reconcilePendingOrder({ rpc }, order)).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith('process_payos_webhook', expect.objectContaining({
      incoming_order_code: 123456,
      incoming_amount: 49000,
      incoming_description: 'KIDHABIT 123456',
      incoming_reference: 'FT26274ABC',
    }));
  });

  it('falls back to a stable reference when PayOS lists no transaction', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => payosAnswer({ ...paid, transactions: [] })));
    rpc.mockResolvedValue({ data: 'activated', error: null });
    await reconcilePendingOrder({ rpc }, order);
    expect(rpc).toHaveBeenCalledWith('process_payos_webhook', expect.objectContaining({ incoming_reference: 'payos-status-123456' }));
  });

  it.each([
    ['still pending', { ...paid, status: 'PENDING', amountPaid: 0 }],
    ['cancelled', { ...paid, status: 'CANCELLED', amountPaid: 0 }],
    ['no paid amount proof', { ...paid, status: 'CANCELLED', amountPaid: undefined }],
    ['partly paid', { ...paid, amountPaid: 10000 }],
    ['a different amount', { ...paid, amount: 59000, amountPaid: 59000 }],
    ['another order', { ...paid, orderCode: 999 }],
  ])('leaves the order alone when PayOS reports %s', async (_label, data) => {
    vi.stubGlobal('fetch', vi.fn(async () => payosAnswer(data)));
    await expect(reconcilePendingOrder({ rpc }, order)).resolves.toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('does not trust an answer whose signature does not match', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => payosAnswer(paid, { sign: true, badSignature: true })));
    await expect(reconcilePendingOrder({ rpc }, order)).resolves.toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([401, 404, 500])('does nothing when PayOS answers %i', async (status) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ code: '20', desc: 'error' }), { status })));
    await expect(reconcilePendingOrder({ rpc }, order)).resolves.toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('does not call PayOS for an order that is not pending', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(reconcilePendingOrder({ rpc }, { ...order, status: 'PAID' })).resolves.toBe(true);
    await expect(reconcilePendingOrder({ rpc }, { ...order, status: 'CANCELLED' })).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports failure when the database refuses the settlement', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => payosAnswer(paid)));
    rpc.mockResolvedValue({ data: 'amount_mismatch', error: null });
    await expect(reconcilePendingOrder({ rpc }, order)).resolves.toBe(false);
    rpc.mockResolvedValue({ data: null, error: { message: 'down' } });
    await expect(reconcilePendingOrder({ rpc }, order)).resolves.toBe(false);
  });

  it.each(['CANCELLED', 'EXPIRED'])('reports a %s link with nothing paid as closed so it can stop being polled', async (status) => {
    vi.stubGlobal('fetch', vi.fn(async () => payosAnswer({ ...paid, status, amountPaid: 0 })));
    await expect(reconcileOrderOutcome({ rpc }, order)).resolves.toBe('closed');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('never closes an order that has money on it, even if PayOS calls the link cancelled', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => payosAnswer({ ...paid, status: 'CANCELLED', amountPaid: 49000 })));
    await expect(reconcileOrderOutcome({ rpc }, order)).resolves.toBe('open');
  });

  it('keeps a pending link open', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => payosAnswer({ ...paid, status: 'PENDING', amountPaid: 0 })));
    await expect(reconcileOrderOutcome({ rpc }, order)).resolves.toBe('open');
  });
});

describe('provider-unknown order recovery', () => {
  afterEach(() => vi.unstubAllGlobals());
  const rpc = vi.fn();
  const unknown = () => new Response(JSON.stringify({ code: '231', desc: 'Payment link not found' }));
  it.each([
    { expires_at: new Date(Date.now() - 1000).toISOString() },
    { created_at: new Date(Date.now() - 16 * 60000).toISOString(), expires_at: null },
  ])('closes a proven unknown order after grace (%o)', async (age) => {
    vi.stubGlobal('fetch', vi.fn(async () => unknown()));
    await expect(reconcileOrderOutcome({ rpc }, { ...order, ...age })).resolves.toBe('closed');
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([
    { expires_at: new Date(Date.now() + 1000).toISOString() },
    { created_at: new Date().toISOString(), expires_at: null },
    { expires_at: 'invalid' },
    {},
  ])('keeps an unknown order within grace or without an age open (%o)', async (age) => {
    vi.stubGlobal('fetch', vi.fn(async () => unknown()));
    await expect(reconcileOrderOutcome({ rpc }, { ...order, ...age })).resolves.toBe('open');
  });
  it.each([
    [503, { code: '231' }], [401, { code: '231' }], [429, { code: '231' }],
    [404, { message: 'proxy not found' }], [200, { code: '99', desc: 'system unavailable' }],
  ])('never treats a transient/malformed HTTP %s answer as unpaid proof', async (status, body) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status: Number(status) })));
    await expect(reconcileOrderOutcome({ rpc }, { ...order, expires_at: new Date(Date.now() - 1000).toISOString() })).resolves.toBe('open');
  });
  it('passes a deadline signal to the provider request', async () => {
    const fetchMock = vi.fn(async () => unknown()); vi.stubGlobal('fetch', fetchMock);
    const signal = AbortSignal.timeout(100);
    await reconcileOrderOutcome({ rpc }, order, signal);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal }));
  });
});

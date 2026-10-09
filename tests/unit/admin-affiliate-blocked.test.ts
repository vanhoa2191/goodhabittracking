import { createElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAffiliatePayoutActions } from '@/components/AdminAffiliatePayoutActions';
import type { PayoutClaimState } from '@/components/AdminAffiliatePayoutActions';
import { AdminAffiliatePanel } from '@/components/AdminAffiliatePanel';

const hooks = vi.hoisted(() => ({ index: 0, states: ['BANK-REFERENCE', 'refund review', false, null] as unknown[], refresh: vi.fn(), rpc: vi.fn() }));
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof React>(),
  useState: () => {
    const index = hooks.index++;
    return [hooks.states[index], (value: unknown) => { hooks.states[index] = value; }];
  },
  useId: () => 'payout',
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: hooks.refresh }) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc: hooks.rpc }) }));

function actions(claimState: PayoutClaimState, blocked: boolean) {
  hooks.index = 0;
  return AdminAffiliatePayoutActions({ payoutId: 'payout-id', claimState, blocked });
}

type Button = ReactElement<{ disabled: boolean; onClick: () => void }>;
function buttons(node: ReactNode): Button[] {
  if (Array.isArray(node)) return node.flatMap(buttons);
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  return node.type === 'button' ? [node as Button] : buttons(node.props.children);
}

beforeEach(() => {
  hooks.states = ['BANK-REFERENCE', 'refund review', false, null];
  hooks.refresh.mockClear();
  hooks.rpc.mockReset();
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('blocked affiliate payout actions', () => {
  it.each(['unclaimed', 'mine'] as const)('blocks payment/claim but permits rejection (%s)', async (state) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    const controls = buttons(actions(state, true));
    expect(controls).toHaveLength(2);
    expect(controls.map((button) => button.props.disabled)).toEqual([true, false]);
    controls[0].props.onClick();
    expect(fetchMock).not.toHaveBeenCalled();
    controls[1].props.onClick();
    await vi.waitFor(() => expect(hooks.refresh).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      payoutId: 'payout-id', resolution: 'rejected', reference: 'BANK-REFERENCE', note: '', reason: 'refund review',
    });
  });

  it('does not let a second admin resolve a blocked payout while another admin holds the claim', () => {
    expect(buttons(actions('other', true))).toEqual([]);
  });

  it.each(['billing_case_open', 'refund_confirmed'])('explains a newly blocked API response (%s)', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status }), { status: 409 })));
    buttons(actions('mine', false))[0].props.onClick();
    await vi.waitFor(() => expect(hooks.states[2]).toBe(false));
    const html = renderToStaticMarkup(actions('mine', false));
    expect(html).toContain('role="alert"');
    expect(hooks.states[3]).toBeTypeOf('string');
    expect(hooks.states[3]).not.toBe(status);
    expect(hooks.refresh).not.toHaveBeenCalled();
  });

  it('keeps normal claim and payment actions enabled when not blocked', () => {
    expect(buttons(actions('unclaimed', false)).map((button) => button.props.disabled)).toEqual([false]);
    expect(buttons(actions('mine', false)).map((button) => button.props.disabled)).toEqual([false, false]);
  });

  it('shows the blocked orders on the pending payout and passes the block to its controls', async () => {
    hooks.rpc.mockResolvedValue({ data: {
      affiliates: 1, referrals: 2, owed: { held: 0, available: 0, requested: 100000, paid: 0 },
      payouts: [{ id: 'payout-id', amount: 100000, status: 'requested', bank: 'Bank', accountNumber: '12345678', accountName: 'Affiliate', requestedAt: '2026-10-09T12:00:00Z', processingBy: null, processingAt: null, blocked: true, blockedOrderCodes: [7654321, 7654322] }],
    }, error: null });
    const panel = await AdminAffiliatePanel({ canSeeFullAccounts: true, adminId: 'admin' });
    hooks.index = 0;
    const html = renderToStaticMarkup(createElement('div', null, panel));
    expect(html).toMatch(/role="alert"[^>]*>[^<]*7654321, 7654322/);
    const renderedButtons = [...html.matchAll(/<button\b([^>]*)>/g)];
    expect(renderedButtons).toHaveLength(2);
    expect(renderedButtons[0][1]).toMatch(/\sdisabled(?:=|\s|$)/);
    expect(renderedButtons[1][1]).not.toMatch(/\sdisabled(?:=|\s|$)/);
  });
});

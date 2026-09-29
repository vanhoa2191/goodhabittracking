'use client';

import { useEffect, useState } from 'react';
import { readPaymentStatus } from '@/lib/billing/payment-client';
import { useTranslation } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';

const PAYMENT_RETURN_QUERY_KEYS = ['payment', 'orderCode', 'code', 'id', 'cancel', 'status'] as const;

type PaymentReturnState = 'checking' | 'activated' | 'pending' | 'cancelled' | 'error';

export function PaymentReturnNotice() {
  const { syncNow } = useAppStore();
  const { t } = useTranslation();
  const [state, setState] = useState<PaymentReturnState | null>(null);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const returnKind = currentUrl.searchParams.get('payment');
    if (returnKind !== 'success' && returnKind !== 'cancel') return;

    const clearReturnParameters = () => {
      for (const key of PAYMENT_RETURN_QUERY_KEYS) currentUrl.searchParams.delete(key);
      window.history.replaceState(
        window.history.state,
        '',
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
      );
    };

    if (returnKind === 'cancel') {
      queueMicrotask(() => setState('cancelled'));
      clearReturnParameters();
      return;
    }

    const orderCode = Number(currentUrl.searchParams.get('orderCode'));
    if (!Number.isSafeInteger(orderCode) || orderCode <= 0) {
      queueMicrotask(() => setState('error'));
      clearReturnParameters();
      return;
    }

    let active = true;
    queueMicrotask(() => setState('checking'));

    void (async () => {
      try {
        const result = await readPaymentStatus(orderCode);
        if (!active) return;
        if (!result.success) {
          setState('error');
          return;
        }
        if (!result.paid) {
          setState('pending');
          return;
        }
        await syncNow();
        if (active) setState('activated');
      } catch {
        if (active) setState('error');
      } finally {
        clearReturnParameters();
      }
    })();

    return () => {
      active = false;
    };
  }, [syncNow]);

  if (!state) return null;

  const messages: Record<PaymentReturnState, string> = {
    checking: t.checkingPayment,
    activated: t.paymentReturnActivated,
    pending: t.paymentReturnPending,
    cancelled: t.paymentReturnCancelled,
    error: t.paymentReturnError,
  };

  return (
    <div
      role={state === 'error' ? 'alert' : 'status'}
      data-payment-state={state}
      className={`mx-auto mt-3 max-w-5xl rounded-2xl border px-4 py-3 text-sm font-semibold ${
        state === 'activated'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
          : state === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
            : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
      }`}
    >
      {messages[state]}
    </div>
  );
}

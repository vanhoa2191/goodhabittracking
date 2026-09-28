'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, CreditCard, LogIn, ShieldCheck } from 'lucide-react';
import { CheckoutModal } from '@/components/CheckoutModal';
import { getPricingPlan } from '@/lib/payos';
import { getMarketingOrigin } from '@/lib/site';
import { parseCheckoutPlan, signInWithGoogle } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

interface CheckoutEntryProps {
  readonly planValues: readonly string[];
}

const currency = new Intl.NumberFormat('vi-VN');

export function CheckoutEntry({ planValues }: CheckoutEntryProps) {
  const planId = planValues.length === 1 ? parseCheckoutPlan(planValues[0] ?? null) : null;
  const plan = useMemo(() => planId ? getPricingPlan(planId) : null, [planId]);
  const openedPlan = useRef<string | null>(null);
  const {
    closeCheckoutModal,
    currentUser,
    familyId,
    familyRole,
    isCheckoutModalOpen,
    isEntryReady,
    openCheckoutModal,
    checkoutPlan,
  } = useAppStore();
  const [loginError, setLoginError] = useState<string | null>(null);
  const pricingUrl = new URL('/pricing', getMarketingOrigin()).href;
  const isParent = familyRole === 'owner' || familyRole === 'parent' || familyRole === 'guardian';
  const canPay = Boolean(isEntryReady && currentUser && familyId && isParent);

  const handleLogin = async () => {
    setLoginError(null);
    const result = await signInWithGoogle(`/checkout?plan=${plan?.id ?? ''}`);
    if (result.error) setLoginError('Không thể mở đăng nhập Google. Vui lòng thử lại.');
  };

  useEffect(() => {
    if (!plan || !canPay || openedPlan.current === plan.id) return;
    openedPlan.current = plan.id;
    openCheckoutModal(plan.id);
  }, [canPay, openCheckoutModal, plan]);

  if (!plan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-zinc-950">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <CreditCard className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Gói thanh toán không hợp lệ</h1>
          <p className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-300">Liên kết có thể đã cũ hoặc thiếu thông tin gói. Hãy chọn lại gói phù hợp từ bảng giá KidHabit.</p>
          <Link href={pricingUrl} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-extrabold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            Xem bảng giá
          </Link>
        </section>
      </main>
    );
  }

  const waitingForFamily = Boolean(currentUser && (!isEntryReady || !familyId || familyRole === null));
  const caregiver = Boolean(currentUser && isEntryReady && familyRole === 'caregiver');

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eef2ff,_transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top_left,_#312e81,_transparent_36%),linear-gradient(180deg,#09090b_0%,#18181b_100%)] sm:py-14">
      <section className="mx-auto w-full max-w-3xl">
        <Link href={getMarketingOrigin().href} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold text-slate-700 hover:bg-white/80 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Về trang chủ
        </Link>

        <div data-testid="checkout-summary" className="mt-4 overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-2xl shadow-indigo-100/70 dark:border-indigo-900/70 dark:bg-zinc-900 dark:shadow-none">
          <div className="bg-gradient-to-r from-indigo-700 to-violet-600 px-6 py-6 text-white sm:px-10 sm:py-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-indigo-100">Gói bạn đã chọn</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{plan.name}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-indigo-50">{plan.description}</p>
          </div>

          <div className="grid gap-7 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:p-10">
            <div>
              <div className="flex items-baseline gap-2">
                <strong className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">{currency.format(plan.price)}₫</strong>
                <span className="font-semibold text-slate-600 dark:text-slate-300">{plan.periodLabel}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:w-64">
              {!currentUser ? (
                <button type="button" onClick={() => void handleLogin()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-base font-extrabold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:shadow-none">
                  <LogIn className="h-5 w-5" /> Đăng nhập để thanh toán
                </button>
              ) : caregiver ? (
                <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Chỉ phụ huynh trong gia đình mới có thể thanh toán.</p>
              ) : waitingForFamily ? (
                <p role="status" className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-bold leading-6 text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100">Đang tải thông tin gia đình để tiếp tục thanh toán…</p>
              ) : (
                <button type="button" onClick={() => openCheckoutModal(plan.id)} className="min-h-12 w-full rounded-2xl bg-indigo-600 px-5 py-3 text-base font-extrabold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Tiếp tục thanh toán</button>
              )}
              <p className="mt-4 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Thanh toán một lần qua PayOS. KidHabit không tự động gia hạn.
              </p>
              {loginError && <p role="alert" className="mt-3 text-sm font-bold text-rose-700 dark:text-rose-300">{loginError}</p>}
            </div>
          </div>
        </div>
      </section>

      <CheckoutModal isOpen={isCheckoutModalOpen} onClose={closeCheckoutModal} plan={checkoutPlan} />
    </main>
  );
}

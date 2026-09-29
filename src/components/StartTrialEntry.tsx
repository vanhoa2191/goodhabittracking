'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, LogIn, ShieldCheck } from 'lucide-react';
import { OnboardingModal } from '@/components/OnboardingModal';
import { getMarketingOrigin } from '@/lib/site';
import { signInWithGoogle } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

const benefits = [
  'Đăng nhập bằng Google, chỉ mất vài giây',
  'Tạo hồ sơ cho bé và nhận gợi ý thói quen theo độ tuổi',
  'Ghép thiết bị của bé bằng mã QR, bé không cần tài khoản',
  'Dùng đầy đủ tính năng trong 7 ngày',
] as const;

const primaryButton = 'flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-base font-extrabold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 dark:shadow-none';

export function StartTrialEntry() {
  const router = useRouter();
  const {
    activateFreeTrial,
    closeOnboarding,
    currentUser,
    familyId,
    familyRole,
    isEntryReady,
    isOnboardingOpen,
    isPro,
    openOnboarding,
    profiles,
  } = useAppStore();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [trialError, setTrialError] = useState<{ readonly used: boolean } | null>(null);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const openedSetup = useRef(false);

  const marketingOrigin = getMarketingOrigin();
  const pricingUrl = new URL('/pricing/', marketingOrigin).href;
  const isParent = familyRole === 'owner' || familyRole === 'parent' || familyRole === 'guardian';
  const waitingForFamily = Boolean(currentUser && (!isEntryReady || !familyId || familyRole === null));
  const caregiver = Boolean(currentUser && isEntryReady && familyRole === 'caregiver');
  const ready = Boolean(isEntryReady && currentUser && familyId && isParent);
  const hasChild = profiles.length > 0;

  useEffect(() => {
    if (ready && isPro && hasChild) router.replace('/');
  }, [hasChild, isPro, ready, router]);

  useEffect(() => {
    if (!ready || hasChild || openedSetup.current) return;
    openedSetup.current = true;
    openOnboarding();
  }, [hasChild, openOnboarding, ready]);

  const handleLogin = async () => {
    setLoginError(null);
    const result = await signInWithGoogle('/start');
    if (result.error) setLoginError('Không thể mở đăng nhập Google. Vui lòng thử lại.');
  };

  const handleStartTrial = async () => {
    setTrialError(null);
    setIsStartingTrial(true);
    const result = await activateFreeTrial();
    if (result.success) {
      router.replace('/');
      return;
    }
    setIsStartingTrial(false);
    setTrialError({ used: /already been used|đã dùng/i.test(result.error ?? '') });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eef2ff,_transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top_left,_#312e81,_transparent_36%),linear-gradient(180deg,#09090b_0%,#18181b_100%)] sm:py-14">
      <section className="mx-auto w-full max-w-3xl">
        <Link href={marketingOrigin.href} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold text-slate-700 hover:bg-white/80 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Về trang chủ
        </Link>

        <div data-testid="start-summary" className="mt-4 overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-2xl shadow-indigo-100/70 dark:border-indigo-900/70 dark:bg-zinc-900 dark:shadow-none">
          <div className="bg-gradient-to-r from-indigo-700 to-violet-600 px-6 py-6 text-white sm:px-10 sm:py-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-indigo-100">KidHabit Hero</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Bắt đầu 7 ngày dùng thử</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-indigo-50">Không cần thẻ tín dụng. KidHabit không tự động trừ tiền khi hết thời gian dùng thử.</p>
          </div>

          <div className="grid gap-7 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:p-10">
            <ul className="space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="sm:w-64">
              {!currentUser ? (
                <button type="button" onClick={() => void handleLogin()} className={primaryButton}>
                  <LogIn className="h-5 w-5" /> Đăng nhập bằng Google để bắt đầu
                </button>
              ) : caregiver ? (
                <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Chỉ phụ huynh trong gia đình mới có thể bắt đầu dùng thử.</p>
              ) : waitingForFamily ? (
                <p role="status" className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-bold leading-6 text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100">Đang tải thông tin gia đình…</p>
              ) : ready && !hasChild ? (
                <button type="button" onClick={openOnboarding} className={primaryButton}>Thiết lập gia đình để bắt đầu</button>
              ) : ready && !isPro ? (
                <button type="button" onClick={() => void handleStartTrial()} disabled={isStartingTrial} className={primaryButton}>
                  {isStartingTrial ? 'Đang kích hoạt…' : 'Bắt đầu dùng thử 7 ngày'}
                </button>
              ) : (
                <p role="status" className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-bold leading-6 text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100">Đang mở ứng dụng…</p>
              )}

              {trialError && (
                <div role="alert" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  {trialError.used
                    ? 'Gia đình này đã dùng thử trước đó. Hãy chọn một gói để tiếp tục.'
                    : 'Chưa thể bắt đầu dùng thử. Vui lòng thử lại sau ít phút.'}
                  {trialError.used && (
                    <Link href={pricingUrl} className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Xem bảng giá</Link>
                  )}
                </div>
              )}

              <p className="mt-4 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Tiếp tục nghĩa là bạn đồng ý với <Link href={new URL('/terms/', marketingOrigin).href} className="underline">Điều khoản</Link> và <Link href={new URL('/privacy/', marketingOrigin).href} className="underline">Quyền riêng tư</Link>.
                </span>
              </p>
              {loginError && <p role="alert" className="mt-3 text-sm font-bold text-rose-700 dark:text-rose-300">{loginError}</p>}
            </div>
          </div>
        </div>
      </section>

      <OnboardingModal isOpen={isOnboardingOpen} onClose={closeOnboarding} />
    </main>
  );
}

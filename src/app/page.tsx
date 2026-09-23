'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { KidDashboard } from '@/components/KidDashboard';
import { ParentDashboard } from '@/components/ParentDashboard';
import { LandingPage } from '@/components/LandingPage';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { PricingModal } from '@/components/PricingModal';
import { CheckoutModal } from '@/components/CheckoutModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { Portrait16Modal } from '@/components/Portrait16Modal';
import { demoSessionCopy } from '@/lib/i18n/demo-session-copy';
import { readPaymentStatus } from '@/lib/billing/payment-client';
import { CustomerProfilePrompt } from '@/components/CustomerProfilePrompt';

const IN_APP_SESSION_KEY = 'kidhabit_in_app';
const DEMO_SESSION_KEY = 'kidhabit_demo_session';
const IN_APP_SESSION_EVENT = 'kidhabit-in-app-change';
const PAYMENT_RETURN_QUERY_KEYS = ['payment', 'orderCode', 'code', 'id', 'cancel', 'status'] as const;

type PaymentReturnState = 'checking' | 'activated' | 'pending' | 'cancelled' | 'error';

function subscribeToInAppSession(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(IN_APP_SESSION_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(IN_APP_SESSION_EVENT, onStoreChange);
  };
}

function getInAppSessionSnapshot() {
  return sessionStorage.getItem(IN_APP_SESSION_KEY) === 'true';
}

function getServerInAppSessionSnapshot() {
  return false;
}

function getDemoSessionSnapshot() {
  return sessionStorage.getItem(DEMO_SESSION_KEY) === 'true';
}

export default function Home() {
  const {
    mode,
    isEntryReady,
    isFamilyConnected,
    storageMode,
    profiles,
    currentUser,
    loginWithGoogle,
    isPricingModalOpen,
    setIsPricingModalOpen,
    isCheckoutModalOpen,
    closeCheckoutModal,
    checkoutPlan,
    isOnboardingOpen,
    closeOnboarding,
    isPortraitModalOpen,
    setIsPortraitModalOpen,
    startLocalFamilySetup,
    startDemoSession,
    syncNow,
  } = useAppStore();
  const { t, language } = useTranslation();
  const demoCopy = demoSessionCopy[language];

  const sessionInApp = useSyncExternalStore(
    subscribeToInAppSession,
    getInAppSessionSnapshot,
    getServerInAppSessionSnapshot
  );
  const isDemoSession = useSyncExternalStore(
    subscribeToInAppSession,
    getDemoSessionSnapshot,
    getServerInAppSessionSnapshot
  );
  const currentUserId = currentUser?.id ?? null;
  const canOpenApp = Boolean(currentUser || isFamilyConnected || isDemoSession || sessionInApp || (storageMode === 'local' && profiles.length > 0));
  const defaultShowLanding = !canOpenApp;
  const [landingSelection, setLandingSelection] = useState<{
    userId: string | null;
    showLanding: boolean;
  } | null>(null);
  const [paymentReturnState, setPaymentReturnState] = useState<PaymentReturnState | null>(null);
  const showLanding = isFamilyConnected && !currentUser ? false : landingSelection?.userId === currentUserId
    ? landingSelection.showLanding
    : defaultShowLanding;

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
      queueMicrotask(() => setPaymentReturnState('cancelled'));
      clearReturnParameters();
      return;
    }

    const orderCode = Number(currentUrl.searchParams.get('orderCode'));
    if (!Number.isSafeInteger(orderCode) || orderCode <= 0) {
      queueMicrotask(() => setPaymentReturnState('error'));
      clearReturnParameters();
      return;
    }

    let isActive = true;
    queueMicrotask(() => setPaymentReturnState('checking'));

    void (async () => {
      try {
        const result = await readPaymentStatus(orderCode);
        if (!isActive) return;
        if (!result.success) {
          setPaymentReturnState('error');
          return;
        }
        if (!result.paid) {
          setPaymentReturnState('pending');
          return;
        }
        await syncNow();
        if (isActive) setPaymentReturnState('activated');
      } catch (error: unknown) {
        if (!isActive) return;
        if (error instanceof Error) {
          setPaymentReturnState('error');
          return;
        }
        setPaymentReturnState('error');
      } finally {
        clearReturnParameters();
      }
    })();

    return () => {
      isActive = false;
    };
  }, [syncNow]);

  const paymentReturnMessages: Record<PaymentReturnState, string> = {
    checking: t.checkingPayment,
    activated: t.paymentReturnActivated,
    pending: t.paymentReturnPending,
    cancelled: t.paymentReturnCancelled,
    error: t.paymentReturnError,
  };

  const handleStartDemo = () => {
    startDemoSession();
    sessionStorage.setItem(IN_APP_SESSION_KEY, 'true');
    sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
    window.dispatchEvent(new Event(IN_APP_SESSION_EVENT));
    setLandingSelection({ userId: currentUserId, showLanding: false });
  };

  const handleStartLocalSetup = () => {
    startLocalFamilySetup();
    sessionStorage.setItem(IN_APP_SESSION_KEY, 'true');
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    window.dispatchEvent(new Event(IN_APP_SESSION_EVENT));
    setLandingSelection({ userId: currentUserId, showLanding: false });
  };

  const handleToggleLanding = () => {
    if (!canOpenApp || (isFamilyConnected && !currentUser)) return;
    setLandingSelection({
      userId: currentUserId,
      showLanding: !showLanding,
    });
  };

  if (!isEntryReady) {
    return <div data-testid="app-surface" data-app-mode="loading" role="status" aria-label={language === 'vi' ? 'Đang mở KidHabit' : 'Opening KidHabit'} className="flex min-h-screen items-center justify-center bg-white text-lg font-semibold text-indigo-700 dark:bg-zinc-950 dark:text-indigo-200">{language === 'vi' ? 'Đang mở KidHabit…' : 'Opening KidHabit…'}</div>;
  }

  return (
    <div
      data-testid="app-surface"
      data-app-mode={showLanding ? 'landing' : mode}
      className={`min-h-screen flex flex-col justify-between transition-colors ${
        showLanding ? 'app-mode-landing' : mode === 'kid' ? 'app-mode-kid' : 'app-mode-parent'
      }`}
    >
      <div>
        <Header
          onToggleLanding={canOpenApp && !(isFamilyConnected && !currentUser) ? handleToggleLanding : undefined}
          isLanding={showLanding}
          hasAppSession={canOpenApp}
        />
        {paymentReturnState && (
          <div
            role={paymentReturnState === 'error' ? 'alert' : 'status'}
            data-payment-state={paymentReturnState}
            className={`mx-auto mt-3 max-w-5xl rounded-2xl border px-4 py-3 text-sm font-semibold ${
              paymentReturnState === 'activated'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                : paymentReturnState === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                  : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
            }`}
          >
            {paymentReturnMessages[paymentReturnState]}
          </div>
        )}
        <main>
          {showLanding ? (
            <LandingPage
              onStartDemo={canOpenApp ? handleToggleLanding : handleStartDemo}
              onStartLocalSetup={handleStartLocalSetup}
              onLoginGoogle={loginWithGoogle}
              isLoggedIn={canOpenApp}
            />
          ) : (
            <>
              {isDemoSession && !currentUser && (
                <div role="status" className="mx-auto mt-3 flex max-w-5xl flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  <span><strong>{demoCopy.label}</strong> {demoCopy.notice}</span>
                  <button type="button" onClick={handleStartLocalSetup} className="min-h-11 rounded-xl bg-amber-600 px-4 font-bold text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                    {demoCopy.setup}
                  </button>
                </div>
              )}
              {mode === 'kid' ? <KidDashboard /> : <ParentDashboard />}
            </>
          )}
        </main>
      </div>

      <footer className="w-full py-6 border-t border-slate-100 dark:border-zinc-800 text-center text-xs text-slate-400 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-medium">
          <p className="flex items-center justify-center gap-1.5">
            <span>⭐</span>
            <span>{t.appName} &bull; {t.appSlogan}</span>
          </p>
          <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">&bull;</span>
          {!(isFamilyConnected && !currentUser) && <Link href="/docs" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">{language === 'vi' ? 'Tài liệu sử dụng' : 'User guide'}</Link>}
        </div>
      </footer>

      {/* Global Modals */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={closeCheckoutModal}
        plan={checkoutPlan}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={closeOnboarding}
      />

      <Portrait16Modal
        isOpen={isPortraitModalOpen}
        onClose={() => setIsPortraitModalOpen(false)}
      />
      <CustomerProfilePrompt userId={currentUserId} />
    </div>
  );
}

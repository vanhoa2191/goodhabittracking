'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { Header } from '@/components/Header';
import { KidDashboard } from '@/components/KidDashboard';
import { ParentDashboard } from '@/components/ParentDashboard';
import { AppEntryGate } from '@/components/AppEntryGate';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getAppFooterCopy } from '@/lib/i18n/app-footer-copy';
import { SignInErrorNotice } from '@/components/SignInErrorNotice';
import { demoSessionCopy } from '@/lib/i18n/demo-session-copy';
import { CaregiverDashboard } from '@/components/CaregiverDashboard';
import { PaymentReturnNotice } from '@/components/PaymentReturnNotice';
import { getMarketingOrigin } from '@/lib/site';
import dynamic from 'next/dynamic';

// Dialogs that open on a tap load their code and text when the page is idle, not in the first download.
const PricingModal = dynamic(() => import('@/components/PricingModal').then((module) => module.PricingModal));
const CheckoutModal = dynamic(() => import('@/components/CheckoutModal').then((module) => module.CheckoutModal));
const OnboardingModal = dynamic(() => import('@/components/OnboardingModal').then((module) => module.OnboardingModal));
const Portrait16Modal = dynamic(() => import('@/components/Portrait16Modal').then((module) => module.Portrait16Modal));

// The profile prompt is shown once, right after a first sign-in, so its text and code load only when it is needed.
const CustomerProfilePrompt = dynamic(() => import('@/components/CustomerProfilePrompt').then((module) => module.CustomerProfilePrompt));

const IN_APP_SESSION_KEY = 'kidhabit_in_app';
const DEMO_SESSION_KEY = 'kidhabit_demo_session';
const IN_APP_SESSION_EVENT = 'kidhabit-in-app-change';
const marketingOrigin = getMarketingOrigin();

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
    currentUser,
    familyRole,
    loginWithGoogle,
    signInError,
    clearSignInError,
    isPricingModalOpen,
    setIsPricingModalOpen,
    isCheckoutModalOpen,
    closeCheckoutModal,
    checkoutPlan,
    isOnboardingOpen,
    closeOnboarding,
    isPortraitModalOpen,
    setIsPortraitModalOpen,
    startDemoSession,
    openConnectModal,
  } = useAppStore();
  const { t, language } = useTranslation();
  const demoCopy = demoSessionCopy[language];
  const footerCopy = getAppFooterCopy(language);

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
  const canOpenApp = Boolean(currentUser || isFamilyConnected || isDemoSession || sessionInApp);
  const handledPublicEntry = useRef(false);
  const renderGateway = !isEntryReady || !canOpenApp;

  const handleStartDemo = () => {
    startDemoSession();
    sessionStorage.setItem(IN_APP_SESSION_KEY, 'true');
    sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
    window.dispatchEvent(new Event(IN_APP_SESSION_EVENT));
  };

  useEffect(() => {
    if (!isEntryReady || handledPublicEntry.current) return;
    const currentUrl = new URL(window.location.href);
    const wantsPricing = currentUrl.searchParams.get('pricing') === '1';
    const wantsDemo = currentUrl.searchParams.get('demo') === '1';
    if (!wantsPricing && !wantsDemo) return;

    handledPublicEntry.current = true;
    currentUrl.searchParams.delete('pricing');
    currentUrl.searchParams.delete('demo');
    window.history.replaceState(window.history.state, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);

    if (wantsPricing) {
      setIsPricingModalOpen(true);
      return;
    }

    startDemoSession();
    sessionStorage.setItem(IN_APP_SESSION_KEY, 'true');
    sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
    window.dispatchEvent(new Event(IN_APP_SESSION_EVENT));
  }, [currentUserId, isEntryReady, setIsPricingModalOpen, startDemoSession]);

  return (
    <div
      data-testid="app-surface"
      data-app-mode={!isEntryReady ? 'loading' : renderGateway ? 'gateway' : mode}
      data-entry-loading={!isEntryReady ? 'true' : undefined}
      className={`min-h-screen flex flex-col justify-between transition-colors ${
        renderGateway ? 'app-mode-parent' : mode === 'kid' ? 'app-mode-kid' : 'app-mode-parent'
      }`}
    >
      <div>
        <Header hasAppSession={canOpenApp} marketingHomeUrl={marketingOrigin.href} />
        <PaymentReturnNotice />
        <SignInErrorNotice message={signInError} onDismiss={clearSignInError} />
        <main>
          {renderGateway ? (
            <AppEntryGate
              isLoading={!isEntryReady}
              language={language}
              marketingHomeUrl={marketingOrigin.href}
              onOpenPairing={openConnectModal}
              onStartDemo={handleStartDemo}
              onLoginGoogle={loginWithGoogle}
            />
          ) : (
            <>
              {isDemoSession && !currentUser && (
                <div role="status" className="mx-auto mt-3 flex max-w-5xl flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  <span><strong>{demoCopy.label}</strong> {demoCopy.notice}</span>
                  <button type="button" onClick={loginWithGoogle} className="min-h-11 rounded-xl bg-amber-700 px-4 font-bold text-white hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                    {demoCopy.setup}
                  </button>
                </div>
              )}
              {currentUser && familyRole === 'caregiver'
                ? <CaregiverDashboard />
                : mode === 'kid' ? <KidDashboard /> : <ParentDashboard />}
            </>
          )}
        </main>
      </div>

      <footer className="w-full py-6 border-t border-slate-100 dark:border-zinc-800 text-center text-xs text-slate-400 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-medium">
          <p className="flex w-full min-w-0 max-w-full items-start justify-center gap-1.5 sm:w-auto">
            <span className="shrink-0">⭐</span>
            <span className="min-w-0 break-words">{t.appName} &bull; {t.appSlogan}</span>
          </p>
          <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">&bull;</span>
          {!(isFamilyConnected && !currentUser) && <a href={new URL('/pricing/', marketingOrigin).href} className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">{footerCopy.pricing}</a>}
          {!(isFamilyConnected && !currentUser) && <a href={new URL('/docs/', marketingOrigin).href} className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">{footerCopy.guide}</a>}
          {!(isFamilyConnected && !currentUser) && <a href={new URL('/privacy/', marketingOrigin).href} className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">{footerCopy.privacy}</a>}
          {!(isFamilyConnected && !currentUser) && <a href={new URL('/terms/', marketingOrigin).href} className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">{footerCopy.terms}</a>}
          {!(isFamilyConnected && !currentUser) && <a href={new URL('/contact/', marketingOrigin).href} className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">{footerCopy.contact}</a>}
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
      <CustomerProfilePrompt key={currentUserId ?? 'signed-out'} userId={currentUserId} suppressed={isOnboardingOpen} />
    </div>
  );
}

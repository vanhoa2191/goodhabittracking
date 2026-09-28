'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
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
import { CustomerProfilePrompt } from '@/components/CustomerProfilePrompt';
import { CaregiverDashboard } from '@/components/CaregiverDashboard';
import { PaymentReturnNotice } from '@/components/PaymentReturnNotice';

const IN_APP_SESSION_KEY = 'kidhabit_in_app';
const DEMO_SESSION_KEY = 'kidhabit_demo_session';
const IN_APP_SESSION_EVENT = 'kidhabit-in-app-change';
const legalPagesApproved = process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true';

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
  const canOpenApp = Boolean(currentUser || isFamilyConnected || isDemoSession || sessionInApp);
  const defaultShowLanding = !canOpenApp;
  const [landingSelection, setLandingSelection] = useState<{
    userId: string | null;
    showLanding: boolean;
  } | null>(null);
  const handledPublicEntry = useRef(false);
  const showLanding = isFamilyConnected && !currentUser ? false : landingSelection?.userId === currentUserId
    ? landingSelection.showLanding
    : defaultShowLanding;
  const renderLanding = !isEntryReady || showLanding;

  const handleStartDemo = () => {
    startDemoSession();
    sessionStorage.setItem(IN_APP_SESSION_KEY, 'true');
    sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
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
      data-app-mode={!isEntryReady ? 'loading' : renderLanding ? 'landing' : mode}
      data-entry-loading={!isEntryReady ? 'true' : undefined}
      className={`min-h-screen flex flex-col justify-between transition-colors ${
        renderLanding ? 'app-mode-landing' : mode === 'kid' ? 'app-mode-kid' : 'app-mode-parent'
      }`}
    >
      <div>
        <Header
          onToggleLanding={canOpenApp && !(isFamilyConnected && !currentUser) ? handleToggleLanding : undefined}
          isLanding={renderLanding}
          hasAppSession={canOpenApp}
        />
        <PaymentReturnNotice />
        <main>
          {renderLanding ? (
            <LandingPage
              onStartDemo={canOpenApp ? handleToggleLanding : handleStartDemo}
              onLoginGoogle={loginWithGoogle}
              isLoggedIn={canOpenApp}
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
          {!(isFamilyConnected && !currentUser) && <Link href="/pricing" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">{language === 'vi' ? 'Bảng giá' : 'Pricing'}</Link>}
          {!(isFamilyConnected && !currentUser) && <Link href="/framework" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">{language === 'vi' ? 'Khung thói quen' : 'Framework'}</Link>}
          {!(isFamilyConnected && !currentUser) && <Link href="/roadmaps" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">{language === 'vi' ? 'Lộ trình' : 'Roadmaps'}</Link>}
          {!(isFamilyConnected && !currentUser) && <Link href="/docs" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">{language === 'vi' ? 'Tài liệu sử dụng' : 'User guide'}</Link>}
          {legalPagesApproved && !(isFamilyConnected && !currentUser) && <>
            <Link href="/privacy" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">Quyền riêng tư</Link>
            <Link href="/terms" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">Điều khoản</Link>
            <Link href="/contact" className="font-bold text-indigo-600 hover:underline dark:text-indigo-400">Liên hệ</Link>
          </>}
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
      <CustomerProfilePrompt key={currentUserId ?? 'signed-out'} userId={currentUserId} />
    </div>
  );
}

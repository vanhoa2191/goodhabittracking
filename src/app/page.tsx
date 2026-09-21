'use client';

import React, { useState, useSyncExternalStore } from 'react';
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

const IN_APP_SESSION_KEY = 'kidhabit_in_app';
const DEMO_SESSION_KEY = 'kidhabit_demo_session';
const IN_APP_SESSION_EVENT = 'kidhabit-in-app-change';

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
  const defaultShowLanding = !currentUser && !sessionInApp && profiles.length === 0;
  const [landingSelection, setLandingSelection] = useState<{
    userId: string | null;
    showLanding: boolean;
  } | null>(null);
  const showLanding = landingSelection?.userId === currentUserId
    ? landingSelection.showLanding
    : defaultShowLanding;

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
    setLandingSelection({
      userId: currentUserId,
      showLanding: !showLanding,
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header
          onToggleLanding={handleToggleLanding}
          isLanding={showLanding}
          isDemo={isDemoSession && !currentUser}
        />
        <main>
          {showLanding ? (
            <LandingPage
              onStartDemo={handleStartDemo}
              onStartLocalSetup={handleStartLocalSetup}
              onLoginGoogle={loginWithGoogle}
              isLoggedIn={Boolean(currentUser || profiles.length > 0)}
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
          <button
            type="button"
            onClick={handleToggleLanding}
            className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-bold"
          >
            {showLanding ? t.landingBackToApp : t.landingCtaParentGuide}
          </button>
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
    </div>
  );
}

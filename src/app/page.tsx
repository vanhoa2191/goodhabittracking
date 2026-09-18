'use client';

import React, { useState, useEffect } from 'react';
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

export default function Home() {
  const {
    mode,
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
    openOnboarding,
    parentProfile,
  } = useAppStore();
  const { t } = useTranslation();

  const [showLanding, setShowLanding] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // If logged in, go straight to dashboard
    if (currentUser) {
      setShowLanding(false);
      return;
    }
    // Check if user explicitly clicked into dashboard during this session
    const sessionInApp = sessionStorage.getItem('kidhabit_in_app') === 'true';
    if (sessionInApp) {
      setShowLanding(false);
    } else {
      setShowLanding(true);
    }
  }, [currentUser]);

  const handleStartDemo = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('kidhabit_in_app', 'true');
    }
    setShowLanding(false);
  };

  const handleToggleLanding = () => {
    setShowLanding((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header
          onToggleLanding={handleToggleLanding}
          isLanding={showLanding}
        />
        <main>
          {showLanding ? (
            <LandingPage
              onStartDemo={handleStartDemo}
              onLoginGoogle={loginWithGoogle}
              isLoggedIn={!!currentUser}
            />
          ) : (
            mode === 'kid' ? <KidDashboard /> : <ParentDashboard />
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

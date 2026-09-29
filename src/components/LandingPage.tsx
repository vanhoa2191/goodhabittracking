'use client';

import { useAppStore } from '@/lib/store';
import { HeroSection } from './landing/hero-section';
import { ComparisonSection } from './landing/comparison-section';
import { AssurancesSection, GettingStartedSection, ProofSection } from './landing/trust-sections';
import { FrameworkSection } from './landing/framework-section';
import { RoadmapsSection } from './landing/roadmaps-section';
import { ProductLinksSection } from './landing/product-links-section';
import { PricingSection } from './landing/pricing-section';
import { SafetySection } from './landing/safety-section';
import { FinalActionSection, MobileActions } from './landing/action-sections';

interface LandingPageProps {
  onStartDemo: () => void;
  onLoginGoogle: () => void;
  isLoggedIn?: boolean;
}

export function LandingPage(props: LandingPageProps) {
  const { openConnectModal, openPricingModal } = useAppStore();
  const showExpandedLandingCatalog = false;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-amber-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-slate-800 dark:text-slate-100 transition-colors">
      <HeroSection {...props} openConnectModal={openConnectModal} />
      <AssurancesSection />
      <ComparisonSection />
      <ProofSection />
      <GettingStartedSection />
      {showExpandedLandingCatalog ? (
        <>
          <FrameworkSection />
          <RoadmapsSection onStartDemo={props.onStartDemo} isLoggedIn={props.isLoggedIn} />
        </>
      ) : <ProductLinksSection />}
      <PricingSection expanded={showExpandedLandingCatalog} openPricingModal={openPricingModal} />
      <SafetySection expanded={showExpandedLandingCatalog} />
      <FinalActionSection {...props} />
      <MobileActions {...props} />
    </div>
  );
}

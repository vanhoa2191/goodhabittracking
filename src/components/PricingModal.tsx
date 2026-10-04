'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  Crown,
  CheckCircle2,
  QrCode,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PLAN_LOCALIZATION } from '@/lib/i18n/pricing-plan-copy';
import { UpcomingPlans } from '@/components/public/UpcomingPlans';
import { PRICING_PLANS } from '@/lib/payos';
import { SubscriptionPlan } from '@/types';
import { useTranslation } from '@/lib/i18n/context';
import { formatCurrency } from '@/lib/i18n/formatters';
import { ModalShell } from '@/components/ui/ModalShell';
import { shouldOfferTrial } from '@/lib/store/subscription';
import { HelpTip } from '@/components/help/HelpTip';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const {
    isPro,
    subscriptionPlan,
    activateFreeTrial,
    openCheckoutModal,
    getSubscriptionDetails,
  } = useAppStore();

  const { language, t } = useTranslation();
  const [trialError, setTrialError] = useState<string | null>(null);
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);

  if (!isOpen) return null;

  const subDetails = getSubscriptionDetails();
  // The trial is an offer for families without a paid plan; once a family has paid, it only shows the plan it is on.
  const showTrialBanner = shouldOfferTrial(isPro, subscriptionPlan);
  const offerLabel = t.specialOffer.replace(/^[🎁👑]\s*/u, '');

  const handleActivateTrial = async () => {
    setIsActivatingTrial(true);
    setTrialError(null);
    const result = await activateFreeTrial();
    setIsActivatingTrial(false);
    if (result.success) onClose();
    else setTrialError(result.error ?? t.connectFail);
  };

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    if (planId === 'free') {
      onClose();
      return;
    }
    if (planId === 'trial') {
      void handleActivateTrial();
      return;
    }
    openCheckoutModal(planId);
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} label={t.pricingModalTitle} maxWidth="5xl">
        {/* Fixed Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1"><h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {t.pricingModalTitle}
                </h2><HelpTip topic="payment.plans" /></div>
                <span className="hidden sm:inline-flex text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {t.vietQrOneTouch || 'VietQR 1-Chạm'}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-600 dark:text-slate-300">
                {t.pricingModalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={t.close}
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {/* 1. Highlight Banner: 7-Day Free Trial (offered until the family has a paid plan) */}
          {showTrialBanner ? (
          <div data-testid="trial-summary" className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/40">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="max-w-2xl space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                    {offerLabel}
                  </span>
                  <span className="hidden text-sm font-bold text-indigo-800 dark:text-indigo-200 sm:inline">{t.noCreditCardNeeded}</span>
                </div>
                <div className="flex items-center gap-1"><h3 className="text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">
                  {t.freeTrialTitle}
                </h3><HelpTip topic="payment.trial" /></div>
                <p className="hidden text-sm font-medium leading-5 text-slate-700 dark:text-slate-200 sm:block">
                  {t.freeTrialDesc}
                </p>
              </div>

              <div className="shrink-0">
                {subscriptionPlan === 'trial' ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-extrabold text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{t.trialActiveRemaining.replace('{days}', String(subDetails.daysRemaining ?? 7))}</span>
                  </div>
                ) : isPro ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-white px-4 py-3 text-sm font-extrabold text-amber-800 shadow-sm dark:border-amber-800 dark:bg-zinc-900 dark:text-amber-300">
                    <Crown className="w-5 h-5" />
                    <span>{t.yourPlanIs.replace('{plan}', subDetails.label)}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleActivateTrial}
                    disabled={isActivatingTrial}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-md transition-colors hover:bg-indigo-700 active:scale-95 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:w-auto"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
                    <span>{isActivatingTrial ? t.checkingPayment : t.activateTrialBtn}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
          ) : (
            <div data-testid="current-plan-summary" className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-extrabold text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <Crown className="h-5 w-5" aria-hidden="true" />
              <span>{t.yourPlanIs.replace('{plan}', subDetails.label)}</span>
            </div>
          )}

          {trialError && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {trialError}
            </div>
          )}

          {/* 2. Pricing Plans Grid */}
          <div data-testid="paid-plan-grid" className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-3">
            {PRICING_PLANS.filter((p) => p.id !== 'trial').map((plan) => {
              const isCurrent = subscriptionPlan === plan.id;
              const loc = PLAN_LOCALIZATION[plan.id]?.[language] || PLAN_LOCALIZATION[plan.id]?.vi || {
                name: plan.name,
                desc: plan.description,
                period: plan.periodLabel,
                badge: plan.badge,
                cta: plan.ctaText,
              };
              const badge = loc.badge?.replace(/^👑\s*/u, '').split('•')[0].trim() || plan.badge;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/30 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-900 border-2 border-indigo-600 shadow-xl'
                      : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-indigo-300'
                  }`}
                >
                  {/* Top Badge */}
                  {badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className={`whitespace-nowrap text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                          plan.popular
                            ? 'bg-indigo-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 pt-1">
                    <div>
                      <h4 className="font-black text-base text-slate-800 dark:text-slate-100 flex items-start justify-between gap-3">
                        <span>{loc.name}</span>
                        {plan.savings && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                            {plan.savings}
                          </span>
                        )}
                      </h4>
                    </div>

                    {/* Price display */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                          {formatCurrency(plan.price, language)}
                        </span>
                        <span className="text-xs font-bold text-slate-500">VNĐ</span>
                        <span className="text-xs text-slate-400 font-medium">{loc.period}</span>
                      </div>
                      {plan.originalPrice && (
                        <div className="text-xs text-slate-400 line-through mt-0.5">
                          {formatCurrency(plan.originalPrice, language)}
                        </div>
                      )}
                    </div>

                    <p className="text-sm font-medium leading-5 text-slate-700 dark:text-slate-200">
                      {loc.desc}
                    </p>

                    {/* Feature list */}
                    <ul className="space-y-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {plan.features.slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-5">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Plan CTA Button */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrent}
                      className={`w-full min-h-[48px] py-3 px-4 rounded-2xl font-extrabold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isCurrent
                          ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed shadow-none'
                          : plan.popular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none cursor-pointer'
                          : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{isCurrent ? t.planActivated : loc.cta}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <UpcomingPlans />
        </div>

        <div className="flex justify-end px-4 py-3 sm:px-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/80">
          <button
            onClick={onClose}
            className="min-h-[44px] py-2.5 px-5 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {t.decideLater}
          </button>
        </div>
    </ModalShell>
  );
}

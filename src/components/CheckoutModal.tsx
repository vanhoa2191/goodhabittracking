'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Check,
  QrCode,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { PricingPlan } from '@/types';
import type { PaymentResult } from '@/lib/payos';
import { createPaymentOrder, readPaymentStatus } from '@/lib/billing/payment-client';
import type { PaymentErrorCode } from '@/lib/billing/payment-client';
import { copyPaymentText } from '@/lib/billing/copy-payment-text';
import { getPaymentErrorCopy } from '@/lib/i18n/payment-error-copy';
import { PLAN_LOCALIZATION } from '@/lib/i18n/pricing-plan-copy';
import { useTranslation } from '@/lib/i18n/context';
import { getCheckoutLegalCopy } from '@/lib/i18n/checkout-legal-copy';
import { CheckoutPaymentDetails } from '@/components/CheckoutPaymentDetails';
import { ModalShell } from '@/components/ui/ModalShell';
import { getMarketingOrigin } from '@/lib/site';
import dynamic from 'next/dynamic';
import { HelpTip } from '@/components/help/HelpTip';

const ReferralCodeEntry = dynamic(() => import('@/components/ReferralCodeEntry').then((module) => module.ReferralCodeEntry));

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingPlan | null;
}

const marketingOrigin = getMarketingOrigin();

export function CheckoutModal({ isOpen, onClose, plan }: CheckoutModalProps) {
  const { syncNow, currentUser, familyId, familyRole } = useAppStore();
  const { t, language } = useTranslation();
  const legal = getCheckoutLegalCopy(language);
  const errorCopy = getPaymentErrorCopy(language);
  const planName = plan ? PLAN_LOCALIZATION[plan.id]?.[language]?.name ?? plan.name : '';

  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorCode, setErrorCode] = useState<PaymentErrorCode | null>(null);
  const [statusErrorCode, setStatusErrorCode] = useState<PaymentErrorCode | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [hasConfirmedReferral, setHasConfirmedReferral] = useState(false);
  // True once the server says this family can still enter a friend's code; only then is the step shown.
  const [referralStepNeeded, setReferralStepNeeded] = useState(false);
  const referralStepNeededRef = useRef(false);
  useEffect(() => { referralStepNeededRef.current = referralStepNeeded; }, [referralStepNeeded]);
  const [isClaimingReferral, setIsClaimingReferral] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [hasConfirmedTerms, setHasConfirmedTerms] = useState(false);
  const legalPagesApproved = process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true';
  const canCreatePayment = Boolean(
    currentUser
    && familyId
    && familyRole
    && familyRole !== 'caregiver',
  );

  // A family with nothing to enter goes straight to the QR; only one that can still enter a code sees the extra step.
  const handleReferralState = useCallback((state: 'loading' | 'eligible' | 'referred' | 'hidden') => {
    if (state === 'eligible') setReferralStepNeeded(true);
    else if (state !== 'loading') setHasConfirmedReferral((confirmed) => confirmed || !referralStepNeededRef.current);
  }, []);

  const handleClose = useCallback(() => {
    setHasAcceptedTerms(false);
    setHasConfirmedTerms(false);
    setHasConfirmedReferral(false);
    setReferralStepNeeded(false);
    setIsClaimingReferral(false);
    setCopyFailed(false);
    setPaymentData(null);
    onClose();
  }, [onClose]);

  // Initialize Payment Request from API
  const initPayment = useCallback(async () => {
    if (!plan || !canCreatePayment) return;
    setIsLoading(true);
    setErrorCode(null);
    setStatusErrorCode(null);
    setIsSuccess(false);

    try {
      const result = await createPaymentOrder(plan.id);
      if (result.success) {
        setPaymentData(result.payment);
      } else {
        setErrorCode(result.error);
      }
    } catch (err: unknown) {
      console.error('Failed to init payment:', err);
      setErrorCode('network');
    } finally {
      setIsLoading(false);
    }
  }, [canCreatePayment, plan]);

  useEffect(() => {
    if (!isOpen || !plan || !canCreatePayment || !hasConfirmedReferral || (legalPagesApproved && !hasConfirmedTerms)) return;

    const initializationTimer = window.setTimeout(() => {
      void initPayment();
    }, 0);

    return () => window.clearTimeout(initializationTimer);
  }, [canCreatePayment, hasConfirmedReferral, hasConfirmedTerms, isOpen, legalPagesApproved, plan, initPayment]);

  // Check payment status with API
  const checkStatus = useCallback(
    async () => {
      if (!paymentData || isSuccess) return;
      setIsCheckingStatus(true);

      try {
        const result = await readPaymentStatus(paymentData.orderCode);
        if (result.success) setStatusErrorCode(null);
        if (result.success && result.paid) {
          await syncNow();
          setIsSuccess(true);
          setTimeout(() => {
            handleClose();
          }, 2500);
        } else if (result.success) {
          // Normal check, still pending
          setCopiedField('status-pending');
          setTimeout(() => setCopiedField(null), 2500);
        } else {
          setStatusErrorCode(result.error);
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        setStatusErrorCode('status_failed');
      } finally {
        setIsCheckingStatus(false);
      }
    },
    [paymentData, isSuccess, syncNow, handleClose]
  );

  // Auto poll status every 6 seconds
  useEffect(() => {
    if (!isOpen || !paymentData || isSuccess) return;
    const pollInterval = setInterval(() => {
      checkStatus();
    }, 6000);
    return () => clearInterval(pollInterval);
  }, [isOpen, paymentData, isSuccess, checkStatus]);

  if (!isOpen || !plan) return null;

  const copyToClipboard = async (text: string, fieldName: string) => {
    setCopyFailed(false);
    setCopiedField(null);
    if (await copyPaymentText(text)) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      setCopyFailed(true);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} label={t.checkoutModalTitle} maxWidth="2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {t.checkoutModalTitle}
                </h2>
                <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  PayOS 24/7
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {planName}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="min-w-11 min-h-11 shrink-0 flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={t.close}
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {/* Success screen */}
          {!canCreatePayment ? (
            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              {legal.signInRequired}
            </div>
          ) : legalPagesApproved && !hasConfirmedTerms ? (
            <div className="space-y-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-950/30">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{legal.confirmTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{legal.confirmBody}</p>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-indigo-200 bg-white p-4 text-sm font-semibold text-slate-800 dark:border-indigo-800 dark:bg-zinc-900 dark:text-slate-100">
                <input type="checkbox" checked={hasAcceptedTerms} onChange={(event) => setHasAcceptedTerms(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-indigo-600" />
                <span>
                  {legal.agreeTemplate.split(/(\[terms\]|\[privacy\])/).map((part, index) => {
                    if (part === '[terms]') return <Link key={index} href={new URL('/terms/', marketingOrigin).href} target="_blank" className="text-indigo-700 underline dark:text-indigo-300">{legal.termsLink}</Link>;
                    if (part === '[privacy]') return <Link key={index} href={new URL('/privacy/', marketingOrigin).href} target="_blank" className="text-indigo-700 underline dark:text-indigo-300">{legal.privacyLink}</Link>;
                    return <React.Fragment key={index}>{part}</React.Fragment>;
                  })}
                </span>
              </label>
              <button type="button" disabled={!hasAcceptedTerms} onClick={() => setHasConfirmedTerms(true)} className="min-h-11 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{legal.continueButton}</button>
            </div>
          ) : !hasConfirmedReferral ? (
            <div className="space-y-4">
              {referralStepNeeded && <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{errorCopy.beforeQr}</p>}
              <ReferralCodeEntry onBusyChange={setIsClaimingReferral} onStateChange={handleReferralState} />
              {referralStepNeeded ? (
                <button type="button" disabled={isClaimingReferral} onClick={() => setHasConfirmedReferral(true)} className="min-h-11 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{legal.continueButton}</button>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-500">{t.checkingPayment}</p>
                </div>
              )}
            </div>
          ) : isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-lg animate-bounce">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {t.paymentSuccessTitle}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                  {t.paymentSuccessDesc}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {planName} &bull; {t.planActivated}
              </div>
            </div>
          ) : isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500">{t.checkingPayment}</p>
            </div>
          ) : errorCode ? (
            <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>{errorCopy.title}</span>
              </div>
              <p>{errorCopy.create[errorCode]}</p>
              <button
                onClick={initPayment}
                className="min-h-11 py-2 px-3 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
              >
                {errorCopy.retry}
              </button>
            </div>
          ) : paymentData ? (
            <CheckoutPaymentDetails
              payment={paymentData}
              copiedField={copiedField}
              statusErrorMessage={statusErrorCode ? errorCopy.status[statusErrorCode] : null}
              onCopy={copyToClipboard}
            />
          ) : null}
          {copyFailed && <p role="status" className="text-sm font-semibold text-amber-800 dark:text-amber-200">{errorCopy.clipboardFailure}</p>}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:px-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => checkStatus()}
              disabled={!paymentData || isLoading || isCheckingStatus || isSuccess}
              className="flex-1 sm:flex-none min-h-[44px] py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              <span>{isCheckingStatus ? t.checkingPayment : t.iHaveTransferredBtn}</span>
            </button>
            <HelpTip topic="payment.activation" />
          </div>
        </div>
    </ModalShell>
  );
}

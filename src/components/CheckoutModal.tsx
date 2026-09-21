'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { useTranslation } from '@/lib/i18n/context';
import { CheckoutPaymentDetails } from '@/components/CheckoutPaymentDetails';
import { ModalShell } from '@/components/ui/ModalShell';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingPlan | null;
}

export function CheckoutModal({ isOpen, onClose, plan }: CheckoutModalProps) {
  const { syncNow } = useAppStore();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60); // 15 minutes countdown

  // Initialize Payment Request from API
  const initPayment = useCallback(async () => {
    if (!plan) return;
    setIsLoading(true);
    setErrorMessage(null);
    setStatusErrorMessage(null);
    setIsSuccess(false);

    try {
      const result = await createPaymentOrder(plan.id);
      if (result.success) {
        setPaymentData(result.payment);
      } else {
        setErrorMessage(result.error);
      }
    } catch (err: unknown) {
      console.error('Failed to init payment:', err);
      setErrorMessage('Error connecting to payment server.');
    } finally {
      setIsLoading(false);
    }
  }, [plan]);

  useEffect(() => {
    if (!isOpen || !plan) return;

    const initializationTimer = window.setTimeout(() => {
      void initPayment();
      setTimeLeftSeconds(15 * 60);
    }, 0);

    return () => window.clearTimeout(initializationTimer);
  }, [isOpen, plan, initPayment]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isSuccess) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isSuccess]);

  // Check payment status with API
  const checkStatus = useCallback(
    async () => {
      if (!paymentData || isSuccess) return;
      setIsCheckingStatus(true);
      setStatusErrorMessage(null);

      try {
        const result = await readPaymentStatus(paymentData.orderCode);
        if (result.success && result.paid) {
          await syncNow();
          setIsSuccess(true);
          setTimeout(() => {
            onClose();
          }, 2500);
        } else if (result.success) {
          // Normal check, still pending
          setCopiedField('status-pending');
          setTimeout(() => setCopiedField(null), 2500);
        } else {
          setStatusErrorMessage(result.error);
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      } finally {
        setIsCheckingStatus(false);
      }
    },
    [paymentData, isSuccess, syncNow, onClose]
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

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} label={t.checkoutModalTitle} maxWidth="2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {t.checkoutModalTitle}
                </h2>
                <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  PayOS 24/7
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {plan.name}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {/* Success screen */}
          {isSuccess ? (
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
                {plan.name} &bull; {t.planActivated}
              </div>
            </div>
          ) : isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500">{t.checkingPayment}</p>
            </div>
          ) : errorMessage ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Error</span>
              </div>
              <p>{errorMessage}</p>
              <button
                onClick={initPayment}
                className="py-1.5 px-3 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : paymentData ? (
            <CheckoutPaymentDetails
              payment={paymentData}
              timeFormatted={timeFormatted}
              copiedField={copiedField}
              statusErrorMessage={statusErrorMessage}
              onCopy={copyToClipboard}
            />
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:px-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => checkStatus()}
              disabled={isLoading || isCheckingStatus || isSuccess}
              className="flex-1 sm:flex-none min-h-[44px] py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              <span>{isCheckingStatus ? t.checkingPayment : t.iHaveTransferredBtn}</span>
            </button>
          </div>
        </div>
    </ModalShell>
  );
}

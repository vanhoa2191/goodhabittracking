'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { useTranslation } from '@/lib/i18n/context';
import { CheckoutPaymentDetails } from '@/components/CheckoutPaymentDetails';
import { ModalShell } from '@/components/ui/ModalShell';
import { getMarketingOrigin } from '@/lib/site';
import dynamic from 'next/dynamic';

const ReferralCodeEntry = dynamic(() => import('@/components/ReferralCodeEntry').then((module) => module.ReferralCodeEntry));

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingPlan | null;
}

const marketingOrigin = getMarketingOrigin();

export function CheckoutModal({ isOpen, onClose, plan }: CheckoutModalProps) {
  const { syncNow, currentUser, familyId, familyRole } = useAppStore();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60); // 15 minutes countdown
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [hasConfirmedTerms, setHasConfirmedTerms] = useState(false);
  const legalPagesApproved = process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true';
  const canCreatePayment = Boolean(
    currentUser
    && familyId
    && familyRole
    && familyRole !== 'caregiver',
  );

  const handleClose = useCallback(() => {
    setHasAcceptedTerms(false);
    setHasConfirmedTerms(false);
    setPaymentData(null);
    onClose();
  }, [onClose]);

  // Initialize Payment Request from API
  const initPayment = useCallback(async () => {
    if (!plan || !canCreatePayment) return;
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
  }, [canCreatePayment, plan]);

  useEffect(() => {
    if (!isOpen || !plan || !canCreatePayment || (legalPagesApproved && !hasConfirmedTerms)) return;

    const initializationTimer = window.setTimeout(() => {
      void initPayment();
      setTimeLeftSeconds(15 * 60);
    }, 0);

    return () => window.clearTimeout(initializationTimer);
  }, [canCreatePayment, hasConfirmedTerms, isOpen, legalPagesApproved, plan, initPayment]);

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
            handleClose();
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
    <ModalShell isOpen={isOpen} onClose={handleClose} label={t.checkoutModalTitle} maxWidth="2xl">
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
            onClick={handleClose}
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
          {!canCreatePayment ? (
            <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              Vui lòng đăng nhập bằng tài khoản phụ huynh và chờ dữ liệu gia đình tải xong trước khi thanh toán.
            </div>
          ) : legalPagesApproved && !hasConfirmedTerms ? (
            <div className="space-y-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-950/30">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Xác nhận trước khi tạo đơn</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">Bạn sẽ thanh toán một lần cho kỳ đã chọn. KidHabit không tự động gia hạn hoặc tự động trừ tiền kỳ tiếp theo.</p>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-indigo-200 bg-white p-4 text-sm font-semibold text-slate-800 dark:border-indigo-800 dark:bg-zinc-900 dark:text-slate-100">
                <input type="checkbox" checked={hasAcceptedTerms} onChange={(event) => setHasAcceptedTerms(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-indigo-600" />
                <span>Tôi đã đọc và đồng ý với <Link href={new URL('/terms/', marketingOrigin).href} target="_blank" className="text-indigo-700 underline dark:text-indigo-300">Điều khoản sử dụng</Link> và <Link href={new URL('/privacy/', marketingOrigin).href} target="_blank" className="text-indigo-700 underline dark:text-indigo-300">Quyền riêng tư</Link>.</span>
              </label>
              <button type="button" disabled={!hasAcceptedTerms} onClick={() => setHasConfirmedTerms(true)} className="min-h-11 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">Tiếp tục tạo đơn thanh toán</button>
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
          {canCreatePayment && !isSuccess && <ReferralCodeEntry />}
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

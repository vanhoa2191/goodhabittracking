'use client';

import Image from 'next/image';
import { Check, Clock, Copy } from 'lucide-react';
import type { PaymentResult } from '@/lib/payos';
import { useTranslation } from '@/lib/i18n/context';

interface CheckoutPaymentDetailsProps {
  readonly payment: PaymentResult;
  readonly timeFormatted: string;
  readonly copiedField: string | null;
  readonly statusErrorMessage: string | null;
  readonly onCopy: (text: string, fieldName: string) => void;
}

export function CheckoutPaymentDetails({
  payment,
  timeFormatted,
  copiedField,
  statusErrorMessage,
  onCopy,
}: CheckoutPaymentDetailsProps) {
  const { language, t } = useTranslation();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>{t.paymentHoldTimer}</span>
        </div>
        <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
          {timeFormatted}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-3xl border border-slate-200 dark:border-zinc-700 text-center space-y-3">
          <div className="relative p-2 bg-white rounded-2xl shadow-md border border-slate-100">
            <Image
              src={payment.vietQrUrl}
              alt="VietQR PayOS"
              width={224}
              height={224}
              unoptimized
              className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-xl"
            />
          </div>

          <div className="space-y-0.5">
            <div className="text-xs font-black text-slate-800 dark:text-slate-100">
              {t.scanWithBankApp}
            </div>
            <p className="text-[11px] text-slate-400">VCB, MB, Techcom, BIDV, VPBank, ACB, Momo...</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">{t.bankNameLabel}</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">
              {payment.bankName || 'MBBank'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">{t.accountNumberLabel}</div>
              <div className="font-mono font-black text-sm text-slate-900 dark:text-white truncate">
                {payment.accountNumber}
              </div>
            </div>
            <button
              onClick={() => onCopy(payment.accountNumber, 'accNumber')}
              className="min-h-[38px] py-1.5 px-3 rounded-xl bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              {copiedField === 'accNumber' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === 'accNumber' ? t.copiedAction : t.copyAction}</span>
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
            <div className="text-[10px] uppercase font-bold text-slate-400">{t.accountNameLabel}</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{payment.accountName}</div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-500">{t.exactAmountLabel}</div>
              <div className="font-mono font-black text-base text-indigo-700 dark:text-indigo-300">
                {payment.amount.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VNĐ
              </div>
            </div>
            <button
              onClick={() => onCopy(String(payment.amount), 'amount')}
              className="min-h-[38px] py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
            >
              {copiedField === 'amount' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === 'amount' ? t.copiedAction : t.copyAction}</span>
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase font-black text-amber-700 dark:text-amber-300">
                {t.transferMemoLabel}
              </div>
              <button
                onClick={() => onCopy(payment.description, 'memo')}
                className="min-h-[34px] py-1 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
              >
                {copiedField === 'memo' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'memo' ? t.copiedAction : t.copyAction}</span>
              </button>
            </div>
            <div className="font-mono font-black text-sm text-slate-900 dark:text-white bg-white dark:bg-zinc-800 p-2 rounded-xl border border-amber-200 dark:border-amber-800 break-all">
              {payment.description}
            </div>
            <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-tight">
              {t.transferMemoWarning}
            </p>
          </div>
        </div>
      </div>

      {copiedField === 'status-pending' && (
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold text-center animate-fade-in">
          {t.checkingPayment}
        </div>
      )}
      {statusErrorMessage && (
        <div role="alert" className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold text-center">
          {statusErrorMessage}
        </div>
      )}
    </div>
  );
}

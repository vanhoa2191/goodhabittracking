'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Clock, Copy, Download, ExternalLink } from 'lucide-react';
import { qrFileName, saveQrImage } from '@/lib/save-qr-image';
import type { PaymentResult } from '@/lib/payos';
import { useTranslation } from '@/lib/i18n/context';
import { formatCurrency } from '@/lib/i18n/formatters';
import { referralDiscountLine } from '@/lib/i18n/referral-discount-copy';
import { HelpTip } from '@/components/help/HelpTip';

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
  const [qrSaved, setQrSaved] = useState(false);

  const downloadQr = async () => {
    try {
      const saved = await saveQrImage(payment.vietQrUrl, qrFileName(payment.orderCode));
      setQrSaved(saved);
      if (saved) window.setTimeout(() => setQrSaved(false), 3000);
    } catch {
      // Fall back to the payment page, which shows the same QR and can be saved from there.
      window.open(payment.checkoutUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>{t.paymentHoldTimer}</span><HelpTip topic="payment.timer" />
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
            <p className="text-xs text-slate-400">VCB, MB, Techcom, BIDV, VPBank, ACB, MoMo...</p>
          </div>

          <button
            type="button"
            data-testid="download-qr"
            onClick={() => void downloadQr()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition-all hover:bg-indigo-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
          >
            {qrSaved ? <Check className="h-4 w-4" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
            <span>{qrSaved ? t.downloadQrDone : t.downloadQrAction}</span>
          </button>
          <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">{t.downloadQrHint}</p>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-1">
            <div className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">{t.accountNameLabel}</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">
              {payment.accountName}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">{t.accountNumberLabel}</div>
              <div className="break-all font-mono text-base font-black tracking-wide text-slate-950 dark:text-white">
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
            <div className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
              {t.bankNameLabel}
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {payment.bankName}
            </div>
            <div className="mt-1 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
              BIN {payment.bankBin}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between gap-2">
            <div>
              <div className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400">{t.exactAmountLabel}</div>
              <div className="font-mono font-black text-base text-indigo-700 dark:text-indigo-300">
                {formatCurrency(payment.amount, language)}
              </div>
              {payment.discountPercent && payment.listPrice ? (
                <div className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {referralDiscountLine(language, payment.discountPercent, formatCurrency(payment.listPrice, language))}
                </div>
              ) : null}
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
              <div className="flex items-center gap-1"><div className="text-xs uppercase font-black text-amber-700 dark:text-amber-300">
                {t.transferMemoLabel}
              </div><HelpTip topic="payment.memo" /></div>
              <button
                onClick={() => onCopy(payment.description, 'memo')}
                className="min-h-[34px] py-1 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
              >
                {copiedField === 'memo' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'memo' ? t.copiedAction : t.copyAction}</span>
              </button>
            </div>
            <div className="font-mono font-black text-sm text-slate-900 dark:text-white bg-white dark:bg-zinc-800 p-2 rounded-xl border border-amber-200 dark:border-amber-800 break-all">
              {payment.description}
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-tight">
              {t.transferMemoWarning}
            </p>
          </div>
        </div>
      </div>

      <a
        href={payment.checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
      >
        <ExternalLink className="h-4 w-4" />
        <span>{t.secureCheckoutAction}</span>
      </a>

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

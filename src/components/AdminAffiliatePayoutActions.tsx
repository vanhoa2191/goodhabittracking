'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';

const field = 'mt-1 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900';

/** The admin transfers the money by hand, then records the bank reference here (or rejects the request). */
export function AdminAffiliatePayoutActions({ payoutId }: { readonly payoutId: string }) {
  const router = useRouter();
  const id = useId();
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (resolution: 'paid' | 'rejected') => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/affiliate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ payoutId, resolution, reference, note: '', reason }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        setError(body?.error ?? 'Không thực hiện được.');
        return;
      }
      router.refresh();
    } catch {
      setError('Không thực hiện được.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <label htmlFor={`${id}-ref`} className="text-xs font-bold text-slate-600 dark:text-slate-300">Mã giao dịch ngân hàng (bắt buộc khi đã chuyển)
        <input id={`${id}-ref`} className={field} value={reference} maxLength={120} onChange={(event) => setReference(event.target.value)} />
      </label>
      <label htmlFor={`${id}-reason`} className="text-xs font-bold text-slate-600 dark:text-slate-300">Lý do ghi nhật ký (tối thiểu 5 ký tự)
        <input id={`${id}-reason`} className={field} value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button type="button" disabled={busy || reference.trim() === '' || reason.trim().length < 5} onClick={() => void submit('paid')} className="min-h-10 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-60">Đã chuyển khoản</button>
        <button type="button" disabled={busy || reason.trim().length < 5} onClick={() => void submit('rejected')} className="min-h-10 rounded-xl border border-rose-300 px-4 text-sm font-bold text-rose-700 disabled:opacity-60 dark:border-rose-800 dark:text-rose-300">Từ chối</button>
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300 sm:col-span-2">{error}</p>}
    </div>
  );
}

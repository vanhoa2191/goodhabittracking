'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminAffiliateCommissionActions({ orderCode }: { readonly orderCode: number }) {
  const router = useRouter();
  const id = useId();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function release() {
    if (busy || reason.trim().length < 5) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch('/api/admin/affiliate/commissions', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderCode, reason }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { status?: string } | null;
        const messages: Record<string, string> = {
          billing_case_open: 'Hồ sơ thanh toán đang mở. Xử lý hồ sơ trước khi bỏ đóng băng.',
          refund_confirmed: 'Đơn đã hoàn tiền, không thể bỏ đóng băng.',
          not_frozen: 'Hoa hồng này đã được bỏ đóng băng. Tải lại trang.',
          not_authorized: 'Bạn cần quyền tài chính đang có hiệu lực và xác thực hai bước.',
        };
        setError(messages[body?.status ?? ''] ?? 'Chưa bỏ được đóng băng. Kiểm tra quyền và thử lại.');
        return;
      }
      router.refresh();
    } catch { setError('Chưa bỏ được đóng băng. Thử lại sau.'); }
    finally { setBusy(false); }
  }
  return (
    <div className="mt-3 space-y-2">
      <label htmlFor={id} className="block text-xs font-bold text-slate-600 dark:text-slate-300">Lý do xác nhận tranh chấp đã giải quyết, không hoàn tiền (tối thiểu 5 ký tự)
        <input id={id} className="mt-1 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900" value={reason} maxLength={500} onChange={event => setReason(event.target.value)} />
      </label>
      <button type="button" disabled={busy || reason.trim().length < 5} onClick={() => void release()} className="min-h-10 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Đang xử lý…' : 'Xác nhận và bỏ đóng băng'}</button>
      {error && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>}
    </div>
  );
}

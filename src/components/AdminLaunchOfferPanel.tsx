'use client';

import { useEffect, useId, useState } from 'react';

type Claim = { readonly orderCode: number; readonly familyShort: string; readonly claimedAt: string; readonly revoked: boolean };

const field = 'mt-1 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900';

/** The launch-offer places taken so far, and a way to give one back when its payment is refunded. */
export function AdminLaunchOfferPanel() {
  const id = useId();
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [slots, setSlots] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [target, setTarget] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/launch-offer')
      .then(async (response) => {
        if (!response.ok) throw new Error('load');
        return await response.json() as { claims: Claim[]; slots: number };
      })
      .then((body) => {
        if (cancelled) return;
        setClaims(body.claims);
        setSlots(body.slots);
        setFailed(false);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [version]);

  const revoke = async () => {
    if (target === null) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/launch-offer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderCode: target, reason: reason.trim() }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        setMessage(body?.error ?? 'Không thu hồi được.');
        return;
      }
      setMessage(`Đã thu hồi suất của đơn ${target}.`);
      setTarget(null);
      setReason('');
      setVersion((current) => current + 1);
    } catch {
      setMessage('Không thu hồi được.');
    } finally {
      setBusy(false);
    }
  };

  const active = claims?.filter((claim) => !claim.revoked).length ?? 0;
  return (
    <section aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-xl font-black">Ưu đãi ra mắt</h2>
      {failed && <p role="alert" className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">Chưa tải được danh sách suất.</p>}
      {claims && (
        <>
          <p className="mt-1 text-sm text-slate-500">Đã dùng {active}/{slots} suất.</p>
          {claims.length === 0 ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Chưa có suất nào.</p> : (
            <ul className="mt-3 space-y-2">
              {claims.map((claim) => (
                <li key={claim.orderCode} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                  <span className="font-bold tabular-nums">Đơn {claim.orderCode}</span>
                  <span>{new Date(claim.claimedAt).toLocaleDateString('vi-VN')}</span>
                  <span className="font-mono text-xs text-slate-500">Gia đình {claim.familyShort}</span>
                  {claim.revoked
                    ? <span className="font-bold text-slate-500">Đã thu hồi</span>
                    : <button type="button" onClick={() => { setTarget(claim.orderCode); setMessage(null); }} className="ml-auto min-h-10 rounded-xl border border-rose-300 px-3 text-sm font-bold text-rose-700 dark:border-rose-800 dark:text-rose-300">Thu hồi suất đơn {claim.orderCode}</button>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {target !== null && (
        <div className="mt-3 grid gap-2 rounded-2xl border border-rose-200 p-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label htmlFor={`${id}-reason`} className="text-xs font-bold text-slate-600 dark:text-slate-300">Lý do thu hồi đơn {target} (tối đa 200 ký tự)
            <input id={`${id}-reason`} className={field} value={reason} maxLength={200} onChange={(event) => setReason(event.target.value)} />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={busy || reason.trim() === ''} onClick={() => void revoke()} className="min-h-10 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white disabled:opacity-60">Xác nhận thu hồi</button>
            <button type="button" disabled={busy} onClick={() => setTarget(null)} className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold dark:border-zinc-700">Hủy</button>
          </div>
        </div>
      )}
      {message && <p role="status" className="mt-3 text-sm font-semibold">{message}</p>}
    </section>
  );
}

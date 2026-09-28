'use client';

import { useCallback, useEffect, useState } from 'react';

type Membership = {
  readonly user_id: string;
  readonly role: 'support' | 'finance' | 'super_admin';
  readonly granted_at: string;
  readonly expires_at: string | null;
  readonly revoked_at: string | null;
};

export function AdminAccessPanel() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Membership['role']>('support');
  const [expiresOn, setExpiresOn] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/access');
    if (!response.ok) return;
    const body = await response.json() as { memberships: Membership[] };
    setMemberships(body.memberships);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const handleFailure = async (response: Response, fallback: string) => {
    const body = await response.json().catch(() => null) as { error?: string; code?: string } | null;
    setError(body?.code === 'mfa_required'
      ? 'Hãy hoàn tất xác minh hai bước ở phía trên rồi thử lại.'
      : body?.error ?? fallback);
  };

  const grant = async () => {
    setError('');
    setMessage('');
    if (!expiresOn || reason.trim().length < 5) {
      setError('Chọn ngày hết hạn và nhập lý do ít nhất 5 ký tự.');
      return;
    }
    const response = await fetch('/api/admin/access', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email,
        role,
        expiresAt: new Date(`${expiresOn}T23:59:59.000Z`).toISOString(),
        reason: reason.trim(),
      }),
    });
    if (!response.ok) {
      await handleFailure(response, 'Không cấp được quyền quản trị.');
      return;
    }
    setEmail('');
    setReason('');
    setMessage('Đã cấp quyền có thời hạn.');
    await load();
  };

  const revoke = async (userId: string) => {
    setError('');
    setMessage('');
    if (reason.trim().length < 5) {
      setError('Nhập lý do thu hồi ít nhất 5 ký tự.');
      return;
    }
    const response = await fetch('/api/admin/access', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, reason: reason.trim() }),
    });
    if (!response.ok) {
      await handleFailure(response, 'Không thu hồi được quyền quản trị.');
      return;
    }
    setReason('');
    setMessage('Đã thu hồi quyền quản trị.');
    await load();
  };

  return (
    <section className="space-y-4 border-t border-slate-200 pt-5">
      <div>
        <h2 className="text-xl font-black">Quyền quản trị</h2>
        <p className="mt-1 text-sm text-slate-600">Mọi quyền đều có ngày hết hạn và có thể thu hồi ngay.</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold">Email tài khoản
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" />
        </label>
        <label className="text-sm font-bold">Vai trò
          <select value={role} onChange={(event) => setRole(event.target.value as Membership['role'])} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3">
            <option value="support">Chăm sóc khách hàng</option>
            <option value="finance">Tài chính</option>
            <option value="super_admin">Quản trị cao nhất</option>
          </select>
        </label>
        <label className="text-sm font-bold">Ngày hết hạn
          <input value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} type="date" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" />
        </label>
        <label className="text-sm font-bold">Lý do cấp hoặc thu hồi
          <input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" />
        </label>
      </div>
      <button type="button" onClick={() => void grant()} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white">Cấp hoặc thay quyền</button>
      <div className="space-y-2">
        {memberships.map((membership) => (
          <div key={membership.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
            <div>
              <p className="font-bold">{membership.role}</p>
              <p className="break-all text-xs text-slate-500">ID: {membership.user_id}</p>
              <p className="text-xs text-slate-500">{membership.revoked_at ? 'Đã thu hồi' : membership.expires_at ? `Hết hạn ${membership.expires_at.slice(0, 10)}` : 'Không có ngày hết hạn'}</p>
            </div>
            {!membership.revoked_at && (
              <button type="button" onClick={() => void revoke(membership.user_id)} className="min-h-11 rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700">Thu hồi</button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

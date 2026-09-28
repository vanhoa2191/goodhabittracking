'use client';

import { useEffect, useState } from 'react';
import { Copy, UserRoundPlus, XCircle } from 'lucide-react';

type InviteSummary = Readonly<{
  id: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}>;

export function CaregiverInvitesPanel() {
  const [invites, setInvites] = useState<InviteSummary[]>([]);
  const [oneTimeLink, setOneTimeLink] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch('/api/caregiver/invites').then(async (response) => {
      if (!response.ok) return;
      const result: { invites?: InviteSummary[] } = await response.json();
      if (active) setInvites(result.invites ?? []);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const createInvite = async () => {
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/caregiver/invites', { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.invite) throw new Error(result.error || 'Chưa thể tạo lời mời.');
      const link = `${window.location.origin}/invite/caregiver#token=${encodeURIComponent(result.invite.token)}`;
      setOneTimeLink(link);
      setInvites((current) => [{
        id: result.invite.id,
        expiresAt: result.invite.expiresAt,
        acceptedAt: null,
        revokedAt: null,
        createdAt: new Date().toISOString(),
      }, ...current]);
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : 'Chưa thể tạo lời mời.');
    } finally {
      setBusy(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/caregiver/invites', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Chưa thể thu hồi lời mời.');
      setInvites((current) => current.filter((invite) => invite.id !== inviteId));
      setOneTimeLink('');
      setNotice('Đã thu hồi lời mời.');
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : 'Chưa thể thu hồi lời mời.');
    } finally {
      setBusy(false);
    }
  };

  const activeInvites = invites.filter((invite) => !invite.acceptedAt && !invite.revokedAt);

  return (
    <section className="rounded-3xl border border-indigo-100 bg-white p-6 dark:border-indigo-900 dark:bg-zinc-900" aria-labelledby="caregiver-invites-title">
      <h4 id="caregiver-invites-title" className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white"><UserRoundPlus className="h-5 w-5 text-indigo-600" aria-hidden="true" />Mời người chăm sóc</h4>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Người được mời chỉ xem tiến độ gia đình, không thể sửa hồ sơ, nhiệm vụ, điểm hay gói đăng ký.</p>
      <button type="button" onClick={() => void createInvite()} disabled={busy} className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">Tạo lời mời người chăm sóc</button>

      {oneTimeLink && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <label className="text-sm font-bold text-slate-900 dark:text-white">Liên kết mời một lần<input aria-label="Liên kết mời một lần" readOnly value={oneTimeLink} className="mt-2 min-h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm text-slate-800 dark:border-amber-800 dark:bg-zinc-900 dark:text-white" /></label>
          <p className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-200">Liên kết chỉ hiện trong lần tạo này và hết hạn sau 72 giờ.</p>
          <button type="button" onClick={() => void navigator.clipboard.writeText(oneTimeLink).then(() => setNotice('Đã sao chép liên kết.'))} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-sm font-bold text-amber-900 dark:border-amber-700 dark:bg-zinc-900 dark:text-amber-100"><Copy className="h-4 w-4" aria-hidden="true" />Sao chép</button>
        </div>
      )}

      {activeInvites.length > 0 && <ul className="mt-4 space-y-2" aria-label="Lời mời đang hoạt động">{activeInvites.map((invite) => <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-zinc-800"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hết hạn {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(invite.expiresAt))}</span><button type="button" onClick={() => void revokeInvite(invite.id)} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 px-3 text-sm font-bold text-rose-700 dark:border-rose-800 dark:text-rose-300"><XCircle className="h-4 w-4" aria-hidden="true" />Thu hồi lời mời</button></li>)}</ul>}
      {notice && <p role="status" className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{notice}</p>}
    </section>
  );
}

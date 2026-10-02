'use client';

import { useEffect, useState } from 'react';
import { Copy, UserRoundPlus, XCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getCaregiverCopy } from '@/lib/i18n/caregiver-copy';

type InviteSummary = Readonly<{
  id: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}>;

export function CaregiverInvitesPanel() {
  const { language } = useTranslation();
  const copy = getCaregiverCopy(language);
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
      if (!response.ok || !result.invite) throw new Error(result.error || copy.panelCreateFailed);
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
      setNotice(error instanceof Error ? error.message : copy.panelCreateFailed);
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
      if (!response.ok) throw new Error(result.error || copy.panelRevokeFailed);
      setInvites((current) => current.filter((invite) => invite.id !== inviteId));
      setOneTimeLink('');
      setNotice(copy.panelRevoked);
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : copy.panelRevokeFailed);
    } finally {
      setBusy(false);
    }
  };

  const activeInvites = invites.filter((invite) => !invite.acceptedAt && !invite.revokedAt);

  return (
    <section className="rounded-3xl border border-indigo-100 bg-white p-6 dark:border-indigo-900 dark:bg-zinc-900" aria-labelledby="caregiver-invites-title">
      <h4 id="caregiver-invites-title" className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white"><UserRoundPlus className="h-5 w-5 text-indigo-600" aria-hidden="true" />{copy.panelTitle}</h4>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{copy.panelIntro}</p>
      <button type="button" onClick={() => void createInvite()} disabled={busy} className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{copy.panelCreate}</button>

      {oneTimeLink && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <label className="text-sm font-bold text-slate-900 dark:text-white">{copy.panelLinkLabel}<input aria-label={copy.panelLinkLabel} readOnly value={oneTimeLink} className="mt-2 min-h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm text-slate-800 dark:border-amber-800 dark:bg-zinc-900 dark:text-white" /></label>
          <p className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-200">{copy.panelLinkNote}</p>
          <button type="button" onClick={() => void navigator.clipboard.writeText(oneTimeLink).then(() => setNotice(copy.panelCopied))} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-sm font-bold text-amber-900 dark:border-amber-700 dark:bg-zinc-900 dark:text-amber-100"><Copy className="h-4 w-4" aria-hidden="true" />{copy.panelCopy}</button>
        </div>
      )}

      {activeInvites.length > 0 && <ul className="mt-4 space-y-2" aria-label={copy.panelActiveLabel}>{activeInvites.map((invite) => <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-zinc-800"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{copy.panelExpires(new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(invite.expiresAt)))}</span><button type="button" onClick={() => void revokeInvite(invite.id)} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 px-3 text-sm font-bold text-rose-700 dark:border-rose-800 dark:text-rose-300"><XCircle className="h-4 w-4" aria-hidden="true" />{copy.panelRevoke}</button></li>)}</ul>}
      {notice && <p role="status" className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{notice}</p>}
    </section>
  );
}

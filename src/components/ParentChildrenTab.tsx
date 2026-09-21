'use client';

import { useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { Check, Copy, Edit2, Plus, QrCode, RefreshCw, Smartphone, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import type { ChildProfile } from '@/types';
import { getParentPrimaryCopy } from '@/lib/i18n/parent-primary-copy';
import { getKidDashboardCopy } from '@/lib/i18n/kid-dashboard-copy';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { useAgeHabitBundleMutation } from '@/lib/store/use-age-habit-bundle-mutation';
import { getProfileMutationCopy } from '@/lib/i18n/profile-mutation-copy';
import { readPairingCredential, type PairingCredential } from '@/lib/store/pairing-client';

interface ParentChildrenTabProps {
  onAdjustPoints: (childId: string) => void;
  onOpenChild: (child?: ChildProfile) => void;
}

export function ParentChildrenTab({ onAdjustPoints, onOpenChild }: ParentChildrenTabProps) {
  const {
    profiles, deleteProfile, childCodes,
    generateChildCodes, regenerateChildCode, currentUser,
  } = useAppStore();
  const { t, language } = useTranslation();
  const copy = getParentPrimaryCopy(language);
  const kidCopy = getKidDashboardCopy(language);
  const onboarding = getOnboardingCopy(language);
  const profileCopy = getProfileMutationCopy(language);
  const [copiedChildId, setCopiedChildId] = useState<string | null>(null);
  const [qrChildId, setQrChildId] = useState<string | null>(null);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<Record<string, PairingCredential>>({});
  const [regeneratingChildId, setRegeneratingChildId] = useState<string | null>(null);
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const { applyAgeBundle, mutationError, pendingChildId } = useAgeHabitBundleMutation();
  const canManagePairing = Boolean(currentUser);

  const loadAgeBundle = async (child: ChildProfile) => {
    if (!child.ageStage) return;
    const saved = await applyAgeBundle(child.id, child.ageStage);
    if (!saved) return;
    alert(copy.ageBundleLoaded(onboarding.stageLabels[child.ageStage], child.name));
  };

  const copyChildCode = (childId: string, code: string) => {
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(code);
    setCopiedChildId(childId);
    window.setTimeout(() => setCopiedChildId(null), 2500);
  };

  const toggleQr = async (childId: string, code: string | undefined) => {
    if (qrChildId === childId) {
      setQrChildId(null);
      return;
    }
    if (!code) return;
    const credential = credentials[childId] ?? await readPairingCredential(childId);
    if (!credential) return;
    const dataUrl = await QRCode.toDataURL(credential.qrPayload, { width: 320, margin: 1 });
    setCredentials((previous) => ({ ...previous, [childId]: credential }));
    setQrDataUrls((previous) => ({ ...previous, [childId]: dataUrl }));
    setQrChildId(childId);
  };

  const regenerateCode = async (child: ChildProfile) => {
    if (!confirm(copy.regenerateCodeConfirm(child.name))) return;
    setRegeneratingChildId(child.id);
    const code = await regenerateChildCode(child.id);
    if (code) {
      const credential = await readPairingCredential(child.id);
      if (credential) {
        setCredentials((previous) => ({ ...previous, [child.id]: credential }));
        const dataUrl = await QRCode.toDataURL(credential.qrPayload, { width: 320, margin: 1 });
        setQrDataUrls((previous) => ({ ...previous, [child.id]: dataUrl }));
      }
    }
    setRegeneratingChildId(null);
  };

  const removeChild = async (child: ChildProfile) => {
    if (!confirm(profileCopy.deleteConfirm(child.name))) return;
    setDeletingChildId(child.id);
    setDeleteError('');
    const deleted = await deleteProfile(child.id);
    setDeletingChildId(null);
    if (!deleted) setDeleteError(profileCopy.deleteError);
  };

  return (
    <div className="space-y-6">
      {deleteError && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{deleteError}</p>}
      <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/90 dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/30 rounded-3xl p-5 sm:p-6 border-2 border-indigo-200/80 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none shrink-0"><Smartphone className="w-5 h-5" /></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">{copy.pairingTitle}</h4>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{copy.oneTimeCodeBadge}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{copy.pairingDescription}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const codes = await generateChildCodes();
              if (Object.keys(codes).length > 0) alert(copy.allCodesRefreshed);
            }}
            disabled={!canManagePairing}
            className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:active:scale-100"
          >
            <RefreshCw className="w-3.5 h-3.5" /><span>{copy.newCodes}</span>
          </button>
        </div>

        {!canManagePairing && (
          <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            {t.loginRequiredForCloud}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-zinc-800 text-xs">
          {[[copy.deviceStep1, copy.deviceStep1Body], [copy.deviceStep2, copy.deviceStep2Body], [copy.deviceStep3, copy.deviceStep3Body]].map(([title, body]) => (
            <div key={title} className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">{title}</span>
              <span className="text-slate-500 dark:text-slate-400">{body}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">{t.manageProfiles} ({profiles.length})</h3>
          <p className="text-xs text-slate-400">{copy.profilesIntro}</p>
        </div>
        <button onClick={() => onOpenChild()} className="py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95">
          <Plus className="w-4 h-4" />{t.addChildTitle}
        </button>
      </div>

      {mutationError && <div role="alert" className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 text-xs font-bold">{mutationError}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {profiles.map((child) => {
          const childCode = childCodes[child.id];
          const codeActionsDisabled = !childCode;
          return (
          <div key={child.id} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-4xl shadow-inner">{child.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100 truncate">{child.name}</h4>
                  {child.ageStage && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">{kidCopy.stageLabels[child.ageStage]} ({child.age !== undefined ? `${child.age} ${kidCopy.ageUnit}` : onboarding.stageLabels[child.ageStage]})</span>}
                  {child.nickname && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">🛡️ {child.nickname}</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className="font-bold text-amber-500">⭐ {child.points} {copy.stars}</span><span>•</span><span>{t.levelPrefix} {child.level}</span><span>•</span><span>🔥 {copy.streakDays(child.streak)}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-slate-400 font-medium">{t.currentDisplayMode}</span>
                  <span className={`font-bold px-2 py-0.5 rounded-lg text-xs uppercase tracking-wider ${child.showRealNameOnLeaderboard ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'}`}>{child.showRealNameOnLeaderboard ? `👤 ${t.modeRealName}` : `🛡️ ${t.modeNickname}`}</span>
                  {!child.isPublicOnLeaderboard && <span className="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 font-semibold px-2 py-0.5 rounded-lg text-xs">🔒 {copy.hiddenFromRanking}</span>}
                </div>

                <div className="mt-3.5 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300"><Smartphone className="w-3.5 h-3.5" /><span>{copy.childCode}</span></div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{copy.forChild(child.name)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex-1 min-w-[120px] px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border-2 border-indigo-300 dark:border-indigo-700 shadow-inner flex items-center justify-center"><span className="font-mono font-black text-base text-indigo-600 dark:text-indigo-400 tracking-wider">{childCode || '---- ----'}</span></div>
                    <button type="button" onClick={() => { if (childCode) copyChildCode(child.id, childCode); }} disabled={codeActionsDisabled} className="py-1.5 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:active:scale-100" title={copy.copyCodeTitle} aria-label={copy.copyCodeTitle}>
                      {copiedChildId === child.id ? <><Check className="w-3.5 h-3.5 text-emerald-300" /><span>{copy.copied}</span></> : <><Copy className="w-3.5 h-3.5" /><span>{copy.copy}</span></>}
                    </button>
                    <button type="button" onClick={() => void toggleQr(child.id, childCode)} disabled={codeActionsDisabled} className="py-1.5 px-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:active:scale-100 dark:disabled:hover:bg-zinc-800" title={copy.qrTitle} aria-label={copy.qrTitle}><QrCode className="w-3.5 h-3.5 text-indigo-600" /><span>QR</span></button>
                    <button type="button" onClick={() => void regenerateCode(child)} disabled={!canManagePairing || regeneratingChildId === child.id} className="p-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer border border-slate-200 dark:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500 dark:disabled:hover:bg-zinc-800" title={copy.regenerateCodeTitle} aria-label={copy.regenerateCodeTitle}><RefreshCw className={`w-3.5 h-3.5 ${regeneratingChildId === child.id ? 'animate-spin' : ''}`} /></button>
                  </div>
                  {qrChildId === child.id && qrDataUrls[child.id] && (
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 border-t border-indigo-100 dark:border-indigo-900/40 animate-fade-in">
                      <Image src={qrDataUrls[child.id]} alt={`QR Code ${child.name}`} width={240} height={240} unoptimized className="h-60 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xs dark:border-zinc-700" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left leading-relaxed">{copy.qrHelp(child.name, childCode || '')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button onClick={() => onAdjustPoints(child.id)} className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors">⭐ {t.adjustPoints}</button>
                {child.ageStage && <button onClick={() => void loadAgeBundle(child)} disabled={pendingChildId === child.id} aria-busy={pendingChildId === child.id} className="py-1.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-60" title={copy.ageBundleTitle}>⚡ {copy.addAgeBundle}</button>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onOpenChild(child)} aria-label={`${t.editChildTitle}: ${child.name}`} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                {profiles.length > 1 && <button onClick={() => void removeChild(child)} disabled={deletingChildId === child.id} aria-busy={deletingChildId === child.id} aria-label={profileCopy.deleteConfirm(child.name)} className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors disabled:cursor-wait disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

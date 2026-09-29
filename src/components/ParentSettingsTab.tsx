'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Database, Lock, PauseCircle, PlayCircle, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getParentSettingsCopy } from '@/lib/i18n/parent-settings-copy';
import { familyPauseCopy } from '@/lib/i18n/family-pause-copy';
import { ChildDevicesPanel } from '@/components/ChildDevicesPanel';
import { ThemeSelector } from '@/components/ThemeSelector';
import { AccountProfileCard } from '@/components/AccountProfileCard';
import { AnalyticsConsentCard } from '@/components/AnalyticsConsentCard';
import { ParentReminderConsentCard } from '@/components/ParentReminderConsentCard';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { CaregiverInvitesPanel } from '@/components/CaregiverInvitesPanel';
import { PwaInstallPanel } from '@/components/PwaInstallPanel';
import { getMarketingOrigin } from '@/lib/site';

const legalPagesApproved = process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true';
const marketingOrigin = getMarketingOrigin();

export function ParentSettingsTab() {
  const {
    parentPinConfigured,
    refreshParentPinStatus,
    updateParentPin,
    currentUser,
    loginWithGoogle,
    logout,
    cloudSyncActive,
    experience,
    setFamilyPaused,
    familyRole,
  } = useAppStore();
  const { t, language } = useTranslation();
  const copy = getParentSettingsCopy(language);
  const pauseCopy = familyPauseCopy[language];
  const isPaused = Boolean(experience.settings?.paused_at);
  const [newPinInput, setNewPinInput] = useState('');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeNotice, setPinChangeNotice] = useState('');
  const [pinChangeError, setPinChangeError] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [pinStatusErrorUserId, setPinStatusErrorUserId] = useState<string | null>(null);
  const [isConfirmingPause, setIsConfirmingPause] = useState(false);
  const [isSavingPause, setIsSavingPause] = useState(false);
  const [pauseError, setPauseError] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    void refreshParentPinStatus().catch(() => {
      if (active) setPinStatusErrorUserId(currentUser.id);
    });
    return () => {
      active = false;
    };
  }, [currentUser, refreshParentPinStatus]);

  const handleRetryPinStatus = async () => {
    setPinStatusErrorUserId(null);
    try {
      await refreshParentPinStatus();
    } catch {
      setPinStatusErrorUserId(currentUser?.id ?? null);
    }
  };

  const pinStatusError = pinStatusErrorUserId === currentUser?.id;

  const handleFamilyPause = async () => {
    setIsSavingPause(true);
    setPauseError(false);
    try {
      const saved = await setFamilyPaused(!isPaused);
      if (saved) setIsConfirmingPause(false);
      else setPauseError(true);
    } catch (error: unknown) {
      if (!(error instanceof Error)) throw error;
      setPauseError(true);
    } finally {
      setIsSavingPause(false);
    }
  };

  const handleSavePin = async () => {
    setPinChangeError(false);
    if (!/^\d{4}$/.test(newPinInput) || newPinInput !== confirmPinInput) {
      setPinChangeError(true);
      setPinChangeNotice(newPinInput !== confirmPinInput ? 'Hai mã PIN mới chưa khớp.' : copy.pinInvalid);
      return;
    }
    setIsSavingPin(true);
    try {
      const result = await updateParentPin({
        currentPin: parentPinConfigured ? currentPinInput : undefined,
        newPin: newPinInput,
      });
      if (result.status !== 'updated') {
        setPinChangeError(true);
        setPinChangeNotice(result.status === 'locked'
          ? `Bạn đã thử quá nhiều lần. Hãy thử lại sau ${Math.ceil(result.retryAfterSeconds / 60)} phút.`
          : result.status === 'invalid_current'
            ? 'Mã PIN hiện tại chưa đúng.'
            : copy.pinInvalid);
        return;
      }
      setPinChangeNotice(copy.pinUpdated);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    } catch {
      setPinChangeError(true);
      setPinChangeNotice('Chưa thể lưu mã PIN. Vui lòng thử lại.');
    } finally {
      setIsSavingPin(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">{t.parentSettings}</h3>

      <nav aria-label="Nhóm cài đặt" className="flex flex-wrap gap-2 text-sm">
        {[
          ['settings-devices', 'Thiết bị & nhịp gia đình'],
          ['settings-account', 'Tài khoản'],
          ['settings-privacy', 'Riêng tư & thông báo'],
          ['settings-appearance', 'Giao diện'],
          ['settings-security', 'Bảo vệ bằng PIN'],
        ].map(([href, label]) => <a key={href} href={`#${href}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-3 font-bold text-indigo-700 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-indigo-300">{label}</a>)}
      </nav>

      <h4 id="settings-devices" className="scroll-mt-24 text-base font-black text-slate-900 dark:text-white">Thiết bị & nhịp gia đình</h4>

      <ChildDevicesPanel key={currentUser?.id ?? 'signed-out'} />
      <PwaInstallPanel />
      {currentUser && familyRole === 'owner' && <CaregiverInvitesPanel />}

      <section className="rounded-3xl border border-sand-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900" aria-labelledby="family-pause-title">
        <h4 id="family-pause-title" className="flex items-center gap-2 text-base font-extrabold text-sand-900 dark:text-slate-100">
          {isPaused ? <PauseCircle aria-hidden="true" className="h-5 w-5 text-amber-700" /> : <PlayCircle aria-hidden="true" className="h-5 w-5 text-indigo-600" />}
          {pauseCopy.title}
        </h4>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300" role="status">{isPaused ? pauseCopy.paused : pauseCopy.active}</p>
        {isConfirmingPause ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{isPaused ? pauseCopy.confirmResume : pauseCopy.confirmPause}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleFamilyPause()} disabled={isSavingPause} aria-busy={isSavingPause} className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{isPaused ? pauseCopy.resume : pauseCopy.pause}</button>
              <button type="button" onClick={() => setIsConfirmingPause(false)} disabled={isSavingPause} className="min-h-11 rounded-xl border border-sand-200 px-4 text-sm font-semibold text-slate-700 dark:border-zinc-700 dark:text-slate-200">{pauseCopy.cancel}</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => { setPauseError(false); setIsConfirmingPause(true); }} className="mt-4 min-h-11 rounded-xl border border-indigo-200 px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-zinc-800">{isPaused ? pauseCopy.resume : pauseCopy.pause}</button>
        )}
        {pauseError && <p role="alert" className="mt-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{pauseCopy.error}</p>}
      </section>

      <h4 id="settings-account" className="scroll-mt-24 text-base font-black text-slate-900 dark:text-white">Tài khoản & đồng bộ</h4>
      {currentUser && <AccountProfileCard />}
      <h4 id="settings-privacy" className="scroll-mt-24 text-base font-black text-slate-900 dark:text-white">Riêng tư & thông báo</h4>
      {currentUser && <AnalyticsConsentCard />}
      {currentUser && defaultExperienceFlags.parentReengagement && <ParentReminderConsentCard />}

      <Link href={new URL('/docs/', marketingOrigin).href} className="flex min-h-11 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">{language === 'vi' ? 'Mở tài liệu hướng dẫn' : 'Open user guide'}</Link>
      {legalPagesApproved && <nav aria-label="Quyền riêng tư và hỗ trợ" className="grid gap-2 sm:grid-cols-3">
        <Link href={new URL('/privacy/', marketingOrigin).href} className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-indigo-300">Quyền riêng tư</Link>
        <Link href={new URL('/terms/', marketingOrigin).href} className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-indigo-300">Điều khoản</Link>
        <Link href={new URL('/contact/', marketingOrigin).href} className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-indigo-300">Liên hệ hỗ trợ</Link>
      </nav>}

      <h4 id="settings-appearance" className="scroll-mt-24 text-base font-black text-slate-900 dark:text-white">Giao diện</h4>
      <div className="rounded-3xl border border-slate-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <ThemeSelector />
      </div>

      <h4 id="settings-security" className="scroll-mt-24 text-base font-black text-slate-900 dark:text-white">Bảo vệ khu vực phụ huynh</h4>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600" />
          {t.changePin}
        </h4>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Không chia sẻ mã PIN này với trẻ.</p>
        {currentUser && parentPinConfigured === null ? (
          pinStatusError ? (
            <div className="max-w-sm rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
              <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">Chưa thể kiểm tra trạng thái mã PIN. Chưa có thay đổi nào được gửi.</p>
              <button type="button" onClick={() => void handleRetryPinStatus()} className="mt-3 min-h-11 rounded-xl border border-rose-300 bg-white px-4 text-sm font-bold text-rose-700 dark:border-rose-800 dark:bg-zinc-900 dark:text-rose-300">Thử lại</button>
            </div>
          ) : <p role="status" className="text-sm font-semibold text-slate-600 dark:text-slate-300">Đang kiểm tra trạng thái mã PIN…</p>
        ) : (
          <div className="grid max-w-sm gap-3">
            {parentPinConfigured && <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Mã PIN hiện tại<input type="password" inputMode="numeric" autoComplete="current-password" pattern="[0-9]*" maxLength={4} value={currentPinInput} onChange={(event) => setCurrentPinInput(event.target.value.replace(/\D/g, ''))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-center font-bold tracking-widest dark:border-zinc-700 dark:bg-zinc-800" /></label>}
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Mã PIN mới<input type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]*" maxLength={4} value={newPinInput} onChange={(event) => setNewPinInput(event.target.value.replace(/\D/g, ''))} placeholder={copy.newPinPlaceholder} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-center font-bold tracking-widest dark:border-zinc-700 dark:bg-zinc-800" /></label>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Nhập lại mã PIN mới<input type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]*" maxLength={4} value={confirmPinInput} onChange={(event) => setConfirmPinInput(event.target.value.replace(/\D/g, ''))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-center font-bold tracking-widest dark:border-zinc-700 dark:bg-zinc-800" /></label>
            <button type="button" onClick={() => void handleSavePin()} disabled={isSavingPin} aria-busy={isSavingPin} className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-60">{isSavingPin ? 'Đang lưu…' : t.save}</button>
          </div>
        )}
        {pinChangeNotice && <p role={pinChangeError ? 'alert' : 'status'} className={`mt-3 text-sm font-bold ${pinChangeError ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{pinChangeNotice}</p>}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-600" />{copy.accountAccess}</h4>
          {currentUser && <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{copy.verified}</span>}
        </div>
        <p className="text-xs text-slate-500">{t.customerIsolationNotice}</p>
        {currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center gap-3">
              {currentUser.user_metadata?.avatar_url ? <Image src={currentUser.user_metadata.avatar_url} alt="Avatar" width={40} height={40} unoptimized className="w-10 h-10 rounded-full border border-white shadow-xs" /> : <div className="w-10 h-10 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-200">{currentUser.email?.charAt(0).toUpperCase()}</div>}
              <div><div className="text-sm font-bold text-slate-800 dark:text-slate-100">{currentUser.user_metadata?.full_name || copy.customer}</div><div className="text-xs text-slate-500">{currentUser.email}</div></div>
            </div>
            <button type="button" onClick={logout} className="py-2 px-4 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 dark:border-zinc-700 text-slate-600 transition-colors shadow-xs">{t.logout}</button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><div className="text-sm font-bold text-slate-800 dark:text-slate-100">{copy.notSignedIn}</div><div className="text-xs text-slate-500">{t.loginRequiredForCloud}</div></div>
            <button type="button" onClick={loginWithGoogle} className="py-2.5 px-5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 border border-slate-200 dark:border-zinc-700 text-xs font-extrabold text-slate-800 dark:text-slate-100 transition-all shadow-md">{t.googleLogin}</button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2"><Database className="w-4 h-4 text-emerald-600" />{t.cloudBackend}</h4>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cloudSyncActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-700'}`}>{cloudSyncActive ? copy.cloudReady : copy.cloudServer}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 mb-4">
          <div className="flex items-start gap-2.5"><span className="text-base leading-none">✅</span><div className="text-xs text-emerald-900 dark:text-emerald-200"><p className="font-bold mb-0.5">{copy.cloudSetupTitle}</p><p className="text-emerald-700 dark:text-emerald-300">{copy.cloudSetupDescription}</p></div></div>
        </div>
      </div>

    </div>
  );
}

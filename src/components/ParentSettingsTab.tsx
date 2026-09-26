'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Database, Download, Lock, PauseCircle, PlayCircle, ShieldCheck, Upload } from 'lucide-react';
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

export function ParentSettingsTab() {
  const {
    parentPin,
    updateParentPin,
    storageMode,
    setStorageMode,
    currentUser,
    loginWithGoogle,
    logout,
    cloudSyncActive,
    experience,
    setFamilyPaused,
    exportData,
    importData,
  } = useAppStore();
  const { t, language } = useTranslation();
  const copy = getParentSettingsCopy(language);
  const pauseCopy = familyPauseCopy[language];
  const isPaused = Boolean(experience.settings?.paused_at);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeNotice, setPinChangeNotice] = useState('');
  const [isConfirmingPause, setIsConfirmingPause] = useState(false);
  const [isSavingPause, setIsSavingPause] = useState(false);
  const [pauseError, setPauseError] = useState(false);

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

  const handleSavePin = () => {
    if (/^\d{4}$/.test(newPinInput)) {
      updateParentPin(newPinInput);
      setPinChangeNotice(copy.pinUpdated);
      window.setTimeout(() => setPinChangeNotice(''), 3000);
      setNewPinInput('');
      return;
    }
    setPinChangeNotice(copy.pinInvalid);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `kidhabit_backup_${new Date().toISOString().split('T')[0]}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      alert(content && importData(content) ? copy.importSuccess : copy.importInvalid);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">{t.parentSettings}</h3>

      <ChildDevicesPanel key={currentUser?.id ?? 'signed-out'} />

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

      {currentUser && <AccountProfileCard />}
      {currentUser && <AnalyticsConsentCard />}
      {currentUser && defaultExperienceFlags.parentReengagement && <ParentReminderConsentCard />}

      <Link href="/docs" className="flex min-h-11 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">{language === 'vi' ? 'Mở tài liệu hướng dẫn' : 'Open user guide'}</Link>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <ThemeSelector />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600" />
          {t.changePin}
        </h4>
        <p className="text-xs text-slate-400 mb-4">{copy.currentPin}: <strong className="text-slate-700 dark:text-slate-200">{parentPin}</strong>.</p>
        <div className="flex items-center gap-3 max-w-xs">
          <input type="password" maxLength={4} value={newPinInput} onChange={(event) => setNewPinInput(event.target.value)} placeholder={copy.newPinPlaceholder} className="w-32 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-center font-bold tracking-widest text-sm" />
          <button onClick={handleSavePin} className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all">{t.save}</button>
        </div>
        {pinChangeNotice && <p className="text-xs text-emerald-600 font-bold mt-2">{pinChangeNotice}</p>}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 space-y-4">
        <div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2"><Database className="w-4 h-4 text-indigo-600" />{t.storageModeLabel}</h4>
          <p className="text-xs text-slate-400 mt-1">{t.storageModeTip}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button type="button" onClick={() => setStorageMode('local')} className={`p-4 rounded-2xl border text-left transition-all ${storageMode === 'local' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'}`}>
            <div className="flex items-center justify-between mb-1.5"><span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">📱 {t.localStorageMode}</span>{storageMode === 'local' && <Check className="w-4 h-4 text-indigo-600" />}</div>
            <p className="text-xs text-slate-500">{copy.localDescription}</p>
          </button>
          <button type="button" onClick={() => setStorageMode('cloud')} className={`p-4 rounded-2xl border text-left transition-all ${storageMode === 'cloud' ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'}`}>
            <div className="flex items-center justify-between mb-1.5"><span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">☁️ {t.cloudStorageMode}</span>{storageMode === 'cloud' && <Check className="w-4 h-4 text-emerald-600" />}</div>
            <p className="text-xs text-slate-500">{copy.cloudDescription}</p>
          </button>
        </div>
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

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2"><Download className="w-4 h-4 text-indigo-600" />{copy.backupRestore}</h4>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />{t.exportData}</button>
          <label className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"><Upload className="w-3.5 h-3.5" />{t.importData}<input type="file" accept=".json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleImport(file); }} /></label>
        </div>
      </div>
    </div>
  );
}

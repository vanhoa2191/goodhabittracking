'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Sparkles,
  House,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Globe,
  Database,
  ChevronDown,
  Check,
  Type,
  LogOut,
  User as UserIcon,
  Crown,
  MoreVertical,
  X,
  BookOpen,
  UserPlus,
  Smartphone,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation, SUPPORTED_LANGUAGES, LanguageOption } from '@/lib/i18n/context';
import { sounds } from '@/lib/sound';
import { PinModal } from './PinModal';
import { FontSettingsModal } from './FontSettingsModal';
import { DeviceConnectModal } from './DeviceConnectModal';
import { getHeaderCopy } from '@/lib/i18n/header-copy';
import { useModalFocus } from '@/lib/use-modal-focus';
import { BrandMark } from '@/components/BrandMark';
import { ThemeSelector } from '@/components/ThemeSelector';
import { MascotAvatar } from '@/components/MascotAvatar';

interface HeaderProps {
  hasAppSession?: boolean;
  marketingHomeUrl: string;
}

export function Header({ hasAppSession = false, marketingHomeUrl }: HeaderProps) {
  const {
    mode,
    setMode,
    isParentUnlocked,
    refreshParentPinStatus,
    unlockParent,
    updateParentPin,
    lockParent,
    profiles,
    activeChildId,
    setActiveChildId,
    activeChild,
    cloudSyncActive,
    currentUser,
    loginWithGoogle,
    logout,
    isPro,
    subscriptionPlan,
    getSubscriptionDetails,
    openPricingModal,
    setIsPortraitModalOpen,
    openOnboarding,
    parentProfile,
    isFamilyConnected,
    isConnectModalOpen,
    openConnectModal,
    closeConnectModal,
  } = useAppStore();

  const isAuthenticated = Boolean(currentUser || isFamilyConnected);
  const hasDashboardAccess = isAuthenticated || hasAppSession;

  const { language, setLanguage, t } = useTranslation();
  const copy = getHeaderCopy(language);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  useModalFocus(isMobileMenuOpen, () => setIsMobileMenuOpen(false), menuPanelRef);
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);

  const toggleSound = () => {
    const next = sounds.toggleSound();
    setSoundEnabled(next);
  };

  const handleParentModeClick = () => {
    if (mode === 'kid') {
      if (isParentUnlocked) {
        setMode('parent');
      } else {
        setIsPinModalOpen(true);
      }
    } else {
      lockParent();
    }
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  const shell = mode;
  const marketingDocsUrl = new URL('/docs/', marketingHomeUrl).href;
  // A signed-in parent reads the guide inside the app (with its ? help); a visitor reads the one on the website.
  const docsUrl = currentUser || mode === 'parent' ? '/docs' : marketingDocsUrl;
  const homeLabel = language === 'vi' ? 'Trang chủ' : 'Home';

  if (isFamilyConnected && !currentUser) {
    return (
      <>
        <header data-app-shell="kid" className="sticky top-0 z-40 w-full border-b border-amber-200 bg-kid-surface/95 px-4 py-3 backdrop-blur-md dark:border-amber-900 dark:bg-zinc-950/90">
          <div className="mx-auto flex max-w-6xl items-center gap-2 sm:gap-3">
            <BrandMark className="h-10 w-10 shrink-0" label={t.appName} />
            <span className="min-w-0 flex-1 truncate text-base font-extrabold text-slate-800 dark:text-slate-100">{activeChild?.name || t.appName}</span>
            <select
              aria-label={t.language}
              value={language}
              onChange={(event) => setLanguage(event.target.value as typeof language)}
              className="min-h-11 w-16 rounded-xl border border-amber-200 bg-white px-1 text-sm font-bold text-slate-800 dark:border-amber-900 dark:bg-zinc-900 dark:text-slate-100"
            >
              {SUPPORTED_LANGUAGES.map((option) => <option key={option.code} value={option.code}>{option.code.toUpperCase()}</option>)}
            </select>
            <button type="button" onClick={() => setIsFontModalOpen(true)} aria-label={t.fontSettingsTitle} title={t.fontSettingsTitle} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-amber-200 bg-white text-slate-700 dark:border-amber-900 dark:bg-zinc-900 dark:text-slate-200">
              <Type className="h-5 w-5" />
            </button>
            <button type="button" onClick={toggleSound} aria-label={soundEnabled ? t.soundOn : t.soundOff} aria-pressed={soundEnabled} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-amber-200 bg-white text-slate-700 dark:border-amber-900 dark:bg-zinc-900 dark:text-slate-200">
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>
        </header>
        <FontSettingsModal isOpen={isFontModalOpen} onClose={() => setIsFontModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <header
        data-app-shell={shell}
        className={`sticky top-0 ${isMobileMenuOpen ? 'z-[45]' : 'z-40'} w-full border-b backdrop-blur-md transition-colors before:absolute before:inset-x-0 before:top-0 before:h-[3px] ${
          shell === 'kid'
            ? 'bg-kid-surface/95 border-amber-200 before:bg-amber-400 dark:bg-zinc-950/90 dark:border-amber-900'
            : shell === 'parent'
              ? 'bg-parent-surface/95 border-sand-200 before:bg-indigo-600 dark:bg-zinc-950/90 dark:border-zinc-800'
              : 'bg-parent-surface/95 border-sand-200 before:bg-transparent dark:bg-zinc-950/90 dark:border-zinc-800'
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1536px] items-center justify-between gap-1.5 px-3 sm:gap-2 sm:px-6">
          {/* Left: Logo & Slogan */}
          <Link
            href={marketingHomeUrl}
            className={`${hasDashboardAccess ? 'hidden min-[430px]:flex' : 'flex'} items-center gap-2 sm:gap-3 shrink-0 hover:opacity-90 transition-opacity`}
            title={t.appName}
          >
            <BrandMark className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" label={t.appName} />
            <div className="hidden xl:block">
              <span className="font-extrabold text-slate-800 dark:text-slate-100 text-base sm:text-lg tracking-tight block leading-tight">
                {t.appName}
              </span>
              <span className="hidden text-xs text-slate-500 font-medium 2xl:block">
                {t.appSlogan}
              </span>
            </div>
          </Link>

          {/* Center: Multi-Child Profile Switcher (Only when logged in and in Dashboard mode) */}
          {hasDashboardAccess && profiles.length > 0 && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3.5 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <MascotAvatar avatar={activeChild?.avatar || '🌟'} alt="" className="h-7 w-7 text-lg sm:h-8 sm:w-8 sm:text-xl" />
                <span className="font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200 max-w-[65px] sm:max-w-[130px] truncate">
                  {activeChild?.name}
                </span>
                <span className="hidden md:inline-flex items-center text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                  ⭐ {activeChild?.points || 0}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)} />
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-100 dark:border-zinc-800 p-2 z-20 animate-fade-in">
                    <div className="text-xs font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                      {t.switchProfile}
                    </div>
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveChildId(p.id);
                          setIsProfileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          p.id === activeChildId
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <MascotAvatar avatar={p.avatar} alt="" className="h-10 w-10 text-2xl" />
                          <div>
                            <div className="text-sm font-medium truncate">{p.name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5">
                              <span>⭐ {p.points}</span>
                              <span>•</span>
                              <span>{t.levelPrefix} {p.level}</span>
                            </div>
                          </div>
                        </div>
                        {p.id === activeChildId && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href={docsUrl} aria-label={language === 'vi' ? 'Tài liệu' : 'Docs'} title={language === 'vi' ? 'Tài liệu' : 'Docs'} className="hidden min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800 lg:flex 2xl:px-3"><BookOpen aria-hidden="true" className="h-4 w-4" /><span className="hidden whitespace-nowrap 2xl:inline">{language === 'vi' ? 'Tài liệu' : 'Docs'}</span></Link>
            <div className="hidden 2xl:block">
              <ThemeSelector compact />
            </div>
            {/* Desktop Only: Storage Status (Only when logged in) */}
            {hasDashboardAccess && (
              <div
                className={`hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  cloudSyncActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                }`}
                title={cloudSyncActive ? t.storageCloudConnected : t.cloudStorageMode}
              >
                <Database className="w-3 h-3" />
                <span>{cloudSyncActive ? t.storageCloudConnected : t.cloudStorageMode}</span>
              </div>
            )}

            {/* Desktop Only: Font Customization (xl:flex) */}
            <button
              onClick={() => setIsFontModalOpen(true)}
              className="hidden xl:flex min-w-[38px] min-h-[38px] p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all items-center justify-center gap-1 text-xs font-bold cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title={t.fontSettingsTitle}
            >
              <Type className="w-4 h-4" />
              <span className="text-xs">Aa</span>
            </button>

            <button
              type="button"
              data-testid="sound-toggle"
              onClick={toggleSound}
              className={`${shell === 'kid' ? 'hidden min-[360px]:flex' : 'hidden xl:flex'} min-w-11 min-h-11 p-2 rounded-xl text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all items-center justify-center cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
              title={soundEnabled ? t.soundOn : t.soundOff}
              aria-label={soundEnabled ? t.soundOn : t.soundOff}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Desktop Only: Language Switcher Dropdown (xl:block) */}
            <div className="relative hidden xl:block">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                aria-expanded={isLangMenuOpen}
                aria-haspopup="true"
                aria-label={currentLang.label}
                className="min-h-[38px] flex items-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span>{currentLang.flag}</span>
                <Globe className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {isLangMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsLangMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-100 dark:border-zinc-800 p-1.5 z-20 animate-fade-in max-h-80 overflow-y-auto">
                    {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          lang.code === language
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200 font-medium'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        {lang.code === language && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Desktop Only: 16 Portraits Guide (xl:flex) */}
            <button
              type="button"
              onClick={() => setIsPortraitModalOpen(true)}
              className="hidden 2xl:flex min-h-[38px] items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 transition-all shadow-xs cursor-pointer active:scale-95"
              title={copy.portraitGuide}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>{copy.portraitGuideShort}</span>
            </button>

            {hasDashboardAccess && mode === 'parent' && (
              <Link
                href={marketingHomeUrl}
                aria-label={homeLabel}
                className="flex min-h-[38px] items-center gap-1.5 rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-xs transition-transform hover:-translate-y-0.5 hover:bg-indigo-100 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-800/60 dark:bg-indigo-950/60 dark:text-indigo-300 max-lg:min-w-11 max-lg:justify-center max-lg:px-2"
                title={homeLabel}
              >
                <House className="w-4 h-4" aria-hidden="true" />
                <span className="hidden whitespace-nowrap 2xl:inline">{homeLabel}</span>
              </Link>
            )}

            {/* Google Account */}
            {currentUser ? (
              <div className="hidden xl:flex min-h-11 items-center gap-1.5 py-1 px-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {currentUser.user_metadata?.avatar_url ? (
                  <Image
                    src={currentUser.user_metadata.avatar_url}
                    alt="Google avatar"
                    width={20}
                    height={20}
                    unoptimized
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span className="hidden xl:inline max-w-[80px] truncate text-xs">
                  {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                </span>
                <button
                  onClick={logout}
                  title={t.logout}
                  aria-label={t.logout}
                  className="-mr-1.5 flex min-h-11 min-w-11 items-center justify-center hover:text-rose-600 transition-colors cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-full"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                aria-label={t.googleLogin}
                className="hidden xl:flex min-h-[38px] items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold bg-white dark:bg-zinc-900 hover:bg-slate-50 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-200 transition-all shadow-xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title={t.googleLogin}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="hidden whitespace-nowrap 2xl:inline">{t.googleLogin}</span>
              </button>
            )}

            {/* Pro Subscription Badge / Upgrade Button */}
            {mode === 'parent' && <button
              type="button"
              onClick={openPricingModal}
              className={`max-[429px]:hidden min-h-[38px] sm:min-h-[40px] flex items-center gap-1 sm:gap-1.5 py-1 px-1.5 sm:px-3 rounded-full text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0 ${
                isPro
                  ? subscriptionPlan === 'trial'
                    ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-amber-200 dark:shadow-none animate-trial-pulse'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-indigo-200 dark:shadow-none'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-950 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/80'
              }`}
              title={t.pricingModalTitle}
            >
              {isPro ? (
                subscriptionPlan === 'trial' ? (
                  <>
                    <span className="text-sm leading-none">🎁</span>
                    <span className="hidden sm:inline">{t.freeTrialDays} ({getSubscriptionDetails().daysRemaining ?? 7}d)</span>
                    <span className="sm:hidden font-bold">{getSubscriptionDetails().daysRemaining ?? 7}d</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-300 fill-current shrink-0" />
                    <span>{t.proBadge}</span>
                  </>
                )
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
                  <span className="hidden sm:inline">{t.upgradePro}</span>
                  <span className="sm:hidden font-black">{t.proBadge}</span>
                </>
              )}
            </button>}

            {/* Mode Switcher (Parent Mode) - Only when logged in */}
            {hasDashboardAccess && (!currentUser || mode === 'kid') && (
              <button
                onClick={handleParentModeClick}
                aria-label={mode === 'parent' ? copy.backToChild : undefined}
                className={`${mode === 'parent' ? 'max-[429px]:hidden ' : ''}min-h-[38px] sm:min-h-[40px] flex items-center gap-1 sm:gap-1.5 py-1 px-1.5 sm:px-3 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0 ${
                  mode === 'parent'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {mode === 'parent' ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="hidden whitespace-nowrap 2xl:inline">{copy.backToChild}</span>
                    <span className="whitespace-nowrap text-xs 2xl:hidden">{copy.backToChildShort}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">{t.parentMode}</span>
                    <span className="sm:hidden whitespace-nowrap text-xs">{t.parentShort}</span>
                  </>
                )}
              </button>
            )}
            {!hasDashboardAccess && (
              <button
                type="button"
                onClick={openConnectModal}
                className="min-h-[38px] sm:min-h-[40px] flex items-center gap-1 sm:gap-1.5 py-1 px-2.5 sm:px-3.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 dark:from-indigo-950/50 dark:to-purple-950/50 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                title={copy.childCode}
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{copy.childCodeButton}</span>
                <span className="sm:hidden whitespace-nowrap text-xs">{copy.childCodeShort}</span>
              </button>
            )}

            {/* Mobile / Tablet Menu Button (xl:hidden) */}
            <div className="relative 2xl:hidden shrink-0">
              <button
                type="button"
                data-testid="more-menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-haspopup="dialog"
                className="relative z-50 min-w-[38px] min-h-[38px] p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 border border-slate-200/80 dark:border-zinc-800"
                aria-label={t.moreMenu}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Mobile More Menu Floating Sheet */}
              {/* Portaled to <body>: the header's backdrop-blur makes it the containing block of fixed children, which clipped the backdrop to the header strip. */}
              {isMobileMenuOpen && createPortal(
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  {/* Anchored to the screen, not the button, so it can never slide off an edge; it scrolls inside when tall. */}
                  <div
                    ref={menuPanelRef}
                    data-testid="more-menu-panel"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t.moreMenu}
                    tabIndex={-1}
                    className="fixed right-3 top-[4.5rem] w-[min(18rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-3 z-40 animate-fade-in space-y-3"
                  >
                    {/* Header in Mobile Menu */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t.moreMenu}
                      </span>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-label={t.close}
                        className="-mr-2 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Google Auth Row */}
                    <div>
                      {currentUser ? (
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {currentUser.user_metadata?.avatar_url ? (
                              <Image
                                src={currentUser.user_metadata.avatar_url}
                                alt="avatar"
                                width={24}
                                height={24}
                                unoptimized
                                className="w-6 h-6 rounded-full shrink-0"
                              />
                            ) : (
                              <UserIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {currentUser.user_metadata?.full_name || currentUser.email}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              logout();
                              setIsMobileMenuOpen(false);
                            }}
                            className="flex min-h-11 min-w-11 items-center justify-center text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0"
                            title={t.logout}
                            aria-label={t.logout}
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            loginWithGoogle();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            />
                          </svg>
                          <span>{t.googleLogin}</span>
                        </button>
                      )}
                    </div>

                    {/* Language Selection Grid (all 9 languages) */}
                    <div>
                      <div className="text-xs font-bold text-slate-400 mb-1.5">
                        {t.language} ({currentLang.label})
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.code);
                            }}
                            className={`py-1.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-all ${
                              lang.code === language
                                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <span>{lang.flag}</span>
                            <span className="text-xs font-semibold">{lang.code.toUpperCase()}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <ThemeSelector />

                    {mode === 'parent' && (
                      <button
                        type="button"
                        onClick={openPricingModal}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 text-sm font-bold text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        <Crown className="h-4 w-4" aria-hidden="true" />
                        {t.pricingModalTitle}
                      </button>
                    )}

                    <Link href={docsUrl} onClick={() => setIsMobileMenuOpen(false)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-50 px-3 text-sm font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"><BookOpen className="h-4 w-4" />{language === 'vi' ? 'Tài liệu sử dụng' : 'User guide'}</Link>

                    {/* Quick Tools: Font Settings & Sound */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          setIsFontModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                      >
                        <Type className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Aa {t.fontSizeLabel || 'Cỡ chữ'}</span>
                      </button>

                      <button
                        onClick={toggleSound}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                      >
                        {soundEnabled ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t.soundOn}</span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t.soundOff}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 16 Portraits & Onboarding in Mobile Menu */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-zinc-800">
                      {/* Kid enter code button in mobile menu if not logged in */}
                      {!hasDashboardAccess && (
                        <button
                          onClick={() => {
                            openConnectModal();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2 transition-colors"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{copy.childConnect}</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsPortraitModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                        <span>{copy.portraitGuide}</span>
                      </button>

                      {isAuthenticated && (
                        <button
                          onClick={() => {
                            openOnboarding();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center justify-center gap-2 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-purple-600" />
                          <span>{parentProfile ? copy.parentProfile : copy.familySetup}</span>
                        </button>
                      )}
                    </div>

                    {mode === 'parent' && (
                      <Link
                        href={marketingHomeUrl}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1.5"
                      >
                        <House className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{homeLabel}</span>
                      </Link>
                    )}

                    {/* Storage Mode Notice (Only when logged in) */}
                    {hasDashboardAccess && (
                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3 text-indigo-500" />
                          <span>{cloudSyncActive ? t.storageCloudConnected : t.cloudStorageMode}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Parent PIN Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsPinModalOpen(false);
        }}
        refreshStatus={refreshParentPinStatus}
        verifyPin={unlockParent}
        savePin={updateParentPin}
      />

      {/* Font & Size Settings Modal */}
      <FontSettingsModal
        isOpen={isFontModalOpen}
        onClose={() => setIsFontModalOpen(false)}
      />

      {/* Child Device Pairing Modal */}
      <DeviceConnectModal
        isOpen={isConnectModalOpen}
        onClose={closeConnectModal}
      />
    </>
  );
}

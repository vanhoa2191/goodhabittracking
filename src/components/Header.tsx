'use client';

import React, { useId, useRef, useState, type ReactNode } from 'react';
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
import { getChromeCopy } from '@/lib/i18n/chrome-copy';
import { useModalFocus } from '@/lib/use-modal-focus';
import { BrandMark } from '@/components/BrandMark';
import { ThemeSelector } from '@/components/ThemeSelector';
import { MascotAvatar } from '@/components/MascotAvatar';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const MENU_GROUP_HEADING = 'mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300';
const MENU_ROW = 'flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';

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
    familyRole,
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
  const isCaregiver = familyRole === 'caregiver';
  const hasDashboardAccess = isAuthenticated || hasAppSession;

  const { language, setLanguage, t } = useTranslation();
  const copy = getHeaderCopy(language);
  const chromeCopy = getChromeCopy(language);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
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
  const homeLabel = chromeCopy.home;

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
            <DropdownMenu
              rootClassName="relative shrink-0"
              menuLabel={t.switchProfile}
              heading={t.switchProfile}
              triggerClassName="flex items-center gap-1.5 sm:gap-2 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3.5 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              panelClassName="absolute left-1/2 -translate-x-1/2 mt-2 w-56 max-w-[calc(100vw-1rem)] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-100 dark:border-zinc-800 p-2 z-20 animate-fade-in"
              trigger={
                <>
                  <MascotAvatar avatar={activeChild?.avatar || '🌟'} alt="" className="h-7 w-7 text-lg sm:h-8 sm:w-8 sm:text-xl" />
                  <span className="font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200 max-w-[65px] sm:max-w-[130px] truncate">
                    {activeChild?.name}
                  </span>
                  <span className="hidden md:inline-flex items-center text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                    ⭐ {activeChild?.points || 0}
                  </span>
                  <ChevronDown aria-hidden="true" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </>
              }
            >
              {profiles.map((p) => (
                <DropdownMenuItem key={p.id} selected={p.id === activeChildId} onSelect={() => setActiveChildId(p.id)}>
                  <MascotAvatar avatar={p.avatar} alt="" className="h-10 w-10 shrink-0 text-2xl" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <span>⭐ {p.points}</span>
                      <span aria-hidden="true">•</span>
                      <span>{t.levelPrefix} {p.level}</span>
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenu>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href={docsUrl} aria-label={chromeCopy.docs} title={chromeCopy.docs} className="hidden min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800 lg:flex 2xl:px-3"><BookOpen aria-hidden="true" className="h-4 w-4" /><span className="hidden whitespace-nowrap 2xl:inline">{chromeCopy.docs}</span></Link>
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
            <DropdownMenu
              rootClassName="relative hidden xl:block"
              menuLabel={t.language}
              triggerLabel={currentLang.label}
              triggerClassName="min-h-11 min-w-11 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              panelClassName="absolute right-0 mt-2 w-48 max-w-[calc(100vw-1rem)] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-100 dark:border-zinc-800 p-1.5 z-20 animate-fade-in max-h-80 overflow-y-auto"
              trigger={
                <>
                  <span aria-hidden="true">{currentLang.flag}</span>
                  <Globe aria-hidden="true" className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
                </>
              }
            >
              {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => (
                <DropdownMenuItem key={lang.code} selected={lang.code === language} onSelect={() => setLanguage(lang.code)} className="text-sm">
                  <span aria-hidden="true" className="text-base">{lang.flag}</span>
                  <span>{lang.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenu>

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
                <GoogleMark className="w-3.5 h-3.5" />
                <span className="hidden whitespace-nowrap 2xl:inline">{t.googleLogin}</span>
              </button>
            )}

            {/* Pro Subscription Badge / Upgrade Button */}
            {!isCaregiver && mode === 'parent' && <button
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
            {!isCaregiver && hasDashboardAccess && (!currentUser || mode === 'kid') && (
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
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {t.moreMenu}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-label={t.close}
                        className="-mr-2 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:text-white"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div role="group" aria-labelledby={`${menuId}-account`}>
                      <p id={`${menuId}-account`} className={MENU_GROUP_HEADING}>{chromeCopy.menuAccount}</p>
                      {currentUser ? (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2 pl-3 dark:bg-zinc-800/80">
                          <div className="flex min-w-0 items-center gap-2">
                            {currentUser.user_metadata?.avatar_url ? (
                              <Image
                                src={currentUser.user_metadata.avatar_url}
                                alt={chromeCopy.avatarAlt}
                                width={24}
                                height={24}
                                unoptimized
                                className="w-6 h-6 rounded-full shrink-0"
                              />
                            ) : (
                              <UserIcon aria-hidden="true" className="w-4 h-4 text-indigo-600 shrink-0" />
                            )}
                            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {currentUser.user_metadata?.full_name || currentUser.email}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              logout();
                              setIsMobileMenuOpen(false);
                            }}
                            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-300 dark:hover:bg-rose-950/40"
                            title={t.logout}
                            aria-label={t.logout}
                          >
                            <LogOut className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            loginWithGoogle();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
                        >
                          <GoogleMark className="w-4 h-4 shrink-0" />
                          <span>{t.googleLogin}</span>
                        </button>
                      )}
                    </div>

                    <div role="group" aria-labelledby={`${menuId}-quick`} className="space-y-3 border-t border-slate-100 pt-3 dark:border-zinc-800">
                      <p id={`${menuId}-quick`} className={MENU_GROUP_HEADING}>{chromeCopy.menuQuickSettings}</p>
                      <div role="group" aria-labelledby={`${menuId}-language`}>
                        <p id={`${menuId}-language`} className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                          {t.language} ({currentLang.label})
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => (
                            <button
                              key={lang.code}
                              type="button"
                              title={lang.label}
                              aria-pressed={lang.code === language}
                              onClick={() => {
                                setLanguage(lang.code);
                              }}
                              className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-xl px-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                lang.code === language
                                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-700'
                              }`}
                            >
                              <span>{lang.flag}</span>
                              <span className="font-semibold">{lang.code.toUpperCase()}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <ThemeSelector />

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFontModalOpen(true);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`${MENU_ROW} justify-center bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-700`}
                        >
                          <Type className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
                          <span>Aa {t.fontSizeLabel}</span>
                        </button>

                        <button
                          type="button"
                          onClick={toggleSound}
                          className={`${MENU_ROW} justify-center bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-700`}
                        >
                          {soundEnabled ? (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
                              <span>{t.soundOn}</span>
                            </>
                          ) : (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                              <span>{t.soundOff}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <Link
                      href={docsUrl}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`${MENU_ROW} justify-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70`}
                    >
                      <BookOpen className="h-4 w-4" aria-hidden="true" />
                      {chromeCopy.userGuide}
                    </Link>

                    <MenuDisclosure label={chromeCopy.menuMore}>
                      {!isCaregiver && mode === 'parent' && (
                        <button
                          type="button"
                          onClick={openPricingModal}
                          className={`${MENU_ROW} bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70`}
                        >
                          <Crown className="h-4 w-4" aria-hidden="true" />
                          {t.pricingModalTitle}
                        </button>
                      )}

                      {!hasDashboardAccess && (
                        <button
                          type="button"
                          onClick={() => {
                            openConnectModal();
                            setIsMobileMenuOpen(false);
                          }}
                          className={`${MENU_ROW} bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-950/80`}
                        >
                          <Smartphone className="w-4 h-4" aria-hidden="true" />
                          <span>{copy.childConnect}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsPortraitModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`${MENU_ROW} bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70`}
                      >
                        <BookOpen className="w-4 h-4" aria-hidden="true" />
                        <span>{copy.portraitGuide}</span>
                      </button>

                      {!isCaregiver && isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => {
                            openOnboarding();
                            setIsMobileMenuOpen(false);
                          }}
                          className={`${MENU_ROW} bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-950/70`}
                        >
                          <UserPlus className="w-4 h-4" aria-hidden="true" />
                          <span>{parentProfile ? copy.parentProfile : copy.familySetup}</span>
                        </button>
                      )}

                      {mode === 'parent' && (
                        <Link
                          href={marketingHomeUrl}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`${MENU_ROW} bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-950/80`}
                        >
                          <House className="w-4 h-4" aria-hidden="true" />
                          <span>{homeLabel}</span>
                        </Link>
                      )}

                      {hasDashboardAccess && (
                        <p className="flex min-h-11 items-center gap-2 px-3 text-sm text-slate-600 dark:text-slate-300">
                          <Database className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
                          <span>{cloudSyncActive ? t.storageCloudConnected : t.cloudStorageMode}</span>
                        </p>
                      )}
                    </MenuDisclosure>
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

function GoogleMark({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
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
  );
}

function MenuDisclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  return (
    <div className="border-t border-slate-100 pt-2 dark:border-zinc-800">
      <button
        type="button"
        data-testid="more-menu-more"
        aria-expanded={open}
        aria-controls={open ? contentId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-zinc-800"
      >
        <span>{label}</span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div id={contentId} className="mt-1 space-y-1.5">{children}</div>}
    </div>
  );
}

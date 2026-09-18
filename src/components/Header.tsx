'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Globe,
  Database,
  ChevronDown,
  Check,
  Type,
  LogIn,
  LogOut,
  User as UserIcon,
  Crown,
  MoreVertical,
  X,
  BookOpen,
  UserPlus,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation, SUPPORTED_LANGUAGES, LanguageOption } from '@/lib/i18n/context';
import { sounds } from '@/lib/sound';
import { PinModal } from './PinModal';
import { FontSettingsModal } from './FontSettingsModal';

interface HeaderProps {
  onToggleLanding?: () => void;
  isLanding?: boolean;
}

export function Header({ onToggleLanding, isLanding }: HeaderProps = {}) {
  const {
    mode,
    setMode,
    isParentUnlocked,
    unlockParent,
    lockParent,
    profiles,
    activeChildId,
    setActiveChildId,
    activeChild,
    cloudSyncActive,
    storageMode,
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
  } = useAppStore();

  const { language, setLanguage, t } = useTranslation();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800 transition-colors">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Left: Logo & Slogan */}
          <div
            onClick={onToggleLanding ? onToggleLanding : undefined}
            className={`flex items-center gap-2 sm:gap-3 shrink-0 ${onToggleLanding ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
            title={t.appName}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-slate-800 dark:text-slate-100 text-base sm:text-lg tracking-tight block leading-tight">
                {t.appName}
              </span>
              <span className="text-[11px] text-slate-400 font-medium block">
                {t.appSlogan}
              </span>
            </div>
          </div>

          {/* Center: Multi-Child Profile Switcher (Only in Dashboard mode) */}
          {!isLanding && profiles.length > 0 && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3.5 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span className="text-lg sm:text-xl leading-none">{activeChild?.avatar || '🌟'}</span>
                <span className="font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200 max-w-[65px] sm:max-w-[130px] truncate">
                  {activeChild?.name}
                </span>
                <span className="hidden md:inline-flex items-center text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                  ⭐ {activeChild?.points || 0}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)} />
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-100 dark:border-zinc-800 p-2 z-20 animate-fade-in">
                    <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
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
                          <span className="text-2xl">{p.avatar}</span>
                          <div>
                            <div className="text-sm font-medium truncate">{p.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
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
            {/* Desktop Only: Storage Status */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                storageMode === 'cloud' && cloudSyncActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                  : storageMode === 'cloud'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                  : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-900 dark:text-slate-400 dark:border-zinc-800'
              }`}
              title={storageMode === 'cloud' ? (cloudSyncActive ? t.storageCloudConnected : 'Cloud') : t.storageLocalPrivate}
            >
              <Database className="w-3 h-3" />
              <span>{storageMode === 'cloud' ? (cloudSyncActive ? t.storageCloudConnected : 'Cloud') : t.storageLocalPrivate}</span>
            </div>

            {/* Desktop Only: Font Customization (xl:flex) */}
            <button
              onClick={() => setIsFontModalOpen(true)}
              className="hidden lg:flex min-w-[38px] min-h-[38px] p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all items-center justify-center gap-1 text-xs font-bold cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title={t.fontSettingsTitle}
            >
              <Type className="w-4 h-4" />
              <span className="text-[11px]">Aa</span>
            </button>

            {/* Desktop Only: Sound Toggle (xl:flex) */}
            <button
              onClick={toggleSound}
              className="hidden lg:flex min-w-[38px] min-h-[38px] p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all items-center justify-center cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title={soundEnabled ? t.soundOn : t.soundOff}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Desktop Only: Language Switcher Dropdown (xl:block) */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
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
              className="hidden xl:flex min-h-[38px] items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 transition-all shadow-xs cursor-pointer active:scale-95"
              title="16 Chân Dung & 7 Bố Thí"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Cẩm nang 16 Chân Dung</span>
            </button>

            {/* Desktop Only: Landing Page Switcher (xl:flex) */}
            {onToggleLanding && (
              <button
                type="button"
                onClick={onToggleLanding}
                className={`hidden xl:flex min-h-[38px] items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isLanding
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
                }`}
                title={isLanding ? t.landingBackToApp : t.landingCtaParentGuide}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isLanding ? t.landingBackToApp : t.landingCtaParentGuide}</span>
              </button>
            )}

            {/* Google Account */}
            {currentUser ? (
              <div className="hidden lg:flex min-h-[38px] items-center gap-1.5 py-1 px-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {currentUser.user_metadata?.avatar_url ? (
                  <img
                    src={currentUser.user_metadata.avatar_url}
                    alt="Google avatar"
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span className="hidden xl:inline max-w-[80px] truncate text-[11px]">
                  {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                </span>
                <button
                  onClick={logout}
                  title={t.logout}
                  className="p-1 hover:text-rose-600 transition-colors cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="hidden lg:flex min-h-[38px] items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold bg-white dark:bg-zinc-900 hover:bg-slate-50 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-200 transition-all shadow-xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
                <span>{t.googleLogin}</span>
              </button>
            )}

            {/* Pro Subscription Badge / Upgrade Button */}
            <button
              type="button"
              onClick={openPricingModal}
              className={`min-h-[38px] sm:min-h-[40px] flex items-center gap-1 sm:gap-1.5 py-1 px-2.5 sm:px-3 rounded-full text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0 ${
                isPro
                  ? subscriptionPlan === 'trial'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-200 dark:shadow-none animate-pulse'
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
            </button>

            {/* Mode Switcher (Parent Mode) */}
            <button
              onClick={handleParentModeClick}
              className={`min-h-[38px] sm:min-h-[40px] flex items-center gap-1 sm:gap-1.5 py-1 px-2.5 sm:px-3 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0 ${
                mode === 'parent'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {mode === 'parent' ? (
                <>
                  <Unlock className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">{t.parentMode}</span>
                  <span className="sm:hidden whitespace-nowrap text-[11px]">{t.parentShort}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">{t.parentMode}</span>
                  <span className="sm:hidden whitespace-nowrap text-[11px]">{t.parentShort}</span>
                </>
              )}
            </button>

            {/* Mobile / Tablet Menu Button (xl:hidden) */}
            <div className="relative xl:hidden shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="min-w-[38px] min-h-[38px] p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 border border-slate-200/80 dark:border-zinc-800"
                aria-label={t.moreMenu}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Mobile More Menu Floating Sheet */}
              {isMobileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-3 z-50 animate-fade-in space-y-3">
                    {/* Header in Mobile Menu */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t.moreMenu}
                      </span>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Google Auth Row */}
                    <div>
                      {currentUser ? (
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {currentUser.user_metadata?.avatar_url ? (
                              <img
                                src={currentUser.user_metadata.avatar_url}
                                alt="avatar"
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
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0"
                            title={t.logout}
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
                      <div className="text-[11px] font-bold text-slate-400 mb-1.5">
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
                            <span className="text-[10px] font-semibold">{lang.code.toUpperCase()}</span>
                          </button>
                        ))}
                      </div>
                    </div>

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
                      <button
                        onClick={() => {
                          setIsPortraitModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cẩm nang 16 Chân Dung &amp; 7 Bố Thí</span>
                      </button>

                      <button
                        onClick={() => {
                          openOnboarding();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center justify-center gap-2 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-purple-600" />
                        <span>{parentProfile ? 'Hồ sơ Thân giáo Ba Mẹ' : 'Đăng ký Con &amp; Phụ huynh'}</span>
                      </button>
                    </div>

                    {/* Landing Page Guide Switcher if available */}
                    {onToggleLanding && (
                      <button
                        onClick={() => {
                          onToggleLanding();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isLanding ? t.landingBackToApp : t.landingCtaParentGuide}</span>
                      </button>
                    )}

                    {/* Storage Mode Notice */}
                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3 text-indigo-500" />
                        <span>{storageMode === 'cloud' ? (cloudSyncActive ? t.storageCloudConnected : 'Cloud') : t.storageLocalPrivate}</span>
                      </span>
                    </div>
                  </div>
                </>
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
        verifyPin={unlockParent}
      />

      {/* Font & Size Settings Modal */}
      <FontSettingsModal
        isOpen={isFontModalOpen}
        onClose={() => setIsFontModalOpen(false)}
      />
    </>
  );
}

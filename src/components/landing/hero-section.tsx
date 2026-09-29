import { ArrowRight, CheckCircle2, ChevronRight, Gift, Sparkles } from 'lucide-react';
import { MascotAvatar } from '@/components/MascotAvatar';
import { useTranslation } from '@/lib/i18n/context';
import { getLandingUiCopy } from '@/lib/i18n/landing-ui-copy';
import { getLandingSalesCopy } from '@/lib/i18n/landing-sales-copy';

interface LandingActionsProps {
  onStartDemo: () => void;
  onLoginGoogle: () => void;
  isLoggedIn?: boolean;
}

export function HeroSection({ onStartDemo, onLoginGoogle, isLoggedIn, openConnectModal }: LandingActionsProps & { openConnectModal: () => void }) {
  const { t, language } = useTranslation();
  const uiCopy = getLandingUiCopy(language);
  const salesCopy = getLandingSalesCopy(language);
  return (
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* Ambient background glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 sm:w-[500px] h-72 sm:h-[350px] bg-gradient-to-tr from-amber-300/20 via-indigo-400/20 to-pink-400/20 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-bold shadow-xs animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>{t.landingHeroBadge}</span>
          </div>

          {/* Main Headline */}
          <h1 className={`font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] text-slate-900 dark:text-white ${language === 'ko' ? 'break-keep' : '[word-break:auto-phrase]'}`}>
            {t.landingHeroTitle.split('–')[0]}
            {t.landingHeroTitle.includes('–') && (
              <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 bg-clip-text text-transparent">
                – {t.landingHeroTitle.split('–')[1]}
              </span>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto pt-1 font-medium">
            {t.landingHeroDesc}
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-3 sm:flex-row">
            <button
              type="button"
              data-testid="landing-primary-action"
              onClick={onStartDemo}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-base font-extrabold text-white shadow-lg transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto"
            >
              <span>{isLoggedIn ? t.landingBackToApp : t.landingCtaDemo}</span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
            {!isLoggedIn && (
              <button
                type="button"
                onClick={onLoginGoogle}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-indigo-200 bg-white px-6 py-3 text-base font-bold text-indigo-700 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:w-auto dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-200 dark:hover:bg-zinc-800"
              >
                {t.landingCtaGoogle}
              </button>
            )}
          </div>

          {!isLoggedIn && (
            <details className="group mx-auto max-w-lg pt-1 text-center">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-semibold text-slate-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 [&::-webkit-details-marker]:hidden">
                {uiCopy.otherWays}
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
              </summary>
              <div className="flex flex-col items-stretch justify-center gap-2 pt-2 sm:flex-row sm:flex-wrap">
                <button type="button" onClick={openConnectModal} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100" title={uiCopy.childCodeTitle}>
                  {uiCopy.childCodeButton}
                </button>
              </div>
            </details>
          )}

        </div>

        <div aria-hidden="true" className="relative mx-auto mt-8 flex h-52 max-w-md items-end justify-center overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-100 via-white to-indigo-100 dark:from-amber-950/40 dark:via-zinc-900 dark:to-indigo-950/50 sm:mt-10 sm:h-60">
          <div className="absolute bottom-3 h-11 w-64 rounded-full bg-indigo-300/30 blur-xl dark:bg-indigo-400/20" />
          <MascotAvatar avatar="mascot:bunny" alt="" className="relative z-10 mb-3 h-24 w-24 -rotate-6 sm:h-28 sm:w-28" />
          <MascotAvatar avatar="mascot:leo" alt="" priority sizes="(max-width: 640px) 144px, 176px" className="relative z-20 mb-2 h-36 w-36 sm:h-44 sm:w-44" />
          <MascotAvatar avatar="mascot:panda" alt="" className="relative z-10 mb-3 h-24 w-24 rotate-6 sm:h-28 sm:w-28" />
          <span className="absolute left-6 top-5 text-2xl text-amber-500">★</span>
          <span className="absolute right-7 top-7 text-xl text-indigo-500">✦</span>
        </div>
        {!isLoggedIn && (
          <p className="mx-auto mt-3 max-w-md text-center text-sm font-medium text-slate-700 dark:text-slate-200">{t.landingTrustedBy}</p>
        )}

        <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-xl shadow-indigo-100/70 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-none sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">{salesCopy.previewLabel}</p>
              <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white sm:text-xl">{salesCopy.previewTitle}</h2>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900 dark:bg-amber-950 dark:text-amber-200">45 ⭐</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-2">
              {salesCopy.previewTasks.map((task, index) => (
                <div key={task} className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                  <CheckCircle2 className={`h-5 w-5 shrink-0 ${index === 0 ? 'text-emerald-600' : 'text-indigo-500'}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-sm font-bold text-slate-800 dark:text-slate-100">{task}</span>
                  <span className="text-xs font-black text-amber-700 dark:text-amber-300">+{index === 0 ? 10 : 20}</span>
                </div>
              ))}
            </div>
            <div className="flex min-h-24 flex-col justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white">
              <Gift className="h-6 w-6 text-amber-300" aria-hidden="true" />
              <p className="mt-2 text-sm font-extrabold leading-5">{salesCopy.previewReward}</p>
            </div>
          </div>
        </div>
      </section>


  );
}

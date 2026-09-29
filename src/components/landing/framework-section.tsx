import { useState } from 'react';
import { ChevronRight, Clock, Compass, Sparkles, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getLandingUiCopy } from '@/lib/i18n/landing-ui-copy';
import { FRAMEWORK_PILLARS } from './framework-data';
export function FrameworkSection() {
  const { t, language } = useTranslation();
  const uiCopy = getLandingUiCopy(language);
  const [activePillarIndex, setActivePillarIndex] = useState(0);
  return (
      <section className="px-4 py-8 sm:px-6 sm:py-12 max-w-6xl mx-auto">
        <details className="group rounded-3xl border border-indigo-100 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">{t.landingFrameworkBadge}</p>
              <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white sm:text-xl">{t.landingFrameworkTitle}</h2>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{t.landingFrameworkSubtitle}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-indigo-600 transition-transform group-open:rotate-90" />
          </summary>
          <div className="pt-6 sm:pt-8">
        <div className="text-center space-y-3 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>{t.landingFrameworkBadge}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.landingFrameworkTitle}
          </h2>
          <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t.landingFrameworkSubtitle}
          </p>

          {/* Convenience highlight card */}
          <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-300/40 dark:border-zinc-700 max-w-3xl mx-auto text-left flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              ⚡
            </div>
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {t.landingConvenienceHighlight}
            </div>
          </div>
        </div>

        {/* 8 Pillars Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 sm:pb-4 scrollbar-none sm:justify-center">
          {FRAMEWORK_PILLARS.map((pillar, idx) => {
            const isActive = activePillarIndex === idx;
            const pTitle = pillar.badge[language as keyof typeof pillar.badge] || pillar.badge.en || pillar.badge.vi;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActivePillarIndex(idx)}
                className={`shrink-0 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-102 border-transparent'
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700'
                }`}
              >
                <span className="text-base">{pillar.icon}</span>
                <span>{pTitle.split('&')[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Active Pillar Showcase Detail Card */}
        {(() => {
          const currentPillar = FRAMEWORK_PILLARS[activePillarIndex];
          const cBadge = currentPillar.badge[language as keyof typeof currentPillar.badge] || currentPillar.badge.en || currentPillar.badge.vi;
          const cTitle = currentPillar.title[language as keyof typeof currentPillar.title] || currentPillar.title.en || currentPillar.title.vi;
          const cMeaning = currentPillar.meaning[language as keyof typeof currentPillar.meaning] || currentPillar.meaning.en || currentPillar.meaning.vi;

          return (
            <div className="mt-5 bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-9 border border-slate-200/80 dark:border-zinc-800 shadow-xl space-y-6 animate-fade-in transition-all">
              {/* Pillar Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-indigo-50 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-3xl shadow-sm shrink-0">
                    {currentPillar.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${currentPillar.badgeBg}`}>
                        {cBadge}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{uiCopy.pillar(activePillarIndex + 1)}</span>
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {cTitle}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-zinc-800/80 px-3.5 py-2 rounded-xl border border-slate-100 dark:border-zinc-700/60 self-start md:self-auto">
                  <span className="text-amber-500 font-black text-sm">✓</span>
                  <span>{uiCopy.oneTap}</span>
                </div>
              </div>

              {/* Core Meaning & Pedagogical Value */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{uiCopy.meaning}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {cMeaning}
                </p>
              </div>

              {/* Concrete Examples Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>{t.habitTemplates}</span>
                  </div>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                    {uiCopy.habitCount(currentPillar.examples.length)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {currentPillar.examples.map((item, exIdx) => {
                    const exTitle = item.title[language as keyof typeof item.title] || item.title.en || item.title.vi;
                    const exDesc = item.desc[language as keyof typeof item.desc] || item.desc.en || item.desc.vi;
                    const timeTag =
                      item.timeOfDay === 'morning'
                        ? t.morning
                        : item.timeOfDay === 'afternoon'
                        ? t.afternoon
                        : item.timeOfDay === 'evening'
                        ? t.evening
                        : t.anytime;

                    return (
                      <div
                        key={exIdx}
                        className="bg-slate-50/60 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-800 p-4 rounded-2xl border border-slate-100 dark:border-zinc-700/60 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-xl shadow-xs">
                              {item.icon}
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                              <span>+{item.points}</span>
                              <span>⭐</span>
                            </span>
                          </div>

                          <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-snug">
                            {exTitle}
                          </h4>
                          <p className="text-xs sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {exDesc}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/50 dark:border-zinc-700/50 flex items-center justify-between text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{timeTag}</span>
                          </span>
                          {item.duration ? (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-700 font-bold text-xs text-slate-600 dark:text-slate-300">
                              ⏱️ {item.duration}p
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
          </div>
        </details>
      </section>


  );
}

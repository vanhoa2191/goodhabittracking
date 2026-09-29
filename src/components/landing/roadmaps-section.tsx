import { useState } from 'react';
import { ArrowRight, ChevronRight, Flame } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { WEEKLY_JOURNEY_PLANS, MONTHLY_JOURNEY_PLANS } from '@/lib/constants';
import { getJourneyHabitText } from '@/lib/i18n/journey-content';
import { getJourneyPeriodLabel, journeyCopy } from '@/lib/i18n/journey-copy';
import { getLandingUiCopy } from '@/lib/i18n/landing-ui-copy';
export function RoadmapsSection({ onStartDemo, isLoggedIn }: { onStartDemo: () => void; isLoggedIn?: boolean }) {
  const { t, language } = useTranslation();
  const uiCopy = getLandingUiCopy(language);
  const roadmapCopy = journeyCopy[language];
  const [roadmapType, setRoadmapType] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('week-1');
  return (
      <section className="px-4 py-8 sm:px-6 sm:py-12 bg-slate-50/70 dark:bg-zinc-900/50 border-y border-slate-200/80 dark:border-zinc-800">
        <details className="group mx-auto max-w-6xl rounded-3xl border border-emerald-100 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t.landingRoadmapsBadge}</p>
              <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white sm:text-xl">{t.landingRoadmapsTitle}</h2>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{t.landingRoadmapsSubtitle}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-emerald-600 transition-transform group-open:rotate-90" />
          </summary>
          <div className="pt-6 sm:pt-8">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-xs">
              <Flame className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.landingRoadmapsBadge}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.landingRoadmapsTitle}
            </h2>
            <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t.landingRoadmapsSubtitle}
            </p>

            {/* Roadmaps Tab Switcher */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-zinc-800 border border-slate-300/60 dark:border-zinc-700 mt-2">
              <button
                type="button"
                onClick={() => {
                  setRoadmapType('weekly');
                  setSelectedPlanId('week-1');
                }}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  roadmapType === 'weekly'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t.landingTab4Weeks}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoadmapType('monthly');
                  setSelectedPlanId('month-1');
                }}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  roadmapType === 'monthly'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t.landingTabMonthly}
              </button>
            </div>
          </div>

          {/* Roadmaps Content */}
          {roadmapType === 'weekly' ? (
            <div className="space-y-6">
              {/* 4-Week Progress Timeline Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {WEEKLY_JOURNEY_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const pTitle = plan.title[language as keyof typeof plan.title] || plan.title.en || plan.title.vi || '';
                  const pDesc = plan.description[language as keyof typeof plan.description] || plan.description.en || plan.description.vi || '';

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`text-left p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-white dark:bg-zinc-800 border-indigo-500 shadow-lg ring-2 ring-indigo-500/20'
                          : 'bg-white/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 hover:bg-white dark:hover:bg-zinc-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{plan.icon}</span>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-black text-slate-950"
                            style={{ backgroundColor: plan.themeColor }}
                          >
                          {getJourneyPeriodLabel(language, plan.type, plan.id)}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight [word-break:auto-phrase]">
                          {pTitle.replace(/^.*?[：:]\s*/, '')}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {pDesc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-700/50 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">{roadmapCopy.habitsPerDay(plan.habits.length)}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                          <span>{roadmapCopy.details}</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Week Detailed Habits List */}
              {(() => {
                const currentPlan =
                  WEEKLY_JOURNEY_PLANS.find((p) => p.id === selectedPlanId) || WEEKLY_JOURNEY_PLANS[0];
                const pTitle = currentPlan.title[language as keyof typeof currentPlan.title] || currentPlan.title.en || currentPlan.title.vi || '';
                const pDesc = currentPlan.description[language as keyof typeof currentPlan.description] || currentPlan.description.en || currentPlan.description.vi || '';

                return (
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-slate-950 text-xs font-black"
                            style={{ backgroundColor: currentPlan.themeColor }}
                          >
                            {getJourneyPeriodLabel(language, currentPlan.type, currentPlan.id)}
                          </span>
                          <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white [word-break:auto-phrase]">
                            {pTitle}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {pDesc}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={onStartDemo}
                        className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <span>{isLoggedIn ? t.landingBackToApp : t.landingApplyRoadmapBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {currentPlan.habits.map((habit, hIdx) => {
                        const localizedHabit = getJourneyHabitText(currentPlan, hIdx, language);
                        const timeTag =
                          habit.timeOfDay === 'morning'
                            ? t.morning
                            : habit.timeOfDay === 'afternoon'
                            ? t.afternoon
                            : habit.timeOfDay === 'evening'
                            ? t.evening
                            : t.anytime;

                        return (
                          <div
                            key={hIdx}
                            className="p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60 space-y-2.5 flex flex-col justify-between"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-2xl">{habit.icon}</span>
                                <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                                  +{habit.points} ⭐
                                </span>
                              </div>
                              <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-snug">
                                {localizedHabit.title}
                              </h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {localizedHabit.description}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-200/50 dark:border-zinc-700/40 flex items-center justify-between text-xs text-slate-400 font-semibold">
                              <span>⏱️ {timeTag}</span>
                              {habit.durationMinutes ? (
                                <span>{roadmapCopy.minutes(habit.durationMinutes)}</span>
                              ) : (
                                <span>{timeTag}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Monthly Thematic Roadmap View */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MONTHLY_JOURNEY_PLANS.map((plan) => {
                const pTitle = plan.title[language as keyof typeof plan.title] || plan.title.en || plan.title.vi || '';
                const pDesc = plan.description[language as keyof typeof plan.description] || plan.description.en || plan.description.vi || '';

                return (
                  <div
                    key={plan.id}
                    className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-md space-y-5 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-2xl shadow-xs">
                          {plan.icon}
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-black text-slate-950"
                          style={{ backgroundColor: plan.themeColor }}
                        >
                          {getJourneyPeriodLabel(language, plan.type, plan.id)}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white [word-break:auto-phrase]">
                          {pTitle}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {pDesc}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {roadmapCopy.focusTasks}
                        </div>
                        {plan.habits.slice(0, 4).map((h, hIdx) => {
                          const localizedHabit = getJourneyHabitText(plan, hIdx, language);
                          return (
                          <div
                            key={hIdx}
                            className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span>{h.icon}</span>
                              <span className="font-semibold truncate text-slate-700 dark:text-slate-200">
                                {localizedHabit.title}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-amber-600 shrink-0">
                              +{h.points}⭐
                            </span>
                          </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onStartDemo}
                      className="w-full py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{isLoggedIn ? t.landingBackToApp : uiCopy.exploreJourney}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Roadmap Convenience Callout Tip */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/5 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="leading-relaxed">
              <span className="font-extrabold mr-1">{uiCopy.noPlanning}</span>
              {t.landingRoadmapConvenienceTip}
            </div>
          </div>
        </div>
          </div>
        </details>
      </section>


  );
}

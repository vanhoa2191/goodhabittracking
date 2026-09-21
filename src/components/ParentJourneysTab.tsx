'use client';

import React, { useCallback, useState } from 'react';
import { Check, CheckCheck, Compass, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { MONTHLY_JOURNEY_PLANS, WEEKLY_JOURNEY_PLANS } from '@/lib/constants';
import type { HabitActivity, JourneyPlan } from '@/types';
import { ModalShell } from '@/components/ui/ModalShell';
import { getJourneyPeriodLabel, journeyCopy } from '@/lib/i18n/journey-copy';
import { getJourneyHabitText } from '@/lib/i18n/journey-content';
import { getActivityMutationError } from '@/lib/i18n/activity-mutation-copy';

export function ParentJourneysTab({ onApplied }: { onApplied: () => void }) {
  const { profiles, createActivities } = useAppStore();
  const { t, language } = useTranslation();
  const copy = journeyCopy[language];
  const [journeyType, setJourneyType] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedPlan, setSelectedPlan] = useState<JourneyPlan | null>(null);
  const [targetChildId, setTargetChildId] = useState('');
  const [appliedNotice, setAppliedNotice] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const closeModal = useCallback(() => setSelectedPlan(null), []);

  const plans = journeyType === 'weekly' ? WEEKLY_JOURNEY_PLANS : MONTHLY_JOURNEY_PLANS;

  const applyPlan = async () => {
    if (!selectedPlan) return;
    setMutationError('');
    setIsApplying(true);
    const activities: Omit<HabitActivity, 'id' | 'createdAt'>[] = selectedPlan.habits.map((habit, habitIndex) => {
      const localizedHabit = getJourneyHabitText(selectedPlan, habitIndex, language);
      return {
        title: localizedHabit.title,
        description: localizedHabit.description,
        icon: habit.icon,
        category: habit.category,
        points: habit.points,
        recurrenceType: 'daily',
        recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: habit.timeOfDay,
        durationMinutes: habit.durationMinutes || 0,
        requiresApproval: Boolean(habit.requiresApproval),
        childId: targetChildId || null,
        isActive: true,
      };
    });
    const saved = await createActivities(activities);
    if (!saved) {
      setMutationError(getActivityMutationError(language));
      setIsApplying(false);
      return;
    }
    setIsApplying(false);
    setAppliedNotice(t.appliedSuccess);
    window.setTimeout(() => {
      setAppliedNotice('');
      setSelectedPlan(null);
      onApplied();
    }, 1500);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2"><Compass className="w-5 h-5 text-indigo-600" />{t.journeys}</h3>
            <p className="text-xs text-slate-400">{copy.description}</p>
          </div>
          <div className="flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-2xl">
            <button onClick={() => setJourneyType('weekly')} className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${journeyType === 'weekly' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{t.weeklyRoadmap}</button>
            <button onClick={() => setJourneyType('monthly')} className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${journeyType === 'monthly' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{t.monthlyRoadmap}</button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 font-medium">💡 {t.customNotice}</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-5 hover:border-indigo-200 transition-colors">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 shadow-xs">{plan.icon}</span>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">{getJourneyPeriodLabel(language, plan.type, plan.id)}</span>
                    <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mt-1 [word-break:auto-phrase]">{plan.title[language] || plan.title.en || plan.title.vi}</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{plan.description[language] || plan.description.en || plan.description.vi}</p>
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{copy.includesHabits(plan.habits.length)}</span>
                  {plan.habits.map((habit, index) => {
                    const localizedHabit = getJourneyHabitText(plan, index, language);
                    return (
                    <div key={index} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 text-xs">
                      <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200 truncate"><span>{habit.icon}</span><span className="truncate">{localizedHabit.title}</span></span>
                      <span className="text-amber-500 font-extrabold shrink-0 ml-2">+{habit.points} ⭐</span>
                    </div>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => { setSelectedPlan(plan); setTargetChildId(profiles[0]?.id || ''); }} className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"><CheckCheck className="w-4 h-4" />{t.applyJourney}</button>
            </div>
          ))}
        </div>
      </div>

      {selectedPlan && (
        <ModalShell isOpen onClose={closeModal} label={t.applyJourney}>
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                <span className="text-2xl sm:text-3xl p-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 shrink-0">{selectedPlan.icon}</span>
                <div className="min-w-0 flex-1"><span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full inline-block">{getJourneyPeriodLabel(language, selectedPlan.type, selectedPlan.id)}</span><h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 mt-0.5 truncate leading-tight [word-break:auto-phrase]">{selectedPlan.title[language] || selectedPlan.title.en || selectedPlan.title.vi}</h3></div>
              </div>
              <button type="button" onClick={closeModal} className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0" aria-label={t.close}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
              <p className="text-xs text-slate-500 leading-relaxed">{copy.applyQuestion(selectedPlan.habits.length)}</p>
              <div>
                <label htmlFor="journey-target-child" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{copy.applyTo}</label>
                <select id="journey-target-child" value={targetChildId} onChange={(event) => setTargetChildId(event.target.value)} className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold">
                  <option value="">{t.allChildren}</option>
                  {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} ({profile.avatar})</option>)}
                </select>
              </div>
              {appliedNotice && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold animate-bounce text-center">✓ {appliedNotice}</div>}
              {mutationError && <div role="alert" className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 text-xs font-bold text-center">{mutationError}</div>}
            </div>
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 flex items-center justify-end gap-2.5 pb-safe">
              <button type="button" onClick={closeModal} className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">{t.cancel}</button>
              <button type="button" onClick={() => void applyPlan()} disabled={isApplying} aria-busy={isApplying} className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 disabled:cursor-wait disabled:opacity-60"><Check className="w-4 h-4" />{copy.confirmApply}</button>
            </div>
        </ModalShell>
      )}
    </>
  );
}

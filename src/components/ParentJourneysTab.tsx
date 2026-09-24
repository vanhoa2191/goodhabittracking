'use client';

import React, { useCallback, useState } from 'react';
import { Check, Compass, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { MONTHLY_JOURNEY_PLANS, WEEKLY_JOURNEY_PLANS } from '@/lib/constants';
import type { HabitActivity, JourneyPlan } from '@/types';
import { ModalShell } from '@/components/ui/ModalShell';
import { getJourneyPeriodLabel, journeyCopy } from '@/lib/i18n/journey-copy';
import { getJourneyHabitText } from '@/lib/i18n/journey-content';
import { getActivityMutationError } from '@/lib/i18n/activity-mutation-copy';
import { getMascotLabel } from '@/lib/mascots';
import { journeyMapCopy } from '@/lib/i18n/journey-map-copy';
import { getCurrentJourneyIndex, getJourneyHabitKey, getJourneyStageProgress, getMissingJourneyAssignments } from '@/lib/journey-progress';
import { ParentJourneyStage } from './ParentJourneyStage';

export function ParentJourneysTab({ onApplied }: { onApplied: () => void }) {
  const { profiles, activities, logs, createActivities } = useAppStore();
  const { t, language } = useTranslation();
  const copy = journeyCopy[language];
  const mapCopy = journeyMapCopy[language];
  const [journeyType, setJourneyType] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<JourneyPlan | null>(null);
  const [targetChildId, setTargetChildId] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const closeModal = useCallback(() => setSelectedPlan(null), []);

  const plans = journeyType === 'weekly' ? WEEKLY_JOURNEY_PLANS : MONTHLY_JOURNEY_PLANS;
  const childId = profiles.some((profile) => profile.id === selectedChildId)
    ? selectedChildId : profiles[0]?.id || '';
  const progress = childId
    ? plans.map((plan) => getJourneyStageProgress(plan, childId, activities, logs))
    : plans.map((plan) => ({ assignedCount: 0, practicedCount: 0, totalCount: plan.habits.length, complete: false }));
  const currentIndex = getCurrentJourneyIndex(progress);
  const currentPlan = plans[currentIndex];
  const nextPlan = plans[currentIndex + 1];
  const pendingAssignments = selectedPlan
    ? getMissingJourneyAssignments(selectedPlan, targetChildId || null, profiles.map((profile) => profile.id), activities)
    : [];

  const applyPlan = async () => {
    if (!selectedPlan || isApplying || pendingAssignments.length === 0) return;
    setMutationError('');
    setIsApplying(true);
    const newActivities: Omit<HabitActivity, 'id' | 'createdAt'>[] = pendingAssignments.map(({ habitIndex, childId: assignmentChildId }) => {
      const habit = selectedPlan.habits[habitIndex];
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
        childId: assignmentChildId,
        isActive: true,
        journeyHabitKey: getJourneyHabitKey(selectedPlan, habitIndex),
      };
    });
    const saved = await createActivities(newActivities);
    if (!saved) {
      setMutationError(getActivityMutationError(language));
      setIsApplying(false);
      return;
    }
    setIsApplying(false);
    setSelectedPlan(null);
    onApplied();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-sand-900 dark:text-slate-100"><Compass className="size-5 text-indigo-600" />{t.journeys}</h3>
            <p className="mt-1 text-sm text-sand-700 dark:text-slate-300">{copy.description}</p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-2xl bg-sand-100 p-1 dark:bg-zinc-900" role="group" aria-label={t.journeys}>
            <button type="button" onClick={() => setJourneyType('weekly')} aria-pressed={journeyType === 'weekly'} className={`min-h-11 rounded-xl px-4 text-sm font-bold ${journeyType === 'weekly' ? 'bg-white text-indigo-700 shadow-sm dark:bg-zinc-800 dark:text-indigo-300' : 'text-sand-700 hover:text-sand-900 dark:text-slate-300'}`}>{t.weeklyRoadmap}</button>
            <button type="button" onClick={() => setJourneyType('monthly')} aria-pressed={journeyType === 'monthly'} className={`min-h-11 rounded-xl px-4 text-sm font-bold ${journeyType === 'monthly' ? 'bg-white text-indigo-700 shadow-sm dark:bg-zinc-800 dark:text-indigo-300' : 'text-sand-700 hover:text-sand-900 dark:text-slate-300'}`}>{t.monthlyRoadmap}</button>
          </div>
        </div>

        {profiles.length > 0 ? (
          <div className="space-y-2">
            <label htmlFor="journey-map-child" className="block text-sm font-bold text-sand-900 dark:text-slate-100">{mapCopy.selectChild}</label>
            <select id="journey-map-child" value={childId} onChange={(event) => setSelectedChildId(event.target.value)} className="min-h-11 w-full rounded-xl border border-sand-200 bg-white px-3 text-sm font-semibold text-sand-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100 sm:max-w-sm">
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} ({getMascotLabel(profile.avatar)})</option>)}
            </select>
          </div>
        ) : <p className="rounded-2xl border border-sand-200 bg-white p-4 text-sm text-sand-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-300">{mapCopy.noChild}</p>}

        {currentPlan && childId && (
          <div className="grid gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40 sm:grid-cols-2 sm:p-5">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">{progress.every((stage) => stage.complete) ? mapCopy.allDone : mapCopy.current}</p>
              <p className="text-base font-bold text-sand-900 dark:text-slate-100">{currentPlan.title[language] || currentPlan.title.en || currentPlan.title.vi}</p>
              <p className="text-sm text-sand-700 dark:text-slate-300">{mapCopy.practiced(progress[currentIndex].practicedCount, progress[currentIndex].totalCount)}</p>
            </div>
            {nextPlan && <div className="min-w-0 space-y-1 sm:border-l sm:border-indigo-200 sm:pl-5 dark:sm:border-indigo-900">
              <p className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">{mapCopy.next}</p>
              <p className="text-base font-bold text-sand-900 dark:text-slate-100">{nextPlan.title[language] || nextPlan.title.en || nextPlan.title.vi}</p>
            </div>}
          </div>
        )}

        <ol className="space-y-0">
          {plans.map((plan, index) => {
            const stage = progress[index];
            return <ParentJourneyStage key={plan.id} plan={plan} index={index} language={language} progress={stage} current={index === currentIndex} next={index === currentIndex + 1} canApply={Boolean(childId) && stage.assignedCount < stage.totalCount} applyLabel={stage.assignedCount === stage.totalCount ? mapCopy.alreadyApplied : stage.assignedCount ? mapCopy.applyRemaining(stage.totalCount - stage.assignedCount) : t.applyJourney} onApply={(chosen) => { setSelectedPlan(chosen); setTargetChildId(childId); setMutationError(''); }} />;
          })}
        </ol>
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
              <p className="text-sm leading-relaxed text-sand-700 dark:text-slate-300">{pendingAssignments.length ? copy.applyQuestion(new Set(pendingAssignments.map(({ habitIndex }) => habitIndex)).size) : mapCopy.alreadyApplied}</p>
              <div>
                <label htmlFor="journey-target-child" className="mb-1.5 block text-sm font-bold text-sand-900 dark:text-slate-100">{copy.applyTo}</label>
                <select id="journey-target-child" value={targetChildId} onChange={(event) => setTargetChildId(event.target.value)} className="min-h-11 w-full rounded-xl border border-sand-200 bg-white px-3 text-sm font-semibold text-sand-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100">
                  <option value="">{t.allChildren}</option>
                  {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} ({getMascotLabel(profile.avatar)})</option>)}
                </select>
              </div>
              {mutationError && <div role="alert" className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 text-xs font-bold text-center">{mutationError}</div>}
            </div>
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 flex items-center justify-end gap-2.5 pb-safe">
              <button type="button" onClick={closeModal} className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">{t.cancel}</button>
              <button type="button" onClick={() => void applyPlan()} disabled={isApplying || pendingAssignments.length === 0} aria-busy={isApplying} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"><Check className="w-4 h-4" />{copy.confirmApply}</button>
            </div>
        </ModalShell>
      )}
    </>
  );
}

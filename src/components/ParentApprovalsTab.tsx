'use client';

import React from 'react';
import { Check, CheckCircle2, Gift } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { parentApprovalsCopy } from '@/lib/i18n/parent-approvals-copy';
import { MascotAvatar } from './MascotAvatar';
import { ParentReminderBanner } from './ParentReminderBanner';
import { defaultExperienceFlags } from '@/lib/experience-flags';

export function ParentApprovalsTab() {
  const {
    profiles,
    activities,
    logs,
    approveLog,
    rejectLog,
    rewards,
    redemptions,
    experience,
    deliverRedemption,
    rejectRedemption,
  } = useAppStore();
  const { t, language } = useTranslation();
  const copy = parentApprovalsCopy[language];
  const pendingLogs = logs.filter((log) => log.status === 'pending_approval');
  const pendingRedemptions = redemptions.filter((redemption) => redemption.status === 'pending');
  const pendingCount = pendingLogs.length + pendingRedemptions.length;
  const familyPaused = Boolean(experience.settings?.paused_at);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {defaultExperienceFlags.parentReengagement && <ParentReminderBanner pendingCount={pendingCount} familyPaused={familyPaused} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {profiles.map((profile) => {
          const doneCount = logs.filter(
            (log) => log.childId === profile.id
              && log.date === today
              && (log.status === 'completed' || log.status === 'approved')
          ).length;

          return (
            <div key={profile.id} className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800 shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <MascotAvatar avatar={profile.avatar} alt="" className="h-12 w-12 text-3xl" />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{profile.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>⭐ {profile.points} {copy.stars}</span><span>•</span><span className="text-amber-500 font-bold">🔥 {profile.streak} {copy.days}</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                <strong className="text-slate-800 dark:text-slate-200">{copy.todayDone(doneCount)}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          {copy.pendingTasks} ({pendingLogs.length})
        </h3>
        {pendingLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic">{copy.noPendingTasks}</p>
        ) : (
          <div className="space-y-3">
            {pendingLogs.map((log) => {
              const activity = activities.find((item) => item.id === log.activityId);
              const child = profiles.find((profile) => profile.id === log.childId);
              return (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{activity?.icon || '✨'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{activity?.title}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{child?.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{copy.rewardCompleted(activity?.points ?? 0, new Intl.DateTimeFormat(language).format(new Date(`${log.date}T00:00:00`)))}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button onClick={() => rejectLog(log.id)} className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors">{t.reject}</button>
                    <button onClick={() => approveLog(log.id)} className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"><Check className="w-3.5 h-3.5" />{t.approve}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-600" />
          {copy.pendingRewards} ({pendingRedemptions.length})
        </h3>
        {pendingRedemptions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">{copy.noPendingRewards}</p>
        ) : (
          <div className="space-y-3">
            {pendingRedemptions.map((redemption) => {
              const reward = rewards.find((item) => item.id === redemption.rewardId);
              const child = profiles.find((profile) => profile.id === redemption.childId);
              return (
                <div key={redemption.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{reward?.icon || '🎁'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{reward?.title}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">{child?.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{copy.redemptionRequested(redemption.pointsSpent, new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(new Date(redemption.requestedAt)))}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button onClick={() => rejectRedemption(redemption.id)} className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors">{t.reject}</button>
                    <button onClick={() => deliverRedemption(redemption.id)} className="py-1.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"><Gift className="w-3.5 h-3.5" />{t.delivered}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

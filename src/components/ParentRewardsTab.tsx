'use client';

import React, { useCallback, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import type { Reward } from '@/types';
import { ModalShell } from '@/components/ui/ModalShell';
import { getParentSecondaryCopy } from '@/lib/i18n/parent-secondary-copy';
import { localizeDemoReward } from '@/lib/i18n/demo-content-copy';
import { getRewardMutationCopy } from '@/lib/i18n/reward-mutation-copy';
import { RewardTemplateLibrary } from './RewardTemplateLibrary';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { HelpTip } from '@/components/help/HelpTip';

const EMPTY_REWARD = {
  title: '',
  description: '',
  icon: '🎁',
  costPoints: 50,
  stock: -1,
};

export function ParentRewardsTab() {
  const { rewards, createReward, updateReward, deleteReward } = useAppStore();
  const { t, language } = useTranslation();
  const copy = getParentSecondaryCopy(language);
  const mutationCopy = getRewardMutationCopy(language);
  const { confirm, dialog } = useConfirm();
  const localizedRewards = rewards.map((reward) => localizeDemoReward(reward, language));
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardForm, setRewardForm] = useState(EMPTY_REWARD);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const closeModal = useCallback(() => {
    if (!isSaving) setIsModalOpen(false);
  }, [isSaving]);

  const openRewardModal = (reward?: Reward) => {
    setMutationError('');
    setEditingReward(reward || null);
    setRewardForm(reward ? {
      title: reward.title,
      description: reward.description || '',
      icon: reward.icon,
      costPoints: reward.costPoints,
      stock: reward.stock,
    } : EMPTY_REWARD);
    setIsModalOpen(true);
  };

  const saveReward = async () => {
    if (!rewardForm.title.trim()) return;
    setIsSaving(true);
    setMutationError('');
    const saved = editingReward
      ? await updateReward(editingReward.id, rewardForm)
      : await createReward({ ...rewardForm, isActive: true });
    setIsSaving(false);
    if (!saved) {
      setMutationError(mutationCopy.saveError);
      return;
    }
    setIsModalOpen(false);
  };

  const handleDeleteReward = async (reward: Reward) => {
    if (!await confirm({ message: mutationCopy.deleteConfirm(reward.title), confirmLabel: t.delete, destructive: true })) return;
    setMutationError('');
    const deleted = await deleteReward(reward.id);
    if (!deleted) setMutationError(mutationCopy.deleteError);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-1"><h3 className="font-black text-lg text-slate-800 dark:text-slate-100">{t.yourRewards} ({localizedRewards.length})</h3><HelpTip topic="rewards.manage" /></div>
            <p className="text-xs text-slate-400">{copy.rewardsIntro}</p>
          </div>
          <button onClick={() => openRewardModal()} className="flex min-h-11 items-center gap-2 rounded-2xl bg-amber-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-colors transition-transform hover:bg-amber-800 active:scale-95">
            <Plus className="w-4 h-4" />
            {t.createRewardTitle}
          </button>
        </div>

        {mutationError && !isModalOpen && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {mutationError}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {localizedRewards.map((reward) => (
            <div key={reward.id} className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-4xl p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/80">{reward.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm sm:text-base leading-snug text-slate-800 dark:text-slate-100 line-clamp-2">{reward.title}</h4>
                  {reward.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{reward.description}</p>}
                  <div className="mt-2 text-xs font-black text-amber-500">{reward.costPoints} ⭐</div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50 dark:border-zinc-800/80">
                <button onClick={() => openRewardModal(reward)} aria-label={`${t.edit} ${reward.title}`} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-indigo-600 dark:hover:bg-zinc-800"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => void handleDeleteReward(reward)} aria-label={`${t.delete} ${reward.title}`} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-zinc-800"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        {language === 'vi' && (
          <details className="group rounded-3xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 sm:p-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-extrabold text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-amber-200 [&::-webkit-details-marker]:hidden">
              <span>Khám phá thư viện quà tặng ý nghĩa</span>
              <span aria-hidden="true" className="text-xl transition-transform group-open:rotate-45">＋</span>
            </summary>
            <div className="pt-4"><RewardTemplateLibrary onMutationError={setMutationError} /></div>
          </details>
        )}
      </div>

      <ModalShell isOpen={isModalOpen} onClose={closeModal} label={editingReward ? t.editRewardTitle : t.createRewardTitle} maxWidth="sm">
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2"><span>🎁</span><span>{editingReward ? t.editRewardTitle : t.createRewardTitle}</span></h3>
              <button type="button" onClick={closeModal} disabled={isSaving} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-wait disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-slate-200" aria-label={t.close}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
              <div>
                <label htmlFor="reward-title" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{copy.rewardNameLabel}</label>
                <div className="flex gap-2">
                  <input aria-label={t.avatar} type="text" value={rewardForm.icon} onChange={(event) => setRewardForm({ ...rewardForm, icon: event.target.value })} className="w-12 text-center text-xl py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800" />
                  <input id="reward-title" type="text" placeholder={copy.rewardNamePlaceholder} value={rewardForm.title} onChange={(event) => setRewardForm({ ...rewardForm, title: event.target.value })} className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-medium" />
                </div>
              </div>
              <div>
                <label htmlFor="reward-cost" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{t.rewardCost} ({copy.rewardCostUnit})</label>
                <input id="reward-cost" type="number" min={5} value={rewardForm.costPoints} onChange={(event) => setRewardForm({ ...rewardForm, costPoints: Number(event.target.value) })} className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-bold text-amber-600" />
              </div>
              <div>
                <label htmlFor="reward-description" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{copy.rewardDescriptionLabel}</label>
                <input id="reward-description" type="text" placeholder={copy.rewardDescriptionPlaceholder} value={rewardForm.description} onChange={(event) => setRewardForm({ ...rewardForm, description: event.target.value })} className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs" />
              </div>
            </div>
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 space-y-3 pb-safe">
              {mutationError && <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">{mutationError}</p>}
              <div className="flex items-center justify-end gap-2.5">
              <button type="button" onClick={closeModal} disabled={isSaving} className="min-h-11 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-wait disabled:opacity-50 dark:hover:bg-zinc-800">{t.cancel}</button>
              <button type="button" onClick={() => void saveReward()} disabled={isSaving} aria-busy={isSaving} className="min-h-11 rounded-xl bg-amber-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-colors transition-transform hover:bg-amber-800 active:scale-95 disabled:cursor-wait disabled:opacity-60">{isSaving ? mutationCopy.saving : t.save}</button>
              </div>
            </div>
      </ModalShell>
      {dialog}
    </>
  );
}

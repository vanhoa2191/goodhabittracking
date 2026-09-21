'use client';

import { useCallback, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { GroupTeam } from '@/types';
import { useTranslation } from '@/lib/i18n/context';
import { getSocialMutationCopy } from '@/lib/i18n/social-mutation-copy';
import { ModalShell } from '@/components/ui/ModalShell';

type NewGroup = Omit<GroupTeam, 'id' | 'inviteCode' | 'createdAt'>;

type Props = {
  readonly activeChildId?: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreate: (group: NewGroup) => Promise<boolean>;
};

function rewardTypeFromValue(value: string): GroupTeam['rewardType'] {
  switch (value) {
    case 'badge': return 'badge';
    case 'stars': return 'stars';
    case 'mystery_box': return 'mystery_box';
    case 'custom': return 'custom';
    default: return 'badge';
  }
}

export function CreateGroupModal({ activeChildId, isOpen, onClose, onCreate }: Props) {
  const { t, language } = useTranslation();
  const copy = getSocialMutationCopy(language);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [targetPoints, setTargetPoints] = useState(300);
  const [rewardType, setRewardType] = useState<GroupTeam['rewardType']>('badge');
  const [customReward, setCustomReward] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const close = useCallback(() => {
    if (!isSaving) onClose();
  }, [isSaving, onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setError('');
    const saved = await onCreate({
      name: name.trim(),
      icon,
      createdByChildId: activeChildId,
      memberChildIds: activeChildId ? [activeChildId] : [],
      weeklyTargetPoints: targetPoints || 300,
      rewardType,
      customRewardText: customReward.trim() || undefined,
    });
    setIsSaving(false);
    if (!saved) {
      setError(copy.createError);
      return;
    }
    setName('');
    setCustomReward('');
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={close} label={t.createGroup}>
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400"><Plus className="w-4 h-4" /></span>{t.createGroup}</h3>
          <button type="button" onClick={close} disabled={isSaving} className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:cursor-wait disabled:opacity-50" aria-label={t.close}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={(event) => void submit(event)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
              <label htmlFor="group-name">{t.groupNameLabel} *</label>
              <div className="mt-1 flex gap-2"><input aria-label={t.avatar} value={icon} onChange={(event) => setIcon(event.target.value)} className="w-12 text-center text-xl py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800" /><input id="group-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.groupNamePlaceholder} required className="flex-1 min-w-0 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-medium" /></div>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300"><label htmlFor="group-target-points">{t.groupTargetPoints}</label><input id="group-target-points" type="number" min={50} step={50} value={targetPoints} onChange={(event) => setTargetPoints(Number(event.target.value))} className="mt-1 w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-bold text-amber-600" /></div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300"><label htmlFor="group-reward-type">{t.groupRewardLabel}</label><select id="group-reward-type" value={rewardType} onChange={(event) => setRewardType(rewardTypeFromValue(event.target.value))} className="mt-1 w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"><option value="badge">{t.rewardBadge}</option><option value="stars">{t.rewardStars}</option><option value="mystery_box">{t.rewardMystery}</option><option value="custom">{t.rewardCustom}</option></select></div>
            {rewardType === 'custom' && <div className="text-xs font-bold text-slate-600 dark:text-slate-300"><label htmlFor="group-custom-reward">{copy.customRewardLabel}</label><input id="group-custom-reward" value={customReward} onChange={(event) => setCustomReward(event.target.value)} placeholder={copy.customRewardPlaceholder} className="mt-1 w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs" /></div>}
          </div>
          <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 space-y-3 pb-safe">
            {error && <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
            <div className="flex items-center justify-end gap-2.5"><button type="button" onClick={close} disabled={isSaving} className="min-h-11 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:cursor-wait disabled:opacity-50">{t.cancel}</button><button type="submit" disabled={isSaving} aria-busy={isSaving} className="min-h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:cursor-wait disabled:opacity-60">{isSaving ? copy.creating : t.create}</button></div>
          </div>
        </form>
    </ModalShell>
  );
}

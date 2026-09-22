'use client';

import { useState } from 'react';
import { Check, Gift, HeartHandshake, Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getRewardMutationCopy } from '@/lib/i18n/reward-mutation-copy';
import { MEANINGFUL_REWARD_TEMPLATES, type RewardTemplateKind } from '@/lib/reward-templates';
import { useAppStore } from '@/lib/store';

type RewardTemplateLibraryProps = Readonly<{
  onMutationError: (message: string) => void;
}>;

const FILTERS: readonly { readonly id: 'all' | RewardTemplateKind; readonly label: string }[] = [
  { id: 'all', label: 'Tất cả gợi ý' },
  { id: 'experience', label: 'Quà phi vật chất' },
  { id: 'material', label: 'Quà vật chất' },
];

export function RewardTemplateLibrary({ onMutationError }: RewardTemplateLibraryProps) {
  const { rewards, createReward } = useAppStore();
  const { language } = useTranslation();
  const copy = getRewardMutationCopy(language);
  const [filter, setFilter] = useState<'all' | RewardTemplateKind>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const existingTitles = new Set(rewards.map((reward) => reward.title));
  const visibleTemplates = MEANINGFUL_REWARD_TEMPLATES.filter(
    (template) => filter === 'all' || template.kind === filter,
  );

  const addReward = async (templateId: string): Promise<void> => {
    const template = MEANINGFUL_REWARD_TEMPLATES.find((candidate) => candidate.id === templateId);
    if (!template) return;
    setPendingId(template.id);
    onMutationError('');
    const saved = await createReward({
      title: template.title,
      description: template.description,
      icon: template.icon,
      costPoints: template.costPoints,
      stock: -1,
      isActive: true,
    });
    setPendingId(null);
    if (!saved) onMutationError(copy.saveError);
  };

  return (
    <section aria-labelledby="reward-library-title" className="space-y-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-amber-100 p-2.5 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"><HeartHandshake className="h-5 w-5" /></span>
        <div className="space-y-1">
          <h4 id="reward-library-title" className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Gợi ý quà tặng ý nghĩa</h4>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">Ưu tiên thời gian bên nhau, trải nghiệm và quyền được lựa chọn. Quà vật chất nên hỗ trợ sở thích, vận động, học tập hoặc tinh thần cho đi.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Loại quà tặng">
        {FILTERS.map((item) => (
          <button key={item.id} type="button" onClick={() => setFilter(item.id)} aria-pressed={filter === item.id} className={`rounded-full border px-3 py-2 text-sm font-bold transition-colors ${filter === item.id ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' : 'border-slate-200 text-slate-600 hover:border-amber-300 dark:border-zinc-700 dark:text-slate-300'}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleTemplates.map((template) => {
          const isAdded = existingTitles.has(template.title);
          const Icon = template.kind === 'experience' ? HeartHandshake : Gift;
          return (
            <article key={template.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/60">
              <div className="flex items-start gap-3">
                <span className={`rounded-xl p-2 ${template.kind === 'experience' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{template.kind === 'experience' ? 'Phi vật chất' : 'Vật chất có mục đích'}</p>
                  <h5 className="text-base font-extrabold leading-snug text-slate-800 dark:text-slate-100">{template.title}</h5>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{template.description}</p>
                  <p className="text-sm font-black text-amber-700 dark:text-amber-300">Gợi ý {template.costPoints} sao</p>
                </div>
              </div>
              <button type="button" disabled={isAdded || pendingId === template.id} onClick={() => void addReward(template.id)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-emerald-100 disabled:text-emerald-800 dark:disabled:bg-emerald-950/60 dark:disabled:text-emerald-300">
                {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {isAdded ? 'Đã có trong kho quà' : pendingId === template.id ? 'Đang thêm…' : 'Thêm vào kho quà'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

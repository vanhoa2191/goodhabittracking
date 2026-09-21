'use client';

import { Clock, Hourglass, Star, X } from 'lucide-react';
import type { HabitActivity } from '@/types';
import { ModalShell } from '@/components/ui/ModalShell';
import { useTranslation } from '@/lib/i18n/context';

export function TaskDetailsModal({ activity, onClose }: { readonly activity: HabitActivity | null; readonly onClose: () => void }) {
  const { language, t } = useTranslation();
  if (!activity) return null;
  const vi = language === 'vi';
  return (
    <ModalShell isOpen label={language === 'vi' ? 'Chi tiết nhiệm vụ' : 'Task details'} onClose={onClose} maxWidth="md">
      <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-zinc-800">
        <div className="flex items-center gap-3"><span className="text-3xl">{activity.icon}</span><h2 className="text-lg font-black text-slate-900 dark:text-white">{activity.title}</h2></div>
        <button type="button" onClick={onClose} aria-label={t.close} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
      </div>
      <div className="space-y-5 overflow-y-auto p-5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        <section><h3 className="mb-1 font-extrabold text-slate-900 dark:text-white">{vi ? 'Ý nghĩa' : 'Why it matters'}</h3><p>{activity.description || (vi ? 'Thói quen nhỏ này giúp con tự lập và tiến bộ mỗi ngày.' : 'This small habit supports steady growth and independence.')}</p></section>
        {activity.instructions && <section><h3 className="mb-1 font-extrabold text-slate-900 dark:text-white">{vi ? 'Cách làm' : 'How to do it'}</h3><p className="whitespace-pre-wrap">{activity.instructions}</p></section>}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><Star className="h-4 w-4" />+{activity.points}</span>
          {activity.durationMinutes ? <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"><Clock className="h-4 w-4" />{activity.durationMinutes} {vi ? 'phút' : 'min'}</span> : null}
          {activity.requiresApproval && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 font-bold dark:bg-zinc-800"><Hourglass className="h-4 w-4" />{t.needApproval}</span>}
        </div>
      </div>
    </ModalShell>
  );
}

import { CheckCircle2, Sparkles } from 'lucide-react';
import type { getPortraitGuideCopy } from '@/lib/i18n/portrait-guide-copy';

type Props = {
  readonly checkedChecklist: readonly number[];
  readonly guide: ReturnType<typeof getPortraitGuideCopy>;
  readonly onToggleChecklist: (index: number) => void;
};

export function PortraitModelingPanel({ checkedChecklist, guide, onToggleChecklist }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 p-5 text-white shadow-md">
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider">{guide.ui.modelingTitle}</span>
        <h3 className="text-base font-black sm:text-lg">{guide.ui.modelingQuote}</h3>
        <p className="max-w-2xl text-xs leading-relaxed text-amber-100">{guide.ui.modelingIntro}</p>
      </div>

      <div className="space-y-3">
        <h4 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>{guide.ui.goldWordsTitle}</span>
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {guide.goldWords.map((item) => (
            <div key={item.word} className="space-y-1 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 dark:border-zinc-700/60 dark:bg-zinc-800/60">
              <span className="block text-sm font-black text-indigo-600 dark:text-indigo-400">✨ {item.word}</span>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{item.meaning}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3.5 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{guide.ui.checklistTitle}</h4>
              <span className="text-[11px] text-slate-400">{guide.ui.checklistSubtitle}</span>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-600 dark:bg-emerald-950/40">{guide.ui.checklistComplete(checkedChecklist.length)}</span>
        </div>
        <div className="space-y-2">
          {guide.checklist.map((question, index) => {
            const isChecked = checkedChecklist.includes(index);
            return (
              <label key={question} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-all ${isChecked ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-slate-200/80 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300'}`}>
                <input type="checkbox" checked={isChecked} onChange={() => onToggleChecklist(index)} className="mt-0.5 shrink-0 rounded text-emerald-600 focus:ring-emerald-500" />
                <span className="text-xs font-semibold leading-relaxed">{question}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

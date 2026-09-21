import type { getPortraitGuideCopy } from '@/lib/i18n/portrait-guide-copy';

type Props = {
  readonly guide: ReturnType<typeof getPortraitGuideCopy>;
};

export function PortraitGivingPanel({ guide }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5 rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-4 text-white shadow-md">
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider">{guide.ui.givingTitle}</span>
        <h3 className="text-base font-black sm:text-lg">{guide.ui.givingSubtitle}</h3>
        <p className="max-w-2xl text-xs leading-relaxed text-pink-100">{guide.ui.givingIntro}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {guide.givings.map((giving, index) => (
          <div key={giving.id} className="space-y-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-zinc-700 dark:bg-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-2xl dark:bg-pink-950/40">{giving.icon}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{giving.name}</h4>
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">{index + 1}/7</span>
                </div>
                <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">{giving.subName}</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="leading-relaxed text-slate-600 dark:text-slate-300"><strong>{guide.ui.givingMeaning}</strong> {giving.meaning}</div>
              <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 p-2.5 font-medium leading-relaxed text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">⭐ <strong>{guide.ui.givingPractice}</strong> {giving.dailyPractice}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

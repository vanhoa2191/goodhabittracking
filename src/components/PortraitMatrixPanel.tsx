import { Zap } from 'lucide-react';
import type { ChildProfile, AgeStage } from '@/types';
import { getStageInfo } from '@/lib/wit-framework';
import type { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import type { getPortraitGuideCopy } from '@/lib/i18n/portrait-guide-copy';

type Props = {
  readonly activeChild: ChildProfile | null;
  readonly guide: ReturnType<typeof getPortraitGuideCopy>;
  readonly onboarding: ReturnType<typeof getOnboardingCopy>;
  readonly selectedStage: AgeStage;
  readonly pending: boolean;
  readonly mutationError: string | null;
  readonly onStageChange: (stage: AgeStage) => void;
  readonly onApply: () => void;
};

const AGE_STAGES: readonly AgeStage[] = ['0-3', '3-6', '6-12', '12-18'];

export function PortraitMatrixPanel({
  activeChild,
  guide,
  onboarding,
  selectedStage,
  pending,
  mutationError,
  onStageChange,
  onApply,
}: Props) {
  const stageInfo = getStageInfo(selectedStage);
  const stageLabel = onboarding.stageLabels[selectedStage];
  const stageJourney = onboarding.stages[selectedStage];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
            {guide.ui.chooseAge}
          </span>
          {activeChild && (
            <span className="text-[11px] text-slate-400">
              {guide.ui.currentChild(activeChild.name, activeChild.age || 5)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AGE_STAGES.map((stage) => {
            const info = getStageInfo(stage);
            const journey = onboarding.stages[stage];
            const isSelected = selectedStage === stage;
            return (
              <button
                key={stage}
                aria-pressed={isSelected}
                onClick={() => onStageChange(stage)}
                className={`cursor-pointer rounded-2xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs dark:bg-indigo-950/40'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{info.icon}</span>
                  <div>
                    <span className="block text-xs font-black text-slate-800 dark:text-slate-100">
                      {onboarding.stageLabels[stage]}
                    </span>
                    <span className="block max-w-[110px] truncate text-[10px] text-slate-400">
                      {journey.title}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`space-y-2 rounded-3xl bg-gradient-to-r p-4 text-white shadow-md ${stageInfo.color}`}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider">
              {stageLabel} &bull; {stageJourney.title}
            </span>
            <h3 className="text-base font-black sm:text-lg">{stageJourney.subtitle}</h3>
            <p className="max-w-2xl text-xs leading-relaxed text-white/90">{stageJourney.summary}</p>
          </div>
          {activeChild && (
            <button
              onClick={onApply}
              disabled={pending}
              aria-busy={pending}
              className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-indigo-700 shadow-md transition-all hover:bg-amber-50 active:scale-95 disabled:cursor-wait disabled:opacity-60"
            >
              <Zap className="h-4 w-4 fill-current text-amber-500" />
              <span>{guide.ui.applyFor(activeChild.name.split(' ').pop() || activeChild.name)}</span>
            </button>
          )}
        </div>
      </div>

      {mutationError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {mutationError}
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {guide.ui.detailsTitle(stageLabel)}
        </h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {guide.portraits.map((item) => (
            <div key={item.id} className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all hover:border-indigo-300 dark:border-zinc-700/80 dark:bg-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-slate-50 p-1 text-2xl dark:bg-zinc-700">{item.icon}</span>
                <div>
                  <span className="block text-xs font-extrabold text-slate-800 sm:text-sm dark:text-slate-100">{item.name}</span>
                  <span className="block text-[10px] text-slate-400">{guide.ui.categories[item.category]}</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs font-medium leading-relaxed text-slate-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-slate-200">
                {item.actionsByStage[selectedStage]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

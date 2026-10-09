'use client';

import { useTranslation } from '@/lib/i18n/context';
import { getOnboardingWizardCopy } from '@/lib/i18n/onboarding-wizard-copy';
import {
  daysToReward,
  estimateDailyStars,
  type OnboardingRewardId,
  type RewardChoice,
  type WizardDraft,
} from '@/lib/onboarding/wizard';
import { MEANINGFUL_REWARD_TEMPLATES } from '@/lib/reward-templates';

type RewardsStepProps = {
  readonly draft: WizardDraft;
  readonly onChange: (draft: WizardDraft) => void;
};

const isValidCost = (cost: number) => Number.isInteger(cost) && cost > 0;

export function RewardsStep({ draft, onChange }: RewardsStepProps) {
  const { language } = useTranslation();
  const wizard = getOnboardingWizardCopy(language);
  const dailyStars = estimateDailyStars(draft);
  const selectedCosts = draft.rewards
    .filter((reward) => reward.selected && isValidCost(reward.costPoints))
    .map((reward) => reward.costPoints);
  const cheapest = selectedCosts.length > 0 ? Math.min(...selectedCosts) : null;
  const days = cheapest === null ? null : daysToReward(cheapest, dailyStars);

  const updateReward = (id: OnboardingRewardId, patch: Partial<RewardChoice>) => {
    onChange({
      ...draft,
      rewards: draft.rewards.map((reward) => (reward.id === id ? { ...reward, ...patch } : reward)),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{wizard.rewards.explain}</p>

      <ul className="space-y-2">
        {draft.rewards.map((reward) => {
          const rewardCopy = wizard.rewardTitles[reward.id];
          const icon = MEANINGFUL_REWARD_TEMPLATES.find((template) => template.id === reward.id)?.icon;
          const checkboxId = `onboarding-reward-${reward.id}`;
          const costId = `${checkboxId}-cost`;
          const costInvalid = reward.selected && !isValidCost(reward.costPoints);
          return (
            <li
              key={reward.id}
              className={`flex flex-col gap-2 rounded-2xl border p-3 sm:flex-row sm:items-center ${
                reward.selected
                  ? 'border-indigo-200 bg-white dark:border-indigo-900 dark:bg-zinc-800'
                  : 'border-slate-100 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800/60'
              }`}
            >
              <label htmlFor={checkboxId} className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-start gap-2">
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={reward.selected}
                  onChange={(e) => updateReward(reward.id, { selected: e.target.checked })}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-600"
                />
                {icon && <span className="text-base font-black text-indigo-600 dark:text-indigo-300" aria-hidden="true">{icon}</span>}
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{rewardCopy.title}</span>
                  <span className="block text-xs leading-relaxed text-slate-600 dark:text-slate-300">{rewardCopy.description}</span>
                </span>
              </label>
              <div className="shrink-0 sm:w-28">
                <label htmlFor={costId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {wizard.rewards.costLabel}
                </label>
                <input
                  id={costId}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={reward.costPoints === 0 ? '' : reward.costPoints}
                  disabled={!reward.selected}
                  onChange={(e) => updateReward(reward.id, { costPoints: e.target.value === '' ? 0 : Number(e.target.value) })}
                  aria-invalid={costInvalid ? true : undefined}
                  aria-describedby={costInvalid ? `${costId}-error` : undefined}
                  className="w-full min-h-11 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:opacity-50"
                />
                {costInvalid && <p id={`${costId}-error`} role="alert" className="mt-1 text-xs font-bold text-rose-700 dark:text-rose-300">{wizard.rewards.invalidCost}</p>}
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => onChange({ ...draft, rewards: draft.rewards.map((reward) => ({ ...reward, selected: false })) })}
        className="min-h-11 rounded-xl px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
      >
        {wizard.rewards.later}
      </button>

      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
        {cheapest !== null && days !== null && (
          <p className="font-bold text-slate-800 dark:text-slate-100">{wizard.rewards.estimate(dailyStars, cheapest, days)}</p>
        )}
        <p>{wizard.rewards.flow}</p>
      </div>
    </div>
  );
}

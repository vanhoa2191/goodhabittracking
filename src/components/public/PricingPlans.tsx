'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { buildPricingView, MAX_SAVING_PERCENT, type PricingCard } from '@/lib/billing/pricing-view';
import type { BillingCycle, PaidPlanId } from '@/lib/billing/plan-catalog';
import { PLAN_LOCALIZATION } from '@/lib/i18n/pricing-plan-copy';
import { getPublicPricingCopy } from '@/lib/i18n/public-pricing-copy';
import { formatCurrency } from '@/lib/i18n/formatters';
import { useTranslation } from '@/lib/i18n/context';
import { LaunchOfferStrip, ProPlusCard } from './UpcomingPlans';

const CYCLES: readonly BillingCycle[] = ['month', 'year'];

type PlanText = { readonly name: string; readonly desc: string; readonly period: string; readonly badge?: string; readonly cta: string };

interface PricingPlansProps {
  /** The action under a buyable card: a button in the app, a link on the public page. */
  readonly renderAction: (planId: PaidPlanId, text: PlanText) => ReactNode;
  readonly isCurrent?: (planId: PaidPlanId) => boolean;
}

/** Monthly or yearly for every plan, the launch offer, and three cards: one child, Pro, and the Pro Plus preview. */
export function PricingPlans({ renderAction, isCurrent }: PricingPlansProps) {
  const { language } = useTranslation();
  const copy = getPublicPricingCopy(language);
  const [cycle, setCycle] = useState<BillingCycle>('year');
  const radios = useRef<Record<BillingCycle, HTMLButtonElement | null>>({ month: null, year: null });
  const market = language === 'vi' ? 'VN' : 'UNAVAILABLE';
  const money = (value: number) => formatCurrency(value, language, market);
  const cards = buildPricingView(cycle);
  const labels: Record<BillingCycle, string> = { month: copy.cycleMonth, year: copy.cycleYear };

  const select = (next: BillingCycle) => {
    setCycle(next);
    radios.current[next]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (['ArrowRight', 'ArrowDown'].includes(event.key)) select(CYCLES[(CYCLES.indexOf(cycle) + 1) % CYCLES.length]);
    else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) select(CYCLES[(CYCLES.indexOf(cycle) + CYCLES.length - 1) % CYCLES.length]);
    else return;
    event.preventDefault();
  };

  const buyable = (card: PricingCard) => {
    const planId = card.planId as PaidPlanId;
    const text: PlanText = PLAN_LOCALIZATION[planId]?.[language] ?? PLAN_LOCALIZATION[planId].vi;
    const popular = card.tier === 'pro';
    const benefits = [card.tier === 'solo' ? copy.oneChild : copy.upToFive, copy.sync, copy.caregiverInvites, card.tier === 'solo' ? copy.library : copy.fullLibrary, ...(cycle === 'year' ? [copy.annualPayment] : [])];
    const yearly = buildPricingView('year').find((candidate) => candidate.tier === card.tier);
    return (
      <div key={card.tier} data-plan={planId} className={`relative flex flex-col justify-between rounded-3xl p-5 ${popular ? 'border-2 border-indigo-600 bg-white shadow-xl dark:bg-zinc-900' : 'border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900'}`}>
        <div className="space-y-3">
          {text.badge && <p className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">{text.badge}</p>}
          <h4 className="text-base font-black text-slate-800 dark:text-slate-100">{text.name}</h4>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-zinc-700/60 dark:bg-zinc-800/60">
            <p className="flex flex-wrap items-baseline gap-1.5"><strong className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">{money(card.price)}</strong><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{text.period}</span></p>
            {card.fullYearPrice !== null && card.saving !== null && <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300"><span className="line-through">{money(card.fullYearPrice)}</span> · <span className="font-bold text-emerald-700 dark:text-emerald-300">{copy.saveAmount.replace('[amount]', money(card.saving))} ({card.savingPercent}%)</span></p>}
            {card.perMonth !== null && <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">{copy.perMonthApprox.replace('[amount]', money(card.perMonth))}</p>}
            <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">{copy.perDayApprox.replace('[amount]', money(card.perDay))}</p>
          </div>
          {cycle === 'month' && yearly?.saving != null && (
            <button type="button" onClick={() => select('year')} className="text-left text-xs font-bold text-emerald-700 underline underline-offset-2 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-emerald-300">
              {copy.yearlyNudge.replace('[amount]', money(yearly.saving))}
            </button>
          )}
          <p className="text-sm font-medium leading-5 text-slate-700 dark:text-slate-200">{text.desc}</p>
          <ul className="space-y-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span className="leading-5">{benefit}</span></li>
            ))}
          </ul>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-zinc-800" data-current={isCurrent?.(planId) ? 'true' : undefined}>{renderAction(planId, text)}</div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label={copy.cycleLabel} onKeyDown={onKeyDown} className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
          {CYCLES.map((value) => (
            <button
              key={value}
              ref={(node) => { radios.current[value] = node; }}
              type="button"
              role="radio"
              aria-checked={cycle === value}
              tabIndex={cycle === value ? 0 : -1}
              onClick={() => setCycle(value)}
              className={`min-h-11 min-w-24 rounded-xl px-5 text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${cycle === value ? 'bg-indigo-600 text-white shadow' : 'text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-zinc-700'}`}
            >
              {labels[value]}
            </button>
          ))}
        </div>
        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{copy.saveUpTo.replace('[percent]', String(MAX_SAVING_PERCENT))}</p>
      </div>
      <LaunchOfferStrip />
      <div data-testid="paid-plan-grid" className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-3">
        {cards.map((card) => (card.purchasable ? buyable(card) : <ProPlusCard key={card.tier} card={card} cycle={cycle} />))}
      </div>
    </div>
  );
}

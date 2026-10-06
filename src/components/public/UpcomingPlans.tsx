'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Gift, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/formatters';
import { useTranslation } from '@/lib/i18n/context';
import { getUpcomingPlansCopy } from '@/lib/i18n/upcoming-plans-copy';
import { getPublicPricingCopy } from '@/lib/i18n/public-pricing-copy';
import type { BillingCycle } from '@/lib/billing/plan-catalog';
import type { PricingCard } from '@/lib/billing/pricing-view';

type OfferState = { readonly remaining: number | null };

/** The launch offer line. The count is the real one from the server; if it cannot be read the sentence shows no number. */
export function LaunchOfferStrip() {
  const { language } = useTranslation();
  const copy = getUpcomingPlansCopy(language);
  const [offer, setOffer] = useState<OfferState>({ remaining: null });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/offers/launch', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('offer unavailable'))))
      .then((data: { remaining?: unknown }) => {
        if (typeof data.remaining === 'number' && Number.isInteger(data.remaining) && data.remaining >= 0) setOffer({ remaining: data.remaining });
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const soldOut = offer.remaining === 0;
  return (
    <section data-testid="launch-offer" aria-label={copy.offerTitle} className="mx-auto flex w-full max-w-6xl items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
      <Gift aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
      <div className="space-y-1">
        <h3 className="font-black">{copy.offerTitle}</h3>
        {soldOut ? (
          <p data-testid="launch-offer-status" className="font-bold">{copy.offerSoldOut}</p>
        ) : (
          <>
            <p className="font-medium leading-5">{copy.offerBody}</p>
            {offer.remaining !== null && <p data-testid="launch-offer-status" className="font-black">{copy.offerRemaining(offer.remaining)}</p>}
          </>
        )}
      </div>
    </section>
  );
}

/** Pro Plus for the chosen cycle: its price and what it adds, and no way to buy it yet. */
export function ProPlusCard({ card, cycle }: { readonly card: PricingCard; readonly cycle: BillingCycle }) {
  const { language } = useTranslation();
  const copy = getUpcomingPlansCopy(language);
  const pricing = getPublicPricingCopy(language);
  const market = language === 'vi' ? 'VN' : 'UNAVAILABLE';
  const id = cycle === 'year' ? 'family_plus_yearly' : 'family_plus_monthly';
  const money = (value: number) => formatCurrency(value, language, market);
  return (
    <div data-testid="upcoming-plans" role="group" aria-label={copy.names[id]} data-plan={id} className="relative flex flex-col rounded-3xl border border-dashed border-indigo-300 bg-indigo-50/40 p-5 dark:border-indigo-800 dark:bg-indigo-950/20">
      <p className="flex items-center gap-1.5 text-sm font-extrabold text-indigo-700 dark:text-indigo-300"><Sparkles aria-hidden="true" className="h-4 w-4" />{copy.badge}</p>
      <h4 className="mt-2 text-base font-black text-slate-800 dark:text-slate-100">{copy.names[id]}</h4>
      <div className="mt-3 rounded-2xl bg-white p-3 dark:bg-zinc-900">
        <p className="flex flex-wrap items-baseline gap-2"><strong className="text-2xl font-black text-slate-900 dark:text-white">{money(card.price)}</strong><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{copy.periods[id]}</span><span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-black text-slate-700 dark:bg-zinc-700 dark:text-slate-100">{copy.priceSoon}</span></p>
        {card.fullYearPrice !== null && card.saving !== null && <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300"><span className="line-through">{money(card.fullYearPrice)}</span> · {pricing.saveAmount.replace('[amount]', money(card.saving))}</p>}
        {card.perMonth !== null && <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">{pricing.perMonthApprox.replace('[amount]', money(card.perMonth))}</p>}
        <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">{pricing.perDayApprox.replace('[amount]', money(card.perDay))}</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{copy.includes}</p>
      <ul className="mt-2 flex-1 space-y-2">
        {[copy.coachFeature, ...copy.features].map((feature) => (
          <li key={feature} className="flex gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />{feature}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-300">{copy.note}</p>
      <p className="mt-3 flex min-h-12 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 px-4 text-center text-sm font-black text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300">{copy.button}</p>
    </div>
  );
}

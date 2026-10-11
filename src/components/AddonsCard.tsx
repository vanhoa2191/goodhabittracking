'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { formatAddonPrice, getAddonsCopy } from '@/lib/i18n/addons-copy';
import { formatDate } from '@/lib/i18n/formatters';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { PAYMENT_SUCCESS_EVENT } from '@/lib/billing/payment-client';
import { ADDON_PRICES, addonVisible } from '@/lib/billing/addon-catalog';
import { PAID_PLAN_IDS, isPaidPlanId, planTier } from '@/lib/billing/plan-catalog';
import type { Language, SubscriptionPlan } from '@/types';

const addonsSchema = z.object({
  aiUntil: z.string().nullable(),
  aiIncluded: z.boolean(),
  printables: z.boolean(),
});
const entitlementSchema = z.object({
  success: z.literal(true),
  entitlement: z.object({
    plan: z.enum(['free', 'trial', ...PAID_PLAN_IDS, 'lifetime']),
    status: z.string(),
    subscription_ends_at: z.string().nullable().optional(),
  }),
  addons: addonsSchema,
});
type Entitlement = z.infer<typeof entitlementSchema>;

export interface AddonsCardViewProps {
  readonly language: Language;
  readonly plan: SubscriptionPlan;
  readonly status: string;
  readonly endsAt: string | null;
  readonly addons: z.infer<typeof addonsSchema>;
  readonly flags: { readonly printablesSale: boolean };
  readonly now: number;
}

/** Entitlement comes from the server, including founding access and purchased add-ons. */
export async function readAddonsEntitlement(requester: typeof fetch = fetch): Promise<Entitlement> {
  const response = await requester('/api/entitlement');
  if (!response.ok) throw new Error('Entitlement unavailable');
  return entitlementSchema.parse(await response.json());
}

export function AddonsCardView({ language, plan, status, endsAt, addons, flags, now }: AddonsCardViewProps) {
  const copy = getAddonsCopy(language);
  const money = (amount: number) => formatAddonPrice(amount, language);
  const activePlan = status === 'active' && (isPaidPlanId(plan) || plan === 'lifetime')
    && (endsAt === null || Date.parse(endsAt) > now);
  const included = addons.aiIncluded || (activePlan && isPaidPlanId(plan) && planTier(plan) === 'pro_plus');
  const activeAi = addons.aiUntil !== null && Date.parse(addons.aiUntil) > now;
  const actionClass = 'mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

  return (
    <section data-testid="addons-card" aria-label={copy.title} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h4 className="text-base font-black text-slate-900 dark:text-white">{copy.title}</h4>
      <div data-testid="ai-addon">
        <h5 className="font-bold text-slate-900 dark:text-white">{copy.aiName}</h5>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{copy.aiDescription}</p>
        {included ? <p role="status" className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">{copy.included}</p> : (
          <>
            {activeAi && <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{copy.activeUntil.replace('{date}', formatDate(addons.aiUntil!, language))}</p>}
            {activePlan ? (
              <Link href="/checkout?plan=ai_addon_monthly" className={actionClass}>{(activeAi ? copy.extend : copy.buyAi).replace('{price}', money(ADDON_PRICES.ai_addon_monthly))}</Link>
            ) : (
              <button type="button" disabled className="mt-3 min-h-11 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-500 disabled:cursor-not-allowed dark:bg-zinc-800 dark:text-slate-400">{copy.requiresPlan}</button>
            )}
          </>
        )}
      </div>
      {addonVisible('printables', flags) && (
        <div data-testid="printables-addon" className="border-t border-slate-100 pt-4 dark:border-zinc-800">
          <h5 className="font-bold text-slate-900 dark:text-white">{copy.printablesName}</h5>
          {addons.printables ? <p role="status" className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">{copy.owned}</p> : (
            <Link href="/checkout?plan=printables" className={actionClass}>{copy.buyPrintables.replace('{price}', money(ADDON_PRICES.printables))}</Link>
          )}
        </div>
      )}
    </section>
  );
}

export function AddonsCard() {
  const { currentUser, familyRole, subscriptionPlan, subscriptionEndsAt } = useAppStore();
  const { language } = useTranslation();
  const copy = getAddonsCopy(language);
  // Buying an add-on changes neither the plan nor its end date, so a paid checkout bumps this to refetch.
  const [paidCount, setPaidCount] = useState(0);
  const key = `${currentUser?.id ?? ''}:${subscriptionPlan}:${subscriptionEndsAt ?? ''}:${paidCount}`;
  const [result, setResult] = useState<{ key: string; data: Entitlement | null; now: number } | null>(null);

  useEffect(() => {
    const onPaid = () => setPaidCount((count) => count + 1);
    window.addEventListener(PAYMENT_SUCCESS_EVENT, onPaid);
    return () => window.removeEventListener(PAYMENT_SUCCESS_EVENT, onPaid);
  }, []);

  useEffect(() => {
    if (!currentUser || familyRole === 'caregiver') return;
    let current = true;
    void readAddonsEntitlement().then((data) => {
      if (current) setResult({ key, data, now: Date.now() });
    }).catch(() => {
      if (current) setResult({ key, data: null, now: Date.now() });
    });
    return () => { current = false; };
  }, [currentUser, familyRole, key]);

  if (!currentUser || familyRole === 'caregiver') return null;
  if (result?.key !== key || !result.data) return (
    <section data-testid="addons-card" aria-label={copy.title} className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h4 className="text-base font-black text-slate-900 dark:text-white">{copy.title}</h4>
      <p role={result?.key === key ? 'alert' : 'status'} className="mt-2 text-sm text-slate-700 dark:text-slate-300">{result?.key === key ? copy.loadError : copy.loading}</p>
    </section>
  );
  return <AddonsCardView language={language} plan={result.data.entitlement.plan} status={result.data.entitlement.status} endsAt={result.data.entitlement.subscription_ends_at ?? null} addons={result.data.addons} flags={defaultExperienceFlags} now={result.now} />;
}

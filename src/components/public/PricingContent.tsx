'use client';

import Link from 'next/link';
import { CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { PublicMarketingPage } from '@/components/PublicMarketingPage';
import { PRICING_PLANS } from '@/lib/payos';
import { formatCurrency } from '@/lib/i18n/formatters';
import { useTranslation } from '@/lib/i18n/context';
import { getPublicPricingCopy } from '@/lib/i18n/public-pricing-copy';

const paidPlans = PRICING_PLANS.filter((plan) => plan.price > 0);

export function PricingContent({ isVietnam }: { readonly isVietnam: boolean }) {
  const { language } = useTranslation();
  const copy = getPublicPricingCopy(language);
  const planText = { solo_monthly: { name: copy.soloName, badge: copy.soloBadge, description: copy.soloDescription, periodLabel: copy.month }, monthly: { name: copy.monthlyName, badge: copy.monthlyBadge, description: copy.monthlyDescription, periodLabel: copy.month }, yearly: { name: copy.yearlyName, badge: copy.yearlyBadge, description: copy.yearlyDescription, periodLabel: copy.year } };
  const publicBenefits: Record<string, readonly string[]> = {
    solo_monthly: [copy.oneChild, copy.sync, copy.library],
    monthly: [copy.unlimited, copy.sync, copy.fullLibrary],
    yearly: [copy.familyBenefits, copy.unlimited, copy.annualPayment],
  };
  return (
    <PublicMarketingPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {paidPlans.map((plan) => (
          <article key={plan.id} className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm dark:bg-zinc-900 ${plan.popular ? 'border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-950' : 'border-slate-200 dark:border-zinc-800'}`}>
            {plan.popular && <span className="absolute right-5 top-5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">{copy.popular}</span>}
            <p className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">{planText[plan.id as keyof typeof planText].badge}</p>
            <h2 className="mt-3 pr-20 text-2xl font-black">{planText[plan.id as keyof typeof planText].name}</h2>
            <p className="mt-5 flex items-end gap-2"><strong className="text-4xl font-black tracking-tight">{formatCurrency(plan.price, language, language === 'vi' ? 'VN' : 'UNAVAILABLE')}</strong><span className="pb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{planText[plan.id as keyof typeof planText].periodLabel}</span></p>
            {plan.originalPrice && <p className="mt-2 text-sm font-semibold text-slate-500"><span className="line-through">{formatCurrency(plan.originalPrice, language, language === 'vi' ? 'VN' : 'UNAVAILABLE')}</span> · {copy.savings}</p>}
            <p className="mt-4 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{planText[plan.id as keyof typeof planText].description}</p>
            <ul className="mt-5 flex-1 space-y-3">
              {(publicBenefits[plan.id] ?? []).map((benefit) => (
                <li key={benefit} className="flex gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />{benefit}</li>
              ))}
            </ul>
            <Link href={isVietnam ? '/?pricing=1' : '/?demo=1'} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-indigo-600 px-5 text-center text-sm font-black text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
              {isVietnam ? copy.choose : copy.demo}
            </Link>
          </article>
        ))}
      </div>

      <section className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
        <div className="flex gap-3"><ShieldCheck aria-hidden="true" className="h-7 w-7 shrink-0 text-emerald-600" /><div><h2 className="font-black">{copy.renewalTitle}</h2><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.renewal}</p></div></div>
        <div className="flex gap-3"><CreditCard aria-hidden="true" className="h-7 w-7 shrink-0 text-indigo-600" /><div><h2 className="font-black">{copy.paymentTitle}</h2><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.payment}</p></div></div>
      </section>
    </PublicMarketingPage>
  );
}

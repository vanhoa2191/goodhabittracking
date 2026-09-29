import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getLandingSalesCopy } from '@/lib/i18n/landing-sales-copy';
import { PRICING_PLANS } from '@/lib/payos';
import { BILLING_PERIOD_COPY, PRICING_SECTION_COPY } from '@/lib/i18n/landing-pricing-copy';

export function PricingSection({ expanded, openPricingModal }: { expanded: boolean; openPricingModal: () => void }) {
  const { language } = useTranslation();
  const pricingCopy = PRICING_SECTION_COPY[language];
  const salesCopy = getLandingSalesCopy(language);
  return (
expanded ? <section className="border-t border-indigo-100 bg-white px-4 py-14 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              {pricingCopy.trial}
            </span>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{pricingCopy.title}</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300 sm:text-base">{pricingCopy.description}</p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => {
              if (plan.id !== 'solo_monthly' && plan.id !== 'monthly' && plan.id !== 'yearly') return null;
              const localizedPlan = salesCopy.plans[plan.id];
              return (
              <article key={plan.id} className={`relative flex flex-col rounded-3xl border bg-white p-5 shadow-sm dark:bg-zinc-900 sm:p-6 ${plan.popular ? 'border-2 border-indigo-600 shadow-xl shadow-indigo-100 dark:shadow-none' : 'border-slate-200 dark:border-zinc-800'}`}>
                {localizedPlan.badge && (
                  <span className={`self-start rounded-full px-3 py-1 text-xs font-black ${plan.popular ? 'bg-indigo-600 text-white' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'}`}>
                    {localizedPlan.badge}
                  </span>
                )}
                <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{localizedPlan.name}</h3>
                <div className="mt-3 flex flex-wrap items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-950 dark:text-white">{plan.price.toLocaleString('vi-VN')}</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">VNĐ {plan.id === 'yearly' ? BILLING_PERIOD_COPY[language].year : BILLING_PERIOD_COPY[language].month}</span>
                </div>
                {plan.savings && <p className="mt-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">{plan.savings}</p>}
                <p className="mt-4 text-sm font-extrabold leading-6 text-slate-800 dark:text-slate-200">{localizedPlan.limit}</p>
                <ul className="mt-5 flex-1 space-y-3">
                  {(language === 'vi' ? plan.features.slice(0, 3) : salesCopy.assurances.slice(1)).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm font-medium leading-5 text-slate-700 dark:text-slate-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
              );
            })}
          </div>

          <div className="mt-7 text-center">
            <button type="button" onClick={openPricingModal} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
              {pricingCopy.action}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <div>
              <Link href="/pricing" className="mt-3 inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-zinc-900">
                {language === 'vi' ? 'Xem bảng giá đầy đủ' : 'View full pricing'}
              </Link>
            </div>
          </div>
        </div>
      </section> : (
        <section className="bg-indigo-950 px-4 py-12 text-white sm:px-6 sm:py-16">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">{pricingCopy.trial}</span>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{pricingCopy.title}</h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-indigo-100">{pricingCopy.description}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <button type="button" onClick={openPricingModal} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-indigo-800 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{pricingCopy.action}<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
              <Link href="/pricing" className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-bold text-indigo-100 hover:bg-white/10">{language === 'vi' ? 'So sánh đầy đủ 3 gói' : 'Compare all plans'}</Link>
            </div>
          </div>
        </section>
      )
  );
}

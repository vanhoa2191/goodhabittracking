'use client';

import Link from 'next/link';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { PublicMarketingPage } from '@/components/PublicMarketingPage';
import { PricingPlans } from './PricingPlans';
import { useTranslation } from '@/lib/i18n/context';
import { getPublicPricingCopy } from '@/lib/i18n/public-pricing-copy';

export function PricingContent({ isVietnam }: { readonly isVietnam: boolean }) {
  const { language } = useTranslation();
  const copy = getPublicPricingCopy(language);
  return (
    <PublicMarketingPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
    >
      <PricingPlans
        renderAction={() => (
          <Link href={isVietnam ? '/?pricing=1' : '/?demo=1'} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 text-center text-sm font-black text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
            {isVietnam ? copy.choose : copy.demo}
          </Link>
        )}
      />

      <section className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
        <div className="flex gap-3"><ShieldCheck aria-hidden="true" className="h-7 w-7 shrink-0 text-emerald-600" /><div><h2 className="font-black">{copy.renewalTitle}</h2><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.renewal}</p></div></div>
        <div className="flex gap-3"><CreditCard aria-hidden="true" className="h-7 w-7 shrink-0 text-indigo-600" /><div><h2 className="font-black">{copy.paymentTitle}</h2><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.payment}</p></div></div>
      </section>
    </PublicMarketingPage>
  );
}

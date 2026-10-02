'use client';

import Link from 'next/link';
import { Mail, ShieldAlert } from 'lucide-react';
import { PublicInfoPage } from '@/components/PublicInfoPage';
import { useTranslation } from '@/lib/i18n/context';
import { getPublicContactCopy } from '@/lib/i18n/public-contact-copy';

export function ContactContent({ approved, supportEmail }: { readonly approved: boolean; readonly supportEmail: string | null }) {
  const { language } = useTranslation();
  const copy = getPublicContactCopy(language);
  const subject = encodeURIComponent(copy.subject);
  return (
    <PublicInfoPage title={copy.title} description={copy.description} approved={approved}>
      <section><h2>{copy.beforeTitle}</h2><ul><li>{copy.docsAdvice.split(/(\[docs\])/g).map((part, index) => part === '[docs]' ? <Link key={index} href="/docs">{copy.docsLabel}</Link> : part)}</li><li>{copy.errorAdvice}</li><li>{copy.paymentAdvice}</li></ul></section>

      <section aria-labelledby="contact-channel"><h2 id="contact-channel">{copy.channelTitle}</h2>{supportEmail ? <a href={`mailto:${supportEmail}?subject=${subject}`} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold !text-white !no-underline hover:bg-indigo-700"><Mail aria-hidden="true" className="h-5 w-5" /> {copy.email} {supportEmail}</a> : <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">{copy.unconfigured}</p>}<p className="mt-3 text-sm">{copy.noForm}</p></section>

      <section><h2>{copy.neverTitle}</h2><p className="flex items-start gap-2"><ShieldAlert aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-rose-600" />{copy.never}</p></section>

      <section><h2>{copy.topicsTitle}</h2><ul><li>{copy.accountTopic}</li><li>{copy.paymentTopic}</li><li>{copy.dataTopic}</li><li>{copy.safetyTopic}</li></ul><p>{copy.response}</p></section>
    </PublicInfoPage>
  );
}

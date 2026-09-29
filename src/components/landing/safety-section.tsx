import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getLandingSalesCopy } from '@/lib/i18n/landing-sales-copy';

export function SafetySection({ expanded }: { expanded: boolean }) {
  const { language } = useTranslation();
  const salesCopy = getLandingSalesCopy(language);
  return (
expanded ? <section className="border-t border-slate-200 bg-slate-50 px-4 py-12 dark:border-zinc-800 dark:bg-zinc-900/60 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl bg-indigo-950 p-6 text-white sm:p-8">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black">{salesCopy.safetyTitle}</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-indigo-100">{salesCopy.safetyBody}</p>
            <Link href="/docs" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-indigo-800 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              {salesCopy.docs}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">{salesCopy.faqTitle}</h2>
            <div className="mt-4 space-y-3">
              {salesCopy.faq.map((item) => (
                <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-white [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <ChevronRight className="h-5 w-5 shrink-0 text-indigo-600 transition-transform group-open:rotate-90" aria-hidden="true" />
                  </summary>
                  <p className="pt-2 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section> : (
        <section className="border-t border-slate-200 bg-slate-50 px-4 py-8 dark:border-zinc-800 dark:bg-zinc-900/60 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-3xl bg-indigo-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="text-xl font-black sm:text-2xl">{salesCopy.safetyTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-indigo-100">{salesCopy.safetyBody}</p>
            </div>
            <Link href="/docs" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-indigo-800 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{salesCopy.docs}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          </div>
        </section>
      )
  );
}

import { CheckCircle2, Clock, Compass, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getLandingSalesCopy } from '@/lib/i18n/landing-sales-copy';
import { getPublishableProof } from '@/lib/public-proof';


export function AssurancesSection() {
  const { language } = useTranslation();
  const salesCopy = getLandingSalesCopy(language);
  return (
      <section aria-label={salesCopy.assurances.join(', ')} className="border-y border-indigo-100 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
        <ul className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-3">
          {salesCopy.assurances.map((item) => (
            <li key={item} className="flex min-h-11 items-center gap-2 rounded-2xl bg-indigo-50/70 px-4 py-3 text-sm font-bold text-slate-800 dark:bg-indigo-950/30 dark:text-slate-100">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>


  );
}


export function ProofSection() {
  const { t, language } = useTranslation();
  const salesCopy = getLandingSalesCopy(language);
  const proofCards = language === 'vi'
    ? getPublishableProof().filter((proof) => proof.kind === 'product').map((proof) => ({ icon: proof.icon, title: proof.title, body: proof.statement }))
    : [
        { icon: <Clock className="h-6 w-6" aria-hidden="true" />, title: t.landingPillar1Title, body: t.landingPillar1Desc },
        { icon: <Star className="h-6 w-6" aria-hidden="true" />, title: t.landingPillar2Title, body: t.landingPillar2Desc },
        { icon: <Compass className="h-6 w-6" aria-hidden="true" />, title: salesCopy.safetyTitle, body: salesCopy.safetyBody },
      ];


  return (
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{language === 'vi' ? 'Những điều bạn có thể kiểm tra ngay' : t.landingPillarsTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-700 dark:text-slate-300 sm:text-base">{language === 'vi' ? 'Không dùng lời chứng thực hoặc con số chưa có nguồn. Đây là các hành vi đang hoạt động trong sản phẩm.' : t.landingPillarsSubtitle}</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {proofCards.map((surface) => (
            <article key={surface.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{surface.icon}</span>
              <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{surface.title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{surface.body}</p>
            </article>
          ))}
        </div>
      </section>


  );
}


export function GettingStartedSection() {
  const { t } = useTranslation();
  return (
      <section className="border-y border-slate-200 bg-slate-50 px-4 py-12 dark:border-zinc-800 dark:bg-zinc-900/60 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{t.landingStepsTitle}</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { title: t.landingStep1Title, body: t.landingStep1Desc },
              { title: t.landingStep2Title, body: t.landingStep2Desc },
              { title: t.landingStep3Title, body: t.landingStep3Desc },
            ].map((step, index) => (
              <li key={step.title} className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white">{index + 1}</span>
                <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">{step.title.replace(/^\d+[.)]?\s*/, '')}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>


  );
}

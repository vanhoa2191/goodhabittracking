import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getLandingSalesCopy } from '@/lib/i18n/landing-sales-copy';

interface LandingActionsProps {
  onStartDemo: () => void;
  onLoginGoogle: () => void;
  isLoggedIn?: boolean;
}


export function FinalActionSection({ onStartDemo, onLoginGoogle, isLoggedIn }: LandingActionsProps) {
  const { t, language } = useTranslation();
  const salesCopy = getLandingSalesCopy(language);
  return (
      <section className="bg-gradient-to-br from-indigo-700 to-violet-700 px-4 py-14 text-center text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{salesCopy.finalTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-indigo-100 sm:text-base">{salesCopy.finalBody}</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button type="button" onClick={onStartDemo} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-indigo-700 shadow-lg hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto">
              {isLoggedIn ? t.landingBackToApp : t.landingCtaDemo}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            {!isLoggedIn && <button type="button" onClick={onLoginGoogle} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/50 px-6 py-3 text-sm font-black text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto">{t.landingCtaGoogle}</button>}
            <Link href="/docs" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/50 px-6 py-3 text-sm font-black text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto">{salesCopy.docs}</Link>
          </div>
        </div>
      </section>


  );
}


export function MobileActions({ onStartDemo, onLoginGoogle, isLoggedIn }: LandingActionsProps) {
  const { t, language } = useTranslation();
  if (isLoggedIn) return null;
  return (
        <div className="sticky bottom-0 z-30 border-t border-indigo-100 bg-white/95 px-3 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:hidden">
          <div className="mx-auto flex max-w-md gap-2">
            <button type="button" onClick={onStartDemo} className="min-h-12 flex-1 rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white">{language === 'vi' ? 'Dùng thử ngay' : t.landingCtaDemo}</button>
            <button type="button" onClick={onLoginGoogle} aria-label={t.landingCtaGoogle} className="min-h-12 rounded-2xl border border-indigo-200 bg-white px-4 text-sm font-black text-indigo-700 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-200">Google</button>
          </div>
        </div>
  );
}

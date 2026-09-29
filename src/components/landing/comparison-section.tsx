import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

const COMPARISON_STYLES = {
  before: {
    card: 'bg-white dark:bg-zinc-800/90 rounded-3xl p-6 sm:p-8 border border-rose-100 dark:border-rose-950/60 shadow-sm space-y-5',
    icon: 'w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-500',
    title: 'text-base sm:text-lg font-extrabold text-rose-700 dark:text-rose-400',
    marker: 'text-rose-500 font-bold mt-0.5',
    symbol: '✕',
    Icon: XCircle,
  },
  after: {
    card: 'bg-white dark:bg-zinc-800/90 rounded-3xl p-6 sm:p-8 border border-emerald-200 dark:border-emerald-900/60 shadow-md ring-2 ring-emerald-500/20 space-y-5',
    icon: 'w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-500',
    title: 'text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-400',
    marker: 'text-emerald-500 font-bold mt-0.5',
    symbol: '✓',
    Icon: CheckCircle2,
  },
};

function ComparisonCard({ variant, title, items }: {
  variant: keyof typeof COMPARISON_STYLES;
  title: string;
  items: readonly string[];
}) {
  const styles = COMPARISON_STYLES[variant];
  const Icon = styles.Icon;
  return (
    <div className={styles.card}>
      <div className="flex items-center gap-3">
        <div className={styles.icon}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <span className={styles.marker}>{styles.symbol}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ComparisonSection() {
  const { t } = useTranslation();
  return (
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-slate-50/80 dark:bg-zinc-900/60 border-y border-slate-100 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.landingComparisonTitle}
            </h2>
            <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              {t.landingComparisonDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <ComparisonCard variant="before" title={t.landingBeforeTitle} items={[t.landingBeforeP1, t.landingBeforeP2, t.landingBeforeP3]} />
            <ComparisonCard variant="after" title={t.landingAfterTitle} items={[t.landingAfterP1, t.landingAfterP2, t.landingAfterP3]} />
          </div>
        </div>
      </section>


  );
}

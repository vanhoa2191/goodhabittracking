'use client';

import { useEffect, useState } from 'react';
import { BookOpenText, History } from 'lucide-react';
import {
  WISDOM_KIND_LABEL,
  parseLocalDay,
  pickHistory,
  pickQuote,
  type HistoryByDay,
  type HistoryEvent,
  type WisdomQuote,
} from '@/lib/daily-wisdom/pick';

type Picked = { quote: WisdomQuote | null; event: HistoryEvent | null };

/** The saying and the "on this day" fact for one local day. The data loads lazily, only when the popup opens. */
export function DailyWisdom({ localDay }: { localDay: string }) {
  const [picked, setPicked] = useState<{ day: string; value: Picked } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      import('../../content/daily-wisdom/quotes-vi.json'),
      import('../../content/daily-wisdom/history-vi.json'),
    ]).then(([quotes, history]) => {
      if (!active) return;
      setPicked({
        day: localDay,
        value: {
          quote: pickQuote(quotes.default as unknown as readonly WisdomQuote[], localDay),
          event: pickHistory(history.default as unknown as HistoryByDay, localDay),
        },
      });
    }).catch(() => { if (active) setPicked({ day: localDay, value: { quote: null, event: null } }); });
    return () => { active = false; };
  }, [localDay]);

  const parsed = parseLocalDay(localDay);
  const value = picked?.day === localDay ? picked.value : null;
  if (!parsed) return null;
  if (!value) return <div aria-hidden="true" className="h-24 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none dark:bg-zinc-800" />;
  const { quote, event } = value;
  if (!quote && !event) return null;

  return (
    <div className="grid gap-3" data-testid="daily-wisdom">
      {quote && (
        <figure className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30" data-testid="daily-quote">
          <figcaption className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-amber-800 dark:text-amber-200">
            <BookOpenText aria-hidden="true" className="h-4 w-4" /> {WISDOM_KIND_LABEL[quote.k]} hôm nay
          </figcaption>
          <blockquote className="mt-2 space-y-0.5 text-base font-bold leading-relaxed text-slate-900 dark:text-slate-100">
            {quote.t.split(' / ').map((line) => <p key={line}>{line}</p>)}
          </blockquote>
          {quote.a && <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">— {quote.a}</p>}
        </figure>
      )}
      {event && (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/50 dark:bg-sky-950/30" aria-label="Ngày này năm xưa" data-testid="daily-history">
          <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-sky-800 dark:text-sky-200">
            <History aria-hidden="true" className="h-4 w-4" /> Ngày này năm xưa · {parsed.day}/{parsed.month}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-900 dark:text-slate-100"><strong className="font-black">Năm {event.y}:</strong> {event.t}</p>
        </section>
      )}
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
        Nguồn: kho tàng tục ngữ, ca dao; Wikiquote và Wikipedia tiếng Việt (CC BY-SA).
      </p>
    </div>
  );
}

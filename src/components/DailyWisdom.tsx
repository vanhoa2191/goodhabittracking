'use client';

import { useEffect, useState } from 'react';
import { BookOpenText, History, X } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
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

function useWisdom(localDay: string): Picked | null {
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

  return picked?.day === localDay ? picked.value : null;
}

function WisdomCards({ value, localDay }: { value: Picked; localDay: string }) {
  const parsed = parseLocalDay(localDay);
  const { quote, event } = value;
  if (!parsed) return null;
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

/**
 * One slim line at the top of the dashboard: the saying and the "on this day" fact scroll sideways. Tapping it opens
 * the full text. With reduced motion the line stays still and is cut short instead of moving.
 */
export function DailyWisdom({ localDay }: { localDay: string }) {
  const value = useWisdom(localDay);
  const [open, setOpen] = useState(false);
  const parsed = parseLocalDay(localDay);
  if (!parsed) return null;
  if (!value) return <div aria-hidden="true" className="mt-1.5 h-8" />;
  const { quote, event } = value;
  if (!quote && !event) return null;
  const line = [
    quote && `${quote.t.replace(/ \/ /g, ' — ')}${quote.a ? ` (${quote.a})` : ''}`,
    event && `Ngày này năm xưa ${parsed.day}/${parsed.month}, năm ${event.y}: ${event.t}`,
  ].filter(Boolean).join('   ✦   ');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="daily-wisdom-ticker"
        aria-label={`${line}. Bấm để xem đầy đủ.`}
        className="group mt-1.5 flex h-8 w-full items-center gap-2 overflow-hidden rounded-xl bg-white/70 px-3 text-left text-sm font-semibold text-slate-900 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-zinc-900/70 dark:text-slate-100"
      >
        <BookOpenText aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
        <span aria-hidden="true" className="relative min-w-0 flex-1 overflow-hidden">
          <span className="wisdom-marquee inline-block whitespace-nowrap group-hover:[animation-play-state:paused] group-focus-visible:[animation-play-state:paused] motion-reduce:hidden">{line}<span className="px-12" /> {line}</span>
          <span className="hidden truncate motion-reduce:block">{line}</span>
        </span>
      </button>
      <ModalShell isOpen={open} onClose={() => setOpen(false)} label="Lời hay và ngày này năm xưa" titleId="daily-wisdom-title" maxWidth="lg" mobileSheet>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-zinc-800">
          <h2 id="daily-wisdom-title" className="text-lg font-black text-slate-900 dark:text-slate-100">Lời hay và ngày này năm xưa</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-zinc-800">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"><WisdomCards value={value} localDay={localDay} /></div>
      </ModalShell>
    </>
  );
}

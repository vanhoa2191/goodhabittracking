'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getPrintWeekCopy } from '@/lib/i18n/print-week-copy';
import { buildWeekSheet, type WeekSheet } from '@/lib/week-sheet';
import type { Language } from '@/types';

const LOCALES: Readonly<Record<Language, string>> = {
  vi: 'vi-VN', en: 'en-US', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', es: 'es-ES', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR',
};

type Mode = 'chart' | 'report';

export function PrintSheet({ sheet, mode, childName, language }: { readonly sheet: WeekSheet; readonly mode: Mode; readonly childName: string; readonly language: Language }) {
  const copy = getPrintWeekCopy(language);
  const locale = LOCALES[language];
  const short = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric' });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const first = sheet.days[0]!;
  const last = sheet.days[6]!;
  return (
    <div className="print-week-root">
      <h1>{mode === 'chart' ? copy.chartTitle : copy.reportTitle}</h1>
      <p className="print-week-meta">{childName} · {copy.weekOf(short.format(first.date), short.format(last.date))}</p>
      {sheet.rows.length === 0 ? (
        <p>{copy.noHabits}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">{copy.habit}</th>
              {sheet.days.map((day) => (
                <th key={day.key} scope="col">{weekday.format(day.date)}<br />{short.format(day.date)}</th>
              ))}
              {mode === 'report' && <th scope="col">{copy.points}</th>}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row) => (
              <tr key={row.activity.id}>
                <th scope="row">{row.activity.icon} {row.activity.title}</th>
                {row.cells.map((cell, index) => (
                  <td key={sheet.days[index]!.key} className={cell === null ? 'print-week-off' : undefined}>
                    {cell === null ? '–' : mode === 'report' && cell ? '✓' : '☐'}
                  </td>
                ))}
                {mode === 'report' && <td>{row.pointsEarned}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {mode === 'report' && <p className="print-week-summary">{copy.summary(sheet.doneCount, sheet.scheduledCount, sheet.pointsEarned)}</p>}
      <p className="print-week-footer">{copy.footer}</p>
    </div>
  );
}

/** Two buttons that print the active child's week: an empty chart for the fridge, or the week so far. */
export function PrintWeekButtons() {
  const { activities, logs, profiles, activeChildId } = useAppStore();
  const { language } = useTranslation();
  const copy = getPrintWeekCopy(language);
  const [mode, setMode] = useState<Mode | null>(null);
  const child = profiles.find((profile) => profile.id === activeChildId) ?? profiles[0];

  useEffect(() => {
    if (!mode) return;
    document.body.classList.add('printing-week');
    const finish = () => {
      document.body.classList.remove('printing-week');
      setMode(null);
    };
    window.addEventListener('afterprint', finish, { once: true });
    const timer = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', finish);
      document.body.classList.remove('printing-week');
    };
  }, [mode]);

  if (!child) return null;
  const sheet = mode ? buildWeekSheet({ activities, logs, childId: child.id, today: new Date() }) : null;
  const button = 'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200 dark:hover:bg-zinc-800';
  return (
    <>
      <div className="flex flex-wrap gap-2 print:hidden">
        <button type="button" className={button} onClick={() => setMode('chart')}>
          <Printer className="h-4 w-4" aria-hidden="true" />{copy.printChart}
        </button>
        <button type="button" className={button} onClick={() => setMode('report')}>
          <Printer className="h-4 w-4" aria-hidden="true" />{copy.printReport}
        </button>
      </div>
      {mode && sheet && createPortal(<PrintSheet sheet={sheet} mode={mode} childName={child.name} language={language} />, document.body)}
    </>
  );
}

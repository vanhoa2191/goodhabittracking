'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useAppearance, type ThemeChoice } from '@/lib/appearance-context';
import { useTranslation } from '@/lib/i18n/context';
import { getAppearanceCopy } from '@/lib/i18n/appearance-copy';

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useAppearance();
  const { language } = useTranslation();
  const labels = getAppearanceCopy(language);
  const options: Array<{ value: ThemeChoice; label: string; Icon: typeof Sun }> = [
    { value: 'light', label: labels.light, Icon: Sun },
    { value: 'dark', label: labels.dark, Icon: Moon },
    { value: 'system', label: labels.system, Icon: Monitor },
  ];

  return (
    <div>
      {!compact && <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">{labels.appearance}</p>}
      <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-zinc-700 dark:bg-zinc-800" aria-label={labels.appearance}>
        {options.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            data-testid={`theme-${value}`}
            aria-label={label}
            aria-pressed={theme === value}
            onClick={() => setTheme(value)}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold transition-colors ${theme === value ? 'bg-white text-indigo-700 shadow-sm dark:bg-zinc-700 dark:text-indigo-200' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {!compact && <span>{label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

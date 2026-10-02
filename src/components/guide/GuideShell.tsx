'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/BrandMark';
import { useTranslation } from '@/lib/i18n/context';
import { getGuideCopy } from '@/lib/i18n/guide-copy';

export function GuideShell({ children }: { readonly children: ReactNode }) {
  const { language } = useTranslation();
  const copy = getGuideCopy(language);
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-zinc-950 dark:text-slate-100 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <Link href="/docs" className="inline-flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            <BrandMark className="h-10 w-10" />
            <span className="text-lg font-black">{copy.title}</span>
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-zinc-900">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />{copy.back}
          </Link>
        </header>
        {children}
      </div>
    </main>
  );
}

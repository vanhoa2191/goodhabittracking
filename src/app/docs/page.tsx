'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { DocsNavigation } from '@/components/docs/DocsNavigation';
import { DocsSection } from '@/components/docs/DocsSection';
import { useTranslation } from '@/lib/i18n/context';
import { getDocsCopy } from '@/lib/i18n/docs-copy';
export default function DocsPage() { const { language } = useTranslation(); const copy = getDocsCopy(language); return <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-zinc-950 sm:py-12"><div className="mx-auto max-w-4xl space-y-8"><header className="space-y-5"><BrandMark /><Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-indigo-700 dark:text-indigo-300"><ArrowLeft className="h-4 w-4" />{copy.back}</Link><div><h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{copy.title}</h1><p className="mt-2 text-base text-slate-600 dark:text-slate-300">{copy.intro}</p></div><DocsNavigation sections={copy.sections} /></header><div className="grid gap-4">{copy.sections.map(([id, title, body]) => <DocsSection key={id} id={id} title={title}><p>{body}</p></DocsSection>)}</div></div></main>; }

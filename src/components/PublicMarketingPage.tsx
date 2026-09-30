import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Compass, FlaskConical, Map, Sparkles } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

const navigation = [
  { href: '/pricing', label: 'Bảng giá', icon: Sparkles },
  { href: '/framework', label: 'Khung thói quen', icon: Compass },
  { href: '/science', label: 'Cơ sở khoa học', icon: FlaskConical },
  { href: '/roadmaps', label: 'Lộ trình', icon: Map },
  { href: '/docs', label: 'Hướng dẫn', icon: BookOpen },
] as const;

export function PublicMarketingPage({
  eyebrow,
  title,
  description,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-zinc-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center gap-3 rounded-xl pr-3 font-black text-slate-950 dark:text-white">
            <BrandMark className="h-10 w-10" label="KidHabit Hero" />
            <span>KidHabit Hero</span>
          </Link>
          <nav aria-label="Nội dung công khai" className="flex flex-wrap items-center gap-1 text-sm">
            {navigation.map(({ href, label }) => (
              <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-xl px-3 font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-zinc-800 dark:hover:text-indigo-300">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-zinc-900">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Trang chủ
        </Link>
        <section className="mt-5 rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-amber-50 p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-indigo-950/30 dark:to-zinc-900 sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">{eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-700 dark:text-slate-300 sm:text-lg">{description}</p>
        </section>

        <div className="mt-8">{children}</div>
      </div>

      <footer className="border-t border-slate-200 bg-white px-4 py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">KidHabit Hero · Đồng hành cùng gia đình xây thói quen mỗi ngày.</p>
          <nav aria-label="Liên kết cuối trang" className="flex flex-wrap gap-1">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-zinc-900">
                <Icon aria-hidden="true" className="h-4 w-4" /> {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </main>
  );
}

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

export function PublicInfoPage({
  title,
  description,
  approved,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly approved: boolean;
  readonly children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-zinc-950 dark:text-slate-100 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <BrandMark className="h-12 w-12" label="KidHabit Hero" />
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-zinc-800">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Trang chủ
            </Link>
          </div>
          <div className="mt-7 max-w-3xl">
            <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300"><ShieldCheck aria-hidden="true" className="h-4 w-4" /> Thông tin dành cho phụ huynh</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">{description}</p>
            {!approved && <p role="status" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Bản thông tin đang ở trạng thái chờ chủ sản phẩm duyệt trước khi công bố.</p>}
          </div>
        </header>

        {approved && (
          <article className="mt-6 space-y-6 rounded-3xl border border-slate-200 bg-white p-5 leading-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8 [&_a]:font-bold [&_a]:text-indigo-700 [&_a]:underline-offset-4 hover:[&_a]:underline dark:[&_a]:text-indigo-300 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-black [&_h2]:tracking-tight [&_li]:pl-1 [&_p]:text-slate-700 dark:[&_p]:text-slate-300 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
            {children}
          </article>
        )}

        <nav aria-label="Thông tin pháp lý và hỗ trợ" className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
          <Link href="/privacy" className="min-h-11 rounded-xl px-4 py-3 font-bold text-indigo-700 hover:bg-white dark:text-indigo-300 dark:hover:bg-zinc-900">Quyền riêng tư</Link>
          <Link href="/terms" className="min-h-11 rounded-xl px-4 py-3 font-bold text-indigo-700 hover:bg-white dark:text-indigo-300 dark:hover:bg-zinc-900">Điều khoản</Link>
          <Link href="/contact" className="min-h-11 rounded-xl px-4 py-3 font-bold text-indigo-700 hover:bg-white dark:text-indigo-300 dark:hover:bg-zinc-900">Liên hệ</Link>
          <Link href="/docs" className="min-h-11 rounded-xl px-4 py-3 font-bold text-indigo-700 hover:bg-white dark:text-indigo-300 dark:hover:bg-zinc-900">Hướng dẫn sử dụng</Link>
        </nav>
      </div>
    </main>
  );
}

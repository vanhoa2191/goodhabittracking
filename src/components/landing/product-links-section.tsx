import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

export function ProductLinksSection() {
  const { language } = useTranslation();
  return (
        <section className="border-y border-slate-200 bg-white px-4 py-12 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">{language === 'vi' ? 'Khám phá sản phẩm' : 'Explore the product'}</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{language === 'vi' ? 'Xem đúng phần bạn cần, không phải đọc một trang thật dài' : 'Go straight to the information you need'}</h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { href: '/framework', icon: '🧭', title: language === 'vi' ? 'Khung thói quen' : 'Habit framework', body: language === 'vi' ? '16 định hướng và 7 cách trao tặng, có gợi ý theo giai đoạn tuổi.' : 'Age-aware habit and character guidance.' },
                { href: '/roadmaps', icon: '🗺️', title: language === 'vi' ? 'Lộ trình thực hành' : 'Practice roadmaps', body: language === 'vi' ? 'Hành trình theo tuần và theo tháng để gia đình bắt đầu vừa sức.' : 'Weekly and monthly paths for a manageable start.' },
                { href: '/pricing', icon: '✨', title: language === 'vi' ? 'Bảng giá rõ ràng' : 'Clear pricing', body: language === 'vi' ? 'Ba gói trả phí, 7 ngày trải nghiệm và không tự động gia hạn.' : 'Three paid plans, a 7-day trial and no automatic renewal.' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800 sm:p-6">
                  <span aria-hidden="true" className="text-3xl">{item.icon}</span>
                  <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{item.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-indigo-700 dark:text-indigo-300">{language === 'vi' ? 'Xem chi tiết' : 'View details'} <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
  );
}

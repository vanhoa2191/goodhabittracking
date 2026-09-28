import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { PublicMarketingPage } from '@/components/PublicMarketingPage';
import { PRICING_PLANS } from '@/lib/payos';
import { publicPageMetadata } from '@/lib/site';
import { formatCurrency } from '@/lib/i18n/formatters';

export const metadata: Metadata = publicPageMetadata({
  title: 'Bảng giá KidHabit Hero',
  description: 'Ba gói rõ ràng cho một bé hoặc cả gia đình, kèm 7 ngày trải nghiệm trước khi quyết định.',
  path: '/pricing',
});

const paidPlans = PRICING_PLANS.filter((plan) => plan.price > 0);
const publicBenefits: Record<string, readonly string[]> = {
  solo_monthly: ['1 hồ sơ bé', 'Đồng bộ trên nhiều thiết bị', 'Thư viện thói quen, lộ trình và phần thưởng'],
  monthly: ['Không giới hạn hồ sơ bé', 'Đồng bộ trên nhiều thiết bị', 'Toàn bộ thư viện thói quen và lộ trình'],
  yearly: ['Quyền lợi gói gia đình', 'Không giới hạn hồ sơ bé', 'Thanh toán một lần cho 12 tháng'],
};

export default async function PricingPage() {
  const requestHeaders = await headers();
  const country = requestHeaders.get('cf-ipcountry')?.toUpperCase() ?? null;
  const isVietnam = country === null || country === 'VN';

  return (
    <PublicMarketingPage
      eyebrow="Bảng giá minh bạch"
      title="Chọn gói vừa đủ cho gia đình"
      description="Mỗi tài khoản được trải nghiệm đầy đủ 7 ngày, không cần thẻ tín dụng và không tự động trừ tiền khi hết hạn."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {paidPlans.map((plan) => (
          <article key={plan.id} className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm dark:bg-zinc-900 ${plan.popular ? 'border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-950' : 'border-slate-200 dark:border-zinc-800'}`}>
            {plan.popular && <span className="absolute right-5 top-5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">Phù hợp nhiều gia đình</span>}
            <p className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">{plan.badge}</p>
            <h2 className="mt-3 pr-20 text-2xl font-black">{plan.name}</h2>
            <p className="mt-5 flex items-end gap-2"><strong className="text-4xl font-black tracking-tight">{formatCurrency(plan.price, 'vi')}</strong><span className="pb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{plan.periodLabel}</span></p>
            {plan.originalPrice && <p className="mt-2 text-sm font-semibold text-slate-500"><span className="line-through">{formatCurrency(plan.originalPrice, 'vi')}</span> · {plan.savings}</p>}
            <p className="mt-4 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{plan.description}</p>
            <ul className="mt-5 flex-1 space-y-3">
              {(publicBenefits[plan.id] ?? []).map((benefit) => (
                <li key={benefit} className="flex gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />{benefit}</li>
              ))}
            </ul>
            <Link href={isVietnam ? '/?pricing=1' : '/?demo=1'} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-indigo-600 px-5 text-center text-sm font-black text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
              {isVietnam ? 'Dùng thử hoặc chọn gói' : 'Trải nghiệm bản demo'}
            </Link>
          </article>
        ))}
      </div>

      <section className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
        <div className="flex gap-3"><ShieldCheck aria-hidden="true" className="h-7 w-7 shrink-0 text-emerald-600" /><div><h2 className="font-black">Không tự động gia hạn</h2><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">Bạn chủ động chọn và thanh toán lại khi muốn tiếp tục sử dụng.</p></div></div>
        <div className="flex gap-3"><CreditCard aria-hidden="true" className="h-7 w-7 shrink-0 text-indigo-600" /><div><h2 className="font-black">Thanh toán tại Việt Nam</h2><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">PayOS hiện phục vụ thanh toán VND tại Việt Nam. Ngoài Việt Nam, bạn vẫn có thể trải nghiệm demo nhưng chưa thể mua gói trực tuyến.</p></div></div>
      </section>
    </PublicMarketingPage>
  );
}

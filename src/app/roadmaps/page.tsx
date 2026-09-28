import type { Metadata } from 'next';
import { PublicMarketingPage } from '@/components/PublicMarketingPage';
import { MONTHLY_JOURNEY_PLANS, WEEKLY_JOURNEY_PLANS } from '@/lib/constants';
import { publicPageMetadata } from '@/lib/site';

export const metadata: Metadata = publicPageMetadata({
  title: 'Lộ trình thói quen KidHabit Hero',
  description: 'Khám phá lộ trình theo tuần và theo tháng để bắt đầu vừa sức, theo dõi đều đặn và điều chỉnh cùng con.',
  path: '/roadmaps',
});

function JourneyCards({ plans }: { readonly plans: readonly (typeof WEEKLY_JOURNEY_PLANS)[number][] }) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {plans.map((plan) => (
        <article key={plan.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="flex items-start gap-3"><span aria-hidden="true" className="text-3xl">{plan.icon}</span><div><p className="text-xs font-black uppercase tracking-wide text-indigo-700 dark:text-indigo-300">{plan.periodLabel}</p><h3 className="mt-1 text-lg font-black">{plan.title.vi}</h3></div></div>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{plan.description.vi}</p>
          <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">{plan.habits.length} gợi ý thực hành</p>
          <ul className="mt-2 space-y-2">
            {plan.habits.slice(0, 3).map((habit) => <li key={`${plan.id}-${habit.id}`} className="flex gap-2 text-sm leading-6 text-slate-700 dark:text-slate-300"><span aria-hidden="true">{habit.icon}</span><span>{habit.title}</span></li>)}
          </ul>
        </article>
      ))}
    </div>
  );
}

export default function RoadmapsPage() {
  return (
    <PublicMarketingPage
      eyebrow="Bắt đầu vừa sức"
      title="Có lộ trình rõ ràng, gia đình đỡ phải nghĩ xem hôm nay làm gì"
      description="Chọn hành trình ngắn theo tuần để làm quen hoặc lộ trình theo tháng để duy trì lâu hơn. Phụ huynh có thể điều chỉnh theo tuổi, nhịp sinh hoạt và nhu cầu thực tế của con."
    >
      <section aria-labelledby="weekly-title">
        <h2 id="weekly-title" className="text-2xl font-black tracking-tight sm:text-3xl">Lộ trình theo tuần</h2>
        <JourneyCards plans={WEEKLY_JOURNEY_PLANS} />
      </section>
      <section aria-labelledby="monthly-title" className="mt-12">
        <h2 id="monthly-title" className="text-2xl font-black tracking-tight sm:text-3xl">Lộ trình theo tháng</h2>
        <JourneyCards plans={MONTHLY_JOURNEY_PLANS} />
      </section>
    </PublicMarketingPage>
  );
}

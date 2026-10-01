import type { Metadata } from 'next';
import { PublicMarketingPage } from '@/components/PublicMarketingPage';
import { JOURNEY_STAGES, journeyPlansForStage } from '@/lib/journeys/age-journeys';
import type { JourneyPlan } from '@/types';
import { publicPageMetadata } from '@/lib/site';

export const metadata: Metadata = publicPageMetadata({
  title: 'Lộ trình thói quen KidHabit Hero',
  description: 'Khám phá lộ trình theo tuần và theo tháng để bắt đầu vừa sức, theo dõi đều đặn và điều chỉnh cùng con.',
  path: '/roadmaps',
});

function JourneyCards({ plans }: { readonly plans: readonly JourneyPlan[] }) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {plans.map((plan) => (
        <article key={plan.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="flex items-start gap-3"><span aria-hidden="true" className="text-3xl">{plan.icon}</span><div><p className="text-xs font-black uppercase tracking-wide text-indigo-700 dark:text-indigo-300">{plan.periodLabel}</p><h3 className="mt-1 text-lg font-black">{plan.title.vi}</h3></div></div>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{plan.description.vi}</p>
          <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">Thói quen mới ở bước này</p>
          <ul className="mt-2 space-y-2">
            {plan.habits.map((habit) => <li key={`${plan.id}-${habit.id}`} className="flex gap-2 text-sm leading-6 text-slate-700 dark:text-slate-300"><span aria-hidden="true">{habit.icon}</span><span>{habit.title}</span></li>)}
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
      title="Lộ trình theo độ tuổi, mỗi bước chỉ thêm một thói quen"
      description="Mỗi giai đoạn tuổi có một lộ trình khoảng 12 tuần gồm ba bước. Bước nào cũng giữ các thói quen trước và chỉ thêm một thói quen mới; ở lại một bước bao lâu tùy nhịp của con. Thời gian hình thành thói quen khác nhau giữa từng người nên tuần lễ chỉ là gợi ý, không phải hạn chót."
    >
      {JOURNEY_STAGES.map((stage, index) => (
        <section key={stage.id} aria-labelledby={`${stage.id}-title`} className={index === 0 ? '' : 'mt-12'}>
          <h2 id={`${stage.id}-title`} className="text-2xl font-black tracking-tight sm:text-3xl">{stage.ageRange} tuổi · {stage.title.vi}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">{stage.adultRole.vi}</p>
          <JourneyCards plans={journeyPlansForStage(stage.id)} />
        </section>
      ))}
    </PublicMarketingPage>
  );
}

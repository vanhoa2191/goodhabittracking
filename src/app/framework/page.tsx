import type { Metadata } from 'next';
import { PublicMarketingPage } from '@/components/PublicMarketingPage';
import { PORTRAITS_16, SEVEN_GIVINGS } from '@/lib/wit-framework';
import { publicPageMetadata } from '@/lib/site';

export const metadata: Metadata = publicPageMetadata({
  title: 'Khung thói quen KidHabit Hero',
  description: 'Khung nội dung giúp phụ huynh chọn hành động nhỏ, phù hợp độ tuổi và dễ thực hành cùng con mỗi ngày.',
  path: '/framework',
});

const categoryLabels = {
  personality: 'Nhân cách',
  virtue: 'Phẩm chất',
  capacity: 'Năng lực',
  vision: 'Tầm nhìn',
} as const;

export default function FrameworkPage() {
  return (
    <PublicMarketingPage
      eyebrow="Khung nội dung"
      title="Từ phẩm chất mong muốn đến hành động nhỏ mỗi ngày"
      description="KidHabit Hero sắp xếp gợi ý theo phẩm chất, cách thực hành và giai đoạn tuổi. Đây là công cụ đồng hành cho gia đình, không thay thế tư vấn y tế, tâm lý hoặc giáo dục chuyên môn."
    >
      <section aria-labelledby="giving-title">
        <h2 id="giving-title" className="text-2xl font-black tracking-tight sm:text-3xl">7 cách trao tặng trong đời sống</h2>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">Các hành động dễ quan sát như nụ cười, ánh mắt, lời nói, lòng biết ơn, sự bao dung, giúp đỡ và nhường cơ hội.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SEVEN_GIVINGS.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start gap-3"><span aria-hidden="true" className="text-3xl">{item.icon}</span><div><h3 className="font-black">{item.name}</h3><p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{item.subName}</p></div></div>
              <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.meaning}</p>
              <p className="mt-3 rounded-2xl bg-indigo-50 p-3 text-sm font-semibold leading-6 text-slate-800 dark:bg-indigo-950/30 dark:text-slate-200"><strong>Gợi ý hôm nay:</strong> {item.dailyPractice}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="portrait-title" className="mt-12">
        <h2 id="portrait-title" className="text-2xl font-black tracking-tight sm:text-3xl">16 định hướng phát triển</h2>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">Mỗi định hướng có ví dụ thực hành khác nhau cho các giai đoạn 0–3, 3–6, 6–12 và 12–18 tuổi.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PORTRAITS_16.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-black uppercase tracking-wide text-indigo-700 dark:text-indigo-300">{categoryLabels[item.category]}</p>
              <h3 className="mt-2 flex items-center gap-2 text-lg font-black"><span aria-hidden="true">{item.icon}</span>{item.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicMarketingPage>
  );
}

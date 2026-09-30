import type { Metadata } from 'next';
import { PublicMarketingPage } from '@/components/PublicMarketingPage';
import { SCIENCE_PRINCIPLES, SCIENCE_SOURCES, SCIENCE_UNKNOWNS } from '@/lib/science-content';
import { publicPageMetadata } from '@/lib/site';

export const metadata: Metadata = publicPageMetadata({
  title: 'Cơ sở khoa học của KidHabit Hero',
  description: 'Những điều nghiên cứu về thói quen cho biết, những điều chưa biết, và cách KidHabit Hero dùng chúng một cách thận trọng.',
  path: '/science',
});

const sourceById = new Map(SCIENCE_SOURCES.map((source) => [source.id, source]));

export default function SciencePage() {
  return (
    <PublicMarketingPage
      eyebrow="Cơ sở khoa học"
      title="Xây thói quen cho trẻ: điều đã biết và điều chưa biết"
      description="KidHabit Hero dựa trên các nghiên cứu về hình thành thói quen để gợi ý cách đồng hành cùng con. Trang này nói rõ bằng chứng đến đâu và giới hạn ở đâu. Đây là công cụ đồng hành cho gia đình, không hứa kết quả cho từng em bé và không thay thế tư vấn của bác sĩ, nhà tâm lý hay chuyên gia giáo dục."
    >
      <section aria-labelledby="principles-title">
        <h2 id="principles-title" className="text-2xl font-black tracking-tight sm:text-3xl">Bảy điều nên biết</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {SCIENCE_PRINCIPLES.map((principle) => (
            <article key={principle.id} id={principle.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-lg font-black">{principle.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300"><strong>Bằng chứng nói gì.</strong> {principle.evidence}</p>
              <p className="mt-3 rounded-2xl bg-indigo-50 p-3 text-sm font-semibold leading-6 text-slate-800 dark:bg-indigo-950/30 dark:text-slate-200"><strong>Bạn có thể làm gì.</strong> {principle.action}</p>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300"><strong>Giới hạn.</strong> {principle.limit}</p>
              <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Nguồn: {principle.sourceIds.map((id, index) => (
                <span key={id}>{index > 0 && ', '}<a href={`#source-${id}`} className="underline underline-offset-2">{sourceById.get(id)?.citation.split('.')[0]}</a></span>
              ))}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="unknowns-title" className="mt-12">
        <h2 id="unknowns-title" className="text-2xl font-black tracking-tight sm:text-3xl">Điều chúng tôi chưa biết</h2>
        <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
          {SCIENCE_UNKNOWNS.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section aria-labelledby="sources-title" className="mt-12">
        <h2 id="sources-title" className="text-2xl font-black tracking-tight sm:text-3xl">Nguồn</h2>
        <ol className="mt-4 max-w-4xl space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
          {SCIENCE_SOURCES.map((source) => (
            <li key={source.id} id={`source-${source.id}`}>
              {source.citation}
              {source.doi && <> <a href={`https://doi.org/${source.doi}`} rel="noopener noreferrer" className="font-semibold underline underline-offset-2">doi:{source.doi}</a></>}
            </li>
          ))}
        </ol>
      </section>
    </PublicMarketingPage>
  );
}

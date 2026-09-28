'use client';

import { CheckCircle2, Eye, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function CaregiverDashboard() {
  const { activities, logs, profiles } = useAppStore();

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6" aria-labelledby="caregiver-title">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-700 to-violet-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15"><Eye aria-hidden="true" /></span>
          <div>
            <h1 id="caregiver-title" className="text-2xl font-black">Góc người chăm sóc</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-indigo-100">Bạn đang xem tiến độ với quyền chỉ đọc. Mọi thay đổi vẫn do chủ gia đình hoặc phụ huynh quản lý.</p>
          </div>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200">Gia đình chưa có hồ sơ để theo dõi.</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {profiles.map((profile) => {
            const profileActivities = activities.filter((activity) => activity.childId === null || activity.childId === profile.id);
            const approved = logs.filter((log) => log.childId === profile.id && (log.status === 'completed' || log.status === 'approved')).length;
            return (
              <article key={profile.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{profile.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{approved} lần hoàn thành đã được ghi nhận</p>
                  </div>
                  <Sparkles aria-hidden="true" className="h-7 w-7 text-amber-500" />
                </div>
                <ul className="mt-5 space-y-3" aria-label={`Thói quen của ${profile.name}`}>
                  {profileActivities.map((activity) => (
                    <li key={activity.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-zinc-800">
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <div><p className="font-bold text-slate-900 dark:text-white">{activity.title}</p>{activity.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{activity.description}</p>}</div>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

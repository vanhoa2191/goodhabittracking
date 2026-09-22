'use client';

import { useMemo, useState } from 'react';
import { BookOpenCheck, Check, Plus, ShieldCheck } from 'lucide-react';
import {
  createActivityFromFrameworkHabit,
  HABIT_FRAMEWORK_CATALOG,
  HABIT_FRAMEWORK_STAGES,
  type FrameworkDomain,
  type FrameworkHabit,
  type FrameworkStageId,
} from '@/lib/habit-framework/catalog';
import { useTranslation } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { getActivityMutationError } from '@/lib/i18n/activity-mutation-copy';

const DOMAINS: readonly { readonly id: 'all' | FrameworkDomain; readonly label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'NT', label: 'Nội tâm' },
  { id: 'SK', label: 'Sức khỏe' },
  { id: 'MQH', label: 'Mối quan hệ' },
  { id: 'HT', label: 'Học tập' },
  { id: 'TC', label: 'Tài chính' },
];

type HabitFrameworkLibraryProps = Readonly<{
  onMutationError: (message: string) => void;
}>;

function FrameworkHabitCard({
  habit,
  isAdded,
  isPending,
  onAdd,
}: Readonly<{
  habit: FrameworkHabit;
  isAdded: boolean;
  isPending: boolean;
  onAdd: (habit: FrameworkHabit) => Promise<void>;
}>) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/60">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">{habit.id}</span>
          <span className="rounded-full bg-white px-2 py-1 text-slate-600 dark:bg-zinc-900 dark:text-slate-300">{habit.ageRange} tuổi</span>
        </div>
        <h5 className="text-base font-extrabold leading-snug text-slate-800 dark:text-slate-100">{habit.name}</h5>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{habit.childMeaning}</p>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <span className="font-bold text-slate-800 dark:text-slate-100">Dấu hiệu tiến bộ: </span>
          {habit.successSignal}
        </p>
      </div>

      <details className="group rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
        <summary className="cursor-pointer text-sm font-bold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300">
          Xem cách làm và cách đồng hành
        </summary>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <ol className="space-y-2 pl-5">
            {habit.activities.map((activity) => <li key={activity} className="list-decimal">{activity}</li>)}
          </ol>
          <p><span className="font-bold">Người lớn đồng hành: </span>{habit.parentGuidance}</p>
          <p><span className="font-bold">Tự theo dõi: </span>{habit.measurement}</p>
          {habit.primaryDomain === 'SK' && (
            <p className="rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Điều chỉnh theo thể trạng của trẻ; nội dung sức khỏe không thay thế tư vấn chuyên môn.
            </p>
          )}
        </div>
      </details>

      <button
        type="button"
        disabled={isAdded || isPending}
        onClick={() => void onAdd(habit)}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-emerald-100 disabled:text-emerald-800 dark:disabled:bg-emerald-950/60 dark:disabled:text-emerald-300"
      >
        {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {isAdded ? 'Đã thêm vào gia đình' : isPending ? 'Đang thêm…' : 'Thêm vào danh sách việc'}
      </button>
    </article>
  );
}

export function HabitFrameworkLibrary({ onMutationError }: HabitFrameworkLibraryProps) {
  const { activities, createActivity } = useAppStore();
  const { language } = useTranslation();
  const [selectedStage, setSelectedStage] = useState<FrameworkStageId>('GD1');
  const [selectedDomain, setSelectedDomain] = useState<'all' | FrameworkDomain>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const addedIds = useMemo(
    () => new Set(activities.flatMap((activity) => activity.frameworkHabitId ? [activity.frameworkHabitId] : [])),
    [activities],
  );
  const visibleHabits = HABIT_FRAMEWORK_CATALOG.filter((habit) =>
    habit.stageId === selectedStage
    && (selectedDomain === 'all' || habit.primaryDomain === selectedDomain),
  );

  const addHabit = async (habit: FrameworkHabit): Promise<void> => {
    setPendingId(habit.id);
    onMutationError('');
    const saved = await createActivity(createActivityFromFrameworkHabit(habit, null));
    setPendingId(null);
    if (!saved) onMutationError(getActivityMutationError(language));
  };

  return (
    <section aria-labelledby="framework-library-title" className="space-y-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"><BookOpenCheck className="h-5 w-5" /></span>
        <div className="space-y-1">
          <h4 id="framework-library-title" className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Khung 47 thói quen 0–18 tuổi</h4>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">Chọn đúng giai đoạn, đọc ý nghĩa và cách làm trước khi thêm. Tuổi chỉ là gợi ý; phụ huynh điều chỉnh theo khả năng thực tế của con.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-wrap" aria-label="Giai đoạn phát triển">
        {HABIT_FRAMEWORK_STAGES.map((stage) => (
          <button key={stage.id} type="button" onClick={() => setSelectedStage(stage.id)} aria-pressed={selectedStage === stage.id} className={`shrink-0 rounded-2xl px-3.5 py-2 text-sm font-bold transition-colors ${selectedStage === stage.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-200 dark:hover:bg-zinc-700'}`}>
            {stage.ageRange} · {stage.title}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Lĩnh vực thói quen">
        {DOMAINS.map((domain) => (
          <button key={domain.id} type="button" onClick={() => setSelectedDomain(domain.id)} aria-pressed={selectedDomain === domain.id} className={`rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${selectedDomain === domain.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'border-slate-200 text-slate-600 hover:border-indigo-300 dark:border-zinc-700 dark:text-slate-300'}`}>
            {domain.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <span>Điểm và chuỗi ngày chỉ để tạo động lực, không dùng để đánh giá phẩm chất hay so sánh trẻ.</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visibleHabits.map((habit) => (
          <FrameworkHabitCard key={habit.id} habit={habit} isAdded={addedIds.has(habit.id)} isPending={pendingId === habit.id} onAdd={addHabit} />
        ))}
      </div>
    </section>
  );
}

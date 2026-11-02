'use client';

import { useState } from 'react';
import { Target } from 'lucide-react';
import {
  GOAL_STATUS_COPY, SPACE_GOAL_MAX_LENGTH, SPACE_GOAL_PRESETS, goalForWeek, type SpaceGoal, type SpaceGoalStatus,
} from '@/lib/child-space';

type Props = {
  goals: readonly SpaceGoal[];
  weekStart: string;
  lastWeekStart: string;
  onSave: (text: string) => Promise<boolean>;
  onMark: (weekStart: string, status: SpaceGoalStatus) => Promise<boolean>;
};

/** One short intention per Monday-based week, kept private to the child. */
export function WeeklyGoal({ goals, weekStart, lastWeekStart, onSave, onMark }: Props) {
  const current = goalForWeek(goals, weekStart);
  const previous = goalForWeek(goals, lastWeekStart);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(false);
  const run = async (action: () => Promise<boolean>) => { setError(!(await action())); };
  return (
    <section aria-labelledby="goal-title" className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900" data-testid="weekly-goal">
      <h3 id="goal-title" className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-slate-100"><Target aria-hidden="true" className="h-4 w-4" /> Điều con muốn thử tuần này</h3>
      {previous && previous.status === 'open' && (
        <div className="mt-3 rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/40" data-testid="goal-last-week">
          <p className="text-sm font-bold text-amber-950 dark:text-amber-100">Tuần trước con muốn: &quot;{previous.goal_text}&quot;. Con làm được chưa?</p>
          <MarkButtons onMark={(status) => run(() => onMark(previous.week_start, status))} />
        </div>
      )}
      {current && !editing ? (
        <div className="mt-3">
          <p className="text-base font-black text-slate-900 dark:text-slate-100" data-testid="goal-current">{current.goal_text}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300" data-testid="goal-status">{GOAL_STATUS_COPY[current.status]}</p>
          <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cuối tuần, con tự xem mình làm được chưa nhé. Điều này chỉ mình con thấy.</p>
          <MarkButtons current={current.status} onMark={(status) => run(() => onMark(weekStart, status))} />
          <button type="button" onClick={() => { setText(current.goal_text); setEditing(true); }} className="mt-2 min-h-11 text-sm font-bold underline">Đổi điều khác</button>
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Gợi ý cho tuần này">
            {SPACE_GOAL_PRESETS.map((preset) => (
              <button key={preset} type="button" aria-pressed={text === preset} onClick={() => setText(preset)}
                className={`min-h-11 rounded-full border px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${text === preset ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100'}`}>{preset}</button>
            ))}
          </div>
          <label htmlFor="goal-input" className="mt-3 block text-sm font-black text-slate-900 dark:text-slate-100">Hoặc con tự viết (tối đa {SPACE_GOAL_MAX_LENGTH} chữ)</label>
          <input id="goal-input" value={text} maxLength={SPACE_GOAL_MAX_LENGTH} onChange={(event) => setText(event.target.value.replace(/[\r\n]+/g, ' '))}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100" />
          <button type="button" disabled={!text.trim()} onClick={() => void run(async () => { const ok = await onSave(text); if (ok) { setEditing(false); setText(''); } return ok; })}
            className="mt-3 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">Chọn cho tuần này</button>
        </div>
      )}
      {error && <p role="status" className="mt-2 text-sm font-bold text-rose-700 dark:text-rose-300">Chưa lưu được. Con thử lại nhé.</p>}
    </section>
  );
}

function MarkButtons({ current, onMark }: { current?: SpaceGoalStatus; onMark: (status: SpaceGoalStatus) => Promise<void> }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Con làm được chưa?">
      <button type="button" aria-pressed={current === 'done'} onClick={() => void onMark('done')}
        className={`min-h-11 rounded-xl border px-4 text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${current === 'done' ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-emerald-600 text-emerald-900 dark:text-emerald-200'}`}>Con làm được ✓</button>
      <button type="button" aria-pressed={current === 'not_yet'} onClick={() => void onMark('not_yet')}
        className={`min-h-11 rounded-xl border px-4 text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${current === 'not_yet' ? 'border-slate-700 bg-slate-700 text-white' : 'border-slate-400 text-slate-800 dark:text-slate-200'}`}>Chưa được</button>
    </div>
  );
}

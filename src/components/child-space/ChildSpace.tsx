'use client';

import { useCallback, useEffect, useState } from 'react';
import { Heart, Lock, ShieldCheck, Trash2 } from 'lucide-react';
import { DailyJournalCard } from '@/components/DailyJournalCard';
import { CalmBox } from '@/components/child-space/CalmBox';
import { LetterToParents } from '@/components/child-space/LetterToParents';
import { MoodTimeline } from '@/components/child-space/MoodTimeline';
import { WeeklyGoal } from '@/components/child-space/WeeklyGoal';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import {
  MOOD_VISUAL, NOTE_KIND_COPY, REASON_LABEL, SPACE_MOODS, SPACE_NOTE_KINDS, SPACE_NOTE_MAX_LENGTH, SPACE_REASONS, weekStartOf,
  type SpaceMood, type SpaceNoteKind, type SpaceReason, type SpaceSnapshot,
} from '@/lib/child-space';
import {
  EMPTY_SPACE, deleteSpaceNote, loadChildSpace, markSpaceGoal, saveSpaceGoal, saveSpaceMood, saveSpaceNote, sendSpaceLetter, type ChildSpaceMode,
} from '@/lib/store/child-space-client';

type Props = {
  childId: string;
  childName: string;
  localDay: string;
  mode: ChildSpaceMode;
  /** Young children get the feelings check-in and the calm box only; writing starts from six. */
  canWrite: boolean;
};

const LOW_MOODS: readonly SpaceMood[] = ['worried', 'sad', 'angry'];

function addDays(day: string, offset: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function ChildSpace({ childId, childName, localDay, mode, canWrite }: Props) {
  const [snapshot, setSnapshot] = useState<SpaceSnapshot>(EMPTY_SPACE);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState('');

  const reload = useCallback(async () => {
    const next = await loadChildSpace(childId, mode);
    if (next) { setSnapshot(next); setFailed(false); } else setFailed(true);
    setLoaded(true);
  }, [childId, mode]);
  useEffect(() => {
    let active = true;
    void loadChildSpace(childId, mode).then((next) => {
      if (!active) return;
      if (next) { setSnapshot(next); setFailed(false); } else setFailed(true);
      setLoaded(true);
    });
    return () => { active = false; };
  }, [childId, mode]);

  const today = snapshot.moods.find((entry) => entry.local_date === localDay) ?? null;

  const chooseMood = async (mood: SpaceMood, reason: SpaceReason | null) => {
    setNotice('');
    const ok = await saveSpaceMood(childId, mode, localDay, mood, reason);
    if (!ok) { setNotice('Chưa lưu được. Con thử lại nhé.'); return; }
    await reload();
  };

  const week = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(localDay, index - 6);
    return { day, mood: snapshot.moods.find((entry) => entry.local_date === day)?.mood ?? null };
  });
  const showCalm = today ? LOW_MOODS.includes(today.mood) : false;

  return (
    <div className="space-y-5" data-testid="child-space">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 dark:text-slate-100"><Heart aria-hidden="true" className="h-5 w-5 text-rose-500" /> Không gian của bé</h2>
        <p className="mt-1 flex items-start gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Đây là chỗ của riêng {childName}. Ba mẹ nhìn thấy cảm xúc con chọn để biết khi nào con cần được giúp. Các ghi chú chỉ ba mẹ đọc được khi con bật &quot;Chia sẻ với ba mẹ&quot;. Riêng thư gửi ba mẹ thì ba mẹ luôn đọc được.</span>
        </p>
        {mode !== 'paired' && <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Đang xem thử trên thiết bị này, dữ liệu không gửi lên gia đình.</p>}
      </div>

      {failed && loaded && (
        <p role="status" className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          Chưa tải được Không gian của bé. <button type="button" onClick={() => void reload()} className="underline">Thử lại</button>
        </p>
      )}

      <section aria-labelledby="mood-title" className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 id="mood-title" className="text-base font-black text-slate-900 dark:text-slate-100">Hôm nay con thấy thế nào?</h3>
        <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Chọn cảm xúc hôm nay">
          {SPACE_MOODS.map((mood) => {
            const visual = MOOD_VISUAL[mood];
            const selected = today?.mood === mood;
            return (
              <button
                key={mood}
                type="button"
                aria-pressed={selected}
                data-testid={`mood-${mood}`}
                onClick={() => void chooseMood(mood, selected ? today?.reason ?? null : null)}
                className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-2 text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${visual.tone} ${selected ? 'border-indigo-600 shadow-md' : 'border-transparent'}`}
              >
                <span aria-hidden="true" className="text-3xl">{visual.emoji}</span>
                {visual.label}
              </button>
            );
          })}
        </div>
        {today && LOW_MOODS.includes(today.mood) && (
          <div className="mt-4">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Chuyện gì làm con thấy {MOOD_VISUAL[today.mood].label.toLowerCase()}? (không bắt buộc)</p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Lý do">
              {SPACE_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  aria-pressed={today.reason === reason}
                  onClick={() => void chooseMood(today.mood, today.reason === reason ? null : reason)}
                  className={`min-h-11 rounded-full border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${today.reason === reason ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100'}`}
                >{REASON_LABEL[reason]}</button>
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Con có thể nói với ba mẹ: &quot;Con cần một cái ôm&quot;. Ba mẹ luôn muốn nghe con.</p>
          </div>
        )}
        {notice && <p role="status" className="mt-3 text-sm font-bold text-rose-700 dark:text-rose-300">{notice}</p>}
        <ol className="mt-4 grid grid-cols-7 gap-1" aria-label="Cảm xúc 7 ngày gần đây" data-testid="mood-week">
          {week.map(({ day, mood }) => (
            <li key={day} className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <span aria-hidden="true" className="text-xl">{mood ? MOOD_VISUAL[mood].emoji : '·'}</span>
              <span className="sr-only">{day}: {mood ? MOOD_VISUAL[mood].label : 'chưa chọn'}</span>
              <span aria-hidden="true">{day.slice(8)}/{day.slice(5, 7)}</span>
            </li>
          ))}
        </ol>
      </section>

      <MoodTimeline snapshot={snapshot} localDay={localDay} />

      <CalmBox defaultOpen={showCalm} key={showCalm ? 'open' : 'closed'} />

      {canWrite && (
        <WeeklyGoal
          goals={snapshot.goals}
          weekStart={weekStartOf(localDay)}
          lastWeekStart={addDays(weekStartOf(localDay), -7)}
          onSave={async (text) => { const ok = await saveSpaceGoal(childId, mode, weekStartOf(localDay), text); if (ok) await reload(); return ok; }}
          onMark={async (weekStart, status) => { const ok = await markSpaceGoal(childId, mode, weekStart, status); if (ok) await reload(); return ok; }}
        />
      )}

      {canWrite && (
        <LetterToParents
          letters={snapshot.letters}
          preview={mode !== 'paired'}
          onSend={async (text) => { const ok = await sendSpaceLetter(childId, mode, localDay, text); if (ok) await reload(); return ok; }}
        />
      )}

      {canWrite && (
        <section aria-labelledby="notes-title" className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 id="notes-title" className="text-base font-black text-slate-900 dark:text-slate-100">Ghi nhanh một điều</h3>
          <div className="mt-3 grid gap-3">
            {SPACE_NOTE_KINDS.map((kind) => (
              <NoteEditor
                key={`${kind}:${localDay}`}
                kind={kind}
                existing={snapshot.notes.find((note) => note.local_date === localDay && note.kind === kind) ?? null}
                onSave={async (text, shared) => { const ok = await saveSpaceNote(childId, mode, localDay, kind, text, shared); if (ok) await reload(); return ok; }}
                onDelete={async () => { const ok = await deleteSpaceNote(childId, mode, localDay, kind); if (ok) await reload(); return ok; }}
              />
            ))}
          </div>
        </section>
      )}

      {canWrite && defaultExperienceFlags.dailyJournal && <DailyJournalCard />}
    </div>
  );
}

function NoteEditor({ kind, existing, onSave, onDelete }: {
  kind: SpaceNoteKind;
  existing: { note_text: string; shared_with_parent: boolean } | null;
  onSave: (text: string, shared: boolean) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const copy = NOTE_KIND_COPY[kind];
  const [text, setText] = useState(existing?.note_text ?? '');
  const [shared, setShared] = useState(existing?.shared_with_parent ?? false);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(existing ? 'saved' : 'idle');
  const save = async () => {
    setState('saving');
    setState((await onSave(text, shared)) ? 'saved' : 'error');
  };
  const remove = async () => {
    if (await onDelete()) { setText(''); setShared(false); setState('idle'); } else setState('error');
  };
  const id = `space-note-${kind}`;
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-zinc-800" data-testid={`note-${kind}`}>
      <label htmlFor={id} className="text-sm font-black text-slate-900 dark:text-slate-100">{copy.prompt}</label>
      <input
        id={id}
        value={text}
        maxLength={SPACE_NOTE_MAX_LENGTH}
        onChange={(event) => { setText(event.target.value.replace(/[\r\n]+/g, ' ')); setState('idle'); }}
        placeholder={copy.placeholder}
        className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <input type="checkbox" checked={shared} onChange={(event) => { setShared(event.target.checked); setState('idle'); }} className="h-5 w-5" />
          Chia sẻ với ba mẹ
        </label>
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">{!shared && <><Lock aria-hidden="true" className="h-3.5 w-3.5" /> Chỉ mình con thấy</>}</span>
        <div className="ml-auto flex items-center gap-2">
          {existing && <button type="button" onClick={() => void remove()} aria-label={`Xóa: ${copy.label}`} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-zinc-700"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>}
          <button type="button" disabled={!text.trim() || state === 'saving'} onClick={() => void save()} className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">{state === 'saving' ? 'Đang lưu…' : state === 'saved' ? 'Đã lưu ✓' : 'Lưu'}</button>
        </div>
      </div>
      {state === 'error' && <p role="status" className="mt-2 text-sm font-bold text-rose-700 dark:text-rose-300">Chưa lưu được. Con thử lại nhé.</p>}
    </div>
  );
}

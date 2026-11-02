'use client';

import { useEffect, useState } from 'react';
import { Heart, HeartHandshake, Mail } from 'lucide-react';
import { localDayKey } from '@/lib/habit-fire';
import {
  MOOD_VISUAL, NOTE_KIND_COPY, evaluateMoodAlert, type MoodAlert, type SpaceLetter, type SpaceSnapshot,
} from '@/lib/child-space';
import { loadParentChildSpace, respondToSpaceLetter } from '@/lib/store/child-space-client';
import { useAppStore } from '@/lib/store';

function useParentSpace(childId: string): { snapshot: SpaceSnapshot | null; reload: () => void } {
  const [state, setState] = useState<{ childId: string; snapshot: SpaceSnapshot | null } | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    void loadParentChildSpace(childId).then((snapshot) => { if (active) setState({ childId, snapshot }); });
    return () => { active = false; };
  }, [childId, version]);
  return { snapshot: state?.childId === childId ? state.snapshot : null, reload: () => setVersion((value) => value + 1) };
}

function alertCopy(name: string, alert: MoodAlert): { title: string; body: string } | null {
  if (alert.level === 'watch') {
    return {
      title: `${name} mấy hôm nay hay buồn, lo hoặc giận`,
      body: `Con đã chọn cảm xúc nặng nề ${alert.streak} ngày liền. Bạn thử dành 10 phút ở bên con, hỏi nhẹ nhàng: "Hôm nay có chuyện gì làm con không vui?" và lắng nghe, đừng vội sửa hay khuyên.`,
    };
  }
  if (alert.level === 'concern') {
    return {
      title: `${name} đã nhiều ngày không vui`,
      body: `Con đã buồn, lo hoặc giận ${alert.lowDaysInWeek} trong 7 ngày gần đây. Hãy trò chuyện riêng với con, và nếu con ăn ngủ khác lạ, ngại đến trường hoặc tình trạng kéo dài, bạn nên hỏi giáo viên hoặc chuyên gia tâm lý trẻ em. Đây chỉ là gợi ý từ cảm xúc con tự chọn, không phải chẩn đoán.`,
    };
  }
  return null;
}

/** A short, gentle note on the parent's day view. It stays hidden unless the last few days looked heavy. */
export function ChildSpaceAlert({ childId }: { childId: string }) {
  const { profiles } = useAppStore();
  const { snapshot } = useParentSpace(childId);
  const name = profiles.find((profile) => profile.id === childId)?.nickname
    ?? profiles.find((profile) => profile.id === childId)?.name ?? 'Con';
  if (!snapshot) return null;
  const copy = alertCopy(name, evaluateMoodAlert(snapshot.moods, localDayKey(new Date())));
  if (!copy) return null;
  return (
    <section role="status" data-testid="child-space-alert" className="flex items-start gap-3 rounded-3xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900/60 dark:bg-violet-950/30">
      <HeartHandshake aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-violet-700 dark:text-violet-300" />
      <div>
        <h3 className="text-sm font-black text-violet-950 dark:text-violet-100">{copy.title}</h3>
        <p className="mt-1 text-sm leading-6 text-violet-950 dark:text-violet-100">{copy.body}</p>
      </div>
    </section>
  );
}

/** The mood trend and the notes a child chose to share, for every child in the family. */
export function ChildSpaceParentPanel() {
  const { profiles } = useAppStore();
  const children = profiles.filter((profile) => profile.ageStage !== '0-3');
  if (children.length === 0) return null;
  return (
    <section aria-labelledby="parent-space-title" className="rounded-3xl border border-sand-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900" data-testid="parent-space-panel">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-rose-50 p-2.5 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"><Heart aria-hidden="true" className="h-5 w-5" /></span>
        <div>
          <h4 id="parent-space-title" className="text-base font-extrabold text-sand-900 dark:text-slate-100">Không gian của bé</h4>
          <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">Cảm xúc con chọn mỗi ngày, thư con gửi và những điều con muốn chia sẻ. Ghi chú và mục tiêu tuần con không chia sẻ sẽ không hiện ở đây.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4">
        {children.map((child) => <ChildSpaceRow key={child.id} childId={child.id} name={child.nickname || child.name} />)}
      </div>
    </section>
  );
}

function ChildSpaceRow({ childId, name }: { childId: string; name: string }) {
  const { snapshot, reload } = useParentSpace(childId);
  const today = localDayKey(new Date());
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(`${today}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - (13 - index));
    const day = date.toISOString().slice(0, 10);
    return { day, mood: snapshot?.moods.find((entry) => entry.local_date === day)?.mood ?? null };
  });
  const alert = snapshot ? alertCopy(name, evaluateMoodAlert(snapshot.moods, today)) : null;
  return (
    <article className="rounded-2xl border border-sand-100 bg-sand-50 p-4 dark:border-zinc-700 dark:bg-zinc-800" data-testid={`parent-space-${childId}`}>
      <h5 className="text-sm font-black text-slate-900 dark:text-slate-100">{name}</h5>
      {!snapshot ? (
        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Chưa có dữ liệu Không gian từ thiết bị của bé.</p>
      ) : (
        <>
          <ol className="mt-3 grid grid-cols-7 gap-1 sm:grid-cols-14" aria-label={`Cảm xúc 14 ngày gần đây của ${name}`}>
            {days.map(({ day, mood }) => (
              <li key={day} className="flex flex-col items-center text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <span aria-hidden="true" className="text-xl">{mood ? MOOD_VISUAL[mood].emoji : '·'}</span>
                <span className="sr-only">{day}: {mood ? MOOD_VISUAL[mood].label : 'chưa chọn'}</span>
                <span aria-hidden="true">{day.slice(8)}</span>
              </li>
            ))}
          </ol>
          {alert && <p className="mt-3 rounded-xl bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-950 dark:bg-violet-950/40 dark:text-violet-100">{alert.body}</p>}
          {snapshot.letters.length > 0 && (
            <div className="mt-3" data-testid={`parent-letters-${childId}`}>
              <h6 className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200"><Mail aria-hidden="true" className="h-3.5 w-3.5" /> Thư con gửi ba mẹ</h6>
              <ul className="mt-2 space-y-2">
                {snapshot.letters.map((letter) => <LetterRow key={letter.id} letter={letter} onChanged={reload} />)}
              </ul>
            </div>
          )}
          {snapshot.notes.length > 0 && (
            <ul className="mt-3 space-y-2">
              {snapshot.notes.map((note) => (
                <li key={`${note.local_date}:${note.kind}`} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-900 dark:bg-zinc-900 dark:text-slate-100">
                  <span className="block text-xs font-bold text-slate-600 dark:text-slate-400">{note.local_date} · {NOTE_KIND_COPY[note.kind].label}</span>
                  {note.note_text}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </article>
  );
}

function LetterRow({ letter, onChanged }: { letter: SpaceLetter; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const respond = async (heart?: boolean) => {
    setBusy(true);
    const ok = await respondToSpaceLetter(letter.id, heart);
    setBusy(false);
    setFailed(!ok);
    if (ok) onChanged();
  };
  return (
    <li className="rounded-xl bg-white px-3 py-2 text-sm text-slate-900 dark:bg-zinc-900 dark:text-slate-100" data-testid={`letter-${letter.id}`}>
      <span className="block text-xs font-bold text-slate-600 dark:text-slate-400">{letter.local_date} · {letter.read ? 'Đã đọc' : 'Mới'}</span>
      <span className="whitespace-pre-line">{letter.letter_text}</span>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy} aria-pressed={letter.parent_heart} onClick={() => void respond(!letter.parent_heart)}
          className={`min-h-11 rounded-full border px-4 text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${letter.parent_heart ? 'border-rose-600 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100' : 'border-slate-300 text-slate-800 dark:border-zinc-600 dark:text-slate-100'}`}>
          {letter.parent_heart ? '💗 Đã gửi tim' : '💗 Gửi tim cho con'}
        </button>
        {!letter.read && (
          <button type="button" disabled={busy} onClick={() => void respond()}
            className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-600 dark:text-slate-100">Đánh dấu đã đọc</button>
        )}
      </div>
      {failed && <p role="status" className="mt-1 text-xs font-bold text-rose-700 dark:text-rose-300">Chưa cập nhật được, thử lại nhé.</p>}
    </li>
  );
}

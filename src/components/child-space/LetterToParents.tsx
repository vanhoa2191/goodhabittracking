'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { SPACE_LETTER_MAX_LENGTH, type SpaceLetter } from '@/lib/child-space';

type Props = { letters: readonly SpaceLetter[]; preview: boolean; onSend: (text: string) => Promise<boolean> };

/** A short letter that is always read by parents. The notice sits above the box so the child knows before writing. */
export function LetterToParents({ letters, preview, onSend }: Props) {
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const send = async () => {
    setState('sending');
    if (await onSend(text)) { setText(''); setState('sent'); } else setState('error');
  };
  return (
    <section aria-labelledby="letter-title" className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900" data-testid="letter-to-parents">
      <h3 id="letter-title" className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-slate-100"><Mail aria-hidden="true" className="h-4 w-4" /> Thư gửi ba mẹ</h3>
      <p className="mt-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-100" data-testid="letter-shared-notice">
        Thư này sẽ luôn được gửi cho ba mẹ đọc. Chỉ viết điều con muốn ba mẹ biết.
      </p>
      <label htmlFor="letter-input" className="mt-3 block text-sm font-black text-slate-900 dark:text-slate-100">Con muốn nói với ba mẹ…</label>
      <textarea id="letter-input" rows={3} value={text} maxLength={SPACE_LETTER_MAX_LENGTH}
        onChange={(event) => { setText(event.target.value); setState('idle'); }}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-slate-100" />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{Array.from(text).length}/{SPACE_LETTER_MAX_LENGTH}</span>
        <button type="button" disabled={!text.trim() || state === 'sending'} onClick={() => void send()}
          className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">{state === 'sending' ? 'Đang gửi…' : 'Gửi cho ba mẹ'}</button>
      </div>
      {state === 'sent' && <p role="status" className="mt-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">{preview ? 'Đã lưu thử trên thiết bị này, chưa gửi cho ba mẹ.' : 'Thư đã gửi cho ba mẹ rồi 💌'}</p>}
      {state === 'error' && <p role="status" className="mt-2 text-sm font-bold text-rose-700 dark:text-rose-300">Chưa gửi được. Con thử lại nhé (mỗi ngày gửi tối đa 5 thư).</p>}
      {letters.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Thư con đã gửi" data-testid="letters-sent">
          {letters.slice(0, 5).map((letter) => (
            <li key={letter.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:bg-zinc-800 dark:text-slate-100">
              <span className="block text-xs font-bold text-slate-600 dark:text-slate-400">{letter.local_date.slice(8)}/{letter.local_date.slice(5, 7)} · {letter.parent_heart ? 'Ba mẹ gửi tim 💗' : letter.read ? 'Ba mẹ đã đọc' : 'Chưa được đọc'}</span>
              <span className="whitespace-pre-line">{letter.letter_text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

'use client';

import { useState } from 'react';
import { Wind } from 'lucide-react';

const TIPS = [
  'Đếm 5 thứ con nhìn thấy, 4 thứ con chạm được, 3 âm thanh con nghe được.',
  'Ôm gối hoặc thú bông thật chặt, rồi thả lỏng từ từ.',
  'Nói với ba mẹ: "Con cần một cái ôm".',
  'Uống một ngụm nước, rồi hít thở thật chậm.',
] as const;

/** A short breathing game and a few things to try. It never asks the child to explain or to rate anything. */
export function CalmBox({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section aria-labelledby="calm-box-title" className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30" data-testid="calm-box">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex min-h-11 w-full items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100"><Wind className="h-5 w-5" /></span>
        <span>
          <span id="calm-box-title" className="block text-base font-black text-emerald-950 dark:text-emerald-100">Hộp bình tĩnh</span>
          <span className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">Khi con buồn, lo hay giận, mình thử cùng nhau nhé.</span>
        </span>
      </button>
      {open && (
        <div className="mt-4 grid gap-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/80 p-4 dark:bg-zinc-900/70">
            <div aria-hidden="true" className="calm-breath flex h-24 w-24 items-center justify-center rounded-full bg-emerald-300 text-2xl motion-reduce:animate-none dark:bg-emerald-700">🎈</div>
            <p className="text-center text-sm font-bold text-slate-900 dark:text-slate-100">Hít vào bằng mũi… đếm 1, 2, 3, 4. Thở ra bằng miệng… đếm 1, 2, 3, 4. Làm 5 lần nhé.</p>
          </div>
          <ul className="grid gap-2">
            {TIPS.map((tip) => (
              <li key={tip} className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900 dark:bg-zinc-900/70 dark:text-slate-100">{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

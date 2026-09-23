'use client';

import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, RotateCcw } from 'lucide-react';
import { z } from 'zod';
import type { Language } from '@/types';
import { dailyLetterFor, letterFromTemplateKey } from '@/lib/daily-mascot-letter';
import { getMascot } from '@/lib/mascots';
import { useAppStore } from '@/lib/store';

const cloudLetterSchema = z.object({
  templateKey: z.string().regex(/^(leo|bunny|panda|fox|turtle|bee)_[0-2]$/),
  readAt: z.string().datetime({ offset: true }).nullable(),
});

type CloudLetterState =
  | { readonly key: string; readonly kind: 'loading' | 'error' }
  | { readonly key: string; readonly kind: 'ready'; readonly templateKey: string; readonly readAt: string | null };

type Props = {
  readonly childId: string;
  readonly childName: string;
  readonly avatar: string;
  readonly language: Language;
};

export function MorningMascotLetter({ childId, childName, avatar, language }: Props) {
  const { ensureLocalDailyLetter, experience, markLocalDailyLetterRead, storageMode } = useAppStore();
  const [now, setNow] = useState<Date | null>(null);
  const [cloudState, setCloudState] = useState<CloudLetterState | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [readErrorKey, setReadErrorKey] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setNow(new Date()));
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const candidate = now ? dailyLetterFor(avatar, language, childName, now) : null;
  const date = candidate?.date;
  const templateKey = candidate?.templateKey;
  const stateKey = date ? `${childId}:${date}` : null;

  useEffect(() => {
    if (!date || !templateKey || !stateKey) return;
    if (storageMode === 'local') {
      queueMicrotask(() => ensureLocalDailyLetter(childId, date, templateKey));
      return;
    }

    const controller = new AbortController();
    queueMicrotask(() => setCloudState({ key: stateKey, kind: 'loading' }));
    async function loadLetter() {
      try {
        const query = new URLSearchParams({ childId, date: date ?? '' });
        const response = await fetch(`/api/mascot/letter?${query}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) {
          setCloudState({ key: stateKey ?? '', kind: 'error' });
          return;
        }
        const parsed = cloudLetterSchema.parse(await response.json());
        setCloudState({ key: stateKey ?? '', kind: 'ready', ...parsed });
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if (error instanceof Error) {
          setCloudState({ key: stateKey ?? '', kind: 'error' });
          return;
        }
        throw error;
      }
    }
    void loadLetter();
    return () => controller.abort();
  }, [childId, date, ensureLocalDailyLetter, retryCount, stateKey, storageMode, templateKey]);

  if (!candidate || !now || !stateKey) return null;

  const localRow = experience.letters.find((letter) => letter.child_id === childId && letter.local_date === date);
  const cloudReady = cloudState?.key === stateKey && cloudState.kind === 'ready' ? cloudState : null;
  const cloudError = cloudState?.key === stateKey && cloudState.kind === 'error';
  const readError = readErrorKey === stateKey;
  const selectedTemplate = storageMode === 'local' ? localRow?.template_key ?? templateKey : cloudReady?.templateKey;
  const readAt = storageMode === 'local' ? localRow?.read_at ?? null : cloudReady?.readAt ?? null;
  const letter = selectedTemplate ? letterFromTemplateKey(selectedTemplate, language, childName, now) : null;
  const isVietnamese = language === 'vi';
  const letterMascot = selectedTemplate ? getMascot(`mascot:${selectedTemplate.split('_')[0]}`) : null;
  const mascotName = letterMascot?.name ?? getMascot(avatar)?.name ?? 'Leo';

  async function markRead() {
    if (!letter || readAt || saving) return;
    if (storageMode === 'local') {
      markLocalDailyLetterRead(childId, letter.date, letter.templateKey);
      return;
    }
    setSaving(true);
    setReadErrorKey(null);
    try {
      const response = await fetch('/api/mascot/letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, date: letter.date }),
      });
      if (!response.ok) {
        setReadErrorKey(stateKey);
        return;
      }
      const parsed = cloudLetterSchema.parse(await response.json());
      setCloudState({ key: stateKey ?? '', kind: 'ready', ...parsed });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setReadErrorKey(stateKey);
        return;
      }
      throw error;
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="morning-letter-title" data-testid="morning-mascot-letter" className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-zinc-800 dark:text-amber-300">
          <BookOpen className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="morning-letter-title" className="text-lg font-extrabold text-sand-900 dark:text-slate-100">
            {isVietnamese ? `Thư buổi sáng từ ${mascotName}` : `Morning letter from ${mascotName}`}
          </h2>
          <p className="text-sm font-medium text-sand-700 dark:text-slate-300">
            {new Intl.DateTimeFormat(isVietnamese ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'long' }).format(now)}
          </p>
        </div>
        {readAt && (
          <div className="basis-full pl-14 sm:ml-auto sm:basis-auto sm:pl-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="size-4" /> {isVietnamese ? 'Đã đọc' : 'Read'}
            </span>
          </div>
        )}
      </div>

      {cloudError ? (
        <div className="mt-4" role="status">
          <p className="text-sm text-sand-700 dark:text-slate-300">{isVietnamese ? 'Chưa tải được thư. Vui lòng thử lại.' : 'The letter could not be loaded. Please try again.'}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 px-4 text-sm font-bold text-sand-900 hover:bg-amber-100 dark:border-zinc-600 dark:text-slate-100 dark:hover:bg-zinc-800">
            <RotateCcw className="size-4" /> {isVietnamese ? 'Thử lại' : 'Try again'}
          </button>
        </div>
      ) : letter ? (
        <>
          <p className="mt-4 text-base leading-7 text-sand-900 dark:text-slate-100">{letter.text}</p>
          {!readAt && (
            <>
              {readError && (
                <p className="mt-3 text-sm font-semibold text-red-700 dark:text-red-300" role="alert">
                  {isVietnamese ? 'Chưa lưu được trạng thái đã đọc. Hãy thử lại.' : 'Could not save your read status. Please try again.'}
                </p>
              )}
              <button type="button" disabled={saving} onClick={() => void markRead()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                <CheckCircle2 className="size-4" /> {saving ? (isVietnamese ? 'Đang lưu…' : 'Saving…') : (isVietnamese ? 'Mình đã đọc' : 'I have read it')}
              </button>
            </>
          )}
        </>
      ) : (
        <p className="mt-4 text-sm text-sand-700 dark:text-slate-300" role="status">{isVietnamese ? 'Đang mở thư…' : 'Opening your letter…'}</p>
      )}
    </section>
  );
}

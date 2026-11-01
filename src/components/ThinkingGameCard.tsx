'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import type { PublicPuzzle } from '@/lib/thinking-games/types';
import type { ThinkingGamePlayerProps } from './thinking-games/ThinkingGamePlayer';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import {
  finishThinkingGame,
  finishThinkingGameForParent,
  getThinkingGameState,
  getThinkingGameParentState,
  ThinkingGameRequestError,
  pauseThinkingGame,
  pauseThinkingGameForParent,
  startThinkingGame,
  startThinkingGameForParent,
} from '@/lib/store/thinking-games-client';
import {
  clearLocalThinkingGame,
  finishLocalThinkingGame,
  getLocalThinkingGame,
  pauseLocalThinkingGame,
  resumeLocalThinkingGame,
  startLocalThinkingGame,
  subscribeLocalThinkingGame,
} from '@/lib/store/thinking-games-local';
import { Play, ShieldAlert, Sparkles } from 'lucide-react';
import { getThinkingGamesViCopy } from '@/lib/i18n/thinking-games-copy';

type PauseAwarePlayerProps = ThinkingGamePlayerProps & {
  readonly onPauseRequest?: () => Promise<boolean> | boolean;
  readonly onResumeRequest?: () => Promise<boolean> | boolean;
};

const ThinkingGamePlayer = dynamic(
  () => import('./thinking-games/ThinkingGamePlayer').then((module) => module.ThinkingGamePlayer),
  { ssr: false },
) as unknown as ComponentType<PauseAwarePlayerProps>;

type Props = {
  childId: string;
  localDay: string;
  mode: 'paired' | 'parent' | 'local';
};

/** Say why a game did not open, in the family's words, instead of one generic "not ready" line. */
function startFailureNotice(error: unknown): string {
  const codes = getThinkingGamesViCopy().error.codes as Readonly<Record<string, string>>;
  if (error instanceof ThinkingGameRequestError) {
    if (error.code === 'feature_off') return 'Trò chơi đang tắt. Phụ huynh có thể bật trong Cài đặt.';
    const known = codes[error.code];
    if (known) return known;
    if (error.code === 'authentication_required') return 'Bạn cần đăng nhập lại để mở trò chơi.';
    return `Trò chơi chưa mở được (mã ${error.code}). Bạn thử lại sau nhé.`;
  }
  return 'Mất kết nối rồi. Bạn kiểm tra mạng và thử lại nhé.';
}

export function ThinkingGameCard({ childId, localDay, mode }: Props) {
  const [initialLocal] = useState(() => mode === 'local' ? getLocalThinkingGame() : null);
  const [puzzle, setPuzzle] = useState<PublicPuzzle | null>(initialLocal?.puzzle ?? null);
  const [attemptId, setAttemptId] = useState<string | null>(initialLocal?.attemptId ?? null);
  const [notice, setNotice] = useState<string>('');
  const [open, setOpen] = useState(Boolean(initialLocal));
  const [bonusAvailable, setBonusAvailable] = useState(false);
  const [starting, setStarting] = useState(false);
  const latestRequestId = useRef(0);
  const enabled = defaultExperienceFlags.thinkingGames;

  const applyLocalState = useCallback(() => {
    const state = getLocalThinkingGame();
    if (!state) {
      setPuzzle(null);
      setAttemptId(null);
      setOpen(false);
      return;
    }
    setPuzzle(state.puzzle);
    setAttemptId(state.attemptId);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (mode !== 'local') return;
    return subscribeLocalThinkingGame(applyLocalState);
  }, [applyLocalState, mode]);

  const refreshAvailability = useCallback(async () => {
    if (mode === 'local' || !enabled) return;
    const result = mode === 'parent'
      ? await getThinkingGameParentState({ childId, expectedLocalDay: localDay })
      : await getThinkingGameState(localDay);
    return result.ok && (result.data as { bonusAvailable?: boolean } | undefined)?.bonusAvailable === true;
  }, [childId, localDay, mode, enabled]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void refreshAvailability().then((available) => {
        if (active) setBonusAvailable(Boolean(available));
      }).catch(() => { if (active) setBonusAvailable(false); });
    };
    refresh();
    window.addEventListener('focus', refresh);
    // Habit approval on another device can grant a bonus while this card is mounted.
    const timer = mode === 'local' || !enabled ? undefined : window.setInterval(refresh, 60_000);
    return () => { active = false; window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [refreshAvailability, mode, enabled, open]);

  const start = useCallback(async (slot: 'main' | 'bonus' = 'main') => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    setNotice('');
    setStarting(true);
    if (mode === 'local') {
      const state = startLocalThinkingGame(slot);
      if (!state) setNotice('Chế độ luyện tập trên thiết bị chưa có nội dung phù hợp.');
      else { setPuzzle(state.puzzle); setAttemptId(state.attemptId); setOpen(true); }
      setStarting(false);
      return;
    }
    try {
      const result = mode === 'parent'
        ? await startThinkingGameForParent({ childId, slot, expectedLocalDay: localDay, commandId: crypto.randomUUID() })
        : await startThinkingGame({ slot, expectedLocalDay: localDay, commandId: crypto.randomUUID() });
      if (requestId !== latestRequestId.current || !result.ok) return;
      const data = result.data as { puzzle?: PublicPuzzle; attemptId?: string } | undefined;
      if (!data?.puzzle || !data.attemptId) setNotice('Hôm nay chưa có trò chơi phù hợp.');
      else { setPuzzle(data.puzzle); setAttemptId(data.attemptId); setOpen(true); }
    } catch (error) {
      if (requestId === latestRequestId.current) setNotice(startFailureNotice(error));
    } finally {
      if (requestId === latestRequestId.current) setStarting(false);
    }
  }, [childId, localDay, mode]);

  const pause = useCallback(async () => {
    if (!attemptId) return false;
    if (mode === 'local') return Boolean(pauseLocalThinkingGame());
    try {
      if (mode === 'parent') await pauseThinkingGameForParent({ childId, attemptId, commandId: crypto.randomUUID() });
      else await pauseThinkingGame({ attemptId, commandId: crypto.randomUUID() });
      return true;
    } catch {
      setNotice('Không thể lưu trạng thái tạm dừng.');
      return false;
    }
  }, [attemptId, childId, mode]);

  const resume = useCallback(() => {
    if (mode === 'local') return Boolean(resumeLocalThinkingGame());
    return true;
  }, [mode]);

  if (!enabled) return null;
  return (
    <div data-testid="thinking-game-panel">
      {!open && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={starting} onClick={() => void start()} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-6 text-base font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"><Play aria-hidden="true" className="h-5 w-5" /> {starting ? 'Đang mở…' : 'Chơi'}</button>
          {bonusAvailable && <button type="button" disabled={starting} onClick={() => void start('bonus')} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-indigo-300 bg-white px-5 text-base font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-700 dark:bg-zinc-900 dark:text-indigo-300"><Sparkles aria-hidden="true" className="h-5 w-5" /> Chơi thêm</button>}
        </div>
      )}
      {notice && <p role="status" className="mt-3 text-sm font-bold text-amber-900 dark:text-amber-100">{notice}</p>}
      {!open && <p className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-300">{mode === 'local' ? 'Luyện tập riêng trên thiết bị này, không ảnh hưởng dữ liệu gia đình.' : 'Luyện tập ngắn, không điểm thưởng và không thay đổi danh sách thói quen.'}</p>}
      {mode !== 'local' && !open && <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400"><ShieldAlert aria-hidden="true" className="h-4 w-4" /> Kết quả được xác nhận an toàn trên máy chủ.</p>}
      {open && puzzle && attemptId && (
        <div className="mt-5">
          <ThinkingGamePlayer
            puzzle={puzzle}
            onPauseRequest={pause}
            onResumeRequest={resume}
            onExit={() => { setOpen(false); setPuzzle(null); }}
            onSubmitAnswer={async (answer) => {
              if (mode === 'local') return finishLocalThinkingGame(answer);
              let response;
              try {
                response = mode === 'parent'
                ? await finishThinkingGameForParent({ childId, attemptId, answer, commandId: crypto.randomUUID() })
                : await finishThinkingGame({ attemptId, answer, commandId: crypto.randomUUID() });
              } catch (error) {
                if (error instanceof ThinkingGameRequestError && ['attempt_expired', 'day_changed'].includes(error.code)) {
                  setOpen(false);
                  setPuzzle(null);
                  setNotice('Lượt chơi đã hết ngày. Hãy tải lại trang để chơi ngày mới.');
                }
                throw error;
              }
              if (!response.ok) return { correct: false };
              const data = response.data as { won?: boolean; correct?: boolean } | undefined;
              return { correct: Boolean(data?.won ?? data?.correct) };
            }}
            onFinish={() => {
              if (mode === 'local') clearLocalThinkingGame();
              setOpen(false);
              setPuzzle(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

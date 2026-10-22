'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import type { PublicPuzzle } from '@/lib/thinking-games/types';
import type { ThinkingGamePlayerProps } from './thinking-games/ThinkingGamePlayer';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import {
  finishThinkingGame,
  finishThinkingGameForParent,
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

export function ThinkingGameCard({ childId, localDay, mode }: Props) {
  const [initialLocal] = useState(() => mode === 'local' ? getLocalThinkingGame() : null);
  const [puzzle, setPuzzle] = useState<PublicPuzzle | null>(initialLocal?.puzzle ?? null);
  const [attemptId, setAttemptId] = useState<string | null>(initialLocal?.attemptId ?? null);
  const [notice, setNotice] = useState<string>('');
  const [open, setOpen] = useState(Boolean(initialLocal));
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

  const start = useCallback(async () => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    setNotice('');
    if (mode === 'local') {
      const state = startLocalThinkingGame('main');
      if (!state) setNotice('Chế độ luyện tập trên thiết bị chưa có nội dung phù hợp.');
      else { setPuzzle(state.puzzle); setAttemptId(state.attemptId); setOpen(true); }
      return;
    }
    try {
      const result = mode === 'parent'
        ? await startThinkingGameForParent({ childId, slot: 'main', expectedLocalDay: localDay, commandId: crypto.randomUUID() })
        : await startThinkingGame({ slot: 'main', expectedLocalDay: localDay, commandId: crypto.randomUUID() });
      if (requestId !== latestRequestId.current || !result.ok) return;
      const data = result.data as { puzzle?: PublicPuzzle; attemptId?: string } | undefined;
      if (!data?.puzzle || !data.attemptId) setNotice('Hôm nay chưa có trò chơi phù hợp.');
      else { setPuzzle(data.puzzle); setAttemptId(data.attemptId); setOpen(true); }
    } catch {
      if (requestId === latestRequestId.current) setNotice('Trò chơi chưa sẵn sàng. Bạn có thể thử lại sau.');
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
    <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20" aria-labelledby="thinking-game-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="thinking-game-title" className="flex items-center gap-2 text-base font-black text-amber-950 dark:text-amber-100">
            <Sparkles aria-hidden="true" className="h-5 w-5 text-amber-600" /> Một trò chơi nhỏ hôm nay
          </h2>
          <p className="mt-1 text-sm font-medium text-amber-900/80 dark:text-amber-200/80">
            {mode === 'local' ? 'Luyện tập riêng trên thiết bị này, không ảnh hưởng dữ liệu gia đình.' : 'Luyện tập ngắn, không điểm thưởng và không thay đổi danh sách thói quen.'}
          </p>
        </div>
        {!open && <button type="button" onClick={() => void start()} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><Play aria-hidden="true" className="h-4 w-4" /> Chơi</button>}
      </div>
      {notice && <p role="status" className="mt-3 text-sm font-bold text-amber-900 dark:text-amber-100">{notice}</p>}
      {mode !== 'local' && <p className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-900/70 dark:text-amber-200/70"><ShieldAlert aria-hidden="true" className="h-4 w-4" /> Kết quả được xác nhận an toàn trên máy chủ.</p>}
      {open && puzzle && attemptId && (
        <div className="mt-5">
          <ThinkingGamePlayer
            puzzle={puzzle}
            onPauseRequest={pause}
            onResumeRequest={resume}
            onExit={() => { setOpen(false); setPuzzle(null); }}
            onSubmitAnswer={async (answer) => {
              if (mode === 'local') return finishLocalThinkingGame(answer);
              const response = mode === 'parent'
                ? await finishThinkingGameForParent({ childId, attemptId, answer, commandId: crypto.randomUUID() })
                : await finishThinkingGame({ attemptId, answer, commandId: crypto.randomUUID() });
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
    </section>
  );
}

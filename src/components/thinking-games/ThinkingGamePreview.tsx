'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import pilotManifest from '../../../content/thinking-games/pilot/pilot-manifest-v1.json';
import p06Fixtures from '../../../content/thinking-games/p06-fixtures/p06-fixtures-v1.json';
import { checkAnswer, toPublicPuzzle, type GameTypeId, type PuzzleItem } from '@/lib/thinking-games';
import {
  ThinkingGameFrame,
  type ThinkingGameState,
} from './ThinkingGameFrame';
import { ThinkingGamePlayer } from './ThinkingGamePlayer';

const SCENARIOS: readonly { id: ThinkingGameState; label: string }[] = [
  { id: 'invitation', label: '1. Lời mời (invitation)' },
  { id: 'tutorial', label: '2. Hướng dẫn (tutorial)' },
  { id: 'playing', label: '3. Đang chơi (playing)' },
  { id: 'paused', label: '4. Tạm dừng (paused)' },
  { id: 'hints', label: '5. Gợi ý (hints)' },
  { id: 'wrong', label: '6. Chưa khớp (wrong/incorrect)' },
  { id: 'finish', label: '7. Hoàn thành (finish/completion)' },
  { id: 'explanation', label: '8. Giải thích (explanation)' },
  { id: 'loading', label: '9. Đang tải (loading)' },
  { id: 'error', label: '10. Lỗi hệ thống (error)' },
  { id: 'network_pending', label: '11. Mất mạng (offline/pending)' },
  { id: 'approval_waiting', label: '12. Chờ phụ huynh duyệt (approval waiting)' },
  { id: 'bonus_locked', label: '13. Thử thách phụ bị khóa (bonus locked)' },
  { id: 'bedtime', label: '14. Giờ ngủ (bedtime)' },
  { id: 'missing_content', label: '15. Nội dung chưa có (missing content)' },
  { id: 'exit', label: '16. Xác nhận thoát (exit)' },
  { id: 'retry', label: '17. Thử lại (retry)' },
];

export type PreviewMode = 'scenarios' | 'pilot' | 'p06';

export const P06_GAME_TYPE_IDS: readonly GameTypeId[] = [
  'g01-t2',
  'g01-t3',
  'g02-t1',
  'g02-t2',
  'g02-t3',
  'g03-t2',
  'g03-t3',
  'g04-t1',
  'g04-t2',
  'g04-t3',
  'g05-t1',
  'g05-t2',
  'g05-t3',
  'g06-t2',
  'g06-t3',
  'g07-t1',
  'g07-t2',
  'g07-t3',
  'g08-t1',
  'g08-t2',
  'g08-t3',
];

export function ThinkingGamePreview() {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [previewMode, setPreviewMode] = useState<PreviewMode>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.search.includes('mode=p06')) return 'p06';
      if (window.location.search.includes('mode=pilot')) return 'pilot';
    }
    return 'scenarios';
  });
  const [state, setState] = useState<ThinkingGameState>('invitation');
  const [slotType, setSlotType] = useState<'main' | 'bonus'>('main');
  const [ageTrack, setAgeTrack] = useState<'age_6_8' | 'age_9_12'>('age_6_8');
  const [dayIndex, setDayIndex] = useState<number>(1);
  const [selectedGameType, setSelectedGameType] = useState<GameTypeId>('g01-t2');
  const [variantIndex, setVariantIndex] = useState<number>(0);
  const [activeHintLevel, setActiveHintLevel] = useState<0 | 1 | 2>(0);
  const [praiseType, setPraiseType] = useState<'persistence' | 'strategy'>('persistence');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<string>('none');
  const [mockBoardAnswer, setMockBoardAnswer] = useState<string | null>(null);
  const [playerResetKey, setPlayerResetKey] = useState<number>(0);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', nextDark);
    }
  };

  const handleAction = (eventName: string, nextState?: ThinkingGameState) => {
    setLastEvent(eventName);
    if (nextState) {
      setState(nextState);
    }
  };

  // Find the pilot item for current (dayIndex, slotType, ageTrack)
  const currentPilotItem = useMemo(() => {
    const items = pilotManifest.items as unknown as readonly PuzzleItem[];
    return items.find(
      (item) =>
        item.dayIndex === dayIndex &&
        item.slotType === slotType &&
        item.ageTrack === ageTrack
    ) ?? null;
  }, [dayIndex, slotType, ageTrack]);

  const publicPuzzle = useMemo(() => {
    if (!currentPilotItem) return null;
    return toPublicPuzzle(currentPilotItem);
  }, [currentPilotItem]);

  // Filter all items for the selected gameTypeId and ageTrack
  const p06TypeItems = useMemo(() => {
    const items = p06Fixtures.items as unknown as readonly PuzzleItem[];
    return items.filter(
      (item) => item.gameTypeId === selectedGameType && item.ageTrack === ageTrack
    );
  }, [selectedGameType, ageTrack]);

  const currentP06Item = useMemo(() => {
    if (p06TypeItems.length === 0) return null;
    return p06TypeItems[variantIndex % p06TypeItems.length] ?? p06TypeItems[0] ?? null;
  }, [p06TypeItems, variantIndex]);

  const publicP06Puzzle = useMemo(() => {
    if (!currentP06Item) return null;
    return toPublicPuzzle(currentP06Item);
  }, [currentP06Item]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 transition-colors dark:bg-zinc-950 sm:p-8">
      {/* Technical Harness Header (External dev controls, strictly outside child surface) */}
      <section
        data-testid="harness-panel"
        data-hydrated={isHydrated ? 'true' : 'false'}
        aria-label="Khung điều khiển thử nghiệm nội bộ"
        className="mx-auto mb-6 max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm dark:border-amber-800/60 dark:bg-zinc-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-3 dark:border-zinc-800">
          <div>
            <span className="inline-block rounded-md bg-amber-200 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
              Dev-Only UI Fixture
            </span>
            <h1 className="mt-1 text-base font-extrabold text-slate-900 dark:text-slate-100">
              Harness Kiểm Thử Giao Diện Trò Chơi Tư Duy
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Thử nghiệm 28 bộ dữ liệu pilot thực tế + 17 trạng thái khung. Không cấp thưởng/sao, không lưu backend.
            </p>
          </div>
          <button
            type="button"
            data-testid="theme-toggle"
            onClick={toggleDarkMode}
            className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
          >
            {isDarkMode ? '☀️ Giao diện Sáng' : '🌙 Giao diện Tối'}
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-amber-200/70 pb-3 dark:border-zinc-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Chế độ xem:</span>
          <button
            type="button"
            data-testid="tab-frame-scenarios"
            onClick={() => setPreviewMode('scenarios')}
            className={`min-h-[38px] rounded-xl px-3 py-1 text-xs font-bold transition ${
              previewMode === 'scenarios'
                ? 'bg-amber-800 text-white dark:bg-amber-700'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200'
            }`}
          >
            🖼️ 17 Kịch Bản Khung (Frame Harness)
          </button>
          <button
            type="button"
            data-testid="tab-playable-pilot"
            onClick={() => setPreviewMode('pilot')}
            className={`min-h-[38px] rounded-xl px-3 py-1 text-xs font-bold transition ${
              previewMode === 'pilot'
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200'
            }`}
          >
            🎮 28 Trò Chơi Pilot (Playable Renderers)
          </button>
          <button
            type="button"
            data-testid="tab-playable-p06"
            onClick={() => setPreviewMode('p06')}
            className={`min-h-[38px] rounded-xl px-3 py-1 text-xs font-bold transition ${
              previewMode === 'p06'
                ? 'bg-purple-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200'
            }`}
          >
            🧩 21 Định Dạng Mới (P06 Formats)
          </button>
        </div>

        {/* Harness control controls */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          {/* Scenario Selector (Scenarios Mode Only) */}
          {previewMode === 'scenarios' && (
            <div className="flex flex-col">
              <label htmlFor="scenario-select" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kịch bản (Scenario):
              </label>
              <select
                id="scenario-select"
                data-testid="scenario-select"
                value={state}
                onChange={(e) => {
                  const next = e.target.value as ThinkingGameState;
                  setState(next);
                  setLastEvent(`select_scenario:${next}`);
                  if (next === 'hints') {
                    setActiveHintLevel(1);
                  }
                }}
                className="mt-1 min-h-[44px] rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* P06 Game Type Selector (P06 Mode Only) */}
          {previewMode === 'p06' && (
            <>
              <div className="flex flex-col">
                <label htmlFor="game-type-select" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Định dạng (21 dạng):
                </label>
                <select
                  id="game-type-select"
                  data-testid="game-type-select"
                  value={selectedGameType}
                  onChange={(e) => {
                    setSelectedGameType(e.target.value as GameTypeId);
                    setPlayerResetKey((k) => k + 1);
                  }}
                  className="mt-1 min-h-[44px] rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
                >
                  {P06_GAME_TYPE_IDS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="variant-select" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Biến thể:
                </label>
                <select
                  id="variant-select"
                  data-testid="variant-select"
                  value={variantIndex}
                  onChange={(e) => {
                    setVariantIndex(Number(e.target.value));
                    setPlayerResetKey((k) => k + 1);
                  }}
                  className="mt-1 min-h-[44px] rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
                >
                  {p06TypeItems.map((item, idx) => (
                    <option key={item.id} value={idx}>
                      #{idx + 1} ({item.id})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Slot Selector */}
          <div className="flex flex-col">
            <label htmlFor="slot-select" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Loại ô thử thách:
            </label>
            <select
              id="slot-select"
              data-testid="slot-select"
              value={slotType}
              onChange={(e) => {
                setSlotType(e.target.value as 'main' | 'bonus');
                setPlayerResetKey((k) => k + 1);
              }}
              className="mt-1 min-h-[44px] rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
            >
              <option value="main">Chính (main)</option>
              <option value="bonus">Mở rộng (bonus)</option>
            </select>
          </div>

          {/* Age Track */}
          <div className="flex flex-col">
            <label htmlFor="age-select" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nhóm tuổi:
            </label>
            <select
              id="age-select"
              data-testid="age-select"
              value={ageTrack}
              onChange={(e) => {
                setAgeTrack(e.target.value as 'age_6_8' | 'age_9_12');
                setPlayerResetKey((k) => k + 1);
              }}
              className="mt-1 min-h-[44px] rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
            >
              <option value="age_6_8">6–8 tuổi (Nút to 56px)</option>
              <option value="age_9_12">9–12 tuổi (Nút 48px)</option>
            </select>
          </div>

          {/* Praise Type */}
          <div className="flex flex-col">
            <label htmlFor="praise-select" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Kiểu khen ngợi:
            </label>
            <select
              id="praise-select"
              data-testid="praise-select"
              value={praiseType}
              onChange={(e) => setPraiseType(e.target.value as 'persistence' | 'strategy')}
              className="mt-1 min-h-[44px] rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
            >
              <option value="persistence">Kiên trì (persistence)</option>
              <option value="strategy">Chiến lược (strategy)</option>
            </select>
          </div>

          {/* Day Index */}
          <div className="flex flex-col">
            <label htmlFor="day-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Ngày (1–7 pilot):
            </label>
            <input
              id="day-input"
              data-testid="day-input"
              type="number"
              min={1}
              max={365}
              value={dayIndex}
              onChange={(e) => {
                setDayIndex(Number(e.target.value) || 1);
                setPlayerResetKey((k) => k + 1);
              }}
              className="mt-1 min-h-[44px] rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Quick Scenario Jump Buttons (Scenarios Mode Only) */}
        {previewMode === 'scenarios' && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-400">Chuyển nhanh:</span>
            {SCENARIOS.slice(0, 8).map((s) => (
              <button
                key={s.id}
                type="button"
                data-testid={`scenario-btn-${s.id}`}
                onClick={() => {
                  setState(s.id);
                  setLastEvent(`quick_jump:${s.id}`);
                  if (s.id === 'hints') setActiveHintLevel(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  state === s.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300'
                }`}
              >
                {s.id}
              </button>
            ))}
            <span className="text-slate-400">|</span>
            {SCENARIOS.slice(8).map((s) => (
              <button
                key={s.id}
                type="button"
                data-testid={`scenario-btn-${s.id}`}
                onClick={() => {
                  setState(s.id);
                  setLastEvent(`quick_jump:${s.id}`);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  state === s.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300'
                }`}
              >
                {s.id}
              </button>
            ))}
          </div>
        )}

        {/* Pilot 28 Fixture Inspector Banner (Pilot Mode Only) */}
        {previewMode === 'pilot' && (
          <div
            data-testid="pilot-fixture-banner"
            className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs dark:border-indigo-900 dark:bg-zinc-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  {currentPilotItem?.gameTypeId ?? 'N/A'}
                </span>
                <span className="font-mono font-bold text-indigo-950 dark:text-indigo-200">
                  {currentPilotItem?.id ?? 'Không có item'}
                </span>
                <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                  Pilot Fixture (Pending Human Approval)
                </span>
              </div>
              <button
                type="button"
                data-testid="replay-pilot-btn"
                onClick={() => setPlayerResetKey((k) => k + 1)}
                className="rounded-lg border border-indigo-300 bg-white px-2.5 py-1 font-bold text-indigo-700 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-700 dark:text-indigo-200"
              >
                🔄 Chơi lại từ đầu
              </button>
            </div>
            {currentPilotItem && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 sm:grid-cols-4">
                <div>
                  Kỹ năng: <strong className="text-slate-900 dark:text-slate-100">{currentPilotItem.skillGroup}</strong>
                </div>
                <div>
                  Dạng biến thể: <strong className="text-slate-900 dark:text-slate-100">{currentPilotItem.ruleVariantId}</strong>
                </div>
                <div>
                  Thời gian đích: <strong className="text-slate-900 dark:text-slate-100">{currentPilotItem.targetSeconds}s</strong>
                </div>
                <div className="truncate" title={currentPilotItem.fingerprint}>
                  Fingerprint: <code className="font-mono text-[10px]">{currentPilotItem.fingerprint.slice(0, 10)}...</code>
                </div>
              </div>
            )}
          </div>
        )}

        {/* P06 168 Fixture Inspector Banner (P06 Mode Only) */}
        {previewMode === 'p06' && (
          <div
            data-testid="p06-fixture-banner"
            className="mt-3 rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-xs dark:border-purple-900 dark:bg-zinc-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  {currentP06Item?.gameTypeId ?? 'N/A'}
                </span>
                <span className="font-mono font-bold text-purple-950 dark:text-purple-200">
                  {currentP06Item?.id ?? 'Không có item'}
                </span>
                <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                  P06 Fixture (Internal Test Only)
                </span>
              </div>
              <button
                type="button"
                data-testid="replay-p06-btn"
                onClick={() => setPlayerResetKey((k) => k + 1)}
                className="rounded-lg border border-purple-300 bg-white px-2.5 py-1 font-bold text-purple-700 hover:bg-purple-50 dark:border-zinc-700 dark:bg-zinc-700 dark:text-purple-200"
              >
                🔄 Chơi lại từ đầu
              </button>
            </div>
            {currentP06Item && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 sm:grid-cols-4">
                <div>
                  Kỹ năng: <strong className="text-slate-900 dark:text-slate-100">{currentP06Item.skillGroup}</strong>
                </div>
                <div>
                  Dạng biến thể: <strong className="text-slate-900 dark:text-slate-100">{currentP06Item.ruleVariantId}</strong>
                </div>
                <div>
                  Thời gian đích: <strong className="text-slate-900 dark:text-slate-100">{currentP06Item.targetSeconds}s</strong>
                </div>
                <div className="truncate" title={currentP06Item.fingerprint}>
                  Fingerprint: <code className="font-mono text-[10px]">{currentP06Item.fingerprint.slice(0, 10)}...</code>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Diagnostic Status Strip */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/60 pt-2 text-xs text-slate-600 dark:border-zinc-800 dark:text-slate-400">
          <div>
            Trạng thái hiện tại:{' '}
            <span data-testid="harness-state-display" className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
              {state}
            </span>
          </div>
          <div>
            Sự kiện vừa kích hoạt:{' '}
            <span data-testid="harness-last-event" className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {lastEvent}
            </span>
          </div>
        </div>
      </section>

      {/* Child Game Frame Render Surface */}
      <div className="mx-auto max-w-lg">
        {previewMode === 'p06' ? (
          publicP06Puzzle && currentP06Item ? (
            <ThinkingGamePlayer
              key={`${publicP06Puzzle.id}-${playerResetKey}`}
              puzzle={publicP06Puzzle}
              ageTrack={ageTrack}
              slotType={slotType}
              dayIndex={currentP06Item.dayIndex}
              praiseType={praiseType}
              explanationText={currentP06Item.explanation}
              onSubmitAnswer={(answer) => {
                const check = checkAnswer(currentP06Item, answer);
                const isCorrect = check.ok && check.correct;
                handleAction(`p06_submit:${isCorrect ? 'correct' : 'wrong'}`);
                return isCorrect;
              }}
              onFinish={() => {
                handleAction('p06_finish');
              }}
              onExit={() => {
                handleAction('p06_exit');
              }}
            />
          ) : (
            <div
              data-testid="no-p06-item"
              className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Không tìm thấy dữ liệu P06 cho {selectedGameType}
              </h2>
            </div>
          )
        ) : previewMode === 'pilot' ? (
          publicPuzzle && currentPilotItem ? (
            <ThinkingGamePlayer
              key={`${publicPuzzle.id}-${playerResetKey}`}
              puzzle={publicPuzzle}
              ageTrack={ageTrack}
              slotType={slotType}
              dayIndex={dayIndex}
              praiseType={praiseType}
              explanationText={currentPilotItem.explanation}
              onSubmitAnswer={(answer) => {
                const check = checkAnswer(currentPilotItem, answer);
                const isCorrect = check.ok && check.correct;
                handleAction(`pilot_submit:${isCorrect ? 'correct' : 'wrong'}`);
                return isCorrect;
              }}
              onFinish={() => {
                handleAction('pilot_finish');
              }}
              onExit={() => {
                handleAction('pilot_exit');
              }}
            />
          ) : (
            <div
              data-testid="no-pilot-item"
              className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Không tìm thấy dữ liệu pilot cho Ngày {dayIndex}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Bộ dữ liệu pilot thử nghiệm hiện tại gồm 7 ngày (28 câu đố). Vui lòng chọn ngày từ 1 đến 7.
              </p>
            </div>
          )
        ) : (
          <ThinkingGameFrame
            state={state}
            slotType={slotType}
            title="Quy luật hình vẽ vui nhộn"
            dayIndex={dayIndex}
            ageTrack={ageTrack}
            activeHintLevel={activeHintLevel}
            praiseType={praiseType}
            mascotName="Gấu Chăm Chỉ"
            invitationText="Hôm nay mình có một chuỗi hình bí ẩn đang đợi bạn khám phá đấy!"
            tutorialText="Bạn hãy nhìn thật kỹ hàng hình bên dưới để tìm ra hình tiếp theo nhé!"
            explanationText="Quy luật là hình tròn đỏ và hình vuông xanh xen kẽ nhau: Tròn - Vuông - Tròn - Vuông."
            hints={[
              'Gợi ý 1: Bạn chú ý xem màu sắc của các hình đang lặp lại như thế nào nhé.',
              'Gợi ý 2: Sau một hình tròn màu đỏ luôn là một hình vuông màu xanh đấy!',
            ]}
            errorCode={state === 'error' ? 'RATE_LIMIT_EXCEEDED' : undefined}
            statusMessage={state === 'error' ? 'Hôm nay bạn đã thử nhiều lần rồi, nghỉ ngơi một chút rồi quay lại nhé!' : undefined}
            onStart={() => handleAction('onStart', 'playing')}
            onPause={() => handleAction('onPause', 'paused')}
            onResume={() => handleAction('onResume', 'playing')}
            onRequestHint={() => {
              const nextLevel = ((activeHintLevel % 2) + 1) as 1 | 2;
              setActiveHintLevel(nextLevel);
              handleAction(`onRequestHint:level_${nextLevel}`, 'hints');
            }}
            onRetry={() => {
              setMockBoardAnswer(null);
              handleAction('onRetry', 'playing');
            }}
            onExit={() => handleAction('onExit', 'exit')}
            onFinishAcknowledge={() => {
              setMockBoardAnswer(null);
              handleAction('onFinishAcknowledge', 'invitation');
            }}
            onViewTasks={() => handleAction('onViewTasks')}
          >
            {/* Simple mock children slot exercising board area */}
            <div data-testid="mock-board" className="flex flex-col items-center gap-3 py-2 text-center">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Hình nào sẽ là hình tiếp theo trong chuỗi?
              </p>

              {/* Pattern demonstration sequence */}
              <div className="flex items-center justify-center gap-2 py-2" aria-label="Dãy hình mẫu">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-lg shadow-sm" aria-label="Hình tròn đỏ">
                  🔴
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-lg shadow-sm" aria-label="Hình vuông xanh">
                  🟦
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-lg shadow-sm" aria-label="Hình tròn đỏ">
                  🔴
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50 text-base font-black text-indigo-700 dark:bg-zinc-800 dark:text-indigo-300" aria-label="Ô trống cần điền">
                  {mockBoardAnswer || '?'}
                </span>
              </div>

              {/* Interactive choices */}
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  data-testid="mock-answer-wrong"
                  onClick={() => {
                    setMockBoardAnswer('🔴');
                    handleAction('mock_pick_wrong', 'wrong');
                  }}
                  className="flex min-h-[48px] min-w-[48px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
                >
                  <span>🔴</span>
                  <span>Hình tròn đỏ</span>
                </button>

                <button
                  type="button"
                  data-testid="mock-answer-correct"
                  onClick={() => {
                    setMockBoardAnswer('🟦');
                    handleAction('mock_pick_correct', 'finish');
                  }}
                  className="flex min-h-[48px] min-w-[48px] items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-800 shadow-sm transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                >
                  <span>🟦</span>
                  <span>Hình vuông xanh (Đúng)</span>
                </button>
              </div>

              <div className="mt-1 flex items-center justify-center gap-2">
                <button
                  type="button"
                  data-testid="mock-board-reset"
                  onClick={() => {
                    setMockBoardAnswer(null);
                    handleAction('mock_reset');
                  }}
                  className="min-h-[44px] text-xs font-semibold text-slate-500 underline hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Đặt lại ô câu đố
                </button>
              </div>

              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Khu vực câu đố thử nghiệm độc lập. Không chấm điểm backend, không trao sao thật.
              </p>
            </div>
          </ThinkingGameFrame>
        )}
      </div>
    </div>
  );
}

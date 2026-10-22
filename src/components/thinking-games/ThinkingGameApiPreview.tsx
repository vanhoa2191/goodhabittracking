'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { PublicPuzzle, SlotType } from '@/lib/thinking-games/types';
import { ThinkingGamePlayer } from './ThinkingGamePlayer';
import { localDayKey } from '@/lib/local-day';

type Mode = 'paired' | 'parent';

interface ChildOption {
  id: string;
  name: string;
  ageTrack: 'age_6_8' | 'age_9_12';
  token: string;
}

const KNOWN_CHILDREN: ChildOption[] = [
  {
    id: 'cccccccc-0000-4000-8000-00000000000a',
    name: 'Bé An (6-8 tuổi)',
    ageTrack: 'age_6_8',
    token: 'session_token_alpha_68_live_af21630b3b9d5a17731c28aec3b0856e',
  },
  {
    id: 'cccccccc-0000-4000-8000-00000000000c',
    name: 'Bé Bình (9-12 tuổi)',
    ageTrack: 'age_9_12',
    token: 'session_token_alpha_912_live_716bf628437c51f2f7d98d7877d486b6',
  },
  {
    id: 'cccccccc-0000-4000-8000-00000000000b',
    name: 'Bé Cúc (Gia đình khác - Beta)',
    ageTrack: 'age_6_8',
    token: 'session_token_beta_live_6401723ed5434445df40f5ebf8cdb225',
  },
];

const KIND_TO_GAME_TYPE: Record<string, string> = {
  'rule-sequence': 'g01-t1',
  'rule-error': 'g01-t2',
  'rule-transform': 'g01-t3',
  'spatial-silhouette': 'g02-t1',
  'spatial-rotation': 'g02-t2',
  'spatial-symmetry': 'g02-t3',
  'memory-sequence': 'g03-t1',
  'memory-position': 'g03-t2',
  'memory-change': 'g03-t3',
  'observation-difference': 'g04-t1',
  'observation-two-traits': 'g04-t2',
  'observation-implausible': 'g04-t3',
  'reasoning-elimination': 'g05-t1',
  'reasoning-if-then': 'g05-t2',
  'reasoning-missing-info': 'g05-t3',
  'path-planning': 'g06-t1',
  'planning-command-order': 'g06-t2',
  'planning-fix-step': 'g06-t3',
  'flexibility-alternative': 'g07-t1',
  'flexibility-classify': 'g07-t2',
  'flexibility-perspective': 'g07-t3',
  'quantity-balance': 'g08-t1',
  'quantity-target': 'g08-t2',
  'quantity-grouping': 'g08-t3',
};

function normalizePublicPuzzle(
  raw: PublicPuzzle,
  child: ChildOption,
  slot: SlotType,
  expectedDay: string
): PublicPuzzle {
  const gameTypeId =
    raw.gameTypeId ||
    (raw.boardData?.kind ? KIND_TO_GAME_TYPE[raw.boardData.kind] : undefined) ||
    'g01-t1';
  return {
    ...raw,
    id: raw.id || `${child.id}-${slot}-${expectedDay}`,
    gameTypeId,
    ageTrack: raw.ageTrack || child.ageTrack,
    slotType: raw.slotType || slot,
    dayIndex: raw.dayIndex || 1,
  };
}

export function ThinkingGameApiPreview() {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [mode, setMode] = useState<Mode>('paired');
  const [selectedChildId, setSelectedChildId] = useState<string>(KNOWN_CHILDREN[0].id);
  const [slot, setSlot] = useState<SlotType>('main');
  const [expectedLocalDay, setExpectedLocalDay] = useState<string>(() => localDayKey(new Date()));
  const [useRevokedToken, setUseRevokedToken] = useState<boolean>(false);

  // Parent Auth State
  const parentEmail = 'parent-alpha@example.invalid';
  const parentPassword = 'ParentPassword123!';
  const [authStatus, setAuthStatus] = useState<string>('checking');

  // Parent PIN State
  const [candidatePin, setCandidatePin] = useState<string>('1234');
  const [pinStatus, setPinStatus] = useState<string>('idle');

  // Active Game State
  const [puzzle, setPuzzle] = useState<PublicPuzzle | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [entitlementId, setEntitlementId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Evidence state
  const [lastApiCall, setLastApiCall] = useState<{ method: string; url: string; status: number; body?: unknown; response?: unknown } | null>(null);
  const [dbEvidence, setDbEvidence] = useState<{
    attemptState?: string;
    attemptWon?: boolean | null;
    entitlementState?: string;
    journeyIndex?: number;
    wonCount?: number;
  }>({});

  const selectedChild = KNOWN_CHILDREN.find((c) => c.id === selectedChildId) ?? KNOWN_CHILDREN[0];

  useEffect(() => {
    let cancelled = false;
    fetch('/thinking-games-api-preview/auth-helper')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          if (data.authenticated && data.user) {
            setAuthStatus(`authenticated: ${data.user.email}`);
          } else {
            setAuthStatus('unauthenticated');
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthStatus('unauthenticated');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshDbEvidence = useCallback(
    async (curAttemptId?: string, curEntitlementId?: string, curChildId?: string) => {
      const aId = curAttemptId ?? attemptId;
      const eId = curEntitlementId ?? entitlementId;
      const cId = curChildId ?? selectedChildId;
      if (!aId && !eId && !cId) return;

      try {
        const params = new URLSearchParams();
        if (aId) params.set('attemptId', aId);
        if (eId) params.set('entitlementId', eId);
        if (cId) params.set('childId', cId);

        const res = await fetch(`/thinking-games-api-preview/evidence?${params.toString()}`);
        const data = await res.json();
        if (data.ok) {
          setDbEvidence({
            attemptState: data.attempt?.state,
            attemptWon: data.attempt?.result?.won ?? null,
            entitlementState: data.entitlement?.state,
            journeyIndex: data.journey?.next_day_index,
            wonCount: data.wonCount,
          });
        }
      } catch {
        // ignore in preview
      }
    },
    [attemptId, entitlementId, selectedChildId]
  );

  const handleLoginParent = async () => {
    try {
      const res = await fetch('/thinking-games-api-preview/auth-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: parentEmail, password: parentPassword }),
      });
      const data = await res.json();
      if (data.ok && data.user) {
        setAuthStatus(`authenticated: ${data.user.email}`);
      } else {
        setAuthStatus(`error: ${data.error}`);
      }
    } catch (e) {
      setAuthStatus(`error: ${String(e)}`);
    }
  };

  const handleLogoutParent = async () => {
    try {
      await fetch('/thinking-games-api-preview/auth-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signOut: true }),
      });
      setAuthStatus('unauthenticated');
    } catch (e) {
      setAuthStatus(`error: ${String(e)}`);
    }
  };

  const handleVerifyPin = async () => {
    try {
      const res = await fetch('/api/parent-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: candidatePin }),
      });
      const data = await res.json();
      setPinStatus(data.status ?? 'failed');
    } catch (e) {
      setPinStatus(`error: ${String(e)}`);
    }
  };

  const handleStartGame = async () => {
    setIsStarting(true);
    setNotice('');
    setPuzzle(null);
    setAttemptId(null);
    setEntitlementId(null);

    const commandId = crypto.randomUUID();

    try {
      if (mode === 'paired') {
        const activeToken = useRevokedToken
          ? 'session_token_alpha_revoked_5367dc379ccd2b182b9451693d57fa96'
          : selectedChild.token;

        await fetch('/thinking-games-api-preview/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: activeToken }),
        });

        const startRes = await fetch('/api/child/thinking-games/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot, expectedLocalDay, commandId }),
        });

        const startData = await startRes.json();
        setLastApiCall({
          method: 'POST',
          url: '/api/child/thinking-games/start',
          status: startRes.status,
          body: { slot, expectedLocalDay, commandId },
          response: startData,
        });

        if (!startRes.ok || !startData.ok) {
          setNotice(startData.code || startData.error || 'start_failed');
          return;
        }

        const data = startData.data as {
          puzzle?: PublicPuzzle;
          attemptId?: string;
          entitlementId?: string;
          state?: string;
        };
        if (data?.puzzle && data.attemptId) {
          setPuzzle(normalizePublicPuzzle(data.puzzle, selectedChild, slot, expectedLocalDay));
          setAttemptId(data.attemptId);
          setEntitlementId(data.entitlementId ?? null);
          refreshDbEvidence(data.attemptId, data.entitlementId, selectedChild.id);
        } else if (data?.attemptId) {
          setAttemptId(data.attemptId);
          setEntitlementId(data.entitlementId ?? null);
          setNotice(`attempt_already_${data?.state || 'completed'}`);
          refreshDbEvidence(data.attemptId, data.entitlementId, selectedChild.id);
        } else {
          setNotice('no_content_returned');
        }
      } else {
        // Parent mode
        const startRes = await fetch('/api/domain/thinking-games/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId: selectedChild.id,
            slot,
            expectedLocalDay,
            commandId,
          }),
        });

        const startData = await startRes.json();
        setLastApiCall({
          method: 'POST',
          url: '/api/domain/thinking-games/start',
          status: startRes.status,
          body: { childId: selectedChild.id, slot, expectedLocalDay, commandId },
          response: startData,
        });

        if (!startRes.ok || !startData.ok) {
          setNotice(startData.code || startData.error || 'start_failed');
          return;
        }

        const data = startData.data as {
          puzzle?: PublicPuzzle;
          attemptId?: string;
          entitlementId?: string;
          state?: string;
        };
        if (data?.puzzle && data.attemptId) {
          setPuzzle(normalizePublicPuzzle(data.puzzle, selectedChild, slot, expectedLocalDay));
          setAttemptId(data.attemptId);
          setEntitlementId(data.entitlementId ?? null);
          refreshDbEvidence(data.attemptId, data.entitlementId, selectedChild.id);
        } else if (data?.attemptId) {
          setAttemptId(data.attemptId);
          setEntitlementId(data.entitlementId ?? null);
          setNotice(`attempt_already_${data?.state || 'completed'}`);
          refreshDbEvidence(data.attemptId, data.entitlementId, selectedChild.id);
        } else {
          setNotice('no_content_returned');
        }
      }
    } catch (err) {
      setNotice(`exception: ${String(err)}`);
    } finally {
      setIsStarting(false);
    }
  };

  const handlePauseRequest = async (): Promise<boolean> => {
    if (!attemptId) return false;
    const commandId = crypto.randomUUID();

    try {
      const url =
        mode === 'paired'
          ? '/api/child/thinking-games/pause'
          : '/api/domain/thinking-games/pause';
      const body =
        mode === 'paired'
          ? { attemptId, commandId }
          : { childId: selectedChild.id, attemptId, commandId };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setLastApiCall({ method: 'POST', url, status: res.status, body, response: data });

      if (res.ok && data.ok) {
        refreshDbEvidence();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleResumeRequest = async (): Promise<boolean> => {
    refreshDbEvidence();
    return true;
  };

  const handleSubmitAnswer = async (
    answer: unknown
  ): Promise<{ correct: boolean }> => {
    if (!attemptId) return { correct: false };
    const commandId = crypto.randomUUID();

    const url =
      mode === 'paired'
        ? '/api/child/thinking-games/finish'
        : '/api/domain/thinking-games/finish';
    const body =
      mode === 'paired'
        ? { attemptId, answer, commandId }
        : { childId: selectedChild.id, attemptId, answer, commandId };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLastApiCall({ method: 'POST', url, status: res.status, body, response: data });
    refreshDbEvidence();

    if (!res.ok || !data.ok) {
      setNotice(data.code || data.error || 'finish_failed');
      return { correct: false };
    }

    const won = Boolean(data.data?.won);
    return { correct: won };
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Thinking Games API Preview & Verification
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Real Fullstack Harness: Browser UI → Next Child/Parent API → Supabase SDK → PostgREST RPC → PostgreSQL 18.4
        </p>
      </header>

      {/* Control Panel */}
      <section
        data-testid="control-panel"
        data-hydrated={isHydrated}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        aria-label="Cấu hình thử nghiệm"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Mode Switch */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Chế độ truy cập (Mode)
            </label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="mode"
                  value="paired"
                  checked={mode === 'paired'}
                  onChange={() => setMode('paired')}
                  data-testid="mode-paired"
                />
                Thiết bị trẻ em (Paired)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="mode"
                  value="parent"
                  checked={mode === 'parent'}
                  onChange={() => setMode('parent')}
                  data-testid="mode-parent"
                />
                Phụ huynh (Parent Auth)
              </label>
            </div>
          </div>

          {/* Child Selection */}
          <div>
            <label htmlFor="child-select" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Hồ sơ trẻ em (Child Profile)
            </label>
            <select
              id="child-select"
              data-testid="child-select"
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {KNOWN_CHILDREN.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} ({child.ageTrack})
                </option>
              ))}
            </select>
          </div>

          {/* Slot Selection */}
          <div>
            <label htmlFor="slot-select" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Lượt chơi (Slot)
            </label>
            <select
              id="slot-select"
              data-testid="slot-select"
              value={slot}
              onChange={(e) => setSlot(e.target.value as SlotType)}
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="main">Chính (main - slot 1)</option>
              <option value="bonus">Thưởng (bonus - slot 2)</option>
            </select>
          </div>

          {/* Local Day */}
          <div>
            <label htmlFor="day-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Ngày kiểm tra (Local Day)
            </label>
            <input
              id="day-input"
              data-testid="day-input"
              type="text"
              value={expectedLocalDay}
              onChange={(e) => setExpectedLocalDay(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Revoked Token Toggle */}
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                data-testid="toggle-revoked-token"
                checked={useRevokedToken}
                onChange={(e) => setUseRevokedToken(e.target.checked)}
              />
              Gửi phiên đã bị thu hồi (Revoked Token)
            </label>
          </div>
        </div>

        {/* Start Game Action */}
        <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-6 dark:border-slate-800">
          <button
            type="button"
            data-testid="btn-start-game"
            onClick={handleStartGame}
            disabled={isStarting}
            className="rounded-xl bg-slate-900 px-6 py-2.5 font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950"
          >
            {isStarting ? 'Đang khởi tạo...' : 'Bắt đầu chơi (Gọi Real API)'}
          </button>

          {notice && (
            <div data-testid="api-notice" className="text-sm font-medium text-rose-600 dark:text-rose-400">
              Thông báo: {notice}
            </div>
          )}
        </div>
      </section>

      {/* Parent Auth & PIN section if in Parent Mode */}
      {mode === 'parent' && (
        <section
          data-testid="parent-auth-panel"
          className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20"
        >
          <h2 className="text-lg font-bold text-indigo-950 dark:text-indigo-100">
            Xác thực Phụ huynh & PIN (Real Supabase GoTrue Auth)
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">Trạng thái đăng nhập:</p>
              <p data-testid="auth-status" className="font-mono text-sm font-bold text-indigo-900 dark:text-indigo-100">
                {authStatus}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  data-testid="btn-login-parent"
                  onClick={handleLoginParent}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Đăng nhập (Alpha)
                </button>
                <button
                  type="button"
                  data-testid="btn-logout-parent"
                  onClick={handleLogoutParent}
                  className="rounded-lg border border-indigo-300 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-200"
                >
                  Đăng xuất
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">Kiểm tra mã PIN phụ huynh:</p>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="password"
                  maxLength={4}
                  data-testid="pin-input"
                  value={candidatePin}
                  onChange={(e) => setCandidatePin(e.target.value)}
                  className="w-24 rounded-lg border border-indigo-300 p-1.5 text-center font-mono text-sm text-slate-900 dark:border-indigo-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  data-testid="btn-verify-pin"
                  onClick={handleVerifyPin}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Xác minh PIN
                </button>
                <span data-testid="pin-status" className="font-mono text-xs font-bold text-indigo-900 dark:text-indigo-100">
                  {pinStatus}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Active Game Player Mount */}
      {puzzle && attemptId && (
        <section data-testid="player-container" className="rounded-2xl border border-amber-300 bg-white p-6 shadow-md dark:border-amber-900 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Trò chơi đang hoạt động
              </span>
              <div className="flex gap-2">
                <span data-testid="current-puzzle-type" className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                  {puzzle.gameTypeId}
                </span>
                <span data-testid="current-puzzle-age" className="font-mono text-sm text-slate-600 dark:text-slate-400">
                  ({puzzle.ageTrack})
                </span>
              </div>
            </div>
            <div className="font-mono text-xs text-slate-500">
              Attempt: {attemptId.slice(0, 8)}...
            </div>
          </div>

          <ThinkingGamePlayer
            puzzle={puzzle}
            ageTrack={puzzle.ageTrack}
            slotType={puzzle.slotType}
            dayIndex={puzzle.dayIndex}
            onPauseRequest={handlePauseRequest}
            onResumeRequest={handleResumeRequest}
            onSubmitAnswer={handleSubmitAnswer}
            onExit={() => {
              setPuzzle(null);
              refreshDbEvidence();
            }}
            onFinish={() => {
              setPuzzle(null);
              refreshDbEvidence();
            }}
          />
        </section>
      )}

      {/* Real Network Trace & DB Query Evidence Panel */}
      <section
        data-testid="evidence-panel"
        className="rounded-2xl border border-slate-300 bg-slate-100 p-6 font-mono text-xs shadow-inner dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Real Network & Database Evidence Inspector
          </h2>
          <button
            type="button"
            data-testid="btn-refresh-db-evidence"
            onClick={() => refreshDbEvidence()}
            className="rounded bg-slate-800 px-3 py-1 font-semibold text-white hover:bg-slate-700 dark:bg-slate-700 dark:text-white"
          >
            Làm mới dữ liệu DB
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Last API Request/Response */}
          <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800">
            <p className="font-bold text-slate-700 dark:text-slate-300">Yêu cầu mạng gần nhất:</p>
            {lastApiCall ? (
              <div data-testid="last-api-response" className="mt-1 space-y-1">
                <div>
                  <span className="font-bold">{lastApiCall.method}</span> {lastApiCall.url} →{' '}
                  <span
                    className={`font-bold ${
                      lastApiCall.status >= 200 && lastApiCall.status < 300
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    HTTP {lastApiCall.status}
                  </span>
                </div>
                <pre className="max-h-40 overflow-auto rounded bg-slate-50 p-2 text-[11px] dark:bg-slate-950">
                  {JSON.stringify(lastApiCall.response, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-slate-400">Chưa có cuộc gọi API nào.</p>
            )}
          </div>

          {/* Database Row Verification */}
          <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800">
            <p className="font-bold text-slate-700 dark:text-slate-300">Trạng thái hàng trong PostgreSQL 18.4:</p>
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between">
                <span>Attempt State:</span>
                <span data-testid="db-attempt-state" className="font-bold text-slate-900 dark:text-slate-100">
                  {dbEvidence.attemptState ?? 'none'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Won Status:</span>
                <span data-testid="db-attempt-won" className="font-bold text-slate-900 dark:text-slate-100">
                  {String(dbEvidence.attemptWon)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Entitlement State:</span>
                <span data-testid="db-entitlement-state" className="font-bold text-slate-900 dark:text-slate-100">
                  {dbEvidence.entitlementState ?? 'none'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Journey Next Day:</span>
                <span data-testid="db-journey-index" className="font-bold text-slate-900 dark:text-slate-100">
                  {dbEvidence.journeyIndex ?? 'none'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Won Count:</span>
                <span data-testid="db-won-count" className="font-bold text-slate-900 dark:text-slate-100">
                  {dbEvidence.wonCount ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

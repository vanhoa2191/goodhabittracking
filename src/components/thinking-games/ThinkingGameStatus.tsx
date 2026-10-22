'use client';

import { useRef } from 'react';
import {
  AlertCircle,
  Clock,
  HelpCircle,
  Lock,
  Moon,
  Play,
  RotateCcw,
  Sparkles,
  WifiOff,
  X,
} from 'lucide-react';
import { getThinkingGamesViCopy } from '@/lib/i18n/thinking-games-copy';
import { useModalFocus } from '@/lib/use-modal-focus';

export type ThinkingGameStatusType =
  | 'loading'
  | 'paused'
  | 'exit'
  | 'finish'
  | 'explanation'
  | 'error'
  | 'wrong'
  | 'network_pending'
  | 'approval_waiting'
  | 'bonus_locked'
  | 'bedtime'
  | 'missing_content';

export interface ThinkingGameStatusProps {
  readonly type: ThinkingGameStatusType;
  readonly errorCode?: string;
  readonly customMessage?: string;
  readonly explanationText?: string;
  readonly praiseType?: 'persistence' | 'strategy';
  readonly onResume?: () => void;
  readonly onExit?: () => void;
  readonly onRetry?: () => void;
  readonly onDismiss?: () => void;
  readonly onShowExplanation?: () => void;
  readonly onViewTasks?: () => void;
}

export function ThinkingGameStatus({
  type,
  errorCode,
  customMessage,
  explanationText,
  praiseType = 'persistence',
  onResume,
  onExit,
  onRetry,
  onDismiss,
  onShowExplanation,
  onViewTasks,
}: ThinkingGameStatusProps) {
  const copy = getThinkingGamesViCopy();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Activate focus trap and Escape handler for modal status types
  const isModal = type === 'paused' || type === 'exit' || type === 'finish' || type === 'explanation';
  useModalFocus(isModal, () => {
    if (type === 'paused' && onResume) onResume();
    else if (type === 'exit' && onDismiss) onDismiss();
    else if (type === 'finish' && onExit) onExit();
    else if (type === 'explanation' && onDismiss) onDismiss();
    else if (onDismiss) onDismiss();
  }, dialogRef);

  // Loading state
  if (type === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[300px] flex-col items-center justify-center p-6 text-center"
      >
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-300 border-t-indigo-600 motion-reduce:animate-none" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{copy.loading.title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{copy.loading.body}</p>
      </div>
    );
  }

  // Paused state overlay
  if (type === 'paused') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm motion-reduce:backdrop-blur-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paused-title"
        aria-describedby="paused-desc"
        onKeyDown={(e) => {
          if (e.key === 'Escape') e.stopPropagation();
        }}
        ref={dialogRef}
      >
        <div className="w-full max-w-sm rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <Clock className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 id="paused-title" className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {copy.paused.title}
          </h2>
          <p id="paused-desc" className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {copy.paused.body}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onResume}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500"
            >
              <Play className="h-5 w-5" aria-hidden="true" />
              {copy.paused.resumeAction}
            </button>
            <button
              type="button"
              onClick={onExit}
              className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
            >
              {copy.paused.exitAction}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Exit confirmation modal
  if (type === 'exit') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm motion-reduce:backdrop-blur-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        aria-describedby="exit-desc"
        onKeyDown={(e) => {
          if (e.key === 'Escape') e.stopPropagation();
        }}
        ref={dialogRef}
      >
        <div className="w-full max-w-sm rounded-3xl border border-sand-200 bg-white p-6 text-center shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300">
            <HelpCircle className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 id="exit-title" className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {copy.exit.title}
          </h2>
          <p id="exit-desc" className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {copy.exit.body}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onDismiss}
              className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500"
            >
              {copy.exit.cancelAction}
            </button>
            <button
              type="button"
              onClick={onExit}
              className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
            >
              {copy.exit.confirmAction}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Finish celebration modal
  if (type === 'finish') {
    const praise = praiseType === 'strategy' ? copy.finish.strategyPraise : copy.finish.persistPraise;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm motion-reduce:backdrop-blur-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-title"
        aria-describedby="finish-desc"
        onKeyDown={(e) => {
          if (e.key === 'Escape') e.stopPropagation();
        }}
        ref={dialogRef}
      >
        <div className="w-full max-w-sm rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-6 text-center shadow-2xl dark:border-emerald-800/40 dark:from-zinc-900 dark:to-zinc-950">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner dark:bg-emerald-950/60 dark:text-emerald-300">
            <Sparkles className="h-9 w-9" aria-hidden="true" />
          </div>
          <h2 id="finish-title" className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {copy.finish.title}
          </h2>
          <p id="finish-desc" className="mt-3 text-base font-medium text-slate-700 dark:text-slate-200">
            {praise}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {onShowExplanation && (
              <button
                type="button"
                onClick={onShowExplanation}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-base font-bold text-indigo-700 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
              >
                <HelpCircle className="h-5 w-5" aria-hidden="true" />
                {copy.finish.explanationAction}
              </button>
            )}
            <button
              type="button"
              onClick={onExit}
              className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500"
            >
              {copy.finish.homeAction}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Explanation view modal
  if (type === 'explanation') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm motion-reduce:backdrop-blur-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="explanation-title"
        aria-describedby="explanation-desc"
        onKeyDown={(e) => {
          if (e.key === 'Escape') e.stopPropagation();
        }}
        ref={dialogRef}
      >
        <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between border-b border-sand-100 pb-3 dark:border-zinc-800">
            <h2 id="explanation-title" className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {copy.explanation.title}
            </h2>
            <button
              type="button"
              onClick={onDismiss}
              aria-label={copy.labels.close}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <p id="explanation-desc" className="text-base text-slate-700 dark:text-slate-300">
            {explanationText || copy.explanation.defaultBody}
          </p>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onDismiss}
              className="flex min-h-[48px] items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500"
            >
              {copy.explanation.understandAction}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Wrong / Not matching notice
  if (type === 'wrong') {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">{copy.wrong.title}</h3>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{copy.wrong.body}</p>
          </div>
        </div>
        {onRetry && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onRetry}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-200 px-4 py-2 text-sm font-bold text-amber-950 transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500 dark:border-amber-700 dark:bg-amber-800 dark:text-amber-100"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {copy.wrong.retryAction}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Network pending notice
  if (type === 'network_pending') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-3xl border border-sand-200 bg-sand-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <WifiOff className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{copy.networkPending.title}</h3>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{copy.networkPending.body}</p>
        <div className="mt-5 flex justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex min-h-[48px] items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500"
            >
              {copy.networkPending.retryAction}
            </button>
          )}
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
            >
              {copy.networkPending.laterAction}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Approval waiting state
  if (type === 'approval_waiting') {
    return (
      <div className="rounded-3xl border border-sand-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          <Clock className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{copy.approvalWaiting.title}</h3>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{copy.approvalWaiting.body}</p>
        {onDismiss && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onDismiss}
              className="flex min-h-[48px] items-center justify-center rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500"
            >
              {copy.approvalWaiting.understandAction}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Bonus locked state
  if (type === 'bonus_locked') {
    return (
      <div className="rounded-3xl border border-sand-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300">
          <Lock className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{copy.bonusLocked.title}</h3>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{copy.bonusLocked.body}</p>
        <div className="mt-5 flex justify-center gap-3">
          {onViewTasks && (
            <button
              type="button"
              onClick={onViewTasks}
              className="flex min-h-[48px] items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500"
            >
              {copy.bonusLocked.viewTasksAction}
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
            >
              {copy.bonusLocked.closeAction}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Bedtime blackout state
  if (type === 'bedtime') {
    return (
      <div className="rounded-3xl border border-indigo-900/30 bg-gradient-to-b from-slate-900 to-indigo-950 p-6 text-center text-white shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-800/60 text-amber-300 shadow-inner">
          <Moon className="h-8 w-8" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-black text-amber-100">{copy.bedtime.title}</h3>
        <p className="mt-2 text-sm text-slate-200">{copy.bedtime.body}</p>
        {onDismiss && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onDismiss}
              className="flex min-h-[48px] items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 text-base font-bold text-slate-950 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
            >
              {copy.bedtime.goodnightAction}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Missing content state
  if (type === 'missing_content') {
    return (
      <div className="rounded-3xl border border-sand-200 bg-sand-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <HelpCircle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{copy.missingContent.title}</h3>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{copy.missingContent.body}</p>
        {onDismiss && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onDismiss}
              className="flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
            >
              {copy.missingContent.laterAction}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default Error state
  const errorText =
    (errorCode && copy.error.codes[errorCode]) ||
    customMessage ||
    copy.error.defaultBody;

  return (
    <div
      role="alert"
      className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20"
    >
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-rose-950 dark:text-rose-200">{copy.error.title}</h3>
      <p className="mt-2 text-sm text-rose-900 dark:text-rose-300">{errorText}</p>
      {errorCode && (
        <span className="mt-2 inline-block rounded-md bg-rose-100 px-2 py-0.5 font-mono text-xs text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
          {errorCode}
        </span>
      )}
      <div className="mt-5 flex justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex min-h-[48px] items-center justify-center rounded-2xl bg-rose-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
          >
            {copy.error.retryAction}
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex min-h-[48px] items-center justify-center rounded-2xl border border-rose-300 bg-white px-5 py-2.5 text-sm font-semibold text-rose-900 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500 dark:border-rose-800 dark:bg-zinc-800 dark:text-rose-200"
          >
            {copy.error.closeAction}
          </button>
        )}
      </div>
    </div>
  );
}

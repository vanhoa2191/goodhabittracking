'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { HabitActivity } from '@/types';
import { useTranslation } from '@/lib/i18n/context';
import { sounds } from '@/lib/sound';

interface HabitTimerModalProps {
  activity: HabitActivity | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function HabitTimerModal({ activity, isOpen, onClose, onComplete }: HabitTimerModalProps) {
  const { t } = useTranslation();
  const initialSeconds = (activity?.durationMinutes || 2) * 60;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activity) {
      const secs = (activity.durationMinutes || 2) * 60;
      setTimeLeft(secs);
      setIsRunning(false);
      setIsFinished(false);
    }
  }, [activity]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      setIsFinished(true);
      sounds.playTimerFinish();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  if (!isOpen || !activity) return null;

  const totalSeconds = (activity.durationMinutes || 2) * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const toggleRun = () => {
    sounds.playClick();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    sounds.playClick();
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(totalSeconds);
  };

  const handleFinishAndClose = () => {
    onComplete();
    onClose();
  };

  // SVG circular radius
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 my-auto overflow-hidden text-center">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <span className="text-2xl sm:text-3xl shrink-0 p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
              {activity.icon}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate leading-tight">
                {activity.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {activity.description || `${activity.durationMinutes || 2} phút rèn luyện`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain flex flex-col items-center justify-center">
          {/* Circular Countdown Progress Ring */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 mx-auto my-2 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              {/* Background ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="text-slate-100 dark:text-zinc-800 stroke-current"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated progress ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                className={`stroke-current transition-all duration-500 ease-linear ${
                  isFinished
                    ? 'text-emerald-500'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Time digits in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isFinished ? (
                <div className="animate-bounce flex flex-col items-center">
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500 mb-1" />
                  <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {t.timerFinish}
                  </span>
                </div>
              ) : (
                <>
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight font-mono">
                    {formattedTime}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400 mt-1 font-semibold">
                    +{activity.points} {t.stars} ⭐
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 flex items-center justify-center gap-3 pb-safe">
          {isFinished ? (
            <button
              type="button"
              onClick={handleFinishAndClose}
              className="w-full py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              {t.tickDone} &amp; {t.close}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors active:scale-95 shrink-0"
                title={t.timerReset}
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={toggleRun}
                className={`flex-1 py-3 sm:py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    {t.timerPause}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    {t.timerStart}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getHabitProgramsCopy } from '@/lib/i18n/habit-programs-copy';
import { cueLineFor, isWeekendDay, pickAcknowledgement } from '@/lib/habit-programs/child-view';
import type { HabitPhase } from '@/lib/habit-programs/types';

type ChildHabitNoteProps = {
  readonly activityId: string;
  readonly isDone: boolean;
  /** The day the card is for, YYYY-MM-DD. */
  readonly day: string;
  readonly phase: HabitPhase | undefined;
};

/** Under a task card: the family's cue before the habit is done, and a kind sentence after it once the habit is steady. */
export function ChildHabitNote({ activityId, isDone, day, phase }: ChildHabitNoteProps) {
  const { activeChildId, experience } = useAppStore();
  const { language } = useTranslation();
  const copy = getHabitProgramsCopy(language);
  const plan = experience.cuePlans.find((candidate) => candidate.child_id === activeChildId && candidate.activity_id === activityId);
  if (!activeChildId || !plan) return null;

  if (!isDone) {
    const line = cueLineFor(plan, isWeekendDay(day));
    return line ? <p data-testid="child-cue-line" className="ml-12 mt-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{line}</p> : null;
  }

  if (!phase) return null;
  const line = pickAcknowledgement(activeChildId, activityId, day, phase, [
    copy.childAckMaintain1, copy.childAckMaintain2, copy.childAckMaintain3, copy.childAckMaintain4, copy.childAckMaintain5,
  ]);
  return line ? <p data-testid="child-acknowledgement" className="ml-12 mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{line}</p> : null;
}

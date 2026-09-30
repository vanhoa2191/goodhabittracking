'use client';

import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getHabitProgramsCopy } from '@/lib/i18n/habit-programs-copy';
import { localDayKey } from '@/lib/habit-fire';
import { cueLineFor, pickAcknowledgement } from '@/lib/habit-programs/child-view';
import { summarizeChildHabits } from '@/lib/habit-programs/summary';

type ChildHabitNoteProps = {
  readonly activityId: string;
  readonly isDone: boolean;
};

/** Under a task card: the family's cue before the habit is done, and a kind sentence after it once the habit is steady. */
export function ChildHabitNote({ activityId, isDone }: ChildHabitNoteProps) {
  const { activeChildId, profiles, activities, logs, experience, familyPausePeriods } = useAppStore();
  const { language } = useTranslation();
  const copy = getHabitProgramsCopy(language);
  const child = profiles.find((profile) => profile.id === activeChildId);
  const plan = experience.cuePlans.find((candidate) => candidate.child_id === activeChildId && candidate.activity_id === activityId);
  if (!child || !plan) return null;

  const now = new Date();
  const today = localDayKey(now);

  if (!isDone) {
    const line = cueLineFor(plan, now.getDay() === 0 || now.getDay() === 6);
    return line ? <p data-testid="child-cue-line" className="ml-12 mt-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{line}</p> : null;
  }

  const habit = summarizeChildHabits({ child, activities, logs, experience, pausePeriods: familyPausePeriods, today })
    .habits.find((candidate) => candidate.activityId === activityId);
  if (!habit) return null;
  const line = pickAcknowledgement(child.id, activityId, today, habit.evaluation.phase, [
    copy.childAckMaintain1, copy.childAckMaintain2, copy.childAckMaintain3, copy.childAckMaintain4, copy.childAckMaintain5,
  ]);
  return line ? <p data-testid="child-acknowledgement" className="ml-12 mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{line}</p> : null;
}

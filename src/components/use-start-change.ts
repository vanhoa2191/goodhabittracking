import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { localDayKey } from '@/lib/habit-fire';
import type { TryKind } from '@/lib/habit-programs/coach';
import { smallerVersionFor, toSmallerChanges } from '@/lib/habit-programs/smaller-version';
import { suggestTimeOfDay } from '@/lib/habit-programs/time-suggestion';

/** Starts one change for a habit: changes the task when the idea needs it (smaller, new time), then records the try. */
export function useStartChange(): (activityId: string, childId: string, kind: TryKind) => Promise<boolean> {
  const { activities, logs, updateActivity, startHabitTry } = useAppStore();
  const { language } = useTranslation();
  return async (activityId, childId, kind) => {
    const activity = activities.find((candidate) => candidate.id === activityId);
    if (!activity) return false;
    let applied = true;
    let previous: Record<string, unknown> | null = null;
    if (kind === 'smaller') {
      const version = smallerVersionFor(activity.frameworkHabitId, language);
      if (!version) return false;
      // Remember what the change replaces, so a try that does not help puts back the family's own words.
      previous = { title: activity.title, instructions: activity.instructions ?? null, durationMinutes: activity.durationMinutes ?? 0 };
      applied = await updateActivity(activity.id, toSmallerChanges(version));
    } else if (kind === 'retime') {
      const suggestion = suggestTimeOfDay(activity, childId, logs, localDayKey(new Date()));
      if (!suggestion) return false;
      previous = { timeOfDay: activity.timeOfDay };
      applied = await updateActivity(activity.id, { timeOfDay: suggestion.band });
    }
    return applied && startHabitTry(activityId, childId, kind, previous);
  };
}

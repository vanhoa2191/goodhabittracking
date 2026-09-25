import type { HabitTemplate } from '@/lib/constants';
import type { HabitActivity } from '@/types';

export function matchesLegacyTemplateAssignment(
  activity: HabitActivity,
  template: HabitTemplate,
  localizedCopies: readonly HabitTemplate[],
): boolean {
  if (activity.legacyTemplateId) return activity.legacyTemplateId === template.id;
  if (activity.frameworkHabitId || activity.journeyHabitKey) return false;
  if (activity.childId !== null || !activity.isActive || activity.isParentRole) return false;
  if ((activity.targetAgeStage ?? 'all') !== 'all' || activity.portrait16Key || activity.boThi7Key) return false;
  if (activity.recurrenceType !== 'daily' || activity.recurrenceDays.length !== 7) return false;
  if (!activity.recurrenceDays.every((day, index) => day === index)) return false;
  if (activity.category !== template.category || activity.icon !== template.icon) return false;
  if (activity.points !== template.points || activity.timeOfDay !== template.timeOfDay) return false;
  if ((activity.durationMinutes ?? 0) !== (template.durationMinutes ?? 0)) return false;
  if (activity.requiresApproval !== Boolean(template.requiresApproval)) return false;

  return localizedCopies.some((copy) =>
    activity.title === copy.title
    && (activity.description ?? '') === (copy.description ?? '')
    && (activity.instructions == null || activity.instructions === (copy.description ?? '')),
  );
}

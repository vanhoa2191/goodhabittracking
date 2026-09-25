import { describe, expect, it } from 'vitest';
import { WIT_HABIT_PACKS } from '@/lib/constants';
import { activityMutationSchema } from '@/lib/domain/activity-mutations';
import { mapHabitActivityRow } from '@/lib/supabase/mappers';
import { localizeWitTemplate } from '@/lib/i18n/wit-template-copy';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/context';
import { matchesLegacyTemplateAssignment } from '@/lib/legacy-template-identity';
import type { HabitActivity } from '@/types';

describe('legacy habit template identity', () => {
  it('has an explicit, unique identifier for every template', () => {
    // Given
    const templates = WIT_HABIT_PACKS.flatMap((pack) => pack.items);

    // When
    const ids = templates.map((template) => template.id);

    // Then
    expect(ids).toHaveLength(36);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^WIT-(NUT|GIV|VIR|MIN|PER|WIS|CAP|PHY)-\d{2}$/.test(id))).toBe(true);
  });

  it('preserves a template identifier when an activity is mapped from cloud data', () => {
    // Given
    const row = {
      id: '11111111-1111-4111-8111-111111111111',
      family_id: '22222222-2222-4222-8222-222222222222',
      child_id: null,
      title: 'A renamed task',
      icon: '🧼',
      category: 'nutrition',
      points: 10,
      recurrence_type: 'daily',
      recurrence_days: [0, 1, 2, 3, 4, 5, 6],
      time_of_day: 'morning',
      requires_approval: false,
      is_active: true,
      legacy_template_id: 'WIT-NUT-01',
      created_at: '2026-09-24T00:00:00.000Z',
    };

    // When
    const activity = mapHabitActivityRow(row);

    // Then
    expect(activity.legacyTemplateId).toBe('WIT-NUT-01');
  });

  it('accepts a catalog identity through the activity mutation boundary', () => {
    // Given
    const activity = {
      id: '11111111-1111-4111-8111-111111111111',
      childId: null,
      title: 'A renamed task',
      icon: '🧼',
      category: 'nutrition',
      points: 10,
      recurrenceType: 'daily',
      recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
      timeOfDay: 'morning',
      requiresApproval: false,
      isActive: true,
      legacyTemplateId: 'WIT-NUT-01',
      createdAt: '2026-09-24T00:00:00.000Z',
    };

    // When
    const result = activityMutationSchema.safeParse({ type: 'create', activity });

    // Then
    expect(result.success).toBe(true);
  });

  it('recognizes an exact old template but not a custom habit with only its title', () => {
    const template = WIT_HABIT_PACKS[0].items[0];
    const localized = SUPPORTED_LANGUAGES.map(({ code }) => localizeWitTemplate(template, 0, code));
    const english = localizeWitTemplate(template, 0, 'en');
    const activity: HabitActivity = {
      id: '11111111-1111-4111-8111-111111111111',
      childId: null,
      title: english.title,
      description: english.description,
      instructions: english.description,
      icon: template.icon,
      category: template.category,
      points: template.points,
      recurrenceType: 'daily',
      recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
      timeOfDay: template.timeOfDay,
      durationMinutes: template.durationMinutes ?? 0,
      requiresApproval: Boolean(template.requiresApproval),
      isActive: true,
      createdAt: '2026-09-24T00:00:00.000Z',
    };

    for (const copy of localized) {
      expect(matchesLegacyTemplateAssignment({
        ...activity,
        title: copy.title,
        description: copy.description,
        instructions: copy.description,
      }, template, localized)).toBe(true);
    }
    expect(matchesLegacyTemplateAssignment({ ...activity, description: 'A different goal' }, template, localized)).toBe(false);
    expect(matchesLegacyTemplateAssignment({ ...activity, recurrenceType: 'weekdays' }, template, localized)).toBe(false);
  });

  it('uses a persisted template ID after edits and rejects a different ID', () => {
    const giving = WIT_HABIT_PACKS.find((pack) => pack.key === 'giving');
    if (!giving) throw new Error('The giving template pack is missing');
    const template = giving.items[1];
    const copies = SUPPORTED_LANGUAGES.map(({ code }) => localizeWitTemplate(template, 1, code));
    const activity: HabitActivity = {
      id: '11111111-1111-4111-8111-111111111111',
      childId: null,
      title: 'A parent-edited title',
      icon: template.icon,
      category: template.category,
      points: template.points,
      recurrenceType: 'daily',
      recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
      timeOfDay: template.timeOfDay,
      requiresApproval: false,
      isActive: true,
      legacyTemplateId: template.id,
      createdAt: '2026-09-24T00:00:00.000Z',
    };

    expect(matchesLegacyTemplateAssignment(activity, template, copies)).toBe(true);
    expect(matchesLegacyTemplateAssignment({ ...activity, legacyTemplateId: giving.items[2].id }, template, copies)).toBe(false);
  });
});

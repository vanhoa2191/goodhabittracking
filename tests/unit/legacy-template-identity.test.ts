import { describe, expect, it } from 'vitest';
import { WIT_HABIT_PACKS } from '@/lib/constants';
import { activityMutationSchema } from '@/lib/domain/activity-mutations';
import { mapHabitActivityRow } from '@/lib/supabase/mappers';

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
});

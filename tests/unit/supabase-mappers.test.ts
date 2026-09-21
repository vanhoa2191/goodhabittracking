import { describe, expect, it } from 'vitest';
import { mapChildProfileRow, mapHabitActivityRow } from '@/lib/supabase/mappers';

describe('Supabase domain mappers', () => {
  it('round-trips all child profile fields without changing identity', () => {
    const profile = mapChildProfileRow({
      id: '11111111-1111-4111-8111-111111111111',
      user_id: '22222222-2222-4222-8222-222222222222',
      family_id: '33333333-3333-4333-8333-333333333333',
      name: 'Minh An',
      nickname: 'Sư Tử Nhỏ',
      show_real_name_on_leaderboard: false,
      is_public_on_leaderboard: true,
      avatar: '🦁',
      theme_color: '#6366f1',
      points: 120,
      total_earned: 320,
      level: 4,
      streak: 7,
      birth_year: 2018,
      age_stage: '6-12',
      last_active_date: '2026-09-19',
      league_tier: 'gold',
      created_at: '2026-09-19T00:00:00.000Z',
    });

    expect(profile).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      familyId: '33333333-3333-4333-8333-333333333333',
      birthYear: 2018,
      ageStage: '6-12',
      leagueTier: 'gold',
    });
  });

  it('round-trips WIT activity metadata', () => {
    const activity = mapHabitActivityRow({
      id: '11111111-1111-4111-8111-111111111111',
      user_id: '22222222-2222-4222-8222-222222222222',
      family_id: '33333333-3333-4333-8333-333333333333',
      child_id: null,
      title: 'Con chào ông bà',
      description: 'Thực hành lòng biết ơn',
      icon: '🙏',
      category: 'virtue',
      points: 15,
      recurrence_type: 'daily',
      recurrence_days: [0, 1, 2, 3, 4, 5, 6],
      time_of_day: 'morning',
      duration_minutes: 5,
      requires_approval: true,
      is_active: true,
      target_age_stage: '6-12',
      is_parent_role: false,
      portrait16_key: 'biet-on',
      bo_thi7_key: 'ngon',
      created_at: '2026-09-19T00:00:00.000Z',
    });

    expect(activity).toMatchObject({
      familyId: '33333333-3333-4333-8333-333333333333',
      targetAgeStage: '6-12',
      portrait16Key: 'biet-on',
      boThi7Key: 'ngon',
    });
  });

  it('rejects non-canonical database identifiers', () => {
    expect(() =>
      mapChildProfileRow({
        id: 'child-123',
        family_id: 'family-123',
      })
    ).toThrow();
  });
});

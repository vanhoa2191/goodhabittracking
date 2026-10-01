import { describe, expect, it } from 'vitest';
import { AGE_JOURNEY_PLANS, JOURNEY_STAGES, journeyPlansForStage, journeyStageForAge } from '@/lib/journeys/age-journeys';

describe('age roadmaps', () => {
  it('has five age stages of three steps each, covering about twelve weeks', () => {
    expect(JOURNEY_STAGES.map((stage) => stage.id)).toEqual(['GD1', 'GD2', 'GD3', 'GD4', 'GD5']);
    expect(AGE_JOURNEY_PLANS).toHaveLength(15);
    for (const stage of JOURNEY_STAGES) {
      const steps = journeyPlansForStage(stage.id);
      expect(steps.map((plan) => plan.weeks)).toEqual([[1, 4], [5, 8], [9, 12]]);
      expect(steps.map((plan) => plan.id)).toEqual([1, 2, 3].map((step) => `${stage.id.toLowerCase()}-step-${step}`));
    }
  });

  it('adds exactly one new habit per step, so a child is never handed several new habits at once', () => {
    for (const plan of AGE_JOURNEY_PLANS) expect(plan.habits).toHaveLength(1);
    const titles = AGE_JOURNEY_PLANS.map((plan) => plan.habits[0]!.title);
    expect(new Set(titles).size).toBe(titles.length);
    const ids = AGE_JOURNEY_PLANS.flatMap((plan) => plan.habits.map((habit) => habit.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('writes every step in Vietnamese and English, with no Vietnamese letters in the English', () => {
    const vietnameseLetters = /[ăâđêôơưàáạảãấầẩẫậắằẳẵặèéẹẻẽếềểễệìíịỉĩòóọỏõốồổỗộớờởỡợùúụủũứừửữựỳýỵỷỹ]/i;
    for (const plan of AGE_JOURNEY_PLANS) {
      const habit = plan.habits[0]!;
      expect(plan.title.vi && plan.title.en && plan.description.vi && plan.description.en).toBeTruthy();
      expect(habit.en?.title && habit.en.description).toBeTruthy();
      for (const text of [plan.title.en!, plan.description.en!, habit.en!.title, habit.en!.description]) {
        expect(text).not.toMatch(vietnameseLetters);
      }
      expect(habit.title).toMatch(vietnameseLetters);
    }
  });

  it('presents the weeks as a guide, not a deadline, and does not quote a magic number of days', () => {
    for (const plan of AGE_JOURNEY_PLANS) {
      expect(plan.description.vi).not.toMatch(/\b(21|66)\s*ngày/);
      expect(plan.description.en).not.toMatch(/\b(21|66)[- ]day/);
    }
    for (const step of [2, 3]) {
      const text = journeyPlansForStage('GD3')[step - 1]!.description.vi!;
      expect(text).toMatch(/không cần chạy theo lịch|tùy nhịp|theo nhịp của con/);
    }
  });

  it('keeps each step a small, valid daily task', () => {
    for (const plan of AGE_JOURNEY_PLANS) {
      const habit = plan.habits[0]!;
      expect(habit.points).toBe(10);
      expect(['morning', 'afternoon', 'evening', 'anytime']).toContain(habit.timeOfDay);
      expect(habit.durationMinutes === undefined || (habit.durationMinutes > 0 && habit.durationMinutes <= 60)).toBe(true);
      expect(plan.ageStageId).toMatch(/^GD[1-5]$/);
    }
  });

  it.each([
    [0, 'GD1'], [2.9, 'GD1'], [3, 'GD2'], [5, 'GD2'], [6, 'GD3'], [11, 'GD3'],
    [12, 'GD4'], [14, 'GD4'], [15, 'GD5'], [17, 'GD5'], [18, 'GD5'], [30, 'GD5'], [-1, 'GD1'],
  ] as const)('puts a child of %s into %s', (age, expected) => {
    expect(journeyStageForAge(age)).toBe(expected);
  });

  it('opens on the school-age stage when the age is unknown', () => {
    expect(journeyStageForAge(null)).toBe('GD3');
    expect(journeyStageForAge(undefined)).toBe('GD3');
    expect(journeyStageForAge(Number.NaN)).toBe('GD3');
  });
});
